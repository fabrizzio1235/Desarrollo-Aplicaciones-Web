<?php
declare(strict_types=1);

final class MensajeController
{
    private MensajeModel $mensajes;

    public function __construct(?MensajeModel $mensajes = null)
    {
        $this->mensajes = $mensajes ?? new MensajeModel();
    }


    // Lista las conversaciones del usuario autenticado.
    public function listar(int $usuarioId): void
    {
        Http::ok([
            'conversaciones' => $this->mensajes->listarPorUsuario($usuarioId),
        ]);
    }


    // Abre o recupera una conversación desde un producto.
    public function abrirProducto(int $usuarioId, array $in): void
    {
        $productoId = isset($in['producto_id']) && is_numeric($in['producto_id'])
            ? (int) $in['producto_id']
            : 0;

        if ($productoId <= 0) {
            Http::fail(400, 'Identificador de producto inválido.');
        }

        try {
            $conversacion = $this->mensajes->obtenerOCrearPorProducto(
                $productoId,
                $usuarioId
            );

            Http::ok(
                ['conversacion' => $conversacion],
                'Conversación disponible.'
            );
        } catch (DomainException $e) {
            Http::fail(404, $e->getMessage());
        }
    }

    // Abre o recupera una conversación desde un pedido.
    public function abrirPedido(int $usuarioId, array $in): void
    {
        $pedidoId = isset($in['pedido_id']) && is_numeric($in['pedido_id'])
            ? (int) $in['pedido_id']
            : 0;

        if ($pedidoId <= 0) {
            Http::fail(400, 'Identificador de pedido inválido.');
        }

        try {
            $conversacion = $this->mensajes->obtenerOCrearPorPedido(
                $pedidoId,
                $usuarioId
            );

            Http::ok(
                ['conversacion' => $conversacion],
                'Conversación disponible.'
            );
        } catch (DomainException $e) {
            Http::fail(403, $e->getMessage());
        }
    }

    // Lista los mensajes de una conversación.
    public function listarMensajes(int $usuarioId, array $query): void
    {
        $conversacionId = isset($query['conversacion_id'])
            && is_numeric($query['conversacion_id'])
                ? (int) $query['conversacion_id']
                : 0;

        if ($conversacionId <= 0) {
            Http::fail(400, 'Identificador de conversación inválido.');
        }

        try {
            $mensajes = $this->mensajes->listarMensajes(
                $conversacionId,
                $usuarioId
            );

            Http::ok(['mensajes' => $mensajes]);
        } catch (DomainException $e) {
            Http::fail(403, $e->getMessage());
        }
    }


    // Envía un mensaje dentro de una conversación.
    public function enviar(int $usuarioId, array $in): void
    {
        $conversacionId = isset($in['conversacion_id'])
            && is_numeric($in['conversacion_id'])
                ? (int) $in['conversacion_id']
                : 0;

        $texto = isset($in['texto']) && is_string($in['texto'])
            ? trim($in['texto'])
            : '';

        if ($conversacionId <= 0) {
            Http::fail(400, 'Identificador de conversación inválido.');
        }

        if ($texto === '' || mb_strlen($texto) > 500) {
            Http::fail(
                400,
                'El mensaje debe contener entre 1 y 500 caracteres.'
            );
        }

        try {
            $idMensaje = $this->mensajes->enviarMensaje(
                $conversacionId,
                $usuarioId,
                $texto
            );

            Http::ok(
                ['id' => $idMensaje],
                'Mensaje enviado correctamente.',
                201
            );
        } catch (DomainException $e) {
            Http::fail(403, $e->getMessage());
        }
    }


    // Marca como leídos los mensajes recibidos.
    public function marcarLeidos(int $usuarioId, array $in): void
    {
        $conversacionId = isset($in['conversacion_id'])
            && is_numeric($in['conversacion_id'])
                ? (int) $in['conversacion_id']
                : 0;

        if ($conversacionId <= 0) {
            Http::fail(400, 'Identificador de conversación inválido.');
        }

        try {
            $this->mensajes->marcarComoLeida(
                $conversacionId,
                $usuarioId
            );

            Http::ok([], 'Mensajes marcados como leídos.');
        } catch (DomainException $e) {
            Http::fail(403, $e->getMessage());
        }
    }


    // Cuenta todos los mensajes no leídos del usuario.
    public function contarNoLeidos(int $usuarioId): void
    {
        Http::ok([
            'total' => $this->mensajes->contarNoLeidos($usuarioId),
        ]);
    }
}
