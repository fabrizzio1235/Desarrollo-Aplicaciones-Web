<?php
declare(strict_types=1);

/**
 * Guardia de vistas privadas. Incluir como PRIMERA línea de cada vista protegida:
 * <?php require __DIR__ . '/../config/guard_vista.php'; ?>
 * Si no hay sesión activa redirige a login.php antes de enviar nada de HTML.
 */
require_once __DIR__ . '/bootstrap.php';

header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

if (Sesion::usuario() === null) {
    header('Location: login.php');
    exit;
}