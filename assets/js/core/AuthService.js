'use strict';

/**
 * Servicio de autenticación sobre ApiClient.
 * Mantiene temporalmente un espejo público (sin contraseña) en localStorage
 * para que las vistas que aún no migran a PHP sigan funcionando.
 */
class AuthService {
  constructor(api) {
    this.api = api;
  }

  _guardarEspejo(usuario) {
    try {
      if (usuario) {
        localStorage.setItem('jz_sesion', JSON.stringify(usuario));
      } else {
        localStorage.removeItem('jz_sesion');
      }
      sessionStorage.removeItem('jz_sesion');
    } catch (error) {
      console.error('No fue posible actualizar el espejo de sesión:', error);
    }
  }

  async cargarSesion() {
    const respuesta = await this.api.get('auth/sesion.php');
    if (respuesta.ok) {
      this.api.asignarToken(respuesta.datos.csrf_token);
      this._guardarEspejo(respuesta.datos.autenticado ? respuesta.datos.usuario : null);
    }
    return respuesta;
  }

  async iniciarSesion(correo, contrasena, recordar) {
    const respuesta = await this.api.post('auth/login.php', { correo, contrasena, recordar });
    if (respuesta.ok) {
      this.api.asignarToken(respuesta.datos.csrf_token);
      this._guardarEspejo(respuesta.datos.usuario);
    }
    return respuesta;
  }

  registrar(datos) {
    return this.api.post('auth/registro.php', datos);
  }

  async cerrarSesion() {
    if (!this.api.tokenCsrf) {
      await this.cargarSesion();
    }
    const respuesta = await this.api.post('auth/logout.php', {});
    this._guardarEspejo(null);
    return respuesta;
  }
}

// Calcula la ruta base hacia /api desde la ubicación de este script
// (funciona en cualquier subcarpeta dentro de htdocs).
(function crearInstanciasGlobales() {
  const scriptActual = document.currentScript || document.querySelector('script[src*="AuthService.js"]');
  const origen = scriptActual ? scriptActual.src : window.location.href;
  const urlApi = new URL('../../../api', origen).pathname;
  window.jzApi = new ApiClient(urlApi);
  window.jzAuth = new AuthService(window.jzApi);
})();