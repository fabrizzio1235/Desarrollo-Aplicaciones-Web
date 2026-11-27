<?php
declare(strict_types=1);

/**
 * Controlador de pedidos: compras directas y gestión de entregas.
 */
final class PedidoController
{
    private PedidoModel $pedidos;

    public function __construct(?PedidoModel $pedidos = null)
    {
        $this->pedidos = $pedidos ?? new PedidoModel();
    }

    /**
     * Registra una compra directa.
     *
     * @param array<string, mixed> $in
     */
    public function crear(int $compradorId, array $in): void
    {
        $productoId = isset($in['producto_id']) && is_numeric($in['producto_id'])
            ? (int) $in['producto_id']
            : 0;

        $cantidad = isset($in['cantidad']) && is_numeric($in['cantidad'])
            ? (int) $in['cantidad']
            : 1;

        $punto = Validator::texto(
            $in['punto_entrega'] ?? 'Por acordar',
            255
        );

        $horario = Validator::texto(
            $in['horario_entrega'] ?? 'Por acordar',
            255
        );

        if ($productoId <= 0 || $cantidad < 1) {
            Http::fail(400, 'Datos de compra inválidos.');
        }

        try {
            $pedidoId = $this->pedidos->registrarCompraDirecta(
                $productoId,
                $compradorId,
                $cantidad,
                $punto,
                $horario
            );

            Http::ok(
                ['idPedido' => $pedidoId],
                'Solicitud de compra registrada.',
                201
            );
        } catch (DomainException $e) {
            Http::fail(400, $e->getMessage());
        }
    }

    /**
     * Lista los pedidos de un usuario como comprador o vendedor.
     */
    public function listar(int $usuarioId, string $rol): void
    {
        $rolValido = $rol === 'vendedor'
            ? 'vendedor'
            : 'comprador';

        $lista = $this->pedidos->listarPorUsuario(
            $usuarioId,
            $rolValido
        );

        Http::ok(['pedidos' => $lista]);
    }

    /**
     * Cambia el estado de un pedido.
     *
     * @param array<string, mixed> $in
     */
    public function cambiarEstado(int $vendedorId, array $in): void
    {
        $pedidoId = isset($in['idPedido']) && is_numeric($in['idPedido'])
            ? (int) $in['idPedido']
            : 0;

        $estado = Validator::texto($in['estado'] ?? '', 20);

        if (
            $pedidoId <= 0
            || !in_array($estado, ['completado', 'cancelado'], true)
        ) {
            Http::fail(
                400,
                'Parámetros de actualización de pedido inválidos.'
            );
        }

        try {
            $this->pedidos->actualizarEstado(
                $pedidoId,
                $vendedorId,
                $estado
            );

            Http::ok(
                [],
                $estado === 'completado'
                    ? 'Pedido marcado como entregado.'
                    : 'Pedido cancelado y stock restaurado.'
            );
        } catch (DomainException $e) {
            Http::fail(400, $e->getMessage());
        }
    }
}