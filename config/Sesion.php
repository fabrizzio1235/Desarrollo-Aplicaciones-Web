<?php
declare(strict_types=1);

/** Manejo centralizado de la sesión de usuario. */
final class Sesion
{
    /** Segundos de inactividad tras los cuales se cierra la sesión (2 horas). */
    private const INACTIVIDAD_MAX = 7200;

    public static function esHttps(): bool
    {
        return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
    }

    public static function iniciar(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        session_name('JZSESSID');

        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => self::esHttps(),
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        session_start();

        if (isset($_SESSION['usuario_id'])) {
            $ultima = (int) ($_SESSION['ultima_actividad'] ?? 0);

            if ($ultima > 0 && (time() - $ultima) > self::INACTIVIDAD_MAX) {
                $_SESSION = [];
                session_regenerate_id(true);
            } else {
                $_SESSION['ultima_actividad'] = time();
            }
        }
    }

    /**
     * Abre la sesión del usuario: regenera el ID (evita fijación de sesión)
     * y rota el token CSRF.
     * @param array<string, mixed> $usuario Datos públicos (sin hash).
     */
    public static function establecer(array $usuario): void
    {
        session_regenerate_id(true);
        $_SESSION['usuario_id'] = (int) $usuario['id'];
        $_SESSION['usuario'] = $usuario;
        $_SESSION['ultima_actividad'] = time();
        Csrf::regenerar();
    }

    /** @return array<string, mixed>|null */
    public static function usuario(): ?array
    {
        if (isset($_SESSION['usuario_id'], $_SESSION['usuario']) && is_array($_SESSION['usuario'])) {
            return $_SESSION['usuario'];
        }

        return null;
    }

    public static function usuarioId(): ?int
    {
        return isset($_SESSION['usuario_id']) ? (int) $_SESSION['usuario_id'] : null;
    }

    /**
     * Para endpoints protegidos: responde 401 si no hay sesión activa.
     * @return array<string, mixed>
     */
    public static function requerir(): array
    {
        $usuario = self::usuario();

        if ($usuario === null) {
            Http::fail(401, 'Debes iniciar sesión para continuar.');
        }

        return $usuario;
    }

    public static function destruir(): void
    {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();

            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $p['path'],
                'domain' => $p['domain'],
                'secure' => $p['secure'],
                'httponly' => $p['httponly'],
                'samesite' => 'Lax',
            ]);
        }

        session_destroy();
    }
}