<?php
declare(strict_types=1);

require __DIR__ . '/../_api.php';

Http::metodo('GET');

$usuario = Sesion::requerir();

$rol = $_GET['rol'] ?? 'comprador';

(new PedidoController())->listar(
    (int) $usuario['id'],
    $rol
);