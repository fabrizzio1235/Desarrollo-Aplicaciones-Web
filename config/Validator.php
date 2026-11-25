<?php
declare(strict_types=1);

/** Validación y saneamiento de entradas (la salida se escapa en cada vista / con textContent en JS). */
final class Validator
{
    public const REGEX_CORREO_UADY = '/^(a\d{8}@alumnos\.uady\.mx|[a-z0-9]+([._%+-][a-z0-9]+)*@correo\.uady\.mx)$/i';

    /** Devuelve el valor solo si es cadena, evita errores de conversión con arreglos/objetos. */
    public static function cadena(mixed $valor): string
    {
        return is_string($valor) ? $valor : '';
    }

    /** Recorta, quita etiquetas HTML y caracteres de control, y limita la longitud. */
    public static function texto(mixed $valor, int $max): string
    {
        $limpio = trim(strip_tags(self::cadena($valor)));
        $limpio = (string) preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $limpio);
        return mb_substr($limpio, 0, $max);
    }

    public static function correoUady(string $correo): bool
    {
        return mb_strlen($correo) <= 120 && preg_match(self::REGEX_CORREO_UADY, $correo) === 1;
    }
}