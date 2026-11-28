'use strict';

document.addEventListener('DOMContentLoaded', () => {
  async function inicializarMensajes() {
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
    let ultimoMensajeMostrado = null;
    let refrescando = false;
    let usuarioId = null;
    let correoActual = '';

    // Traduce el estado de un pedido a la etiqueta que ve el usuario.
    function etiquetaEstado(estado) {
      switch (estado) {
        case 'pendiente': return 'Pendiente de entrega';
        case 'completado': return 'Entregado / Completado';
        case 'cancelado': return 'Cancelado';
        default: return 'Sin pedido aún';
      }
    }

    // Estado del pedido más reciente de esta publicación para este comprador.
    function estadoDelPedido(conversacion) {
      try {
        const pedidos = JSON.parse(localStorage.getItem('jz_pedidos') || '[]')
          .filter(p =>
            String(p.idProducto) === String(conversacion.idProducto) &&
            String(p.compradorCorreo || '').toLowerCase() === conversacion.compradorCorreo
          )
          .sort((a, b) =>
            new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0)
          );

        return pedidos.length ? pedidos[0].estado : null;
      } catch (error) {
        console.error('No fue posible consultar los pedidos locales:', error);
        return null;
      }
    }

    function nombreInterlocutor(conversacion) {
      return Number(conversacion.compradorId) === usuarioId
        ? conversacion.vendedorNombre
        : conversacion.compradorNombre;
    }

    function formatoHora(marcaTiempo) {
      const fecha = new Date(marcaTiempo);

      if (Number.isNaN(fecha.getTime())) return '';

      const hora = fecha.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const esHoy = fecha.toDateString() === new Date().toDateString();

      return esHoy
        ? hora
        : `${fecha.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short'
          })} ${hora}`;
    }

    function mostrarError(texto) {
      if (avisoError) avisoError.textContent = texto || '';
    }

    function mostrarPanelVacio(texto) {
      ventanaChat.hidden = true;
      panelVacio.hidden = false;
      textoVacio.textContent = texto;
    }

    // Lista lateral de conversaciones.
    function renderLista() {
      const conversaciones = ApiMensajes.conversaciones;

      listaConversaciones.replaceChildren();
      avisoSidebar.hidden = conversaciones.length > 0;

      conversaciones.forEach(conversacion => {
        const item = document.createElement('li');
        item.className = 'conversation-item' +
          (conversacion.id === String(idActivo) ? ' active' : '');
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
          const esPropio = Number(ultimo.emisorId) === usuarioId ||
            ultimo.de === correoActual;

          const prefijo = esPropio ? 'Tú: ' : '';
          const recorte = ultimo.texto.length > 45
            ? `${ultimo.texto.slice(0, 45)}…`
            : ultimo.texto;

          vistaPrevia.textContent = prefijo + recorte;
        } else {
          vistaPrevia.textContent = 'Aún no hay mensajes';
        }

        boton.append(nombre, referencia, vistaPrevia);

        const noLeidos = ApiMensajes.contarNoLeidosDe(conversacion);

        if (noLeidos > 0 && conversacion.id !== String(idActivo)) {
          const contador = document.createElement('span');
          contador.className = 'badge unread-count';
          contador.textContent = String(noLeidos);
          contador.setAttribute(
            'aria-label',
            `${noLeidos} mensajes sin leer`
          );
          boton.appendChild(contador);
        }

        boton.addEventListener('click', () => {
          activarConversacion(conversacion.id);
        });

        item.appendChild(boton);
        listaConversaciones.appendChild(item);
      });
    }

    // Encabezado: interlocutor, publicación y estado del pedido.
    function renderEncabezado(conversacion) {
      tituloInterlocutor.textContent = nombreInterlocutor(conversacion);
      contextoChat.replaceChildren();

      contextoChat.append('Publicación: ');

      if (conversacion.tituloProducto) {
        const enlace = document.createElement('a');
        enlace.href = `detalle-producto.php?id=${encodeURIComponent(conversacion.idProducto)}`;
        enlace.textContent = conversacion.tituloProducto;
        contextoChat.appendChild(enlace);
      } else {
        contextoChat.append('Publicación no disponible');
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
        vacio.textContent =
          'Todavía no hay mensajes. Saluda y acuerda el punto de encuentro en el campus.';

        contenedorMensajes.appendChild(vacio);
      }

      conversacion.mensajes.forEach(mensaje => {
        const burbuja = document.createElement('article');

        const esPropio = Number(mensaje.emisorId) === usuarioId;

        burbuja.className = `message ${esPropio ? 'sent' : 'received'}`;

        const texto = document.createElement('p');
        texto.textContent = mensaje.texto;

        const hora = document.createElement('time');
        const fecha = new Date(mensaje.fecha);

        if (!Number.isNaN(fecha.getTime())) {
          hora.dateTime = fecha.toISOString();
        }

        hora.textContent = formatoHora(mensaje.fecha);

        burbuja.append(texto, hora);
        contenedorMensajes.appendChild(burbuja);
      });

      contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;

      mensajesMostrados = conversacion.mensajes.length;

      ultimoMensajeMostrado = conversacion.mensajes.length
        ? conversacion.mensajes[conversacion.mensajes.length - 1].id
        : null;
    }

    // Abre una conversación y carga sus mensajes desde el servidor.
    async function activarConversacion(id) {
      try {
        const conversacion = await ApiMensajes.obtenerConversacion(id, true);

        if (!conversacion) {
          mostrarError('No se encontró la conversación solicitada.');
          return;
        }

        idActivo = String(id);
        mostrarError('');

        panelVacio.hidden = true;
        ventanaChat.hidden = false;

        await ApiMensajes.marcarComoLeida(idActivo);
        await ApiMensajes.obtenerConversacionesUsuario();

        // Recupera la conversación actualizada después de actualizar la lista.
        const actualizada = await ApiMensajes.obtenerConversacion(idActivo);

        renderEncabezado(actualizada || conversacion);
        renderMensajes(actualizada || conversacion);
        renderLista();

        if (window.actualizarInsigniaMensajes) {
          window.actualizarInsigniaMensajes();
        }

        history.replaceState(
          null,
          '',
          `mensajes.php?chat=${encodeURIComponent(idActivo)}`
        );
      } catch (error) {
        mostrarError(error.message || 'No fue posible abrir la conversación.');
      }
    }

    // Actualiza conversaciones y mensajes consultando el backend.
    async function refrescar() {
      if (refrescando) return;

      refrescando = true;

      try {
        await ApiMensajes.obtenerConversacionesUsuario();

        if (!idActivo) {
          renderLista();
        } else {
          const conversacion = await ApiMensajes.obtenerConversacion(
            idActivo,
            true
          );

          if (conversacion) {
            const ultimoMensaje = conversacion.mensajes.length
              ? conversacion.mensajes[conversacion.mensajes.length - 1].id
              : null;

            const hayCambios =
              conversacion.mensajes.length !== mensajesMostrados ||
              ultimoMensaje !== ultimoMensajeMostrado;

            if (hayCambios) {
              await ApiMensajes.marcarComoLeida(idActivo);

              await ApiMensajes.obtenerConversacionesUsuario();

              const actualizada = await ApiMensajes.obtenerConversacion(idActivo);

              renderMensajes(actualizada || conversacion);
            }

            const actual = ApiMensajes._buscarConversacion(idActivo);

            if (actual) {
              renderEncabezado(actual);
            }

            renderLista();
          }
        }

        if (window.actualizarInsigniaMensajes) {
          window.actualizarInsigniaMensajes();
        }
      } catch (error) {
        console.error('Error al actualizar los mensajes:', error);
      } finally {
        refrescando = false;
      }
    }

    // Respuestas rápidas.
    document.querySelectorAll('.quick-replies .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const sugerencia = chip.dataset.text || '';

        inputMensaje.value = inputMensaje.value.trim()
          ? `${inputMensaje.value.trim()} ${sugerencia}`
          : sugerencia;

        inputMensaje.focus();
      });
    });

    // Envío de mensajes.
    formulario.addEventListener('submit', async evento => {
      evento.preventDefault();

      if (!idActivo) return;

      const resultado = await ApiMensajes.enviarMensaje(
        idActivo,
        inputMensaje.value
      );

      if (!resultado.exito) {
        mostrarError(resultado.mensaje);
        return;
      }

      inputMensaje.value = '';
      mostrarError('');

      await ApiMensajes.obtenerConversacionesUsuario();

      const conversacion = await ApiMensajes.obtenerConversacion(
        idActivo,
        true
      );

      if (conversacion) {
        renderMensajes(conversacion);
      }

      renderLista();

      if (window.actualizarInsigniaMensajes) {
        window.actualizarInsigniaMensajes();
      }
    });

    inputMensaje.maxLength = ApiMensajes.MAX_CARACTERES;

    // Cargar y validar la sesión PHP.
    try {
      const sesion = await window.jzAuth.cargarSesion();

      if (!sesion.ok || !sesion.datos.autenticado) {
        mostrarPanelVacio('Tu sesión ha expirado. Inicia sesión nuevamente.');
        return;
      }

      const usuario = sesion.datos.usuario;

      usuarioId = Number(usuario.id);
      correoActual = String(usuario.correo || '').toLowerCase();

      if (!usuarioId) {
        mostrarPanelVacio('No fue posible identificar al usuario autenticado.');
        return;
      }

      // Obtener las conversaciones desde MariaDB.
      await ApiMensajes.obtenerConversacionesUsuario();

      // Selección inicial según los parámetros de la URL.
      const parametros = new URLSearchParams(window.location.search);

      let idInicial = parametros.get('chat');
      let mensajeInicial = '';

      if (!idInicial && parametros.get('pedido')) {
        const resultado = await ApiMensajes.abrirPorPedido(
          parametros.get('pedido')
        );

        if (resultado.exito) {
          idInicial = resultado.conversacion.id;
        } else {
          mensajeInicial = resultado.mensaje;
        }
      } else if (!idInicial && parametros.get('producto')) {
        const resultado = await ApiMensajes.abrirPorProducto(
          parametros.get('producto')
        );

        if (resultado.exito) {
          idInicial = resultado.conversacion.id;
        } else {
          mensajeInicial = resultado.mensaje;
        }
      }

      const conversaciones = ApiMensajes.conversaciones;

      if (!idInicial && conversaciones.length > 0 && !mensajeInicial) {
        idInicial = conversaciones[0].id;
      }

      renderLista();

      if (idInicial) {
        await activarConversacion(idInicial);
      } else if (mensajeInicial) {
        mostrarPanelVacio(mensajeInicial);
      } else if (conversaciones.length === 0) {
        mostrarPanelVacio(
          'Aún no tienes conversaciones. Abre una publicación y pulsa «Enviar mensaje al vendedor».'
        );
      } else {
        mostrarPanelVacio('Selecciona una conversación de la lista.');
      }

      // Actualización periódica desde el backend.
      setInterval(refrescar, 3000);

    } catch (error) {
      console.error('Error al inicializar la mensajería:', error);
      mostrarPanelVacio(
        error.message || 'No fue posible cargar la mensajería.'
      );
    }
  }

  inicializarMensajes();
});