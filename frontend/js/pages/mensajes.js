document.addEventListener('DOMContentLoaded', () => {
  const sesion = ApiAutenticacion.obtenerSesion();
  if (!sesion) return; // guardianRutas.js ya redirige a login

  const correoActual = String(sesion.correo || '').toLowerCase();
  const listaConversaciones = document.getElementById('lista-conversaciones');
  const ventanaChat = document.getElementById('ventana-chat');
  const panelVacio = document.getElementById('chat-vacio');
  const textoVacio = document.getElementById('chat-vacio-texto');
  const avisoSidebar = document.getElementById('sin-conversaciones');
  const tituloInterlocutor = document.getElementById('chat-interlocutor');
  const contextoChat = document.getElementById('chat-contexto');
  const contenedorMensajes = document.getElementById('contenedor-mensajes');
  const formulario = document.getElementById('form-enviar-mensaje');
  const inputMensaje = document.getElementById('input-mensaje');
  const avisoError = document.getElementById('chat-error');

  let idActivo = null;
  let mensajesMostrados = 0;

  // Traduce el estado de un pedido a la etiqueta que ve el usuario
  function etiquetaEstado(estado) {
    switch (estado) {
      case 'pendiente': return 'Pendiente de entrega';
      case 'completado': return 'Entregado / Completado';
      case 'cancelado': return 'Cancelado';
      default: return 'Sin pedido aún';
    }
  }

  // Estado del pedido más reciente de esta publicación para este comprador
  function estadoDelPedido(conversacion) {
    const pedidos = JSON.parse(localStorage.getItem('jz_pedidos') || '[]')
      .filter(p => String(p.idProducto) === String(conversacion.idProducto)
        && String(p.compradorCorreo || '').toLowerCase() === conversacion.compradorCorreo)
      .sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0));
    return pedidos.length ? pedidos[0].estado : null;
  }

  function nombreInterlocutor(conversacion) {
    return conversacion.compradorCorreo === correoActual ? conversacion.vendedorNombre : conversacion.compradorNombre;
  }

  function formatoHora(marcaTiempo) {
    const fecha = new Date(marcaTiempo);
    const hora = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const esHoy = fecha.toDateString() === new Date().toDateString();
    return esHoy ? hora : `${fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} ${hora}`;
  }

  function mostrarError(texto) {
    if (avisoError) avisoError.textContent = texto || '';
  }

  function mostrarPanelVacio(texto) {
    ventanaChat.hidden = true;
    panelVacio.hidden = false;
    textoVacio.textContent = texto;
  }

  // Lista lateral de conversaciones
  function renderLista() {
    const conversaciones = ApiMensajes.obtenerConversacionesUsuario();
    listaConversaciones.replaceChildren();
    avisoSidebar.hidden = conversaciones.length > 0;

    conversaciones.forEach(conversacion => {
      const item = document.createElement('li');
      item.className = 'conversation-item' + (conversacion.id === idActivo ? ' active' : '');
      item.dataset.chatId = conversacion.id;

      const boton = document.createElement('button');
      boton.type = 'button';

      const nombre = document.createElement('strong');
      nombre.textContent = nombreInterlocutor(conversacion);

      const referencia = document.createElement('span');
      referencia.className = 'chat-product-ref';
      referencia.textContent = conversacion.tituloProducto;

      const ultimo = conversacion.mensajes[conversacion.mensajes.length - 1];
      const vistaPrevia = document.createElement('small');
      vistaPrevia.className = 'chat-preview';
      if (ultimo) {
        const prefijo = ultimo.de === correoActual ? 'Tú: ' : '';
        const recorte = ultimo.texto.length > 45 ? `${ultimo.texto.slice(0, 45)}…` : ultimo.texto;
        vistaPrevia.textContent = prefijo + recorte;
      } else {
        vistaPrevia.textContent = 'Aún no hay mensajes';
      }

      boton.append(nombre, referencia, vistaPrevia);

      const noLeidos = ApiMensajes.contarNoLeidosDe(conversacion);
      if (noLeidos > 0 && conversacion.id !== idActivo) {
        const contador = document.createElement('span');
        contador.className = 'badge unread-count';
        contador.textContent = String(noLeidos);
        contador.setAttribute('aria-label', `${noLeidos} mensajes sin leer`);
        boton.appendChild(contador);
      }

      boton.addEventListener('click', () => activarConversacion(conversacion.id));
      item.appendChild(boton);
      listaConversaciones.appendChild(item);
    });
  }

  // Encabezado: interlocutor, publicación y estado del pedido
  function renderEncabezado(conversacion) {
    tituloInterlocutor.textContent = nombreInterlocutor(conversacion);
    contextoChat.replaceChildren();

    const producto = ApiProductos.obtenerPorId(conversacion.idProducto);
    contextoChat.append('Publicación: ');
    if (producto) {
      const enlace = document.createElement('a');
      enlace.href = `detalle-producto.html?id=${encodeURIComponent(producto.id)}`;
      enlace.textContent = `${producto.titulo} ($${Number(producto.precio).toFixed(2)})`;
      contextoChat.appendChild(enlace);
    } else {
      contextoChat.append(`${conversacion.tituloProducto} (publicación eliminada)`);
    }

    const estado = estadoDelPedido(conversacion);
    const insignia = document.createElement('span');
    insignia.className = `status-badge status-${estado || 'pendiente'}`;
    insignia.textContent = etiquetaEstado(estado);
    contextoChat.append(' · ', insignia);
  }

  function renderMensajes(conversacion) {
    contenedorMensajes.replaceChildren();
    if (conversacion.mensajes.length === 0) {
      const vacio = document.createElement('p');
      vacio.className = 'chat-empty';
      vacio.textContent = 'Todavía no hay mensajes. Saluda y acuerda el punto de encuentro en el campus.';
      contenedorMensajes.appendChild(vacio);
    }
    conversacion.mensajes.forEach(mensaje => {
      const burbuja = document.createElement('article');
      burbuja.className = `message ${mensaje.de === correoActual ? 'sent' : 'received'}`;
      const texto = document.createElement('p');
      texto.textContent = mensaje.texto;
      const hora = document.createElement('time');
      hora.dateTime = new Date(mensaje.fecha).toISOString();
      hora.textContent = formatoHora(mensaje.fecha);
      burbuja.append(texto, hora);
      contenedorMensajes.appendChild(burbuja);
    });
    contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
    mensajesMostrados = conversacion.mensajes.length;
  }

  function activarConversacion(id) {
    const conversacion = ApiMensajes.obtenerConversacion(id);
    if (!conversacion) return;
    idActivo = id;
    mostrarError('');
    panelVacio.hidden = true;
    ventanaChat.hidden = false;
    ApiMensajes.marcarComoLeida(id);
    renderEncabezado(conversacion);
    renderMensajes(conversacion);
    renderLista();
    if (window.actualizarInsigniaMensajes) window.actualizarInsigniaMensajes();
    history.replaceState(null, '', `mensajes.html?chat=${encodeURIComponent(id)}`);
  }

  // Revisa si llegaron mensajes nuevos (otra pestaña o cuenta en el mismo navegador)
  function refrescar() {
    if (!idActivo) { renderLista(); return; }
    const conversacion = ApiMensajes.obtenerConversacion(idActivo);
    if (!conversacion) return;
    if (conversacion.mensajes.length !== mensajesMostrados) {
      ApiMensajes.marcarComoLeida(idActivo);
      renderMensajes(conversacion);
    }
    renderEncabezado(conversacion);
    renderLista();
    if (window.actualizarInsigniaMensajes) window.actualizarInsigniaMensajes();
  }

  // Respuestas rápidas: insertan el texto en el campo para poder editarlo antes de enviar
  document.querySelectorAll('.quick-replies .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const sugerencia = chip.dataset.text || '';
      inputMensaje.value = inputMensaje.value.trim() ? `${inputMensaje.value.trim()} ${sugerencia}` : sugerencia;
      inputMensaje.focus();
    });
  });

  formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    if (!idActivo) return;
    const resultado = ApiMensajes.enviarMensaje(idActivo, inputMensaje.value);
    if (!resultado.exito) {
      mostrarError(resultado.mensaje);
      return;
    }
    inputMensaje.value = '';
    mostrarError('');
    renderMensajes(resultado.conversacion);
    renderLista();
  });

  inputMensaje.maxLength = ApiMensajes.MAX_CARACTERES;

  // Selección inicial según los parámetros de la URL
  const parametros = new URLSearchParams(window.location.search);
  let mensajeInicial = '';
  let idInicial = null;

  if (parametros.get('chat')) {
    idInicial = parametros.get('chat');
  } else if (parametros.get('pedido')) {
    const resultado = ApiMensajes.abrirPorPedido(parametros.get('pedido'));
    if (resultado.exito) idInicial = resultado.conversacion.id; else mensajeInicial = resultado.mensaje;
  } else if (parametros.get('producto')) {
    const resultado = ApiMensajes.abrirPorProducto(parametros.get('producto'));
    if (resultado.exito) idInicial = resultado.conversacion.id; else mensajeInicial = resultado.mensaje;
  }

  const conversaciones = ApiMensajes.obtenerConversacionesUsuario();
  if (!idInicial && conversaciones.length > 0 && !mensajeInicial) idInicial = conversaciones[0].id;

  renderLista();
  if (idInicial && ApiMensajes.obtenerConversacion(idInicial)) {
    activarConversacion(idInicial);
  } else if (mensajeInicial) {
    mostrarPanelVacio(mensajeInicial);
  } else if (conversaciones.length === 0) {
    mostrarPanelVacio('Aún no tienes conversaciones. Abre una publicación y pulsa «Enviar mensaje al vendedor».');
  } else {
    mostrarPanelVacio('Selecciona una conversación de la lista.');
  }

  setInterval(refrescar, 3000);
  window.addEventListener('storage', refrescar);
});
