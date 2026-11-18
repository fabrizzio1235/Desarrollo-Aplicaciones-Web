
document.addEventListener('DOMContentLoaded', () => {
  if (ApiAutenticacion.obtenerSesion()) {
    window.location.replace('productos.html');
    return;
  }

  const formularioAcceso = document.getElementById('form-login');
  const mensajeRespuesta = document.getElementById('login-feedback');

  if (formularioAcceso) {
    formularioAcceso.addEventListener('submit', (evento) => {
      evento.preventDefault();
      
      const correo = document.getElementById('login-correo').value.trim();
      const contrasena = document.getElementById('login-password').value;
      const mantenerActiva = document.getElementById('login-recordar').checked; 

      const respuesta = ApiAutenticacion.iniciarSesion(correo, contrasena, mantenerActiva);
    
      if (respuesta.exito) {
        window.location.href = 'productos.html';
      } else {
        mensajeRespuesta.textContent = respuesta.mensaje;
        mensajeRespuesta.style.color = '#dc3545';
      }
    });
  }
});