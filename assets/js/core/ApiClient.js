'use strict';

/**
 * Cliente HTTP reutilizable. Envía y recibe JSON, adjunta X-CSRF-Token en
 * escrituras y devuelve siempre { ok, status, mensaje, datos, errores }.
 */
class ApiClient {
  constructor(urlBase) {
    this.urlBase = String(urlBase).replace(/\/+$/, '');
    this.tokenCsrf = '';
  }

  asignarToken(token) {
    this.tokenCsrf = typeof token === 'string' ? token : '';
  }

  async solicitar(metodo, ruta, cuerpo = null) {
    const opciones = {
      method: metodo,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    };

    if (metodo !== 'GET') {
      opciones.headers['X-CSRF-Token'] = this.tokenCsrf;
    }

    if (cuerpo instanceof FormData) {
      opciones.body = cuerpo;
    } else if (cuerpo !== null) {
      opciones.headers['Content-Type'] = 'application/json';
      opciones.body = JSON.stringify(cuerpo);
    }

    try {
      const respuesta = await fetch(`${this.urlBase}/${ruta}`, opciones);
      let json = null;
      try {
        json = await respuesta.json();
      } catch (errorLectura) {
        json = null;
      }

      if (json === null || typeof json !== 'object') {
        return {
          ok: false,
          status: respuesta.status,
          mensaje: 'Respuesta inválida del servidor.',
          datos: {},
          errores: {}
        };
      }

      return {
        ok: respuesta.ok && json.ok === true,
        status: respuesta.status,
        mensaje: typeof json.mensaje === 'string' ? json.mensaje : '',
        datos: json.datos || {},
        errores: json.errores || {}
      };
    } catch (errorRed) {
      return {
        ok: false,
        status: 0,
        mensaje: 'No se pudo conectar con el servidor.',
        datos: {},
        errores: {}
      };
    }
  }

  get(ruta) { return this.solicitar('GET', ruta); }
  post(ruta, cuerpo) { return this.solicitar('POST', ruta, cuerpo); }
  postFormData(ruta, formData) { return this.solicitar('POST', ruta, formData); }
  put(ruta, cuerpo) { return this.solicitar('PUT', ruta, cuerpo); }
  delete(ruta, cuerpo = {}) { return this.solicitar('DELETE', ruta, cuerpo); }
}