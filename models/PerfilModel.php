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
            'SELECT id, nombre, correo, facultad, avatar, creado_en FROM usuarios WHERE id = :id LIMIT 1'
        );
        $st->execute([':id' => $usuarioId]);
        $usuario = $st->fetch();
        if ($usuario === false) {
            return null;
        }

        $stRep = $this->db->prepare(
            'SELECT COALESCE(ROUND(AVG(calificacion), 1), 0) AS promedio, COUNT(*) AS total
               FROM resenas
              WHERE evaluado_id = :uid'
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
            'SELECT r.id, r.calificacion, r.comentario, r.creado_en,
                    u.nombre AS autorNombre, pr.titulo AS productoTitulo
               FROM resenas r
               JOIN usuarios u  ON u.id = r.evaluador_id
               JOIN pedidos ped ON ped.id = r.pedido_id
               JOIN productos pr ON pr.id = ped.producto_id
              WHERE r.evaluado_id = :uid
              ORDER BY r.creado_en DESC, r.id DESC'
        );
        $stResenas->execute([':uid' => $usuarioId]);

        $avatar = (string) ($usuario['avatar'] ?? '');
        if ($avatar !== '' && !str_starts_with($avatar, '../') && !str_starts_with($avatar, 'http')) {
            $avatar = '../' . ltrim($avatar, '/');
        }
        if ($avatar === '') {
            $avatar = '../assets/images/image-placeholder.jpg';
        }

        return [
            'usuario' => [
                'id'        => (int) $usuario['id'],
                'nombre'    => (string) $usuario['nombre'],
                'correo'    => (string) $usuario['correo'],
                'facultad'  => (string) ($usuario['facultad'] ?? ''),
                'avatar'    => $avatar,
                'creado_en' => (string) $usuario['creado_en'],
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

    public function actualizarDatosBasicos(int $usuarioId, string $nombre, string $facultad): void
    {
        $st = $this->db->prepare(
            'UPDATE usuarios SET nombre = :nombre, facultad = :facultad WHERE id = :id'
        );
        $st->execute([
            ':nombre'   => $nombre,
            ':facultad' => $facultad,
            ':id'       => $usuarioId,
        ]);
    }

    // Registra una calificación (1..5) para un pedido completado donde el evaluador fue el comprador. 
    public function crearResena(int $pedidoId, int $evaluadorId, int $calificacion, string $comentario): void
    {
        $st = $this->db->prepare(
            'SELECT id, comprador_id, vendedor_id, estado FROM pedidos WHERE id = :id LIMIT 1'
        );
        $st->execute([':id' => $pedidoId]);
        $pedido = $st->fetch();

        if ($pedido === false) {
            throw new DomainException('No se encontró el pedido indicado.');
        }
        if ((int) $pedido['comprador_id'] !== $evaluadorId) {
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
            'INSERT INTO resenas (pedido_id, evaluador_id, evaluado_id, calificacion, comentario)
             VALUES (:pid, :eval_id, :vend_id, :cal, :com)'
        );
        $stIns->execute([
            ':pid'     => $pedidoId,
            ':eval_id' => $evaluadorId,
            ':vend_id' => (int) $pedido['vendedor_id'],
            ':cal'     => $calificacion,
            ':com'     => $comentario,
        ]);
    }
}
