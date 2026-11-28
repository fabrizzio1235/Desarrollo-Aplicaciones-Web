<?php
declare(strict_types=1);

require __DIR__ . '/../_api.php';
Http::metodo('GET');
$usuario = Sesion::requerir();
$objetivoId = isset($_GET['id']) && is_numeric($_GET['id']) && (int) $_GET['id'] > 0
    ? (int) $_GET['id']
    : (int) $usuario['id'];
(new PerfilController())->obtener($objetivoId);
