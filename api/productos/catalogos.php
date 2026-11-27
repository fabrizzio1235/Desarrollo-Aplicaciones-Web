<?php
declare(strict_types=1);

require __DIR__ . '/../_api.php';
Http::metodo('GET');
Sesion::requerir();
(new ProductoController())->catalogos();