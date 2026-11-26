<?php
declare(strict_types=1);

/**
 * Controlador del catálogo CRUD de productos, búsqueda/filtros y subastas.
 */
final class ProductoController
{
    private ProductoModel $productos;

    public function __construct(?ProductoModel $productos = null)
    {
        $this->productos = $productos ?? new ProductoModel();
    }

    public function catalogos(): void
    {
        Http::ok($this->productos->obtenerCatalogos());
    }

    /** @param array<string, mixed> $query */
    public function listar(array $query, ?int $soloVendedorId = null): void
    {
        $campus = [];
        if (!empty($query['campus'])) {
            $raw = is_array($query['campus']) ? $query['campus'] : explode(',', (string) $query['campus']);
            $campus = array_values(array_filter(array_map(
                static fn($c): string => Validator::texto($c, 25),
                $raw
            )));
        }

        $modalidades = null;
        if (isset($query['modalidad']) && $query['modalidad'] !== '') {
            $rawMod = is_array($query['modalidad']) ? $query['modalidad'] : explode(',', (string) $query['modalidad']);
            $modalidades = array_values(array_filter(array_map(
                static fn($m): string => Validator::texto($m, 15),
                $rawMod
            )));
        }

        $precioMin = isset($query['precio_min']) && $query['precio_min'] !== '' && is_numeric($query['precio_min'])
            ? max(0.0, (float) $query['precio_min'])
            : null;
        $precioMax = isset($query['precio_max']) && $query['precio_max'] !== '' && is_numeric($query['precio_max'])
            ? max(0.0, (float) $query['precio_max'])
            : null;

        $filtros = [
            'vendedor_id' => $soloVendedorId,
            'campus'      => $campus,
            'categoria'   => Validator::texto($query['categoria'] ?? 'todas', 25),
            'modalidades' => $modalidades,
            'precio_min'  => $precioMin,
            'precio_max'  => $precioMax,
            'busqueda'    => Validator::texto($query['q'] ?? '', 90),
            'orden'       => Validator::texto($query['orden'] ?? 'recientes', 20),
        ];

        $lista = $this->productos->listar($filtros);
        Http::ok(['productos' => $lista, 'total' => count($lista)]);
    }

    public function detalle(int $id): void
    {
        if ($id <= 0) {
            Http::fail(400, 'Identificador de producto inválido.');
        }

        $producto = $this->productos->obtenerPorId($id);
        if ($producto === null) {
            Http::fail(404, 'La publicación no existe o fue eliminada.');
        }

        Http::ok(['producto' => $producto]);
    }

    /** @param array<string, mixed> $in */
    public function crear(int $vendedorId, array $in): void
    {
        $validado = $this->validarEntrada($in, false);
        $validado['vendedor_id'] = $vendedorId;

        $id = $this->productos->crear($validado);
        $producto = $this->productos->obtenerPorId($id);

        Http::ok(['id' => $id, 'producto' => $producto], 'Publicación creada correctamente.', 201);
    }

    /** @param array<string, mixed> $in */
    public function actualizar(int $vendedorId, array $in): void
    {
        $id = isset($in['id']) && is_numeric($in['id']) ? (int) $in['id'] : 0;
        if ($id <= 0) {
            Http::fail(400, 'Identificador de publicación inválido.');
        }

        $actual = $this->productos->obtenerPorId($id);
        if ($actual === null) {
            Http::fail(404, 'La publicación no existe.');
        }
        if ((int) $actual['vendedorId'] !== $vendedorId) {
            Http::fail(403, 'Solo el vendedor puede editar esta publicación.');
        }
        if ($actual['modalidad'] === 'subasta' && $actual['estado'] !== 'activa') {
            Http::fail(409, 'No se puede editar una subasta cerrada.');
        }

        $validado = $this->validarEntrada($in, true, $actual);
        $this->productos->actualizar($id, $validado);
        $producto = $this->productos->obtenerPorId($id);

        Http::ok(['producto' => $producto], 'Publicación actualizada.');
    }

    /** @param array<string, mixed> $in */
    public function eliminar(int $vendedorId, array $in): void
    {
        $id = isset($in['id']) && is_numeric($in['id']) ? (int) $in['id'] : 0;
        if ($id <= 0) {
            Http::fail(400, 'Identificador de publicación inválido.');
        }

        $actual = $this->productos->obtenerPorId($id);
        if ($actual === null) {
            Http::fail(404, 'La publicación no existe.');
        }
        if ((int) $actual['vendedorId'] !== $vendedorId) {
            Http::fail(403, 'Solo el vendedor puede eliminar esta publicación.');
        }
        if ($this->productos->tienePedidosPendientes($id)) {
            Http::fail(409, 'Tienes pedidos pendientes de esta publicación. Márcalos como entregados o cancélalos primero.');
        }
        if ($this->productos->tienePedidos($id)) {
            Http::fail(409, 'Esta publicación ya tiene historial de pedidos y no puede eliminarse.');
        }
        if ($actual['modalidad'] === 'subasta' && (int) $actual['totalPujas'] > 0 && $actual['estado'] === 'activa') {
            Http::fail(409, 'La subasta tiene pujas activas y no puede eliminarse antes del cierre.');
        }

        try {
            $this->productos->eliminar($id);
        } catch (PDOException $e) {
            if (($e->errorInfo[1] ?? 0) === 1451) {
                Http::fail(409, 'Esta publicación tiene registros asociados y no puede eliminarse.');
            }
            throw $e;
        }

        Http::ok([], 'Publicación eliminada.');
    }

