// Mensajería interna simulada con localStorage.
// Cada conversación pertenece a UNA publicación y a UN comprador, de modo que
// los acuerdos de entrega quedan ligados al artículo (trazabilidad).
// En la siguiente entrega esta capa se reemplazará por el backend.
const ApiMensajes = {
  CLAVE: 'jz_mensajes',
  MAX_CARACTERES: 500,

  _leer() {
    try {
      const datos = JSON.parse(localStorage.getItem(this.CLAVE));
      return Array.isArray(datos) ? datos : [];
    } catch {
      return [];
    }
  },

  _guardar(conversaciones) {
    try {
      localStorage.setItem(this.CLAVE, JSON.stringify(conversaciones));
      return true;
    } catch (error) {
      console.error('No fue posible guardar los mensajes:', error);
      return false;
    }
  },

  _correoActual() {
    const sesion = ApiAutenticacion.obtenerSesion();
    return sesion ? String(sesion.correo || '').toLowerCase() : '';
  },

  _nombreDeUsuario(correo, respaldo) {
    const usuarios = ApiAutenticacion._leer('jz_usuarios');
    const usuario = usuarios.find(u => String(u.correo).toLowerCase() === correo);
    return (usuario && usuario.nombre) || respaldo || correo;
  },

  _esParticipante(conversacion, correo) {
    return Boolean(correo) && (conversacion.compradorCorreo === correo || conversacion.vendedorCorreo === correo);
  },

  _idConversacion(idProducto, correoComprador) {
    return `${idProducto}__${correoComprador}`;
  },

  // Conversaciones del usuario activo, la más reciente primero
  obtenerConversacionesUsuario() {
    const yo = this._correoActual();
    return this._leer()
      .filter(c => this._esParticipante(c, yo))
      .sort((a, b) => this.fechaUltimaActividad(b) - this.fechaUltimaActividad(a));
  },

  fechaUltimaActividad(conversacion) {
    const ultimo = conversacion.mensajes[conversacion.mensajes.length - 1];
    return ultimo ? ultimo.fecha : conversacion.fechaCreacion;
  },

  obtenerConversacion(idConversacion) {
    const yo = this._correoActual();
    const conversacion = this._leer().find(c => c.id === idConversacion);
    return conversacion && this._esParticipante(conversacion, yo) ? conversacion : null;
  },

  // Busca o crea el chat entre el usuario activo (comprador) y el vendedor de la publicación
  abrirPorProducto(idProducto) {
    const yo = this._correoActual();
    if (!yo) return { exito: false, mensaje: 'Debes iniciar sesión para enviar mensajes.' };

    const producto = ApiProductos.obtenerPorId(idProducto);
    if (!producto) return { exito: false, mensaje: 'La publicación ya no existe.' };

    const correoVendedor = String(producto.vendedorCorreo || '').toLowerCase();
    if (correoVendedor === yo) {
      return { exito: false, mensaje: 'Esta es tu publicación. Las conversaciones aparecerán aquí cuando un comprador te escriba.' };
    }

    return this._buscarOCrear({
      idProducto: producto.id,
      tituloProducto: producto.titulo,
      compradorCorreo: yo,
      vendedorCorreo: correoVendedor,
      vendedorNombre: producto.vendedorNombre
    });
  },

  // Abre el chat ligado a un pedido (lo puede abrir el comprador o el vendedor)
  abrirPorPedido(idPedido) {
    const yo = this._correoActual();
    if (!yo) return { exito: false, mensaje: 'Debes iniciar sesión para ver el chat.' };

    const pedidos = JSON.parse(localStorage.getItem('jz_pedidos') || '[]');
    const pedido = pedidos.find(p => String(p.idPedido) === String(idPedido));
    const comprador = pedido ? String(pedido.compradorCorreo || '').toLowerCase() : '';
    const vendedor = pedido ? String(pedido.vendedorCorreo || '').toLowerCase() : '';
    if (!pedido || (yo !== comprador && yo !== vendedor)) {
      return { exito: false, mensaje: 'No se encontró el pedido o no participas en él.' };
    }

    return this._buscarOCrear({
      idProducto: pedido.idProducto,
      tituloProducto: pedido.tituloProducto,
      compradorCorreo: comprador,
      vendedorCorreo: vendedor,
      vendedorNombre: pedido.vendedorNombre
    });
  },

  _buscarOCrear(datos) {
    const conversaciones = this._leer();
    const id = this._idConversacion(datos.idProducto, datos.compradorCorreo);
    const existente = conversaciones.find(c => c.id === id);
    if (existente) return { exito: true, conversacion: existente };

    const nueva = {
      id,
      idProducto: datos.idProducto,
      tituloProducto: datos.tituloProducto,
      compradorCorreo: datos.compradorCorreo,
      compradorNombre: this._nombreDeUsuario(datos.compradorCorreo),
      vendedorCorreo: datos.vendedorCorreo,
      vendedorNombre: this._nombreDeUsuario(datos.vendedorCorreo, datos.vendedorNombre),
      fechaCreacion: Date.now(),
      mensajes: [],
      lecturas: {}
    };
    conversaciones.push(nueva);
    if (!this._guardar(conversaciones)) {
      return { exito: false, mensaje: 'No hay espacio disponible en el navegador para crear la conversación.' };
    }
    return { exito: true, conversacion: nueva };
  },

  enviarMensaje(idConversacion, texto) {
    const yo = this._correoActual();
    const contenido = String(texto || '').trim();
    if (contenido === '') return { exito: false, mensaje: 'Escribe un mensaje antes de enviar.' };
    if (contenido.length > this.MAX_CARACTERES) {
      return { exito: false, mensaje: `El mensaje no puede superar ${this.MAX_CARACTERES} caracteres.` };
    }

    const conversaciones = this._leer();
    const conversacion = conversaciones.find(c => c.id === idConversacion);
    if (!conversacion || !this._esParticipante(conversacion, yo)) {
      return { exito: false, mensaje: 'No participas en esta conversación.' };
    }

    const ahora = Date.now();
    conversacion.mensajes.push({ de: yo, texto: contenido, fecha: ahora });
    conversacion.lecturas[yo] = ahora;
    if (!this._guardar(conversaciones)) {
      return { exito: false, mensaje: 'No hay espacio disponible para guardar el mensaje.' };
    }
    return { exito: true, conversacion };
  },

  marcarComoLeida(idConversacion) {
    const yo = this._correoActual();
    const conversaciones = this._leer();
    const conversacion = conversaciones.find(c => c.id === idConversacion);
    if (!conversacion || !this._esParticipante(conversacion, yo)) return;
    conversacion.lecturas[yo] = Date.now();
    this._guardar(conversaciones);
  },

  // Cantidad de mensajes recibidos que el usuario activo aún no ha leído en una conversación
  contarNoLeidosDe(conversacion) {
    const yo = this._correoActual();
    const ultimaLectura = conversacion.lecturas[yo] || 0;
    return conversacion.mensajes.filter(m => m.de !== yo && m.fecha > ultimaLectura).length;
  },

  contarNoLeidos() {
    return this.obtenerConversacionesUsuario()
      .reduce((total, conversacion) => total + this.contarNoLeidosDe(conversacion), 0);
  }
};
