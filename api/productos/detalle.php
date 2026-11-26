<?php
declare(strict_types=1);

require __DIR__ . '/../_api.php';
Http::metodo('GET');
Sesion::requerir();
$id = isset($_GET['id']) && is_numeric($_GET['id']) ? (int) $_GET['id'] : 0;
(new ProductoController())->detalle($id);