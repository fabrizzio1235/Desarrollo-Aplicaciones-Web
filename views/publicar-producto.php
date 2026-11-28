<?php require __DIR__ . '/../config/guard_vista.php'; ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Publicar Artículo | JaguarZon UADY</title>
  <link rel="stylesheet" href="../assets/css/base.css">
  <link rel="stylesheet" href="../assets/css/componentes.css">
  <link rel="stylesheet" href="../assets/css/publicar-producto.css">

  <script src="../assets/js/api/apiAutenticacion.js" defer></script>
  <script src="../assets/js/core/ApiClient.js" defer></script>
  <script src="../assets/js/core/AuthService.js" defer></script>
  <script src="../assets/js/api/guardianRutas.js" defer></script>
  <script src="../assets/js/api/apiMensajes.js" defer></script>
  <script src="../assets/js/api/apiProductos.js" defer></script>
  <script src="../assets/js/pages/publicar.js" defer></script>
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
          <li><a href="publicar-producto.php" aria-current="page" class="btn btn-primary btn-sm">+ Vender</a></li>
          <li><a href="perfil.php">Mi Perfil</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="form-page-container">
    <section class="form-card" aria-labelledby="publicar-titulo">
      <header class="form-card-header">
        <h1 id="publicar-titulo">Publicar nuevo artículo</h1>
        <p>Define claramente el estado del producto y en qué campus UADY puedes entregarlo.</p>
      </header>

      <form id="form-publicar-producto" action="productos.php" method="POST" enctype="multipart/form-data" novalidate>
        <!-- 1. Datos del artículo -->
        <fieldset class="form-section">
          <legend>1. Información del artículo</legend>

          <div class="form-group">
            <label for="prod-titulo">Título de la publicación</label>
            <input type="text" id="prod-titulo" name="titulo" maxlength="90" placeholder="Ej. Calculadora Científica Casio fx-991LAX" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="prod-categoria">Categoría</label>
              <select id="prod-categoria" name="categoria" required>
                <option value="" disabled selected>Selecciona una categoría</option>
                <option value="libros">Libros</option>
                <option value="laboratorio">Material de laboratorio</option>
                <option value="electronica">Electrónica</option>
                <option value="papeleria">Papelería</option>
                <option value="uniformes">Uniformes</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div class="form-group">
              <label for="prod-stock">Stock disponible (unidades)</label>
              <input type="number" id="prod-stock" name="stock" min="1" max="50" value="1" required>
            </div>
          </div>

          <div class="form-group">
            <label for="prod-descripcion">Descripción detallada</label>
            <textarea id="prod-descripcion" name="descripcion" rows="4" placeholder="Describe condiciones de uso, edición, talla, accesorios incluidos..." required></textarea>
          </div>

          <div class="form-group">
            <label for="prod-fotos">Fotografías del artículo (máx. 4 imágenes)</label>
            <input type="file" id="prod-fotos" name="fotos" accept="image/png, image/jpeg, image/webp" multiple>
            <small class="form-help">Puedes agregar fotografías en varias selecciones. Máximo 4 imágenes.</small>
            <div id="prod-fotos-preview" class="foto-preview-grid" aria-live="polite" hidden></div>
          </div>
        </fieldset>

        <!-- 2. Modalidad y Precio -->
        <fieldset class="form-section">
          <legend>2. Modalidad de venta</legend>

          <div class="radio-cards">
            <label class="radio-card">
              <input type="radio" name="modalidad" value="fijo" checked>
              <span><strong>Precio fijo</strong> — Venta directa a contraentrega</span>
            </label>
            <label class="radio-card">
              <input type="radio" name="modalidad" value="subasta">
              <span><strong>Subasta</strong> — Los estudiantes pujan hasta la fecha límite</span>
            </label>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="prod-precio" id="label-precio">Precio de venta (MXN)</label>
              <input type="number" id="prod-precio" name="precio" min="1" step="0.50" placeholder="250.00" required>
            </div>

            <div class="form-group" id="grupo-fecha-subasta" hidden>
              <label for="prod-cierre-subasta">Fecha y hora de cierre de subasta</label>
              <input type="datetime-local" id="prod-cierre-subasta" name="cierre_subasta">
            </div>
          </div>
        </fieldset>

        <!-- 3. Cobertura y Puntos de Entrega -->
        <fieldset class="form-section">
          <legend>3. Logística de entrega en campus UADY</legend>

          <div class="form-group">
            <span class="group-label">Campus donde puedes realizar la entrega:</span>
            <div class="checkbox-grid">
              <label><input type="checkbox" name="campus_entrega" value="exactas"> Ciencias Exactas e Ingenierías</label>
              <label><input type="checkbox" name="campus_entrega" value="salud"> Ciencias de la Salud</label>
              <label><input type="checkbox" name="campus_entrega" value="sociales"> Ciencias Sociales y Humanidades</label>
              <label><input type="checkbox" name="campus_entrega" value="biologicas"> Ciencias Biológicas y Agropecuarias</label>
              <label><input type="checkbox" name="campus_entrega" value="arquitectura"> Arquitectura, Hábitat y Arte</label>
            </div>
          </div>

          <div class="form-group">
            <label for="prod-punto-fisico">Puntos físicos sugeridos dentro del campus</label>
            <input type="text" id="prod-punto-fisico" name="punto_fisico" placeholder="Ej. Cafetería FIUADY, Biblioteca Central, Explanada FCA" required>
          </div>

          <div class="form-group">
            <label for="prod-horarios">Horarios de disponibilidad entre clases</label>
            <input type="text" id="prod-horarios" name="horarios" placeholder="Ej. Lunes a Viernes de 11:00 AM a 1:00 PM" required>
          </div>
        </fieldset>

        <p id="publicar-feedback" class="feedback-msg" role="alert" aria-live="polite"></p>

        <div class="form-actions">
          <a href="productos.php" class="btn btn-secondary">Cancelar</a>
          <button type="submit" class="btn btn-primary">Publicar en JaguarZon</button>
        </div>
      </form>
    </section>
  </main>
</body>
</html>