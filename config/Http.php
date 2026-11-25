<?php
declare(strict_types=1);

/**
 * Utilidades HTTP/JSON. Formato estándar de respuesta:
 * éxito: { "ok": true, "mensaje": "...", "datos": { ... } }
 * error: { "ok": false, "mensaje": "...", "errores": { "campo": "detalle" } }
 */
final class Http
{
    /** @param array<string, mixed> $payload */
    public static function responder(int $status, array $payload): void
    {
        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-store');
            header('X-Content-Type-Options: nosniff');
        }

        echo json_encode(
            $payload,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR
        );
        exit;
    }

    /** @param array<string, mixed> $datos */
    public static function ok(array $datos = [], string $mensaje = '', int $status = 200): void
    {
        self::responder($status, [
            'ok' => true,
            'mensaje' => $mensaje,
            'datos' => $datos === [] ? new stdClass() : $datos,
        ]);
    }

    /** @param array<string, string> $errores */
    public static function fail(int $status, string $mensaje, array $errores = []): void
    {
        self::responder($status, [
            'ok' => false,
            'mensaje' => $mensaje,
            'errores' => $errores === [] ? new stdClass() : $errores,
        ]);
    }

    /** Exige que el método HTTP sea uno de los permitidos (405 si no). */
    public static function metodo(string ...$permitidos): void
    {
        $actual = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if (!in_array($actual, $permitidos, true)) {
            header('Allow: ' . implode(', ', $permitidos));
            self::fail(405, 'Método no permitido.');
        }
    }

    /**
     * Lee y valida el cuerpo JSON de la petición.
     * @return array<string, mixed>
     */
    public static function cuerpo(): array
    {
        $tipo = $_SERVER['CONTENT_TYPE'] ?? '';

        if (stripos($tipo, 'application/json') === false) {
            self::fail(400, 'El contenido debe enviarse como JSON.');
        }

        $crudo = file_get_contents('php://input');

        if ($crudo === false || trim($crudo) === '') {
            self::fail(400, 'La petición está vacía.');
        }

        try {
            $datos = json_decode($crudo, true, 16, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            self::fail(400, 'El JSON enviado no es válido.');
        }

        if (!is_array($datos)) {
            self::fail(400, 'El cuerpo debe ser un objeto JSON.');
        }

        return $datos;
    }

    /** Convierte cualquier error o excepción no controlada en un 500 JSON limpio. */
    public static function registrarManejadores(): void
    {
        set_error_handler(static function (
            int $nivel,
            string $mensaje,
            string $archivo,
            int $linea
        ): bool {
            if ((error_reporting() & $nivel) === 0) {
                return false;
            }

            throw new ErrorException($mensaje, 0, $nivel, $archivo, $linea);
        });

        set_exception_handler(static function (Throwable $e): void {
            error_log(sprintf(
                '[%s] %s en %s:%d',
                get_class($e),
                $e->getMessage(),
                $e->getFile(),
                $e->getLine()
            ));

            Http::fail(500, 'Ocurrió un error interno. Inténtalo de nuevo más tarde.');
        });
    }
}