
'use strict';

/**
 * Servicio de mensajería conectado al backend PHP.
 * MariaDB es la fuente principal de conversaciones y mensajes.
 */
const ApiMensajes = {
  MAX_CARACTERES: 500,

  conversaciones: [],
  mensajesCargados: new Set(),

  /**
   * Garantiza que exista una sesión y que ApiClient tenga el token CSRF.
   */
  async _asegurarSesion() {
    if (!window.jzApi || !window.jzAuth) {
      throw new Error('El servicio de autenticación no está disponible.');
    }

    if (!window.jzApi.tokenCsrf) {
      const sesion = await window.jzAuth.cargarSesion();

      if (!sesion.ok || !sesion.datos.autenticado) {
        throw new Error(sesion.mensaje || 'Debes iniciar sesión.');
      }
    }
  },

  /**
   * Convierte fechas SQL de MariaDB a milisegundos.
   */
  _fechaAMilisegundos(fecha) {
    if (!fecha) return Date.now();

    const valor = String(fecha).replace(' ', 'T');
    const resultado = new Date(valor).getTime();

    return Number.isNaN(resultado) ? Date.now() : resultado;
  },

  /**
   * Normaliza un mensaje recibido del servidor.
   */
  _normalizarMensaje(mensaje) {
    return {
      id: Number(mensaje.id),
      idConversacion: Number(mensaje.idConversacion),
      emisorId: Number(mensaje.emisorId),
      de: String(mensaje.de || '').toLowerCase(),
      emisorNombre: mensaje.emisorNombre || '',
      texto: mensaje.texto || '',
      fecha: this._fechaAMilisegundos(mensaje.fecha),
      leido: Number(mensaje.leido) === 1
    };
  },

  /**
   * Normaliza el resumen de una conversación.
   */
  _normalizarConversacion(datos) {
    const ultimoMensaje = datos.ultimoMensaje
      ? {
          de: '',
          texto: datos.ultimoMensaje,
          fecha: this._fechaAMilisegundos(datos.fechaUltimoMensaje)
        }
      : null;

    return {
      id: String(datos.idConversacion),
      idConversacion: Number(datos.idConversacion),
      idProducto: Number(datos.idProducto),
      tituloProducto: datos.tituloProducto || '',
      compradorId: Number(datos.compradorId),
      compradorCorreo: String(datos.compradorCorreo || '').toLowerCase(),
      compradorNombre: datos.compradorNombre || '',
      vendedorId: Number(datos.vendedorId),
      vendedorCorreo: String(datos.vendedorCorreo || '').toLowerCase(),
      vendedorNombre: datos.vendedorNombre || '',
      mensajes: ultimoMensaje ? [ultimoMensaje] : [],
      noLeidos: Number(datos.noLeidos || 0),
      fechaCreacion: ultimoMensaje ? ultimoMensaje.fecha : Date.now()
    };
  },

  /**
   * Realiza una petición y convierte los errores del servidor en excepciones.
   */
  async _solicitar(peticion) {
    await this._asegurarSesion();

    const respuesta = await peticion();

    if (!respuesta.ok) {
      throw new Error(respuesta.mensaje || 'No fue posible completar la operación.');
    }

    return respuesta.datos;
  },

  /**
   * Obtiene las conversaciones del usuario autenticado.
   */
  async obtenerConversacionesUsuario() {
  const datos = await this._solicitar(
    () => window.jzApi.get('mensajes/conversaciones.php')
  );

  const conversacionesAnteriores = this.conversaciones;

  this.conversaciones = (datos.conversaciones || []).map(datosConversacion => {
    const conversacion = this._normalizarConversacion(datosConversacion);

    const anterior = conversacionesAnteriores.find(
      c => c.id === conversacion.id
    );

    // Conserva los mensajes completos que ya se habían consultado.
    if (anterior && this.mensajesCargados.has(conversacion.id)) {
      conversacion.mensajes = anterior.mensajes;
    }

    return conversacion;
  });

  return this.conversaciones;
},

  /**
   * Busca una conversación en la caché.
   */
  _buscarConversacion(idConversacion) {
    return this.conversaciones.find(
      c => c.id === String(idConversacion)
    ) || null;
  },

  /**
   * Obtiene una conversación y sus mensajes.
   * Si recargar es true, vuelve a consultar el servidor.
   */
  async obtenerConversacion(idConversacion, recargar = false) {
    const id = String(idConversacion);
    let conversacion = this._buscarConversacion(id);

    if (!conversacion) {
      await this.obtenerConversacionesUsuario();
      conversacion = this._buscarConversacion(id);
    }

    if (!conversacion) return null;

    if (recargar || !this.mensajesCargados.has(id)) {
      const datos = await this._solicitar(
        () => window.jzApi.get(
          `mensajes/mensajes.php?conversacion_id=${encodeURIComponent(id)}`
        )
      );

      conversacion.mensajes = (datos.mensajes || [])
        .map(m => this._normalizarMensaje(m));

      this.mensajesCargados.add(id);
    }

    return conversacion;
  },

  /**
   * Actualiza la lista y los mensajes de una conversación.
   */
  async _actualizarConversacion(idConversacion) {
    await this.obtenerConversacionesUsuario();
    return this.obtenerConversacion(idConversacion, true);
  },

  /**
   * Abre una conversación desde una publicación.
   */
  async abrirPorProducto(idProducto) {
    try {
      const datos = await this._solicitar(
        () => window.jzApi.post('mensajes/abrir-producto.php', {
          producto_id: Number(idProducto)
        })
      );

      const id = datos.conversacion.idConversacion;
      const conversacion = await this._actualizarConversacion(id);

      if (!conversacion) {
        throw new Error('No fue posible recuperar la conversación.');
      }

      return { exito: true, conversacion };
    } catch (error) {
      return { exito: false, mensaje: error.message };
    }
  },

  /**
   * Abre una conversación desde un pedido.
   */
  async abrirPorPedido(idPedido) {
    try {
      const datos = await this._solicitar(
        () => window.jzApi.post('mensajes/abrir-pedido.php', {
          pedido_id: Number(idPedido)
        })
      );

      const id = datos.conversacion.idConversacion;
      const conversacion = await this._actualizarConversacion(id);

      if (!conversacion) {
        throw new Error('No fue posible recuperar la conversación.');
      }

      return { exito: true, conversacion };
    } catch (error) {
      return { exito: false, mensaje: error.message };
    }
  },

  /**
   * Envía un mensaje a una conversación.
   */
  async enviarMensaje(idConversacion, texto) {
    const contenido = String(texto || '').trim();

    if (!contenido) {
      return { exito: false, mensaje: 'Escribe un mensaje antes de enviar.' };
    }

    if (contenido.length > this.MAX_CARACTERES) {
      return {
        exito: false,
        mensaje: `El mensaje no puede superar ${this.MAX_CARACTERES} caracteres.`
      };
    }

    try {
      await this._solicitar(
        () => window.jzApi.post('mensajes/enviar.php', {
          conversacion_id: Number(idConversacion),
          texto: contenido
        })
      );

      const conversacion = await this._actualizarConversacion(idConversacion);

      return { exito: true, conversacion };
    } catch (error) {
      return { exito: false, mensaje: error.message };
    }
  },

  /**
   * Marca como leídos los mensajes recibidos.
   */
  async marcarComoLeida(idConversacion) {
    try {
      await this._solicitar(
        () => window.jzApi.post('mensajes/leidos.php', {
          conversacion_id: Number(idConversacion)
        })
      );

      const conversacion = this._buscarConversacion(idConversacion);

      if (conversacion) {
        conversacion.noLeidos = 0;
      }

      return true;
    } catch (error) {
      console.error('No fue posible marcar los mensajes como leídos:', error);
      return false;
    }
  },

  /**
   * Devuelve los mensajes pendientes de leer en una conversación.
   */
  contarNoLeidosDe(conversacion) {
    return Number(conversacion?.noLeidos || 0);
  },

  /**
   * Consulta el total de mensajes pendientes de leer.
   */
  async contarNoLeidos() {
    try {
      const datos = await this._solicitar(
        () => window.jzApi.get('mensajes/no-leidos.php')
      );

      return Number(datos.total || 0);
    } catch (error) {
      console.error('No fue posible consultar los mensajes no leídos:', error);
      return 0;
    }
  }
};
