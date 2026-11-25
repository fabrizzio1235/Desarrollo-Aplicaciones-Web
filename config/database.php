<?php
declare(strict_types=1);

//Conexión PDO centralizada: único lugar donde viven las credenciales.

final class Database
{
    private static ?PDO $conexion = null;

    /** @return array<string, mixed> */
    private static function configuracion(): array
    {
        $base = [
            'host' => '127.0.0.1',
            'port' => 3306,
            'name' => 'jaguarzon',
            'user' => 'root',
            'pass' => '',
            'charset' => 'utf8mb4',
        ];

        $archivoLocal = __DIR__ . '/local.php';

        if (is_file($archivoLocal)) {
            $local = require $archivoLocal;

            if (is_array($local)) {
                $base = array_merge($base, $local);
            }
        }

        return $base;
    }

    public static function obtener(): PDO
    {
        if (self::$conexion === null) {
            $c = self::configuracion();

            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $c['host'],
                (int) $c['port'],
                $c['name'],
                $c['charset']
            );

            self::$conexion = new PDO(
                $dsn,
                (string) $c['user'],
                (string) $c['pass'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        }

        return self::$conexion;
    }
}