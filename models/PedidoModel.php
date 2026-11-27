<?php
declare(strict_types=1);

/**
 * Gestión de pedidos mediante PDO y el procedimiento almacenado
 * sp_registrar_pedido.
 */
final class PedidoModel
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::obtener();
    }

    /**
     * Registra una compra directa mediante el procedimiento almacenado.
     *
     * @throws DomainException Si el procedimiento rechaza la compra.
     */
    public function registrarCompraDirecta(
        int $productoId,
        int $compradorId,
        int $cantidad,
        string $puntoEntrega,
        string $horarioEntrega
    ): int {
        try {
            $st = $this->db->prepare(
                'CALL sp_registrar_pedido(
                    :producto_id,
                    :comprador_id,
                    :cantidad,
                    :punto,
                    :horario,
                    @p_pedido_id
                )'
            );

            $st->execute([
                ':producto_id' => $productoId,
                ':comprador_id' => $compradorId,
                ':cantidad' => $cantidad,
                ':punto' => $puntoEntrega,
                ':horario' => $horarioEntrega,
            ]);

            $st->closeCursor();

            $pedidoId = (int) $this->db
                ->query('SELECT @p_pedido_id')
                ->fetchColumn();

            if ($pedidoId <= 0) {
                throw new RuntimeException(
                    'El procedimiento no devolvió un ID de pedido válido.'
                );
            }

            return $pedidoId;
        } catch (PDOException $e) {
            $sqlState = (string) ($e->errorInfo[0] ?? '');
            $codigoMysql = (int) ($e->errorInfo[1] ?? 0);

            if (
                $e->getCode() === '45000'
                || $sqlState === '45000'
                || $codigoMysql === 1644
            ) {
                $mensaje = (string) (
                    $e->errorInfo[2]
                    ?? 'No se pudo procesar la compra.'
                );

                throw new DomainException($mensaje, 0, $e);
            }

            throw $e;
        }
    }

    /**
     * Lista los pedidos de un usuario como comprador o vendedor.
     *
     * @return array<int, array<string, mixed>>
     */
    public function listarPorUsuario(
        int $usuarioId,
        string $rol = 'comprador'
    ): array {
        $columnaFiltro = $rol === 'vendedor'
            ? 'ped.vendedor_id'
            : 'ped.comprador_id';

        $sql = "
            SELECT
                ped.id AS idPedido,
                ped.producto_id AS idProducto,
                pr.titulo AS tituloProducto,
                ped.cantidad,
                ped.total,
                ped.punto_entrega AS puntoEntrega,
                ped.horario_entrega AS horarioEntrega,
                ped.estado,
                ped.origen,
                ped.creado_en AS fechaCreacion,
                comp.nombre AS compradorNombre,
                comp.correo AS compradorCorreo,
                vend.nombre AS vendedorNombre,
                vend.correo AS vendedorCorreo,
                EXISTS (
                    SELECT 1
                    FROM resenas r
                    WHERE r.pedido_id = ped.id
                ) AS yaCalificado
            FROM pedidos ped
            JOIN productos pr
                ON pr.id = ped.producto_id
            JOIN usuarios comp
                ON comp.id = ped.comprador_id
            JOIN usuarios vend
                ON vend.id = ped.vendedor_id
            WHERE {$columnaFiltro} = :uid
            ORDER BY ped.creado_en DESC, ped.id DESC
        ";

        $st = $this->db->prepare($sql);
        $st->execute([':uid' => $usuarioId]);

        return $st->fetchAll();
    }

    /**
     * Actualiza el estado de un pedido pendiente.
     * Solo el vendedor propietario puede modificarlo.
     *
     * @throws DomainException Si el pedido no existe, no pertenece
     *                         al vendedor o ya no está pendiente.
     */
    public function actualizarEstado(
        int $pedidoId,
        int $vendedorId,
        string $nuevoEstado
    ): void {
        if (!in_array($nuevoEstado, ['completado', 'cancelado'], true)) {
            throw new DomainException('El estado solicitado no es válido.');
        }

        $st = $this->db->prepare(
            'SELECT vendedor_id, estado
             FROM pedidos
             WHERE id = :id
             LIMIT 1'
        );

        $st->execute([':id' => $pedidoId]);
        $pedido = $st->fetch();

        if ($pedido === false) {
            throw new DomainException('No se encontró el pedido.');
        }

        if ((int) $pedido['vendedor_id'] !== $vendedorId) {
            throw new DomainException(
                'No tienes permiso para modificar este pedido.'
            );
        }

        if ((string) $pedido['estado'] !== 'pendiente') {
            throw new DomainException(
                'Solo se pueden actualizar pedidos pendientes.'
            );
        }

        $upd = $this->db->prepare(
            "UPDATE pedidos
             SET estado = :estado
             WHERE id = :id
               AND vendedor_id = :vendedor_id
               AND estado = 'pendiente'"
        );

        $upd->execute([
            ':estado' => $nuevoEstado,
            ':id' => $pedidoId,
            ':vendedor_id' => $vendedorId,
        ]);

        if ($upd->rowCount() !== 1) {
            throw new DomainException(
                'El pedido ya fue actualizado o no está disponible.'
            );
        }
    }
}