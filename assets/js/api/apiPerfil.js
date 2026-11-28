'use strict';

class PerfilService {
  constructor(api) {
    this.api = api;
  }

  async _asegurarCsrf() {
    if (!this.api.tokenCsrf && window.jzAuth) {
      await window.jzAuth.cargarSesion();
    }
  }

  obtener(id = null) {
    const qs = id ? `?id=${encodeURIComponent(id)}` : '';
    return this.api.get(`perfil/obtener.php${qs}`);
  }

  async actualizar(datos) {
    await this._asegurarCsrf();
    return this.api.put('perfil/actualizar.php', datos);
  }

  async enviarResena(pedidoId, calificacion, comentario) {
    await this._asegurarCsrf();
    return this.api.post('perfil/resenar.php', {
      pedido_id: pedidoId,
      calificacion,
      comentario
    });
  }
}

window.jzPerfil = new PerfilService(window.jzApi);
