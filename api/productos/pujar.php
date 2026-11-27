<?php
declare(strict_types=1);

require __DIR__ . '/../_api.php';
Http::metodo('POST');
$usuario = Sesion::requerir();
Csrf::exigir();
(new ProductoController())->pujar((int) $usuario['id'], Http::cuerpo());