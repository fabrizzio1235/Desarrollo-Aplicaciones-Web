<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mensajería Interna | JaguarZon UADY</title>
    <link rel="stylesheet" href="../assets/css/base.css">
  <link rel="stylesheet" href="../assets/css/componentes.css">
  <link rel="stylesheet" href="../assets/css/mensajes.css">

  <script src="../assets/js/api/apiAutenticacion.js" defer></script>
  <script src="../assets/js/api/guardianRutas.js" defer></script>
  <script src="../assets/js/api/apiProductos.js" defer></script>
  <script src="../assets/js/api/apiMensajes.js" defer></script>
</head>
<body>
  <header class="main-header">
    <div class="header-container">
      <a href="productos.php" class="brand-logo"><strong>JaguarZon</strong> <span>UADY</span></a>
      <nav class="main-nav" aria-label="Navegación principal">
        <ul>
          <li><a href="productos.php">Explorar</a></li>
          <li><a href="favoritos.php">Favoritos</a></li>
          <li><a href="mensajes.php" aria-current="page">Mensajes</a></li>
          <li><a href="mis-publicaciones.php">Mis Ventas</a></li>
          <li><a href="publicar-producto.php" class="btn btn-primary btn-sm">+ Vender</a></li>
          <li><a href="perfil.php">Mi Perfil</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main class="chat-layout">
    <!-- Lista lateral de conversaciones (se llena desde mensajes.js) -->
    <aside class="chat-sidebar" aria-label="Conversaciones activas">
      <header class="chat-sidebar-header">
        <h1>Mensajes</h1>
      </header>
      <ul class="conversation-list" id="lista-conversaciones"></ul>
      <p class="chat-empty" id="sin-conversaciones" hidden>Aquí aparecerán tus conversaciones con compradores y vendedores.</p>
    </aside>

    <!-- Ventana activa de chat -->
    <section class="chat-window" id="ventana-chat" aria-label="Hilo de mensajes" hidden>
      <header class="chat-header">
        <div>
          <h2 id="chat-interlocutor"></h2>
          <p class="chat-context" id="chat-contexto"></p>
        </div>
      </header>

      <div class="chat-messages" id="contenedor-mensajes" aria-live="polite"></div>

      <!-- Sugerencias rápidas de puntos de encuentro -->
      <div class="quick-replies" aria-label="Respuestas rápidas de ubicación">
        <button type="button" class="chip" data-text="¿Nos vemos en la Biblioteca Central?">Biblioteca Central</button>
        <button type="button" class="chip" data-text="Estoy en la cafetería de la facultad.">Cafetería Facultad</button>
        <button type="button" class="chip" data-text="Ya llegué al punto de encuentro.">Ya llegué al punto</button>
      </div>

      <p id="chat-error" class="feedback-msg" role="alert" aria-live="polite"></p>

      <form class="chat-input-form" id="form-enviar-mensaje">
        <label for="input-mensaje" class="sr-only">Escribe un mensaje</label>
        <input type="text" id="input-mensaje" name="mensaje" placeholder="Acuerda el punto y hora exacta en el campus..." required autocomplete="off">
        <button type="submit" class="btn btn-primary">Enviar</button>
      </form>
    </section>

    <!-- Estado vacío: sin conversación seleccionada -->
    <section class="chat-window chat-placeholder" id="chat-vacio">
      <p id="chat-vacio-texto"></p>
      <a href="productos.php" class="btn btn-primary">Explorar publicaciones</a>
    </section>
  </main>

  <script src="../assets/js/pages/mensajes.js" defer></script>
</body>
</html>