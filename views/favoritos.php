<?php require __DIR__ . '/../config/guard_vista.php'; ?>
<!DOCTYPE html>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mis Favoritos | JaguarZon UADY</title>
  <link rel="stylesheet" href="../assets/css/base.css">
  <link rel="stylesheet" href="../assets/css/componentes.css">
  <link rel="stylesheet" href="../assets/css/productos.css">
  <link rel="stylesheet" href="../assets/css/favoritos.css">

  <script src="../assets/js/api/apiAutenticacion.js" defer></script>
  <script src="../assets/js/core/ApiClient.js" defer></script>
  <script src="../assets/js/core/AuthService.js" defer></script>
  <script src="../assets/js/api/guardianRutas.js" defer></script>
  <script src="../assets/js/api/apiMensajes.js" defer></script>
  <script src="../assets/js/api/apiProductos.js" defer></script>
  <script src="../assets/js/pages/favoritos.js" defer></script>
</head>
<body>
  <header class="main-header">
    <div class="header-container">
      <a href="productos.php" class="brand-logo"><strong>JaguarZon</strong> <span>UADY</span></a>
      <nav class="main-nav" aria-label="Navegación principal">
        <ul>
          <li><a href="productos.php">Explorar</a></li>
          <li><a href="favoritos.php" aria-current="page">Favoritos</a></li>
          <li><a href="mensajes.php">Mensajes</a></li>
          <li><a href="mis-publicaciones.php">Mis Ventas</a></li>
          <li><a href="publicar-producto.php" class="btn btn-primary btn-sm">+ Vender</a></li>
          <li><a href="perfil.php">Mi Perfil</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="favorites-container">
    <header class="page-header">
      <h1>Artículos guardados</h1>
      <p>Publicaciones que te interesan para coordinar compra en tu campus.</p>
      <p id="favoritos-contador" class="muted-text" aria-live="polite"></p>
    </header>

    <section class="product-grid" id="lista-favoritos" aria-label="Lista de productos favoritos"></section>

    <section id="favoritos-vacio" class="empty-state" hidden>
      <h2>Aún no tienes artículos guardados</h2>
      <p>Explora el catálogo de tu campus y guarda libros o materiales para compararlos después.</p>
      <a href="productos.php" class="btn btn-primary">Ir al catálogo</a>
    </section>
  </main>
</body>
</html>
