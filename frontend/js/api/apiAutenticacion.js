
const ApiAutenticacion = {
  
  registrar(datosUsuario) {
    let usuarios = JSON.parse(localStorage.getItem('jz_usuarios')) || [];
    
    const existe = usuarios.find(u => u.correo === datosUsuario.correo);
    if (existe) {
      return { exito: false, mensaje: 'Este correo institucional ya está registrado.' };
    }

    usuarios.push(datosUsuario);
    localStorage.setItem('jz_usuarios', JSON.stringify(usuarios));
    return { exito: true }; 
  },

  iniciarSesion(correo, contrasena, mantenerActiva) {
    let usuarios = JSON.parse(localStorage.getItem('jz_usuarios')) || [];
    const usuario = usuarios.find(u => u.correo === correo && u.contrasena === contrasena);

    if (usuario) {
      const sesionActiva = { nombre: usuario.nombre, correo: usuario.correo, campus: usuario.campus };
      const sesionString = JSON.stringify(sesionActiva);

      if (mantenerActiva) {
        localStorage.setItem('jz_sesion', sesionString);
      } else {
        sessionStorage.setItem('jz_sesion', sesionString);
      }
      return { exito: true };
    }
    return { exito: false, mensaje: 'Correo o contraseña incorrectos.' };
  },

  obtenerSesion() {
    // El sistema ahora debe buscar en ambos lados para ver si el usuario existe
    const sesionLocal = localStorage.getItem('jz_sesion');
    const sesionTemporal = sessionStorage.getItem('jz_sesion');
    
    return JSON.parse(sesionLocal || sesionTemporal);
  },
  //Para la función de cerrar sesión
  cerrarSesion() {
    localStorage.removeItem('jz_sesion');
    sessionStorage.removeItem('jz_sesion');
  }
};