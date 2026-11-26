<?php require __DIR__ . '/../config/guard_vista.php'; ?>
<!DOCTYPE html>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mis Publicaciones y Ventas | JaguarZon UADY</title>
    <link rel="stylesheet" href="../assets/css/base.css">
  <link rel="stylesheet" href="../assets/css/componentes.css">
  <link rel="stylesheet" href="../assets/css/mis-publicaciones.css">

  <script src="../assets/js/api/apiAutenticacion.js" defer></script>
  <script src="../assets/js/core/ApiClient.js" defer></script>
  <script src="../assets/js/core/AuthService.js" defer></script>
  <script src="../assets/js/api/guardianRutas.js" defer></script>
  <script src="../assets/js/api/apiMensajes.js" defer></script>
  <script src="../assets/js/api/apiProductos.js" defer></script>
</head>
<body>
  <header class="main-header">
    <div class="header-container">
      <a href="productos.php" class="brand-logo"><strong>JaguarZon</strong> <span>UADY</span></a>
      <nav class="main-nav" aria-label="Navegación principal">
        <ul>
          <li><a href="productos.php">Explorar</a></li>
          <li><a href="favoritos.php">Favoritos</a></li>
          <li><a href="mensajes.php">Mensajes</a></li>
          <li><a href="mis-publicaciones.php" aria-current="page">Mis Ventas</a></li>
          <li><a href="publicar-producto.php" class="btn btn-primary btn-sm">+ Vender</a></li>
          <li><a href="perfil.php">Mi Perfil</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="dashboard-container">
    <header class="page-header">
      <div>
        <h1>Panel de Vendedor</h1>
        <p>Administra tu catálogo activo y actualiza el estado de tus entregas en campus.</p>
      </div>
      <a href="publicar-producto.php" class="btn btn-primary">+ Nueva publicación</a>
    </header>

    <!-- Sección 1: Pedidos recibidos (Máquina de estados) -->
    <section class="dashboard-section" aria-labelledby="pedidos-recibidos-titulo">
      <h2 id="pedidos-recibidos-titulo">Pedidos y entregas coordinadas</h2>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Comprador UADY</th>
              <th>Punto y horario acordado</th>
              <th>Total</th>
              <th>Estado del pedido</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="tabla-pedidos-vendedor">
            <tr><td colspan="6">Cargando pedidos...</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Sección 2: Catálogo publicado por el usuario -->
    <section class="dashboard-section" aria-labelledby="mis-articulos-titulo">
      <h2 id="mis-articulos-titulo">Mis publicaciones</h2>

      <div class="listings-list" id="lista-mis-publicaciones">
        <p>Cargando tus publicaciones...</p>
      </div>
    </section>
  </main>

  <script src="../assets/js/pages/mis-publicaciones.js" defer></script>
</body>
</html>