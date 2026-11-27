<?php
declare(strict_types=1);

final class MensajeModel
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::obtener();
    }

    // Lista las conversaciones en las que participa un usuario.
    public function listarPorUsuario(int $usuarioId): array
    {
        $sql = '
            SELECT
                c.id AS idConversacion,
                c.producto_id AS idProducto,
                p.titulo AS tituloProducto,
                c.comprador_id AS compradorId,
                comp.nombre AS compradorNombre,
                comp.correo AS compradorCorreo,
                c.vendedor_id AS vendedorId,
                vend.nombre AS vendedorNombre,
                vend.correo AS vendedorCorreo,
                ultimo.texto AS ultimoMensaje,
                ultimo.creado_en AS fechaUltimoMensaje,
                (
                    SELECT COUNT(*)
                    FROM mensajes m2
                    WHERE m2.conversacion_id = c.id
                      AND m2.emisor_id <> :usuario_lectura
                      AND m2.leido = 0
                ) AS noLeidos
            FROM conversaciones c
            JOIN productos p ON p.id = c.producto_id
            JOIN usuarios comp ON comp.id = c.comprador_id
            JOIN usuarios vend ON vend.id = c.vendedor_id
            LEFT JOIN mensajes ultimo
                ON ultimo.id = (
                    SELECT MAX(m3.id)
                    FROM mensajes m3
                    WHERE m3.conversacion_id = c.id
                )
            WHERE c.comprador_id = :comprador_id
               OR c.vendedor_id = :vendedor_id
            ORDER BY
                COALESCE(ultimo.creado_en, c.creado_en) DESC,
                c.id DESC
        ';

        $st = $this->db->prepare($sql);
        $st->execute([
            ':usuario_lectura' => $usuarioId,
            ':comprador_id' => $usuarioId,
            ':vendedor_id' => $usuarioId,
        ]);

        return $st->fetchAll();
    }


    // Obtiene o crea una conversación desde una publicación.
    public function obtenerOCrearPorProducto(
        int $productoId,
        int $compradorId
    ): array {
        $st = $this->db->prepare(
            'SELECT
                p.id AS idProducto,
                p.titulo AS tituloProducto,
                p.vendedor_id AS vendedorId,
                v.nombre AS vendedorNombre,
                v.correo AS vendedorCorreo
             FROM productos p
             JOIN usuarios v ON v.id = p.vendedor_id
             WHERE p.id = :producto_id
             LIMIT 1'
        );

        $st->execute([':producto_id' => $productoId]);
        $producto = $st->fetch();

        if ($producto === false) {
            throw new DomainException('La publicación no existe.');
        }

        $vendedorId = (int) $producto['vendedorId'];

        if ($vendedorId === $compradorId) {
            throw new DomainException(
                'No puedes iniciar una conversación contigo mismo.'
            );
        }

        $idConversacion = $this->crearORecuperar(
            $productoId,
            $compradorId,
            $vendedorId
        );

        return [
            'idConversacion' => $idConversacion,
            ...$producto,
        ];
    }

    /**
     * Obtiene o crea una conversación a partir de un pedido.
     * El usuario debe ser el comprador o el vendedor del pedido.
     */
    public function obtenerOCrearPorPedido(
        int $pedidoId,
        int $usuarioId
    ): array {
        $st = $this->db->prepare(
            'SELECT
                ped.producto_id AS idProducto,
                ped.comprador_id AS compradorId,
                ped.vendedor_id AS vendedorId,
                p.titulo AS tituloProducto,
                comp.nombre AS compradorNombre,
                comp.correo AS compradorCorreo,
                vend.nombre AS vendedorNombre,
                vend.correo AS vendedorCorreo
             FROM pedidos ped
             JOIN productos p ON p.id = ped.producto_id
             JOIN usuarios comp ON comp.id = ped.comprador_id
             JOIN usuarios vend ON vend.id = ped.vendedor_id
             WHERE ped.id = :pedido_id
             LIMIT 1'
        );

        $st->execute([':pedido_id' => $pedidoId]);
        $pedido = $st->fetch();

        if ($pedido === false) {
            throw new DomainException('El pedido no existe.');
        }

        $compradorId = (int) $pedido['compradorId'];
        $vendedorId = (int) $pedido['vendedorId'];

        if ($usuarioId !== $compradorId && $usuarioId !== $vendedorId) {
            throw new DomainException(
                'No tienes permiso para acceder a este pedido.'
            );
        }

        $idConversacion = $this->crearORecuperar(
            (int) $pedido['idProducto'],
            $compradorId,
            $vendedorId
        );

        return [
            'idConversacion' => $idConversacion,
            ...$pedido,
        ];
    }


    // Obtiene los mensajes de una conversación.
    public function listarMensajes(
        int $conversacionId,
        int $usuarioId
    ): array {
        $this->exigirParticipante($conversacionId, $usuarioId);

        $sql = '
            SELECT
                m.id,
                m.conversacion_id AS idConversacion,
                m.emisor_id AS emisorId,
                u.correo AS de,
                u.nombre AS emisorNombre,
                m.texto,
                m.creado_en AS fecha,
                m.leido
            FROM mensajes m
            JOIN usuarios u ON u.id = m.emisor_id
            WHERE m.conversacion_id = :conversacion_id
            ORDER BY m.creado_en ASC, m.id ASC
        ';

        $st = $this->db->prepare($sql);
        $st->execute([':conversacion_id' => $conversacionId]);

        return $st->fetchAll();
    }


    // Registra un mensaje enviado por un participante.
    public function enviarMensaje(
        int $conversacionId,
        int $emisorId,
        string $texto
    ): int {
        $texto = trim($texto);

        if ($texto === '' || mb_strlen($texto) > 500) {
            throw new DomainException(
                'El mensaje debe contener entre 1 y 500 caracteres.'
            );
        }

        $this->exigirParticipante($conversacionId, $emisorId);

        $st = $this->db->prepare(
            'INSERT INTO mensajes (conversacion_id, emisor_id, texto)
             VALUES (:conversacion_id, :emisor_id, :texto)'
        );

        $st->execute([
            ':conversacion_id' => $conversacionId,
            ':emisor_id' => $emisorId,
            ':texto' => $texto,
        ]);

        return (int) $this->db->lastInsertId();
    }


    // Marca como leídos los mensajes recibidos por el usuario.
    public function marcarComoLeida(
        int $conversacionId,
        int $usuarioId
    ): void {
        $this->exigirParticipante($conversacionId, $usuarioId);

        $st = $this->db->prepare(
            'UPDATE mensajes
             SET leido = 1
             WHERE conversacion_id = :conversacion_id
               AND emisor_id <> :usuario_id
               AND leido = 0'
        );

        $st->execute([
            ':conversacion_id' => $conversacionId,
            ':usuario_id' => $usuarioId,
        ]);
    }


    // Cuenta los mensajes no leídos de todas las conversaciones del usuario.
    public function contarNoLeidos(int $usuarioId): int
    {
        $st = $this->db->prepare(
            'SELECT COUNT(*)
             FROM mensajes m
             JOIN conversaciones c ON c.id = m.conversacion_id
             WHERE (c.comprador_id = :comprador_id
                 OR c.vendedor_id = :vendedor_id)
               AND m.emisor_id <> :usuario_lectura
               AND m.leido = 0'
        );

        $st->execute([
            ':comprador_id' => $usuarioId,
            ':vendedor_id' => $usuarioId,
            ':usuario_lectura' => $usuarioId,
        ]);

        return (int) $st->fetchColumn();
    }


    // Crea una conversación o recupera la existente.
    private function crearORecuperar(
        int $productoId,
        int $compradorId,
        int $vendedorId
    ): int {
        $st = $this->db->prepare(
            'INSERT INTO conversaciones
                (producto_id, comprador_id, vendedor_id)
             VALUES
                (:producto_id, :comprador_id, :vendedor_id)
             ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)'
        );

        $st->execute([
            ':producto_id' => $productoId,
            ':comprador_id' => $compradorId,
            ':vendedor_id' => $vendedorId,
        ]);

        return (int) $this->db->lastInsertId();
    }

    // Comprueba que el usuario participe en la conversación.
    private function exigirParticipante(
        int $conversacionId,
        int $usuarioId
    ): void {
        $st = $this->db->prepare(
            'SELECT id
             FROM conversaciones
             WHERE id = :id
               AND (
                    comprador_id = :comprador_id
                    OR vendedor_id = :vendedor_id
               )
             LIMIT 1'
        );

        $st->execute([
            ':id' => $conversacionId,
            ':comprador_id' => $usuarioId,
            ':vendedor_id' => $usuarioId,
        ]);

        if ($st->fetchColumn() === false) {
            throw new DomainException(
                'La conversación no existe o no tienes permiso para acceder a ella.'
            );
        }
    }
}