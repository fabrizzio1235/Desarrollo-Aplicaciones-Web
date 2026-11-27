<?php
declare(strict_types=1);

final class FavoritoController
{
    private FavoritoModel $favoritos;

    public function __construct(?FavoritoModel $favoritos = null)
    {
        $this->favoritos = $favoritos ?? new FavoritoModel();
    }

    public function listar(int $usuarioId): void
    {
        $productos = $this->favoritos->listarPorUsuario($usuarioId);
        $ids = array_column($productos, 'id');
        Http::ok(['favoritos' => $productos, 'ids' => $ids, 'total' => count($productos)]);
    }

    /** @param array<string, mixed> $in */
    public function toggle(int $usuarioId, array $in): void
    {
        $productoId = isset($in['producto_id']) && is_numeric($in['producto_id']) ? (int) $in['producto_id'] : 0;
        if ($productoId <= 0) {
            Http::fail(400, 'Identificador de publicación inválido.');
        }

        try {
            $esFavorito = $this->favoritos->alternar($usuarioId, $productoId);
            $ids = $this->favoritos->idsPorUsuario($usuarioId);
            Http::ok(
                ['esFavorito' => $esFavorito, 'ids' => $ids],
                $esFavorito ? 'Agregado a tus favoritos.' : 'Eliminado de tus favoritos.'
            );
        } catch (DomainException $e) {
            Http::fail(404, $e->getMessage());
        }
    }
}