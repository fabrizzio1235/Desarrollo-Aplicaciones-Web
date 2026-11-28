<?php
declare(strict_types=1);

final class PerfilController
{
    private const CAMPUS_VALIDOS = [
        'exactas',
        'salud',
        'sociales',
        'biologicas',
        'arquitectura',
    ];

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
        $nombre             = Validator::texto($in['nombre'] ?? '', 100);
        $campus             = Validator::texto($in['campus'] ?? '', 50);
        $facultad           = Validator::texto($in['facultad'] ?? '', 100);
        $descripcion        = Validator::texto($in['descripcion'] ?? '', 350);
        $puntosFrecuentes   = Validator::texto($in['puntosFrecuentes'] ?? '', 180);
        $horariosHabituales = Validator::texto($in['horariosHabituales'] ?? '', 150);

        if (mb_strlen($nombre) < 3) {
            Http::fail(400, 'Ingresa tu nombre completo (mínimo 3 caracteres).');
        }
        if (!in_array($campus, self::CAMPUS_VALIDOS, true)) {
            Http::fail(400, 'Selecciona un campus UADY válido.');
        }

        $this->perfil->actualizarPerfil(
            $usuarioId,
            $nombre,
            $campus,
            $facultad,
            $descripcion,
            $puntosFrecuentes,
            $horariosHabituales
        );

        $_SESSION['usuario']['nombre']             = $nombre;
        $_SESSION['usuario']['campus']             = $campus;
        $_SESSION['usuario']['facultad']           = $facultad;
        $_SESSION['usuario']['descripcion']        = $descripcion;
        $_SESSION['usuario']['puntosFrecuentes']   = $puntosFrecuentes;
        $_SESSION['usuario']['horariosHabituales'] = $horariosHabituales;

        Http::ok([
            'nombre'             => $nombre,
            'campus'             => $campus,
            'facultad'           => $facultad,
            'descripcion'        => $descripcion,
            'puntosFrecuentes'   => $puntosFrecuentes,
            'horariosHabituales' => $horariosHabituales,
        ], 'Perfil actualizado correctamente.');
    }

    /** @param array<string, mixed> $in */
    public function resenar(int $compradorId, array $in): void
    {
        $pedidoId = isset($in['pedido_id']) && is_numeric($in['pedido_id']) ? (int) $in['pedido_id'] : 0;
        $rawEstrellas = $in['estrellas'] ?? $in['calificacion'] ?? 0;
        $estrellas = is_numeric($rawEstrellas) ? (int) $rawEstrellas : 0;

        $comentarioCrudo = trim((string) ($in['comentario'] ?? ''));
        if ($comentarioCrudo === '') {
            Http::fail(400, 'El comentario de la reseña es obligatorio.');
        }
        if (mb_strlen($comentarioCrudo) > 500) {
            Http::fail(400, 'El comentario de la reseña no puede exceder los 500 caracteres.');
        }

        $comentario = Validator::texto($comentarioCrudo, 500);
        if ($comentario === '') {
            Http::fail(400, 'El comentario de la reseña es obligatorio.');
        }

        if ($pedidoId <= 0 || $estrellas < 1 || $estrellas > 5) {
            Http::fail(400, 'Selecciona una calificación válida entre 1 y 5 estrellas.');
        }

        try {
            $this->perfil->crearResena($pedidoId, $compradorId, $estrellas, $comentario);
            Http::ok([], 'Reseña publicada. ¡Gracias por fortalecer la confianza en JaguarZon!', 201);
        } catch (DomainException $e) {
            Http::fail(400, $e->getMessage());
        }
    }
}