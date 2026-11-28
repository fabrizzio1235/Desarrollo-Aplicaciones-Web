<?php require __DIR__ . '/../config/guard_vista.php'; ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Perfil de usuario de JaguarZon UADY">
  <title>Mi perfil | JaguarZon UADY</title>
  <link rel="stylesheet" href="../assets/css/base.css">
  <link rel="stylesheet" href="../assets/css/componentes.css">
  <link rel="stylesheet" href="../assets/css/perfil.css">

  <script src="../assets/js/core/ApiClient.js" defer></script>
  <script src="../assets/js/core/AuthService.js" defer></script>
  <script src="../assets/js/api/guardianRutas.js" defer></script>
  <script src="../assets/js/api/apiMensajes.js" defer></script>
  <script src="../assets/js/api/apiPerfil.js" defer></script>
  <script src="../assets/js/api/apiPedidos.js" defer></script>
  <script src="../assets/js/pages/perfil.js" defer></script>
</head>
<body>
  <header class="main-header">
    <div class="header-container">
      <a href="productos.php" class="brand-logo"><strong>JaguarZon</strong> <span>UADY</span></a>
      <nav class="main-nav" aria-label="Navegación principal"><ul>
        <li><a href="productos.php">Explorar</a></li><li><a href="favoritos.php">Favoritos</a></li>
        <li><a href="mensajes.php">Mensajes</a></li><li><a href="mis-publicaciones.php">Mis Ventas</a></li>
        <li><a href="publicar-producto.php" class="btn btn-primary btn-sm">+ Vender</a></li>
        <li><a href="perfil.php" aria-current="page">Mi Perfil</a></li>
      </ul></nav>
    </div>
  </header>

  <main class="profile-container">
    <div class="profile-page-heading"><div><p class="eyebrow">CUENTA UNIVERSITARIA</p><h1>Mi perfil</h1><p>Administra tu información y consulta tu actividad en JaguarZon.</p></div>
      <button type="button" id="btn-cerrar-sesion" class="btn btn-outline-danger">Cerrar sesión</button>
    </div>

    <section class="profile-header-card" aria-labelledby="perfil-nombre">
      <div class="profile-identity">
        <div id="perfil-foto" class="profile-avatar" role="img" aria-label="Fotografía de perfil">U</div>
        <div><h2 id="perfil-nombre">Usuario</h2><p id="perfil-correo" class="institutional-email"></p>
          <span class="verified-badge">Cuenta UADY</span><p id="perfil-campus" class="profile-campus"></p>
          <p id="perfil-facultad" class="profile-faculty"></p>
          <p id="perfil-descripcion" class="profile-description"></p>
        </div>
      </div>
      <div class="profile-reputation"><span class="reputation-label">Reputación como vendedor</span>
        <strong class="reputation-score" id="promedio-estrellas">Sin calificaciones</strong>
        <small id="total-resenas">0 reseñas verificadas</small><small id="total-ventas">0 ventas completadas</small>
        <button type="button" class="btn btn-primary btn-sm" id="btn-editar-perfil">Editar perfil</button>
      </div>
    </section>

    <div class="profile-grid">
      <section class="profile-card" aria-labelledby="datos-cuenta-titulo">
        <h2 id="datos-cuenta-titulo">Información de mi cuenta</h2>
        <dl class="account-data">
          <div><dt>Nombre completo</dt><dd id="dato-nombre">—</dd></div>
          <div><dt>Correo institucional</dt><dd id="dato-correo">—</dd></div>
          <div><dt>Campus principal</dt><dd id="dato-campus">—</dd></div>
          <div><dt>Facultad o dependencia</dt><dd id="dato-facultad">No especificada</dd></div>
          <div><dt>Miembro desde</dt><dd id="dato-registro">—</dd></div>
        </dl>
        <h3>Preferencias de entrega</h3>
        <dl class="account-data">
          <div><dt>Puntos frecuentes</dt><dd id="dato-puntos">No especificados</dd></div>
          <div><dt>Horario habitual</dt><dd id="dato-horarios">No especificado</dd></div>
        </dl>
      </section>

      <section class="profile-card" aria-labelledby="historial-compras-titulo">
        <div class="section-heading"><div><h2 id="historial-compras-titulo">Mis pedidos</h2><p>Compras realizadas con tu cuenta.</p></div><span class="count-pill" id="contador-pedidos">0</span></div>
        <div class="order-filters" role="group" aria-label="Filtrar pedidos">
          <button type="button" class="filter-chip active" data-filtro="todos" aria-pressed="true">Todos</button>
          <button type="button" class="filter-chip" data-filtro="pendiente" aria-pressed="false">Pendientes</button>
          <button type="button" class="filter-chip" data-filtro="completado" aria-pressed="false">Completados</button>
          <button type="button" class="filter-chip" data-filtro="cancelado" aria-pressed="false">Cancelados</button>
        </div>
        <ul class="orders-list" id="lista-compras-usuario" aria-live="polite"></ul>
        <div id="pedidos-vacios" class="empty-orders" hidden><strong>Aún no tienes pedidos.</strong><p>Cuando solicites una compra, aparecerá aquí.</p><a href="productos.php" class="btn btn-primary btn-sm">Explorar publicaciones</a></div>
      </section>
    </div>

    <section class="profile-card reviews-card" aria-labelledby="resenas-titulo">
      <h2 id="resenas-titulo">Reseñas que he recibido</h2>
      <p class="section-help">Las reseñas se generan a partir de pedidos completados y calificados.</p>
      <ul id="lista-resenas" class="received-reviews"></ul>
      <p id="resenas-vacias" class="muted-text">Todavía no has recibido reseñas.</p>
    </section>
  </main>

  <dialog id="modal-editar-perfil" class="profile-dialog" aria-labelledby="editar-perfil-titulo">
    <form id="form-editar-perfil">
      <div class="dialog-heading"><div><p class="eyebrow">PERSONALIZACIÓN</p><h2 id="editar-perfil-titulo">Editar perfil</h2></div><button type="button" class="icon-close" id="cerrar-edicion" aria-label="Cerrar">×</button></div>
      <div class="form-group"><label for="editar-nombre">Nombre completo</label><input id="editar-nombre" name="nombre" type="text" maxlength="100" required></div>
      <div class="form-group"><label for="editar-descripcion">Acerca de mí</label><textarea id="editar-descripcion" name="descripcion" rows="3" maxlength="350" placeholder="Cuéntale a la comunidad un poco sobre ti..."></textarea></div>
      <div class="form-group"><label for="editar-foto">Fotografía de perfil</label><input id="editar-foto" name="foto" type="file" accept="image/png,image/jpeg,image/webp"><small>Formatos JPG, PNG o WEBP. Máximo 1 MB.</small><img id="vista-previa-foto" class="photo-preview" alt="Vista previa" hidden></div>
      <div class="form-group"><label for="editar-campus">Campus principal</label><select id="editar-campus" name="campus" required>
        <option value="exactas">Campus de Ciencias Exactas e Ingenierías</option><option value="salud">Campus de Ciencias de la Salud</option>
        <option value="sociales">Campus de Ciencias Sociales y Humanidades</option><option value="biologicas">Campus de Ciencias Biológicas y Agropecuarias</option><option value="arquitectura">Campus de Arquitectura, Hábitat y Arte</option>
      </select></div>
      <div class="form-group"><label for="editar-facultad">Facultad o dependencia</label><input id="editar-facultad" name="facultad" maxlength="100" placeholder="Ej. Facultad de Matemáticas"></div>
      <div class="form-group"><label for="editar-puntos">Puntos frecuentes de entrega</label><input id="editar-puntos" name="puntosFrecuentes" maxlength="180" placeholder="Ej. Cafetería, biblioteca"></div>
      <div class="form-group"><label for="editar-horarios">Horario habitual disponible</label><input id="editar-horarios" name="horariosHabituales" maxlength="150" placeholder="Ej. Lun a vie, 11:00 a 14:00"></div>
      <p id="perfil-feedback" class="feedback-msg" role="alert" aria-live="polite"></p>
      <div class="dialog-actions"><button type="button" id="cancelar-edicion" class="btn btn-secondary">Cancelar</button><button type="submit" class="btn btn-primary">Guardar cambios</button></div>
    </form>
  </dialog>

  <dialog id="modal-resena" class="profile-dialog" aria-labelledby="modal-resena-titulo">
    <form id="form-emitir-resena">
      <h2 id="modal-resena-titulo">Calificar vendedor</h2><p id="resena-contexto"></p><input type="hidden" id="resena-pedido-id">
      <div class="form-group"><label for="calificacion-estrellas">Puntuación</label><select id="calificacion-estrellas" required><option value="5">★★★★★ — Excelente</option><option value="4">★★★★☆ — Muy bueno</option><option value="3">★★★☆☆ — Aceptable</option><option value="2">★★☆☆☆ — Malo</option><option value="1">★☆☆☆☆ — Muy malo</option></select></div>
      <div class="form-group"><label for="comentario-resena">Comentario</label><textarea id="comentario-resena" rows="3" maxlength="500" required placeholder="Describe tu experiencia con el vendedor..."></textarea></div>
      <p id="resena-feedback" class="feedback-msg" role="alert"></p>
      <div class="dialog-actions"><button type="button" id="btn-cancelar-resena" class="btn btn-secondary">Cancelar</button><button type="submit" class="btn btn-primary">Publicar reseña</button></div>
    </form>
  </dialog>
</body>
</html>