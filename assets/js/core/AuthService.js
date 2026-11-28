'use strict';

/**
 * Servicio de autenticación sobre ApiClient.
 */
class AuthService {
  constructor(api) {
    this.api = api;
  }

  async cargarSesion() {
    const respuesta = await this.api.get('auth/sesion.php');
    if (respuesta.ok) {
      this.api.asignarToken(respuesta.datos.csrf_token);
    }
    return respuesta;
  }

  async iniciarSesion(correo, contrasena, recordar) {
    const respuesta = await this.api.post('auth/login.php', { correo, contrasena, recordar });
    if (respuesta.ok) {
      this.api.asignarToken(respuesta.datos.csrf_token);
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
    return this.api.post('auth/logout.php', {});
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