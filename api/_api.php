<?php
declare(strict_types=1);

/** Cabecera común de TODOS los endpoints: modo API (errores en JSON) + bootstrap. */
define('JZ_MODO_API', true);
require_once __DIR__ . '/../config/bootstrap.php';