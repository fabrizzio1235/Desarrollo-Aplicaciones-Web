<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Detalle del Producto | JaguarZon UADY</title>
    <link rel="stylesheet" href="../assets/css/base.css">
  <link rel="stylesheet" href="../assets/css/componentes.css">
  <link rel="stylesheet" href="../assets/css/detalle-producto.css">

  <script src="../assets/js/api/apiAutenticacion.js" defer></script>
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
          <li><a href="mis-publicaciones.php">Mis Ventas</a></li>
          <li><a href="publicar-producto.php" class="btn btn-primary btn-sm">+ Vender</a></li>
          <li><a href="perfil.php">Mi Perfil</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="detail-container">
    <nav class="breadcrumb" aria-label="Ruta de navegación">
      <ol>
        <li><a href="productos.php">Catálogo</a></li>
        <li><a id="breadcrumb-categoria" href="productos.php">Productos</a></li>
        <li id="breadcrumb-producto" aria-current="page">Detalle del producto</li>
      </ol>
    </nav>

    <article class="product-detail-grid" id="detalle-articulo">
      <!-- Galería de imágenes -->
      <section class="detail-gallery" aria-label="Fotografías del producto">
        <figure class="main-image">
          <img id="img-principal" src="../assets/images/image-placeholder.jpg" alt="Fotografía del producto">
        </figure>
        <div class="thumbnail-list" id="lista-miniaturas" role="group" aria-label="Fotografías del producto"></div>
      </section>

      <!-- Información, compra / subasta y puntos de entrega -->
      <section class="detail-info">
        <header>
          <div class="detail-badges">
            <span class="tag tag-fijo" id="detalle-modalidad">Precio fijo</span>
            <span class="stock-badge" id="detalle-stock">Disponible: 2 unidades</span>
          </div>
          <h1 id="detalle-titulo">Cálculo de una Variable - James Stewart (8ª Ed.)</h1>
          <p class="detail-price" id="detalle-precio"></p>
        </header>

        <div class="detail-description">
          <h2>Descripción del artículo</h2>
          <p id="detalle-descripcion"></p>
        </div>

        <!-- Logística de entrega en campus -->
        <section class="delivery-box" aria-labelledby="logistica-titulo">
          <h2 id="logistica-titulo">Puntos y horarios de entrega en campus</h2>
          <p class="payment-notice"><strong>Pago a contraentrega:</strong> Liquida en efectivo o transferencia al revisar el artículo.</p>

          <form id="form-solicitud-compra">
            <div class="form-group">
              <label for="punto-entrega-select">Selecciona el punto de encuentro:</label>
              <select id="punto-entrega-select" name="punto_entrega" required></select>
            </div>

            <div class="form-group">
              <label for="horario-entrega-select">Franja horaria del vendedor:</label>
              <select id="horario-entrega-select" name="horario_entrega" required></select>
            </div>

            <!-- Bloque de Compra Directa (Precio Fijo) -->
            <div id="bloque-precio-fijo" class="purchase-controls">
              <div class="quantity-control">
                <label for="cantidad-compra">Cantidad:</label>
                <input type="number" id="cantidad-compra" name="cantidad" value="1" min="1" required>
              </div>
              <button type="submit" class="btn btn-primary btn-lg">Solicitar compra a contraentrega</button>
            </div>

            <!-- Bloque de Subasta (Oculto cuando es precio fijo) -->
            <div id="bloque-subasta" class="auction-controls" hidden>
              <p id="cuenta-regresiva" class="auction-countdown"></p>
              <p id="info-pujas" class="muted-text"></p>
              <p id="texto-puja"></p>
              <div class="bid-input-group">
                <label for="monto-puja" class="sr-only">Tu oferta en MXN</label>
                <input type="number" id="monto-puja" name="puja" min="290" step="10" placeholder="Ingresa tu puja ($)">
                <button type="button" id="btn-pujar" class="btn btn-primary">Realizar puja</button>
              </div>
            </div>
          </form>

          <div class="secondary-actions">
            <a href="mensajes.php" class="btn btn-secondary">Enviar mensaje al vendedor</a>
            <button type="button" id="btn-guardar-favorito" class="btn btn-outline" aria-pressed="false">Guardar en favoritos</button>
          </div>
        </section>

        <!-- Tarjeta del Vendedor y Reputación -->
        <aside class="seller-card" aria-labelledby="vendedor-titulo">
          <h2 id="vendedor-titulo">Información del vendedor</h2>
          <div class="seller-summary">
            <div>
              <strong id="detalle-vendedor-nombre">Vendedor JaguarZon</strong>
              <span class="verified-badge">Correo UADY registrado</span>
              <p id="detalle-vendedor-facultad">Comunidad UADY</p>
            </div>
            <div class="seller-score">
              <span class="stars" id="detalle-vendedor-estrellas" aria-label="Sin calificaciones">☆☆☆☆☆</span>
              <strong id="detalle-vendedor-promedio">Sin calificaciones</strong>
              <small id="detalle-vendedor-ventas">(0 ventas completadas)</small>
            </div>
          </div>
        </aside>
      </section>
    </article>

    <!-- Reseñas verificadas del vendedor -->
    <section class="reviews-section" aria-labelledby="resenas-titulo">
      <h2 id="resenas-titulo">Reseñas de compradores verificados</h2>
      <ul class="review-list" id="lista-resenas-producto"></ul>
      <p id="resenas-sin-resultados" class="muted-text">Este vendedor todavía no tiene reseñas verificadas.</p>
    </section>
  </main>

  <!-- Modal de confirmación de pedido -->
  <dialog id="modal-confirmacion-pedido" aria-labelledby="modal-pedido-titulo">
    <h2 id="modal-pedido-titulo">¡Solicitud de pedido registrada!</h2>
    <p>El estado de tu pedido ahora es <strong>Pendiente de entrega</strong>.</p>
    <p>Acuerda los últimos detalles con el vendedor a través del chat interno.</p>
    <div class="modal-actions">
      <a href="mensajes.php" class="btn btn-primary">Ir al chat del pedido</a>
      <button type="button" id="btn-cerrar-modal" class="btn btn-secondary">Cerrar</button>
    </div>
  </dialog>

  <script src="../assets/js/pages/detalle.js" defer></script>
</body>
</html>