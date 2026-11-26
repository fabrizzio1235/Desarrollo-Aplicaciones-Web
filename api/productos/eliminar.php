<?php
declare(strict_types=1);

require __DIR__ . '/../_api.php';
Http::metodo('DELETE', 'POST');
$usuario = Sesion::requerir();
Csrf::exigir();
(new ProductoController())->eliminar((int) $usuario['id'], Http::cuerpo());