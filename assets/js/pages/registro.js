
document.addEventListener('DOMContentLoaded', () => {
  const formularioRegistro = document.getElementById('form-registro');
  const mensajeRespuesta = document.getElementById('registro-feedback');

  if (formularioRegistro) {
    formularioRegistro.addEventListener('submit', (evento) => {
      evento.preventDefault(); 

      mensajeRespuesta.textContent = '';
      
      const nombre = document.getElementById('nombre-completo').value.trim();
      const correo = document.getElementById('correo-uady').value.trim();
      const campus = document.getElementById('campus-origen').value;
      const contrasena = document.getElementById('password').value;
      const confirmarContrasena = document.getElementById('password-confirm').value;

      // Expresión Regular en JavaScript
      const regexUady = /^(a\d{8}@alumnos\.uady\.mx|[a-z0-9]+([._%+-][a-z0-9]+)*@correo\.uady\.mx)$/i;
      if (!regexUady.test(correo)) {
        mensajeRespuesta.textContent = 'Acceso denegado: usa tu matrícula (a + 8 dígitos @alumnos.uady.mx) o un correo @correo.uady.mx';
        mensajeRespuesta.style.color = '#dc3545';
        return;
      }

      // Validación de seguridad de la contraseña
      if (contrasena.length < 8) {
        mensajeRespuesta.textContent = 'La contraseña debe tener un mínimo de 8 caracteres.';
        mensajeRespuesta.style.color = '#dc3545';
        return;
      }

      // Validación de contraseñas
      if (contrasena !== confirmarContrasena) {
        mensajeRespuesta.textContent = 'Las contraseñas no coinciden.';
        mensajeRespuesta.style.color = '#dc3545';
        return;
      }
      

      // Validación de términos y condiciones
      const terminos = document.getElementById('terminos-campus').checked;
      if (!terminos) {
        mensajeRespuesta.textContent = 'Debes aceptar los términos de entrega para registrarte.';
        mensajeRespuesta.style.color = '#dc3545';
        return;
      }

      // Llamada a la API
      const respuesta = ApiAutenticacion.registrar({ nombre, correo, campus, contrasena });
      if (respuesta.exito) {
        alert('Cuenta institucional creada. Ahora puedes iniciar sesión.');
        window.location.href = 'login.php';
      } else {
        mensajeRespuesta.textContent = respuesta.mensaje;
        mensajeRespuesta.style.color = '#dc3545';
      }
    });
  }
});