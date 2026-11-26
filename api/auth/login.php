<?php
declare(strict_types=1);

require __DIR__ . '/../_api.php';
Http::metodo('POST');
Csrf::exigir();
(new AuthController())->login(Http::cuerpo());