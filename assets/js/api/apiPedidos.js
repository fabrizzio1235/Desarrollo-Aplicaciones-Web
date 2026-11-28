'use strict';

/**
 * Servicio cliente para gestionar pedidos mediante la API de JaguarZon.
 */
class PedidoService {
  constructor(api) {
    this.api = api;
  }

  /**
   * Garantiza que exista un token CSRF antes de realizar escrituras.
   */
  async _asegurarCsrf() {
    if (!this.api.tokenCsrf && window.jzAuth) {
      const respuesta = await window.jzAuth.cargarSesion();

      if (!respuesta.ok) {
        throw new Error(
          respuesta.mensaje || 'No se pudo validar la sesión.'
        );
      }
    }

    if (!this.api.tokenCsrf) {
      throw new Error('No se pudo obtener el token de seguridad.');
    }
  }

  /**
   * Comprueba la respuesta del servidor y devuelve sus datos.
   */
  _validarRespuesta(respuesta) {
    if (!respuesta.ok) {
      throw new Error(
        respuesta.mensaje || 'Ocurrió un error al procesar la solicitud.'
      );
    }

    return {
      ...respuesta.datos,
      mensaje: respuesta.mensaje
    };
  }

  /**
   * Registra una compra.
   */
  async crearPedido(datos) {
    await this._asegurarCsrf();

    const respuesta = await this.api.post(
      'pedidos/crear.php',
      datos
    );

    return this._validarRespuesta(respuesta);
  }

  /**
   * Lista los pedidos del usuario según su rol.
   */
  async listar(rol = 'comprador') {
    const respuesta = await this.api.get(
      `pedidos/listar.php?rol=${encodeURIComponent(rol)}`
    );

    return this._validarRespuesta(respuesta);
  }

  /**
   * Actualiza el estado de un pedido.
   */
  async actualizarEstado(idPedido, estado) {
    await this._asegurarCsrf();

    const respuesta = await this.api.put(
      'pedidos/estado.php',
      { idPedido, estado }
    );

    return this._validarRespuesta(respuesta);
  }
}

// Instancia global del servicio.
window.jzPedidos = new PedidoService(window.jzApi);