<?php
declare(strict_types=1);

/**
 * Acceso a datos del catálogo principal (productos), catálogos secundarios
 * (campus y categorias vinculados por FOREIGN KEY) y subastas (pujas).
 */
final class ProductoModel
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::obtener();
    }

    /**
     * Devuelve los catálogos secundarios (campus y categorías) para poblar filtros y formularios.
     * @return array{campus: array<int, array<string, mixed>>, categorias: array<int, array<string, mixed>>}
     */
    public function obtenerCatalogos(): array
    {
        $campus = $this->db->query('SELECT id, clave, nombre FROM campus ORDER BY id')->fetchAll();
        $categorias = $this->db->query('SELECT id, clave, nombre FROM categorias ORDER BY id')->fetchAll();

        return [
            'campus'     => $campus,
            'categorias' => $categorias,
        ];
    }

    public function categoriaIdPorClave(string $clave): ?int
    {
        $st = $this->db->prepare('SELECT id FROM categorias WHERE clave = :clave LIMIT 1');
        $st->execute([':clave' => $clave]);
        $id = $st->fetchColumn();
        return $id === false ? null : (int) $id;
    }

    /**
     * Mapea claves de campus (['exactas', 'salud']) a sus IDs numéricos en la tabla campus.
     * @param array<int, string> $claves
     * @return array<int, int>
     */
    public function campusIdsPorClaves(array $claves): array
    {
        $ids = [];
        $st = $this->db->prepare('SELECT id FROM campus WHERE clave = :clave LIMIT 1');
        foreach ($claves as $clave) {
            $st->execute([':clave' => $clave]);
            $id = $st->fetchColumn();
            if ($id !== false) {
                $ids[] = (int) $id;
            }
        }
        return array_values(array_unique($ids));
    }

    /**
     * Cierra automáticamente las subastas cuya fecha límite ya venció.
     * Bloquea cada fila con FOR UPDATE para evitar pedidos ganadores duplicados.
     */
    public function cerrarSubastasVencidas(): int
    {
        $sql = "SELECT id
                  FROM productos
                 WHERE modalidad = 'subasta'
                   AND estado = 'activa'
                   AND cierre_subasta IS NOT NULL
                   AND cierre_subasta <= NOW()";
        $vencidasIds = $this->db->query($sql)->fetchAll(PDO::FETCH_COLUMN);

        if ($vencidasIds === []) {
            return 0;
        }

        $cerradas = 0;
        $stBloquear = $this->db->prepare(
            "SELECT id, vendedor_id, punto_entrega, horarios_entrega
               FROM productos
              WHERE id = :id
                AND modalidad = 'subasta'
                AND estado = 'activa'
                AND cierre_subasta IS NOT NULL
                AND cierre_subasta <= NOW()
                FOR UPDATE"
        );
        $stPuja = $this->db->prepare(
            'SELECT usuario_id, monto FROM pujas WHERE producto_id = :pid ORDER BY monto DESC, id DESC LIMIT 1'
        );
        $stCerrarSinPujas = $this->db->prepare("UPDATE productos SET estado = 'cerrada' WHERE id = :id");
        $stVenderSubasta = $this->db->prepare("UPDATE productos SET stock = 0, estado = 'vendido' WHERE id = :id");
        $stPedido = $this->db->prepare(
            "INSERT INTO pedidos (producto_id, comprador_id, vendedor_id, cantidad, total, punto_entrega, horario_entrega, estado, origen)
             VALUES (:pid, :cid, :vid, 1, :total, :punto, :horario, 'pendiente', 'subasta')"
        );

        foreach ($vencidasIds as $rawId) {
            $pid = (int) $rawId;
            $this->db->beginTransaction();
            try {
                $stBloquear->execute([':id' => $pid]);
                $prod = $stBloquear->fetch();
                if ($prod === false) {
                    $this->db->rollBack();
                    continue;
                }

                $stPuja->execute([':pid' => $pid]);
                $ganadora = $stPuja->fetch();

                if ($ganadora === false) {
                    $stCerrarSinPujas->execute([':id' => $pid]);
                } else {
                    $stVenderSubasta->execute([':id' => $pid]);
                    $puntos = array_values(array_filter(array_map('trim', explode(',', (string) $prod['punto_entrega']))));
                    $horarios = array_values(array_filter(array_map('trim', explode(',', (string) $prod['horarios_entrega']))));
                    $stPedido->execute([
                        ':pid'     => $pid,
                        ':cid'     => (int) $ganadora['usuario_id'],
                        ':vid'     => (int) $prod['vendedor_id'],
                        ':total'   => $ganadora['monto'],
                        ':punto'   => $puntos[0] ?? 'Por acordar',
                        ':horario' => $horarios[0] ?? 'Por acordar',
                    ]);
                }

                $this->db->commit();
                $cerradas++;
            } catch (Throwable $e) {
                if ($this->db->inTransaction()) {
                    $this->db->rollBack();
                }
                throw $e;
            }
        }

        return $cerradas;
    }

    /**
     * Consulta la vista consolidada vw_catalogo_productos aplicando filtros dinámicos seguros.
     * @param array<string, mixed> $filtros
     * @return array<int, array<string, mixed>>
     */
    public function listar(array $filtros): array
    {
        $this->cerrarSubastasVencidas();

        $where = [];
        $params = [];

        if (!empty($filtros['vendedor_id'])) {
            $where[] = 'v.vendedor_id = :vendedor_id';
            $params[':vendedor_id'] = (int) $filtros['vendedor_id'];
        } else {
            $where[] = "v.estado = 'activa'";
            $where[] = "(v.modalidad = 'subasta' OR v.stock > 0)";
        }

        if (!empty($filtros['categoria']) && $filtros['categoria'] !== 'todas') {
            $where[] = 'v.categoria_clave = :categoria';
            $params[':categoria'] = (string) $filtros['categoria'];
        }

        if (!empty($filtros['modalidades']) && is_array($filtros['modalidades'])) {
            $validas = array_values(array_intersect($filtros['modalidades'], ['fijo', 'subasta']));
            if ($validas === []) {
                return [];
            }
            $placeholders = [];
            foreach ($validas as $idx => $mod) {
                $key = ':mod_' . $idx;
                $placeholders[] = $key;
                $params[$key] = $mod;
            }
            $where[] = 'v.modalidad IN (' . implode(', ', $placeholders) . ')';
        }

        if (!empty($filtros['campus']) && is_array($filtros['campus'])) {
            $campusChecks = [];
            foreach (array_values($filtros['campus']) as $idx => $claveCampus) {
                $key = ':campus_' . $idx;
                $campusChecks[] = "FIND_IN_SET($key, v.campus_claves) > 0";
                $params[$key] = (string) $claveCampus;
            }
            if ($campusChecks !== []) {
                $where[] = '(' . implode(' OR ', $campusChecks) . ')';
            }
        }

        if (isset($filtros['precio_min']) && $filtros['precio_min'] !== null) {
            $where[] = 'v.precio >= :precio_min';
            $params[':precio_min'] = (float) $filtros['precio_min'];
        }

        if (isset($filtros['precio_max']) && $filtros['precio_max'] !== null) {
            $where[] = 'v.precio <= :precio_max';
            $params[':precio_max'] = (float) $filtros['precio_max'];
        }

        if (!empty($filtros['busqueda'])) {
            $where[] = '(v.titulo LIKE :busqueda_t OR v.descripcion LIKE :busqueda_d OR v.categoria_nombre LIKE :busqueda_c)';
            $termino = '%' . addcslashes((string) $filtros['busqueda'], '%_\\') . '%';
            $params[':busqueda_t'] = $termino;
            $params[':busqueda_d'] = $termino;
            $params[':busqueda_c'] = $termino;
        }

        $ordenSql = match ($filtros['orden'] ?? 'recientes') {
            'precio-asc'  => 'v.precio ASC, v.id DESC',
            'precio-desc' => 'v.precio DESC, v.id DESC',
            'reputacion'  => 'COALESCE(v.vendedor_promedio, 0) DESC, v.vendedor_total_resenas DESC, v.id DESC',
            default       => 'v.creado_en DESC, v.id DESC',
        };

        $sql = 'SELECT v.*,
                       (SELECT COUNT(*) FROM pujas pj WHERE pj.producto_id = v.id) AS total_pujas
                  FROM vw_catalogo_productos v';
        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY ' . $ordenSql;

        $st = $this->db->prepare($sql);
        $st->execute($params);
        $filas = $st->fetchAll();

        return array_map([$this, 'formatearFila'], $filas);
    }

    /**
     * Obtiene el detalle completo de un producto (galería de imágenes, pujas recientes y reputación).
     * @return array<string, mixed>|null
     */
    public function obtenerPorId(int $id): ?array
    {
        $this->cerrarSubastasVencidas();

        $st = $this->db->prepare('SELECT * FROM vw_catalogo_productos WHERE id = :id LIMIT 1');
        $st->execute([':id' => $id]);
        $fila = $st->fetch();
        if ($fila === false) {
            return null;
        }

        $producto = $this->formatearFila($fila);

        $stImgs = $this->db->prepare(
            'SELECT id, ruta, mime, tamano, orden FROM producto_imagenes WHERE producto_id = :id ORDER BY orden ASC, id ASC'
        );
        $stImgs->execute([':id' => $id]);
        $imgs = $stImgs->fetchAll();
        $producto['imagenes'] = $imgs !== []
            ? array_map(fn(array $img): string => $this->normalizarRutaImagen((string) $img['ruta']), $imgs)
            : ['../assets/images/image-placeholder.jpg'];

        $stPujas = $this->db->prepare(
            'SELECT pj.id, pj.monto, pj.creado_en, u.nombre AS usuario_nombre, u.correo AS usuario_correo
               FROM pujas pj
               JOIN usuarios u ON u.id = pj.usuario_id
              WHERE pj.producto_id = :id
              ORDER BY pj.monto ASC, pj.id ASC'
        );
        $stPujas->execute([':id' => $id]);
        $producto['pujas'] = $stPujas->fetchAll();
        $producto['totalPujas'] = count($producto['pujas']);

        $stVentas = $this->db->prepare(
            "SELECT COUNT(*) FROM pedidos WHERE vendedor_id = :vid AND estado = 'completado'"
        );
        $stVentas->execute([':vid' => (int) $fila['vendedor_id']]);
        $producto['vendedorVentas'] = (int) $stVentas->fetchColumn();

        return $producto;
    }

    /**
     * Crea una publicación con sus campus asociados e imagen inicial dentro de una transacción.
     * @param array<string, mixed> $datos
     */
    public function crear(array $datos): int
    {
        $this->db->beginTransaction();
        try {
            $st = $this->db->prepare(
                'INSERT INTO productos
                    (vendedor_id, categoria_id, titulo, descripcion, modalidad, precio, stock, cierre_subasta, estado, punto_entrega, horarios_entrega)
                 VALUES
                    (:vendedor_id, :categoria_id, :titulo, :descripcion, :modalidad, :precio, :stock, :cierre_subasta, :estado, :punto_entrega, :horarios_entrega)'
            );
            $st->execute([
                ':vendedor_id'      => (int) $datos['vendedor_id'],
                ':categoria_id'     => (int) $datos['categoria_id'],
                ':titulo'           => $datos['titulo'],
                ':descripcion'      => $datos['descripcion'],
                ':modalidad'        => $datos['modalidad'],
                ':precio'           => $datos['precio'],
                ':stock'            => (int) $datos['stock'],
                ':cierre_subasta'   => $datos['cierre_subasta'],
                ':estado'           => 'activa',
                ':punto_entrega'    => $datos['punto_entrega'],
                ':horarios_entrega' => $datos['horarios_entrega'],
            ]);
            $productoId = (int) $this->db->lastInsertId();

            $stCampus = $this->db->prepare(
                'INSERT INTO producto_campus (producto_id, campus_id) VALUES (:pid, :cid)'
            );
            foreach ($datos['campus_ids'] as $campusId) {
                $stCampus->execute([':pid' => $productoId, ':cid' => (int) $campusId]);
            }

            $stImg = $this->db->prepare(
                'INSERT INTO producto_imagenes (producto_id, ruta, mime, tamano, orden) VALUES (:pid, :ruta, :mime, 0, 0)'
            );
            $stImg->execute([
                ':pid'  => $productoId,
                ':ruta' => 'assets/images/image-placeholder.jpg',
                ':mime' => 'image/jpeg',
            ]);

            $this->db->commit();
            return $productoId;
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Actualiza una publicación existente (dispara trg_productos_au en bitácora si cambian precio/stock/estado/título).
     * @param array<string, mixed> $datos
     */
    public function actualizar(int $productoId, array $datos): void
    {
        $this->db->beginTransaction();
        try {
            $st = $this->db->prepare(
                'UPDATE productos
                    SET categoria_id     = :categoria_id,
                        titulo           = :titulo,
                        descripcion      = :descripcion,
                        precio           = :precio,
                        stock            = :stock,
                        estado           = :estado,
                        punto_entrega    = :punto_entrega,
                        horarios_entrega = :horarios_entrega
                  WHERE id = :id'
            );
            $st->execute([
                ':categoria_id'     => (int) $datos['categoria_id'],
                ':titulo'           => $datos['titulo'],
                ':descripcion'      => $datos['descripcion'],
                ':precio'           => $datos['precio'],
                ':stock'            => (int) $datos['stock'],
                ':estado'           => $datos['estado'],
                ':punto_entrega'    => $datos['punto_entrega'],
                ':horarios_entrega' => $datos['horarios_entrega'],
                ':id'               => $productoId,
            ]);

            $stDelCampus = $this->db->prepare('DELETE FROM producto_campus WHERE producto_id = :pid');
            $stDelCampus->execute([':pid' => $productoId]);

            $stInsCampus = $this->db->prepare(
                'INSERT INTO producto_campus (producto_id, campus_id) VALUES (:pid, :cid)'
            );
            foreach ($datos['campus_ids'] as $campusId) {
                $stInsCampus->execute([':pid' => $productoId, ':cid' => (int) $campusId]);
            }

            $this->db->commit();
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    public function tienePedidosPendientes(int $productoId): bool
    {
        $st = $this->db->prepare(
            "SELECT COUNT(*) FROM pedidos WHERE producto_id = :pid AND estado = 'pendiente'"
        );
        $st->execute([':pid' => $productoId]);
        return (int) $st->fetchColumn() > 0;
    }

    public function tienePedidos(int $productoId): bool
    {
        $st = $this->db->prepare(
            'SELECT COUNT(*) FROM pedidos WHERE producto_id = :pid'
        );
        $st->execute([':pid' => $productoId]);
        return (int) $st->fetchColumn() > 0;
    }

    public function eliminar(int $productoId): void
    {
        $st = $this->db->prepare('DELETE FROM productos WHERE id = :id');
        $st->execute([':id' => $productoId]);
    }

    /**
     * Registra una puja con bloqueo de fila (FOR UPDATE) para evitar condiciones de carrera.
     * @return array{nuevoPrecio: float, totalPujas: int}
     */
    public function registrarPuja(int $productoId, int $usuarioId, float $monto): array
    {
        $this->db->beginTransaction();
        try {
            $st = $this->db->prepare(
                'SELECT id, vendedor_id, modalidad, precio, estado, cierre_subasta
                   FROM productos
                  WHERE id = :id
                    FOR UPDATE'
            );
            $st->execute([':id' => $productoId]);
            $prod = $st->fetch();

            if ($prod === false) {
                throw new DomainException('La publicación no existe.');
            }
            if ((string) $prod['modalidad'] !== 'subasta') {
                throw new DomainException('Este artículo no admite pujas.');
            }
            if ((string) $prod['estado'] !== 'activa' || strtotime((string) $prod['cierre_subasta']) <= time()) {
                throw new DomainException('La subasta de este artículo ya cerró.');
            }
            if ((int) $prod['vendedor_id'] === $usuarioId) {
                throw new DomainException('No puedes pujar por tu propia publicación.');
            }

            $stUltima = $this->db->prepare(
                'SELECT usuario_id FROM pujas WHERE producto_id = :pid ORDER BY monto DESC, id DESC LIMIT 1'
            );
            $stUltima->execute([':pid' => $productoId]);
            $ultimoPostor = $stUltima->fetchColumn();
            if ($ultimoPostor !== false && (int) $ultimoPostor === $usuarioId) {
                throw new DomainException('Ya tienes la puja más alta de esta subasta.');
            }

            $minimo = (float) $prod['precio'] + 10.0;
            if ($monto < $minimo) {
                throw new DomainException(sprintf('La puja debe ser de al menos $%.2f MXN.', $minimo));
            }

            $stIns = $this->db->prepare(
                'INSERT INTO pujas (producto_id, usuario_id, monto) VALUES (:pid, :uid, :monto)'
            );
            $stIns->execute([':pid' => $productoId, ':uid' => $usuarioId, ':monto' => $monto]);

            $stUpd = $this->db->prepare('UPDATE productos SET precio = :monto WHERE id = :pid');
            $stUpd->execute([':monto' => $monto, ':pid' => $productoId]);

            $stCount = $this->db->prepare('SELECT COUNT(*) FROM pujas WHERE producto_id = :pid');
            $stCount->execute([':pid' => $productoId]);
            $totalPujas = (int) $stCount->fetchColumn();

            $this->db->commit();
            return ['nuevoPrecio' => $monto, 'totalPujas' => $totalPujas];
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    private function normalizarRutaImagen(string $ruta): string
    {
        if ($ruta === '') {
            return '../assets/images/image-placeholder.jpg';
        }
        if (!str_starts_with($ruta, '../') && !str_starts_with($ruta, 'http')) {
            return '../' . ltrim($ruta, '/');
        }
        return $ruta;
    }

    /**
     * Normaliza una fila de vw_catalogo_productos al contrato JSON esperado por el frontend.
     * @param array<string, mixed> $fila
     * @return array<string, mixed>
     */
    private function formatearFila(array $fila): array
    {
        $rutaImg = $this->normalizarRutaImagen((string) ($fila['imagen_principal'] ?? ''));

        $puntos = array_values(array_filter(array_map('trim', explode(',', (string) ($fila['punto_entrega'] ?? '')))));
        $horarios = array_values(array_filter(array_map('trim', explode(',', (string) ($fila['horarios_entrega'] ?? '')))));
        $campusClaves = $fila['campus_claves'] !== null && $fila['campus_claves'] !== ''
            ? explode(',', (string) $fila['campus_claves'])
            : [];

        return [
            'id'                   => (int) $fila['id'],
            'titulo'               => (string) $fila['titulo'],
            'descripcion'          => (string) $fila['descripcion'],
            'modalidad'            => (string) $fila['modalidad'],
            'precio'               => (float) $fila['precio'],
            'stock'                => (int) $fila['stock'],
            'cierreSubasta'        => $fila['cierre_subasta'],
            'estado'               => (string) $fila['estado'],
            'categoriaId'          => (int) $fila['categoria_id'],
            'categoria'            => (string) $fila['categoria_clave'],
            'categoriaNombre'      => (string) $fila['categoria_nombre'],
            'campus'               => $campusClaves,
            'entregaTexto'         => (string) ($fila['campus_nombres'] ?? $fila['punto_entrega']),
            'puntosEntrega'        => $puntos,
            'horariosEntrega'      => $horarios,
            'imagen'               => $rutaImg,
            'vendedorId'           => (int) $fila['vendedor_id'],
            'vendedorNombre'       => (string) $fila['vendedor_nombre'],
            'vendedorCorreo'       => (string) $fila['vendedor_correo'],
            'vendedorFacultad'     => (string) ($fila['vendedor_facultad'] ?: 'Comunidad UADY'),
            'vendedorPromedio'     => $fila['vendedor_promedio'] !== null ? (float) $fila['vendedor_promedio'] : 0.0,
            'vendedorTotalResenas' => (int) ($fila['vendedor_total_resenas'] ?? 0),
            'totalPujas'           => (int) ($fila['total_pujas'] ?? 0),
            'fechaCreacion'        => (string) $fila['creado_en'],
        ];
    }
}