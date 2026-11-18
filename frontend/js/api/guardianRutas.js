// js repetido en todos los html's para proteger su acceso y obligarlo a pasar por un inicio de sesión
//Al momento de entrar a una página se activa esta función, y redirige si no hay sesión
function protegerRuta() {
  const sesion = ApiAutenticacion.obtenerSesion();
  
  if (!sesion) {
    window.location.replace('login.html');
  }
}

protegerRuta();