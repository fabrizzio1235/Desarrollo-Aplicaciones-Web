<?php
declare(strict_types=1);

/**
 * Gestión de la lista de artículos guardados (favoritos) por estudiante.
 */
final class FavoritoModel
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::obtener();
    }

    /**
     * Devuelve los IDs de productos marcados como favoritos por el usuario.
     * @return array<int, int>
     */
    public function idsPorUsuario(int $usuarioId): array
    {
        $st = $this->db->prepare(
            'SELECT producto_id FROM favoritos WHERE usuario_id = :uid ORDER BY creado_en DESC'
        );
        $st->execute([':uid' => $usuarioId]);
        return array_map('intval', $st->fetchAll(PDO::FETCH_COLUMN));
    }

    /**
     * Devuelve el detalle completo de los productos favoritos usando vw_catalogo_productos.
     * @return array<int, array<string, mixed>>
     */
    public function listarPorUsuario(int $usuarioId): array
    {
        $sql = 'SELECT v.*, f.creado_en AS guardado_en
                  FROM favoritos f
                  JOIN vw_catalogo_productos v ON v.id = f.producto_id
                 WHERE f.usuario_id = :uid
                 ORDER BY f.creado_en DESC';
        $st = $this->db->prepare($sql);
        $st->execute([':uid' => $usuarioId]);
        $filas = $st->fetchAll();

        $resultado = [];
        foreach ($filas as $fila) {
            $rutaImg = (string) ($fila['imagen_principal'] ?? '');
            if ($rutaImg !== '' && !str_starts_with($rutaImg, '../') && !str_starts_with($rutaImg, 'http')) {
                $rutaImg = '../' . ltrim($rutaImg, '/');
            }
            if ($rutaImg === '') {
                $rutaImg = '../assets/images/image-placeholder.jpg';
            }

            $resultado[] = [
                'id'                   => (int) $fila['id'],
                'titulo'               => (string) $fila['titulo'],
                'descripcion'          => (string) $fila['descripcion'],
                'modalidad'            => (string) $fila['modalidad'],
                'precio'               => (float) $fila['precio'],
                'stock'                => (int) $fila['stock'],
                'estado'               => (string) $fila['estado'],
                'categoria'            => (string) $fila['categoria_clave'],
                'categoriaNombre'      => (string) $fila['categoria_nombre'],
                'campus'               => $fila['campus_claves'] ? explode(',', (string) $fila['campus_claves']) : [],
                'entregaTexto'         => (string) ($fila['campus_nombres'] ?? $fila['punto_entrega']),
                'imagen'               => $rutaImg,
                'vendedorId'           => (int) $fila['vendedor_id'],
                'vendedorNombre'       => (string) $fila['vendedor_nombre'],
                'vendedorPromedio'     => $fila['vendedor_promedio'] !== null ? (float) $fila['vendedor_promedio'] : 0.0,
                'vendedorTotalResenas' => (int) ($fila['vendedor_total_resenas'] ?? 0),
                'guardadoEn'           => (string) $fila['guardado_en'],
            ];
        }
        return $resultado;
    }

    /**
     * Alterna el estado de favorito de un producto para el usuario.
     * @return bool true si quedó guardado, false si se eliminó.
     */
    public function alternar(int $usuarioId, int $productoId): bool
    {
        $stExiste = $this->db->prepare('SELECT id FROM productos WHERE id = :pid LIMIT 1');
        $stExiste->execute([':pid' => $productoId]);
        if ($stExiste->fetchColumn() === false) {
            throw new DomainException('La publicación no existe.');
        }

        $stCheck = $this->db->prepare(
            'SELECT 1 FROM favoritos WHERE usuario_id = :uid AND producto_id = :pid LIMIT 1'
        );
        $stCheck->execute([':uid' => $usuarioId, ':pid' => $productoId]);

        if ($stCheck->fetchColumn() !== false) {
            $stDel = $this->db->prepare(
                'DELETE FROM favoritos WHERE usuario_id = :uid AND producto_id = :pid'
            );
            $stDel->execute([':uid' => $usuarioId, ':pid' => $productoId]);
            return false;
        }

        $stIns = $this->db->prepare(
            'INSERT INTO favoritos (usuario_id, producto_id) VALUES (:uid, :pid)'
        );
        $stIns->execute([':uid' => $usuarioId, ':pid' => $productoId]);
        return true;
    }
}
