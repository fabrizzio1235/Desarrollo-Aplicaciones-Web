<?php
declare(strict_types=1);

final class PerfilController
{
    private PerfilModel $perfil;

    public function __construct(?PerfilModel $perfil = null)
    {
        $this->perfil = $perfil ?? new PerfilModel();
    }

    public function obtener(int $usuarioId): void
    {
        $datos = $this->perfil->obtenerPerfilCompleto($usuarioId);
        if ($datos === null) {
            Http::fail(404, 'No se encontró el perfil solicitado.');
        }
        Http::ok($datos);
    }

    /** @param array<string, mixed> $in */
    public function actualizar(int $usuarioId, array $in): void
    {
        $nombre = Validator::texto($in['nombre'] ?? '', 90);
        $facultad = Validator::texto($in['facultad'] ?? '', 100);

        if (mb_strlen($nombre) < 3) {
            Http::fail(400, 'Ingresa tu nombre completo (mínimo 3 caracteres).');
        }
        if (mb_strlen($facultad) < 2) {
            Http::fail(400, 'Indica tu facultad o dependencia UADY.');
        }

        $this->perfil->actualizarDatosBasicos($usuarioId, $nombre, $facultad);
        $_SESSION['usuario']['nombre'] = $nombre;
        $_SESSION['usuario']['facultad'] = $facultad;

        Http::ok(['nombre' => $nombre, 'facultad' => $facultad], 'Perfil actualizado correctamente.');
    }

    /** @param array<string, mixed> $in */
    public function resenar(int $evaluadorId, array $in): void
    {
        $pedidoId = isset($in['pedido_id']) && is_numeric($in['pedido_id']) ? (int) $in['pedido_id'] : 0;
        $calificacion = isset($in['calificacion']) && is_numeric($in['calificacion']) ? (int) $in['calificacion'] : 0;
        $comentario = Validator::texto($in['comentario'] ?? '', 600);

        if ($pedidoId <= 0 || $calificacion < 1 || $calificacion > 5) {
            Http::fail(400, 'Selecciona una calificación válida entre 1 y 5 estrellas.');
        }

        try {
            $this->perfil->crearResena($pedidoId, $evaluadorId, $calificacion, $comentario);
            Http::ok([], 'Reseña publicada. ¡Gracias por fortalecer la confianza en JaguarZon!', 201);
        } catch (DomainException $e) {
            Http::fail(400, $e->getMessage());
        }
    }
}