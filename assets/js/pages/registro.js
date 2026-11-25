document.addEventListener('DOMContentLoaded', async () => {
  const formulario = document.getElementById('form-registro');
  if (!formulario) return;

  const mensaje = document.getElementById('registro-feedback');
  const boton = formulario.querySelector('button[type="submit"]');
  const campoNombre = document.getElementById('nombre-completo');
  const campoCorreo = document.getElementById('correo-uady');
  const campoCampus = document.getElementById('campus-origen');
  const campoPassword = document.getElementById('password');
  const campoConfirmar = document.getElementById('password-confirm');

  const mostrar = (texto, esError) => {
    mensaje.textContent = texto;
    mensaje.style.color = esError ? '#dc3545' : '#198754';
  };

  // Obtiene el token CSRF de la sesión anónima antes de enviar el formulario
  await window.jzAuth.cargarSesion();

  const regexUady = /^(a\d{8}@alumnos\.uady\.mx|[a-z0-9]+([._%+-][a-z0-9]+)*@correo\.uady\.mx)$/i;

  campoCorreo.addEventListener('input', () => {
    const valor = campoCorreo.value.trim();
    mostrar(
      valor !== '' && !regexUady.test(valor)
        ? 'Usa tu matrícula (a + 8 dígitos @alumnos.uady.mx) o un correo @correo.uady.mx.'
        : '',
      true
    );
  });

  campoPassword.addEventListener('input', () => {
    mostrar(
      campoPassword.value !== '' && campoPassword.value.length < 8
        ? 'La contraseña debe tener un mínimo de 8 caracteres.'
        : '',
      true
    );
  });

  campoConfirmar.addEventListener('input', () => {
    mostrar(
      campoConfirmar.value !== '' && campoConfirmar.value !== campoPassword.value
        ? 'Las contraseñas no coinciden.'
        : '',
      true
    );
  });

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    mostrar('', false);

    const datos = {
      nombre: campoNombre.value.trim(),
      correo: campoCorreo.value.trim(),
      campus: campoCampus.value,
      contrasena: campoPassword.value,
      contrasena_confirmacion: campoConfirmar.value,
      terminos: document.getElementById('terminos-campus').checked
    };

    if (datos.nombre.length < 3) {
      mostrar('Escribe tu nombre completo (mínimo 3 caracteres).', true);
      return;
    }
    if (!regexUady.test(datos.correo)) {
      mostrar('Acceso denegado: usa tu matrícula (a + 8 dígitos @alumnos.uady.mx) o un correo @correo.uady.mx', true);
      return;
    }
    if (datos.campus === '') {
      mostrar('Selecciona tu campus principal.', true);
      return;
    }
    if (datos.contrasena.length < 8) {
      mostrar('La contraseña debe tener un mínimo de 8 caracteres.', true);
      return;
    }
    if (datos.contrasena !== datos.contrasena_confirmacion) {
      mostrar('Las contraseñas no coinciden.', true);
      return;
    }
    if (!datos.terminos) {
      mostrar('Debes aceptar los términos de entrega para registrarte.', true);
      return;
    }

    boton.disabled = true;
    const respuesta = await window.jzAuth.registrar(datos);
    boton.disabled = false;

    if (respuesta.ok) {
      mostrar(respuesta.mensaje, false);
      setTimeout(() => { window.location.href = 'login.php'; }, 1200);
      return;
    }

    const primerError = Object.values(respuesta.errores)[0];
    mostrar(typeof primerError === 'string' ? primerError : respuesta.mensaje, true);
  });
});