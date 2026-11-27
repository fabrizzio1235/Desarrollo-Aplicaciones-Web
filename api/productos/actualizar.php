<?php
declare(strict_types=1);

require __DIR__ . '/../_api.php';
Http::metodo('PUT', 'POST');
$usuario = Sesion::requerir();
Csrf::exigir();
(new ProductoController())->actualizar((int) $usuario['id'], Http::cuerpo());