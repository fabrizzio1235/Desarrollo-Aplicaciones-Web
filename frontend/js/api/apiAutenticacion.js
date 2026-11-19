
const ApiAutenticacion = {
  _leer(clave, defecto = []) {
    try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; }
    catch { return defecto; }
  },

  registrar(datosUsuario) {
    const usuarios = this._leer('jz_usuarios');
    const correo = String(datosUsuario.correo || '').trim().toLowerCase();
    if (usuarios.some(u => String(u.correo).toLowerCase() === correo)) {
      return { exito: false, mensaje: 'Este correo institucional ya está registrado.' };
    }
    usuarios.push({
      ...datosUsuario, correo,
      descripcion: datosUsuario.descripcion || '',
      foto: datosUsuario.foto || '',
      fechaRegistro: datosUsuario.fechaRegistro || new Date().toISOString(),
      facultad: datosUsuario.facultad || '',
      puntosFrecuentes: datosUsuario.puntosFrecuentes || '',
      horariosHabituales: datosUsuario.horariosHabituales || ''
    });
    localStorage.setItem('jz_usuarios', JSON.stringify(usuarios));
    return { exito: true };
  },

  iniciarSesion(correo, contrasena, mantenerActiva) {
    const usuarios = this._leer('jz_usuarios');
    const normalizado = String(correo || '').trim().toLowerCase();
    const usuario = usuarios.find(u => String(u.correo).toLowerCase() === normalizado && u.contrasena === contrasena);
    if (!usuario) return { exito: false, mensaje: 'Correo o contraseña incorrectos.' };
    const sesion = this._crearSesion(usuario);
    const destino = mantenerActiva ? localStorage : sessionStorage;
    const otro = mantenerActiva ? sessionStorage : localStorage;
    otro.removeItem('jz_sesion');
    destino.setItem('jz_sesion', JSON.stringify(sesion));
    return { exito: true };
  },

  _crearSesion(usuario) {
    const { contrasena, ...datosPublicos } = usuario;
    return { ...datosPublicos };
  },

  obtenerSesion() {
    try {
      const raw = localStorage.getItem('jz_sesion') || sessionStorage.getItem('jz_sesion');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  obtenerUsuarioActual() {
    const sesion = this.obtenerSesion();
    if (!sesion?.correo) return null;
    const usuarios = this._leer('jz_usuarios');
    const usuario = usuarios.find(u => String(u.correo).toLowerCase() === String(sesion.correo).toLowerCase());
    // Compatibilidad con sesiones creadas por la versión anterior.
    return usuario || sesion;
  },

  actualizarPerfil(cambios) {
    const usuarioActual = this.obtenerUsuarioActual();
    if (!usuarioActual?.correo) return { exito: false, mensaje: 'No hay una sesión activa.' };
    const permitidos = ['nombre', 'descripcion', 'foto', 'campus', 'facultad', 'puntosFrecuentes', 'horariosHabituales'];
    const actualizacion = {};
    permitidos.forEach(campo => { if (Object.hasOwn(cambios, campo)) actualizacion[campo] = cambios[campo]; });
    const usuarios = this._leer('jz_usuarios');
    const indice = usuarios.findIndex(u => String(u.correo).toLowerCase() === String(usuarioActual.correo).toLowerCase());
    if (indice >= 0) {
      usuarios[indice] = { ...usuarios[indice], ...actualizacion };
      localStorage.setItem('jz_usuarios', JSON.stringify(usuarios));
      const sesion = this._crearSesion(usuarios[indice]);
      const almacenamiento = localStorage.getItem('jz_sesion') ? localStorage : sessionStorage;
      almacenamiento.setItem('jz_sesion', JSON.stringify(sesion));
    } else {
      // Sesión antigua sin registro local coincidente: se actualiza la sesión sin inventar un usuario.
      const sesion = { ...this.obtenerSesion(), ...actualizacion };
      const almacenamiento = localStorage.getItem('jz_sesion') ? localStorage : sessionStorage;
      almacenamiento.setItem('jz_sesion', JSON.stringify(sesion));
    }
    return { exito: true };
  },

  cerrarSesion() {
    localStorage.removeItem('jz_sesion');
    sessionStorage.removeItem('jz_sesion');
  },

  _leerResenas() {
    try { return JSON.parse(localStorage.getItem('jz_resenas')) || []; }
    catch { return []; }
  },

  obtenerReputacion(correoVendedor) {
    const resenas = this._leerResenas().filter(r => r.vendedorCorreo === correoVendedor);
    const promedio = resenas.length ? resenas.reduce((s, r) => s + Number(r.estrellas || 0), 0) / resenas.length : 0;
    return { promedio, total: resenas.length, resenas };
  },

  registrarResena(datos) {
    const sesion = this.obtenerSesion();
    if (!sesion) return { exito: false, mensaje: 'Inicia sesión para publicar una reseña.' };
    const pedidos = this._leer('jz_pedidos');
    const pedido = pedidos.find(p => String(p.idPedido) === String(datos.idPedido));
    if (!pedido || pedido.estado !== 'completado' || pedido.compradorCorreo !== sesion.correo) {
      return { exito: false, mensaje: 'Solo puedes calificar pedidos propios que estén completados.' };
    }
    const resenas = this._leer('jz_resenas');
    if (resenas.some(r => String(r.idPedido) === String(datos.idPedido))) {
      return { exito: false, mensaje: 'Este pedido ya tiene una reseña.' };
    }
    resenas.push({
      id: Date.now(), idPedido: pedido.idPedido,
      vendedorCorreo: pedido.vendedorCorreo || '',
      vendedorNombre: pedido.vendedorNombre || 'Vendedor',
      compradorCorreo: sesion.correo,
      compradorNombre: sesion.nombre,
      estrellas: Number(datos.estrellas), comentario: String(datos.comentario).trim(),
      fecha: new Date().toISOString()
    });
    localStorage.setItem('jz_resenas', JSON.stringify(resenas));
    return { exito: true };
  }
};
