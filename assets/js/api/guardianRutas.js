// Respaldo visual del lado cliente.
// La protección real la hace el servidor con config/guard_vista.php y Sesion::requerir().
async function protegerRuta() {
  const respuesta = await window.jzAuth.cargarSesion();
  if (respuesta.ok && !respuesta.datos.autenticado) {
    window.location.replace('login.php');
  }
}

protegerRuta();