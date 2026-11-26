document.addEventListener('DOMContentLoaded', async () => {
  const formulario = document.getElementById('form-login');
  if (!formulario) return;

  const mensaje = document.getElementById('login-feedback');
  const campoCorreo = document.getElementById('login-correo');
  const campoPassword = document.getElementById('login-password');
  const campoRecordar = document.getElementById('login-recordar');
  const boton = formulario.querySelector('button[type="submit"]');

  const mostrar = (texto, esError) => {
    mensaje.textContent = texto;
    mensaje.style.color = esError ? '#dc3545' : '#198754';
  };

  // Verifica sesión en el servidor y precarga el correo guardado en cookie HttpOnly
  const sesion = await window.jzAuth.cargarSesion();
  if (sesion.ok && sesion.datos.autenticado) {
    window.location.replace('productos.php');
    return;
  }
  if (sesion.ok && sesion.datos.correo_recordado) {
    campoCorreo.value = sesion.datos.correo_recordado;
    campoRecordar.checked = true;
  }

  const regexUady = /^(a\d{8}@alumnos\.uady\.mx|[a-z0-9]+([._%+-][a-z0-9]+)*@correo\.uady\.mx)$/i;
  campoCorreo.addEventListener('input', () => {
    const valor = campoCorreo.value.trim();
    if (valor !== '' && !regexUady.test(valor)) {
      mostrar('Usa tu correo institucional (@alumnos.uady.mx o @correo.uady.mx).', true);
    } else {
      mostrar('', false);
    }
  });

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const correo = campoCorreo.value.trim();
    const contrasena = campoPassword.value;

    if (!regexUady.test(correo)) {
      mostrar('Escribe un correo institucional válido.', true);
      return;
    }
    if (contrasena === '') {
      mostrar('Escribe tu contraseña.', true);
      return;
    }

    boton.disabled = true;
    const respuesta = await window.jzAuth.iniciarSesion(correo, contrasena, campoRecordar.checked);
    boton.disabled = false;

    if (respuesta.ok) {
      window.location.href = 'productos.php';
    } else {
      mostrar(respuesta.mensaje, true);
    }
  });
});