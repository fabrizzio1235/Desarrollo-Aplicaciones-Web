<?php require __DIR__ . '/../config/guard_vista.php'; ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Explorar Catálogo | JaguarZon UADY</title>
  <link rel="stylesheet" href="../assets/css/base.css">
  <link rel="stylesheet" href="../assets/css/componentes.css">
  <link rel="stylesheet" href="../assets/css/productos.css">

  <script src="../assets/js/core/ApiClient.js" defer></script>
  <script src="../assets/js/core/AuthService.js" defer></script>
  <script src="../assets/js/api/guardianRutas.js" defer></script>
  <script src="../assets/js/api/apiMensajes.js" defer></script>
  <script src="../assets/js/api/apiProductos.js" defer></script>
  <script src="../assets/js/api/apiFavoritos.js" defer></script>
  <script src="../assets/js/core/PreferenciasCatalogoStorage.js" defer></script>
  <script src="../assets/js/pages/catalogo.js" defer></script>
</head>
<body>
  <header class="main-header">
    <div class="header-container">
      <a href="productos.php" class="brand-logo"><strong>JaguarZon</strong> <span>UADY</span></a>

      <form class="header-search" role="search" id="form-busqueda-global">
        <label for="input-busqueda" class="sr-only">Buscar artículos académicos</label>
        <input type="search" id="input-busqueda" name="q" placeholder="Buscar batas, libros, Arduino, calculadoras...">
        <button type="submit" class="btn btn-secondary">Buscar</button>
      </form>

      <nav class="main-nav" aria-label="Navegación principal">
        <ul>
          <li><a href="productos.php" aria-current="page">Explorar</a></li>
          <li><a href="favoritos.php">Favoritos</a></li>
          <li><a href="mensajes.php">Mensajes</a></li>
          <li><a href="mis-publicaciones.php">Mis Ventas</a></li>
          <li><a href="publicar-producto.php" class="btn btn-primary btn-sm">+ Vender</a></li>
          <li><a href="perfil.php">Mi Perfil</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="catalog-layout">
    <aside class="filters-sidebar" aria-labelledby="filtros-titulo">
      <div class="filters-header">
        <h2 id="filtros-titulo">Filtrar catálogo</h2>
        <button type="reset" form="form-filtros" class="btn-link">Limpiar</button>
      </div>

      <form id="form-filtros">
        <fieldset class="filter-group">
          <legend>Campus de entrega</legend>
          <label><input type="checkbox" name="campus" value="exactas"> Ciencias Exactas e Ingenierías</label>
          <label><input type="checkbox" name="campus" value="salud"> Ciencias de la Salud</label>
          <label><input type="checkbox" name="campus" value="sociales"> Ciencias Sociales y Humanidades</label>
          <label><input type="checkbox" name="campus" value="biologicas"> Ciencias Biológicas y Agropecuarias</label>
          <label><input type="checkbox" name="campus" value="arquitectura"> Arquitectura, Hábitat y Arte</label>
        </fieldset>

        <fieldset class="filter-group">
          <legend>Categoría</legend>
          <label><input type="radio" name="categoria" value="todas" checked> Todas las categorías</label>
          <label><input type="radio" name="categoria" value="libros"> Libros</label>
          <label><input type="radio" name="categoria" value="laboratorio"> Material de laboratorio</label>
          <label><input type="radio" name="categoria" value="electronica"> Electrónica</label>
          <label><input type="radio" name="categoria" value="papeleria"> Papelería</label>
          <label><input type="radio" name="categoria" value="uniformes"> Uniformes</label>
          <label><input type="radio" name="categoria" value="otros"> Otros</label>
        </fieldset>

        <fieldset class="filter-group">
          <legend>Modalidad de venta</legend>
          <label><input type="checkbox" name="modalidad" value="fijo" checked> Precio fijo</label>
          <label><input type="checkbox" name="modalidad" value="subasta" checked> Subasta</label>
        </fieldset>

        <fieldset class="filter-group">
          <legend>Rango de precio (MXN)</legend>
          <div class="price-range-inputs">
            <input type="number" name="precio_min" min="0" placeholder="Mín $" aria-label="Precio mínimo">
            <span>-</span>
            <input type="number" name="precio_max" min="0" placeholder="Máx $" aria-label="Precio máximo">
          </div>
        </fieldset>
      </form>
    </aside>

    <section class="catalog-content" aria-labelledby="catalogo-titulo">
      <header class="catalog-toolbar">
        <div>
          <h1 id="catalogo-titulo">Artículos disponibles en la UADY</h1>
          <p id="resultados-contador" aria-live="polite">Mostrando 0 publicaciones activas</p>
        </div>
        <div class="sort-control">
          <label for="ordenar-por">Ordenar por:</label>
          <select id="ordenar-por" name="orden">
            <option value="recientes">Más recientes</option>
            <option value="precio-asc">Menor precio</option>
            <option value="precio-desc">Mayor precio</option>
            <option value="reputacion">Mejor reputación del vendedor</option>
          </select>
        </div>
      </header>
      <!--Contenedor que en js se va llenando de forma dinamica conforme van existiendo más productos-->
      <div class="product-grid" id="grid-productos"></div>

      <section id="catalogo-vacio" class="empty-state" hidden>
        <h2>No se encontraron artículos</h2>
        <p>Ninguna publicación coincide con los filtros seleccionados. Intenta ampliar tu búsqueda o limpiar los filtros.</p>
      </section>
    </section>
  </main>

  <footer class="main-footer">
    <p>JaguarZon &copy; 2026 — Plataforma de Comercio Estudiantil Exclusiva UADY. Pago a contraentrega en campus.</p>
  </footer>

</body>
</html>