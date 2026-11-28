<?php
declare(strict_types=1);

require __DIR__ . '/../_api.php';
Http::metodo('GET');
$usuario = Sesion::requerir();
(new FavoritoController())->listar((int) $usuario['id']);
