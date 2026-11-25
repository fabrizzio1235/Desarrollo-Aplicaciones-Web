<?php
declare(strict_types=1);

define('BASE_PATH', dirname(__DIR__));

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', BASE_PATH . '/logs/php-error.log');

date_default_timezone_set('America/Merida');
mb_internal_encoding('UTF-8');

require_once __DIR__ . '/database.php';

spl_autoload_register(static function (string $clase): void {
    foreach (['config', 'models', 'controllers'] as $directorio) {
        $archivo = BASE_PATH . '/' . $directorio . '/' . $clase . '.php';
        if (is_file($archivo)) {
            require_once $archivo;
            return;
        }
    }
});

if (defined('JZ_MODO_API')) {
    Http::registrarManejadores();
}

Sesion::iniciar();