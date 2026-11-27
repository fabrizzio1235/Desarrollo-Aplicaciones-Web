'use strict';

class FavoritoService {
  constructor(api) {
    this.api = api;
  }

  listar() {
    return this.api.get('favoritos/listar.php');
  }

  async toggle(productoId) {
    if (!this.api.tokenCsrf && window.jzAuth) {
      await window.jzAuth.cargarSesion();
    }
    return this.api.post('favoritos/toggle.php', { producto_id: productoId });
  }
}

window.jzFavoritos = new FavoritoService(window.jzApi);
