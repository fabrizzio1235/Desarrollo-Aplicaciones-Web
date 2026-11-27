<?php
declare(strict_types=1);

require __DIR__ . '/../_api.php';
Http::metodo('GET');
$usuario = Sesion::requerir();
$soloMias = isset($_GET['mias']) && $_GET['mias'] === '1' ? (int) $usuario['id'] : null;
(new ProductoController())->listar($_GET, $soloMias);