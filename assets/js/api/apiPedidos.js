'use strict';

/**
 * Servicio cliente para gestionar pedidos mediante window.jzApi.
 * Devuelve siempre la respuesta estándar { ok, status, mensaje, datos, errores }.
 */
class PedidoService {
  constructor(api = null) {
    this._api = api;
  }

  get api() {
    return this._api || window.jzApi;
  }

  async _asegurarCsrf() {
    if (!this.api.tokenCsrf && window.jzAuth) {
      await window.jzAuth.cargarSesion();
    }
  }

  async crearPedido(datos) {
    await this._asegurarCsrf();
    return this.api.post('pedidos/crear.php', datos);
  }

  listar(rol = 'comprador') {
    return this.api.get(`pedidos/listar.php?rol=${encodeURIComponent(rol)}`);
  }

  async actualizarEstado(idPedido, estado) {
    await this._asegurarCsrf();
    return this.api.put('pedidos/estado.php', { idPedido, estado });
  }
}

window.jzPedidos = new PedidoService(window.jzApi);