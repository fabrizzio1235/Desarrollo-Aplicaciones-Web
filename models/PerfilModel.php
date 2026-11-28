<?php
declare(strict_types=1);

// Gestión de perfil académico, reputación y reseñas post-entrega.
final class PerfilModel
{
    private PDO $db;

    public function __construct(?PDO $db = null)
    {
        $this->db = $db ?? Database::obtener();
    }

    /**
     * Obtiene datos del usuario, métricas de actividad y reseñas recibidas.
     * @return array<string, mixed>|null
     */
    public function obtenerPerfilCompleto(int $usuarioId): ?array
    {
        $st = $this->db->prepare(
            'SELECT id, nombre, correo, campus, facultad, descripcion,
                    puntos_frecuentes, horarios_habituales, foto_ruta, creado_en
               FROM usuarios
              WHERE id = :id
              LIMIT 1'
        );
        $st->execute([':id' => $usuarioId]);
        $usuario = $st->fetch();
        if ($usuario === false) {
            return null;
        }

        $stRep = $this->db->prepare(
            'SELECT COALESCE(ROUND(AVG(estrellas), 1), 0) AS promedio, COUNT(*) AS total
               FROM resenas
              WHERE vendedor_id = :uid'
        );
        $stRep->execute([':uid' => $usuarioId]);
        $rep = $stRep->fetch() ?: ['promedio' => 0, 'total' => 0];

        $stVentas = $this->db->prepare(
            "SELECT COUNT(*) FROM pedidos WHERE vendedor_id = :uid AND estado = 'completado'"
        );
        $stVentas->execute([':uid' => $usuarioId]);
        $ventasCompletadas = (int) $stVentas->fetchColumn();

        $stCompras = $this->db->prepare(
            "SELECT COUNT(*) FROM pedidos WHERE comprador_id = :uid AND estado = 'completado'"
        );
        $stCompras->execute([':uid' => $usuarioId]);
        $comprasCompletadas = (int) $stCompras->fetchColumn();

        $stResenas = $this->db->prepare(
            'SELECT r.id, r.estrellas, r.estrellas AS calificacion, r.comentario, r.creado_en,
                    u.nombre AS autorNombre, pr.titulo AS productoTitulo
               FROM resenas r
               JOIN usuarios u   ON u.id = r.comprador_id
               JOIN pedidos ped  ON ped.id = r.pedido_id
               JOIN productos pr ON pr.id = ped.producto_id
              WHERE r.vendedor_id = :uid
              ORDER BY r.creado_en DESC, r.id DESC'
        );
        $stResenas->execute([':uid' => $usuarioId]);

        $fotoRuta = trim((string) ($usuario['foto_ruta'] ?? ''));
        if ($fotoRuta !== '' && !str_starts_with($fotoRuta, '../') && !str_starts_with($fotoRuta, 'http')) {
            $fotoRuta = '../' . ltrim($fotoRuta, '/');
        }

        return [
            'usuario' => [
                'id'                 => (int) $usuario['id'],
                'nombre'             => (string) $usuario['nombre'],
                'correo'             => (string) $usuario['correo'],
                'campus'             => (string) ($usuario['campus'] ?? ''),
                'facultad'           => (string) ($usuario['facultad'] ?? ''),
                'descripcion'        => (string) ($usuario['descripcion'] ?? ''),
                'puntosFrecuentes'   => (string) ($usuario['puntos_frecuentes'] ?? ''),
                'horariosHabituales' => (string) ($usuario['horarios_habituales'] ?? ''),
                'fotoRuta'           => $fotoRuta,
                'avatar'             => $fotoRuta,
                'creado_en'          => (string) $usuario['creado_en'],
            ],
            'metricas' => [
                'promedio'           => (float) $rep['promedio'],
                'totalResenas'       => (int) $rep['total'],
                'ventasCompletadas'  => $ventasCompletadas,
                'comprasCompletadas' => $comprasCompletadas,
            ],
            'resenas' => $stResenas->fetchAll(),
        ];
    }

    public function actualizarPerfil(
        int $usuarioId,
        string $nombre,
        string $campus,
        string $facultad,
        string $descripcion,
        string $puntosFrecuentes,
        string $horariosHabituales
    ): void {
        $st = $this->db->prepare(
            'UPDATE usuarios
                SET nombre = :nombre,
                    campus = :campus,
                    facultad = :facultad,
                    descripcion = :descripcion,
                    puntos_frecuentes = :puntos,
                    horarios_habituales = :horarios
              WHERE id = :id'
        );
        $st->execute([
            ':nombre'      => $nombre,
            ':campus'      => $campus,
            ':facultad'    => $facultad,
            ':descripcion' => $descripcion,
            ':puntos'      => $puntosFrecuentes,
            ':horarios'    => $horariosHabituales,
            ':id'          => $usuarioId,
        ]);
    }

    /**
     * Registra una calificación (1..5 estrellas) para un pedido completado donde el comprador evalúa al vendedor.
     */
    public function crearResena(int $pedidoId, int $compradorId, int $estrellas, string $comentario): void
    {
        $st = $this->db->prepare(
            'SELECT id, comprador_id, vendedor_id, estado FROM pedidos WHERE id = :id LIMIT 1'
        );
        $st->execute([':id' => $pedidoId]);
        $pedido = $st->fetch();

        if ($pedido === false) {
            throw new DomainException('No se encontró el pedido indicado.');
        }
        if ((int) $pedido['comprador_id'] !== $compradorId) {
            throw new DomainException('Solo el comprador de este pedido puede emitir una reseña.');
        }
        if ((string) $pedido['estado'] !== 'completado') {
            throw new DomainException('Solo puedes calificar pedidos ya entregados (completados).');
        }

        $stDup = $this->db->prepare('SELECT 1 FROM resenas WHERE pedido_id = :pid LIMIT 1');
        $stDup->execute([':pid' => $pedidoId]);
        if ($stDup->fetchColumn() !== false) {
            throw new DomainException('Este pedido ya fue calificado anteriormente.');
        }

        $stIns = $this->db->prepare(
            'INSERT INTO resenas (pedido_id, comprador_id, vendedor_id, estrellas, comentario)
             VALUES (:pid, :comp_id, :vend_id, :estrellas, :com)'
        );
        $stIns->execute([
            ':pid'       => $pedidoId,
            ':comp_id'   => $compradorId,
            ':vend_id'   => (int) $pedido['vendedor_id'],
            ':estrellas' => $estrellas,
            ':com'       => $comentario,
        ]);
    }
}