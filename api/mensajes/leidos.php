<?php
declare(strict_types=1);

require __DIR__ . '/../_api.php';

Http::metodo('POST');

$usuario = Sesion::requerir();

Csrf::exigir();

(new MensajeController())->marcarLeidos(
    (int) $usuario['id'],
    Http::cuerpo()
);
