<?php
declare(strict_types=1);

/** Protección CSRF: token en sesión que el cliente reenvía en la cabecera X-CSRF-Token. */
final class Csrf
{
    public static function token(): string
    {
        if (empty($_SESSION['csrf_token']) || !is_string($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }

        return $_SESSION['csrf_token'];
    }

    public static function regenerar(): string
    {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        return $_SESSION['csrf_token'];
    }

    /** Llamar al inicio de TODO endpoint que escriba datos (POST/PUT/DELETE). */
    public static function exigir(): void
    {
        $esperado = $_SESSION['csrf_token'] ?? '';
        $enviado = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

        if (
            !is_string($esperado)
            || $esperado === ''
            || !is_string($enviado)
            || !hash_equals($esperado, $enviado)
        ) {
            Http::fail(
                403,
                'Token de seguridad inválido o ausente. Recarga la página e inténtalo de nuevo.'
            );
        }
    }
}