    /** @param array<string, mixed> $in */
    public function pujar(int $usuarioId, array $in): void
    {
        $productoId = isset($in['producto_id']) && is_numeric($in['producto_id']) ? (int) $in['producto_id'] : 0;
        $monto = isset($in['monto']) && is_numeric($in['monto']) ? round((float) $in['monto'], 2) : 0.0;

        if ($productoId <= 0 || $monto <= 0) {
            Http::fail(400, 'Indica un monto de puja válido.');
        }

        try {
            $resultado = $this->productos->registrarPuja($productoId, $usuarioId, $monto);
            Http::ok($resultado, 'Puja registrada correctamente.');
        } catch (DomainException $e) {
            Http::fail(400, $e->getMessage());
        }
    }

    /**
     * Valida los campos de creación o edición de un producto.
     * @param array<string, mixed> $in
     * @param array<string, mixed>|null $actual
     * @return array<string, mixed>
     */
    private function validarEntrada(array $in, bool $esEdicion, ?array $actual = null): array
    {
        $errores = [];
        $titulo = Validator::texto($in['titulo'] ?? '', 90);
        $descripcion = Validator::texto($in['descripcion'] ?? '', 2000);
        $claveCategoria = Validator::texto($in['categoria'] ?? '', 25);
        $puntoEntrega = Validator::texto($in['puntoFisico'] ?? ($in['punto_entrega'] ?? ''), 255);
        $horariosEntrega = Validator::texto($in['horarios'] ?? ($in['horarios_entrega'] ?? ''), 255);

        if (mb_strlen($titulo) < 3) {
            $errores['titulo'] = 'Ingresa un título de al menos 3 caracteres.';
        }
        if (mb_strlen($descripcion) < 5) {
            $errores['descripcion'] = 'Ingresa una descripción detallada del artículo.';
        }

        $categoriaId = $claveCategoria !== '' ? $this->productos->categoriaIdPorClave($claveCategoria) : null;
        if ($categoriaId === null) {
            $errores['categoria'] = 'Selecciona una categoría académica válida.';
        }

        $modalidad = $esEdicion && $actual !== null
            ? (string) $actual['modalidad']
            : Validator::texto($in['modalidad'] ?? 'fijo', 10);
        if (!in_array($modalidad, ['fijo', 'subasta'], true)) {
            $errores['modalidad'] = 'Modalidad de venta inválida.';
        }

        $precio = isset($in['precio']) && is_numeric($in['precio']) ? round((float) $in['precio'], 2) : 0.0;
        if ($esEdicion && $actual !== null && $modalidad === 'subasta' && (int) $actual['totalPujas'] > 0) {
            $precio = (float) $actual['precio'];
        } elseif ($precio <= 0 || $precio > 999999.99) {
            $errores['precio'] = 'Ingresa un precio válido mayor a $0.00 MXN.';
        }

        $stock = $modalidad === 'subasta'
            ? 1
            : (isset($in['stock']) && is_numeric($in['stock']) ? (int) $in['stock'] : 0);
        if ($modalidad === 'fijo' && ($stock < 1 || $stock > 50)) {
            $errores['stock'] = 'El stock debe ser un número entero entre 1 y 50 unidades.';
        }

        $cierreSubasta = null;
        if (!$esEdicion && $modalidad === 'subasta') {
            $rawCierre = Validator::cadena($in['cierreSubasta'] ?? ($in['cierre_subasta'] ?? ''));
            $tsCierre = strtotime($rawCierre);
            if ($tsCierre === false || $tsCierre <= time()) {
                $errores['cierreSubasta'] = 'La fecha de cierre de la subasta debe ser posterior a la actual.';
            } else {
                $cierreSubasta = date('Y-m-d H:i:s', $tsCierre);
            }
        }

        $campusRaw = isset($in['campus']) && is_array($in['campus']) ? $in['campus'] : [];
        $campusClaves = array_map(static fn($c): string => Validator::texto($c, 25), $campusRaw);
        $campusIds = $this->productos->campusIdsPorClaves($campusClaves);
        if ($campusIds === []) {
            $errores['campus'] = 'Selecciona al menos un campus UADY de entrega.';
        }

        if ($puntoEntrega === '' || $horariosEntrega === '') {
            $errores['logistica'] = 'Indica los puntos físicos sugeridos y tus horarios disponibles.';
        }

        if ($errores !== []) {
            Http::fail(400, 'Revisa los datos de la publicación.', $errores);
        }

        return [
            'categoria_id'     => $categoriaId,
            'titulo'           => $titulo,
            'descripcion'      => $descripcion,
            'modalidad'        => $modalidad,
            'precio'           => $precio,
            'stock'            => $stock,
            'cierre_subasta'   => $cierreSubasta,
            'estado'           => $stock > 0 ? 'activa' : 'agotado',
            'campus_ids'       => $campusIds,
            'punto_entrega'    => $puntoEntrega,
            'horarios_entrega' => $horariosEntrega,
        ];
    }
}