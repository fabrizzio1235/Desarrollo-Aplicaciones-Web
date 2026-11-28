'use strict';

/**
 * Servicio cliente para el catálogo CRUD, búsqueda y subastas sobre window.jzApi.
 */
class ProductoService {
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

  obtenerCatalogos() {
    return this.api.get('productos/catalogos.php');
  }

  filtrarCatalogo(criterios = {}) {
    const params = new URLSearchParams();
    if (Array.isArray(criterios.campus) && criterios.campus.length > 0) {
      params.set('campus', criterios.campus.join(','));
    }
    if (criterios.categoria && criterios.categoria !== 'todas') {
      params.set('categoria', criterios.categoria);
    }
    if (Array.isArray(criterios.modalidades)) {
      params.set('modalidad', criterios.modalidades.join(','));
    }
    if (criterios.precioMin !== null && criterios.precioMin !== undefined && criterios.precioMin !== '') {
      params.set('precio_min', String(criterios.precioMin));
    }
    if (criterios.precioMax !== null && criterios.precioMax !== undefined && criterios.precioMax !== '') {
      params.set('precio_max', String(criterios.precioMax));
    }
    if (criterios.busqueda) {
      params.set('q', criterios.busqueda);
    }
    if (criterios.orden) {
      params.set('orden', criterios.orden);
    }
    if (criterios.mias) {
      params.set('mias', '1');
    }
    const qs = params.toString();
    return this.api.get(`productos/listar.php${qs ? `?${qs}` : ''}`);
  }

  obtenerPorId(id) {
    return this.api.get(`productos/detalle.php?id=${encodeURIComponent(id)}`);
  }

  async crearProducto(datos) {
    await this._asegurarCsrf();
    return this.api.post('productos/crear.php', datos);
  }

  async actualizarProducto(id, datos) {
    await this._asegurarCsrf();
    return this.api.put('productos/actualizar.php', { id, ...datos });
  }

  async eliminarProducto(id) {
    await this._asegurarCsrf();
    return this.api.delete('productos/eliminar.php', { id });
  }

  async registrarPuja(productoId, monto) {
    await this._asegurarCsrf();
    return this.api.post('productos/pujar.php', { producto_id: productoId, monto });
  }
}

window.jzProductos = new ProductoService(window.jzApi);