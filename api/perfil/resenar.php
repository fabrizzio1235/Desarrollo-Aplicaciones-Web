<?php
declare(strict_types=1);

require __DIR__ . '/../_api.php';
Http::metodo('POST');
$usuario = Sesion::requerir();
Csrf::exigir();
(new PerfilController())->resenar((int) $usuario['id'], Http::cuerpo());
