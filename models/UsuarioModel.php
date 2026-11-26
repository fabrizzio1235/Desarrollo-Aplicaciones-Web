<?php
declare(strict_types=1);

/** Acceso a datos de usuarios. Todas las consultas usan PDO con parámetros enlazados. */
final class UsuarioModel
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::obtener();
    }

    /** @return array<string, mixed>|null Fila completa (incluye password_hash). */
    public function buscarPorCorreo(string $correo): ?array
    {
        $sql = 'SELECT u.*, c.clave AS campus_clave, c.nombre AS campus_nombre
                  FROM usuarios u
                  JOIN campus c ON c.id = u.campus_id
                 WHERE u.correo = :correo AND u.activo = 1
                 LIMIT 1';
        $st = $this->db->prepare($sql);
        $st->execute([':correo' => $correo]);
        $fila = $st->fetch();
        return $fila === false ? null : $fila;
    }

    public function campusIdPorClave(string $clave): ?int
    {
        $st = $this->db->prepare('SELECT id FROM campus WHERE clave = :clave LIMIT 1');
        $st->execute([':clave' => $clave]);
        $id = $st->fetchColumn();
        return $id === false ? null : (int) $id;
    }

    /** @param array{nombre:string, correo:string, password_hash:string, campus_id:int} $datos */
    public function crear(array $datos): int
    {
        $st = $this->db->prepare(
            'INSERT INTO usuarios (nombre, correo, password_hash, campus_id)
             VALUES (:nombre, :correo, :hash, :campus)'
        );
        $st->execute([
            ':nombre' => $datos['nombre'],
            ':correo' => $datos['correo'],
            ':hash'   => $datos['password_hash'],
            ':campus' => $datos['campus_id'],
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function actualizarHash(int $id, string $hash): void
    {
        $st = $this->db->prepare('UPDATE usuarios SET password_hash = :hash WHERE id = :id');
        $st->execute([':hash' => $hash, ':id' => $id]);
    }

    /**
     * Datos públicos que viajan al navegador (nunca incluye password_hash).
     * @param array<string, mixed> $fila
     * @return array<string, mixed>
     */
    public static function publico(array $fila): array
    {
        return [
            'id'                 => (int) $fila['id'],
            'nombre'             => (string) $fila['nombre'],
            'correo'             => (string) $fila['correo'],
            'campus'             => (string) ($fila['campus_clave'] ?? ''),
            'campusNombre'       => (string) ($fila['campus_nombre'] ?? ''),
            'facultad'           => (string) ($fila['facultad'] ?? ''),
            'descripcion'        => (string) ($fila['descripcion'] ?? ''),
            'foto'               => (string) ($fila['foto_ruta'] ?? ''),
            'puntosFrecuentes'   => (string) ($fila['puntos_frecuentes'] ?? ''),
            'horariosHabituales' => (string) ($fila['horarios_habituales'] ?? ''),
            'fechaRegistro'      => (string) ($fila['creado_en'] ?? ''),
        ];
    }
}