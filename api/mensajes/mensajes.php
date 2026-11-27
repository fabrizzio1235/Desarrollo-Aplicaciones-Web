<?php
declare(strict_types=1);

require __DIR__ . '/../_api.php';

Http::metodo('GET');

$usuario = Sesion::requerir();

(new MensajeController())->listarMensajes(
    (int) $usuario['id'],
    $_GET
);
