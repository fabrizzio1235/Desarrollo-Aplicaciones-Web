
'use strict';

class PreferenciasCatalogoStorage {
  static CLAVE = 'jz_filtros_catalogo_v1';

  static porDefecto() {
    return {
      campus: [],
      categoria: 'todas',
      modalidades: ['fijo', 'subasta'],
      precioMin: '',
      precioMax: '',
      busqueda: '',
      orden: 'recientes'
    };
  }

  static cargar() {
    const defecto = this.porDefecto();

    try {
      const guardado = localStorage.getItem(this.CLAVE);

      if (!guardado) {
        return defecto;
      }

      const preferencias = JSON.parse(guardado);

      if (!preferencias || typeof preferencias !== 'object') {
        return defecto;
      }

      return {
        ...defecto,
        ...preferencias,
        campus: Array.isArray(preferencias.campus)
          ? preferencias.campus
          : defecto.campus,
        modalidades: Array.isArray(preferencias.modalidades)
          ? preferencias.modalidades
          : defecto.modalidades
      };
    } catch (error) {
      console.error('Error al cargar preferencias del catálogo:', error);
      return defecto;
    }
  }

  static guardar(preferencias) {
    try {
      localStorage.setItem(
        this.CLAVE,
        JSON.stringify(preferencias)
      );
      return true;
    } catch (error) {
      console.error('Error al guardar preferencias del catálogo:', error);
      return false;
    }
  }

  static limpiar() {
    localStorage.removeItem(this.CLAVE);
  }
}