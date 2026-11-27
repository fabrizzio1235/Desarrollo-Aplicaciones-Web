'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const contenedorGrid = document.getElementById('grid-productos');
  const estadoVacio = document.getElementById('catalogo-vacio');
  const contadorResultados = document.getElementById('resultados-contador');
  const formularioFiltros = document.getElementById('form-filtros');
  const formularioBusqueda = document.getElementById('form-busqueda-global');
  const inputBusqueda = document.getElementById('input-busqueda');
  const selectOrden = document.getElementById('ordenar-por');

  let solicitudActual = 0;
  let temporizadorBusqueda = null;

  // Carga las preferencias guardadas del catálogo.
  const preferencias = PreferenciasCatalogoStorage.cargar();

  function aplicarPreferencias() {
    if (!formularioFiltros) return;

    preferencias.campus.forEach(valor => {
      const control = formularioFiltros.querySelector(
        `input[name="campus"][value="${valor}"]`
      );
      if (control) control.checked = true;
    });

    const categoria = formularioFiltros.querySelector(
      `input[name="categoria"][value="${preferencias.categoria}"]`
    );
    if (categoria) categoria.checked = true;

    formularioFiltros.querySelectorAll('input[name="modalidad"]').forEach(control => {
      control.checked = preferencias.modalidades.includes(control.value);
    });

    formularioFiltros.querySelector('input[name="precio_min"]').value =
      preferencias.precioMin ?? '';

    formularioFiltros.querySelector('input[name="precio_max"]').value =
      preferencias.precioMax ?? '';

    if (inputBusqueda) inputBusqueda.value = preferencias.busqueda || '';
    if (selectOrden) selectOrden.value = preferencias.orden || 'recientes';
  }

  // Un parámetro de categoría en la URL tiene prioridad sobre la preferencia guardada.
  const parametrosUrl = new URLSearchParams(window.location.search);
  const categoriaUrl = parametrosUrl.get('categoria');

  aplicarPreferencias();

  if (categoriaUrl && formularioFiltros) {
    const radioCategoria = formularioFiltros.querySelector(
      `input[name="categoria"][value="${categoriaUrl}"]`
    );
    if (radioCategoria) radioCategoria.checked = true;
  }

  function crearTarjetaProducto(producto) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'product-card';
    tarjeta.setAttribute('data-producto-id', producto.id);

    const figura = document.createElement('figure');
    figura.className = 'product-media';

    const imagen = document.createElement('img');
    imagen.src = producto.imagen || '';
    imagen.alt = `Imagen de ${producto.titulo}`;

    const etiquetaModalidad = document.createElement('span');
    etiquetaModalidad.className =
      producto.modalidad === 'subasta' ? 'tag tag-subasta' : 'tag tag-fijo';
    etiquetaModalidad.textContent =
      producto.modalidad === 'subasta' ? 'Subasta' : 'Precio fijo';

    const activoFav = ApiProductos.esFavorito(producto.id);
    const botonFav = document.createElement('button');
    botonFav.type = 'button';
    botonFav.className = 'btn-fav';
    botonFav.setAttribute('data-id', producto.id);
    botonFav.setAttribute('aria-label', activoFav ? 'Quitar de favoritos' : 'Guardar en favoritos');
    botonFav.setAttribute('aria-pressed', String(activoFav));
    botonFav.title = activoFav ? 'Quitar de favoritos' : 'Guardar en favoritos';
    botonFav.textContent = activoFav ? '♥' : '♡';

    botonFav.addEventListener('click', evento => {
      evento.preventDefault();
      evento.stopPropagation();

      if (!ApiAutenticacion.obtenerSesion()) {
        window.alert('Inicia sesión para guardar publicaciones en favoritos.');
        window.location.href = 'login.php';
        return;
      }

      const idProducto = evento.currentTarget.dataset.id;
      const quedoAgregado = ApiProductos.alternarFavorito(idProducto);

      evento.currentTarget.textContent = quedoAgregado ? '♥' : '♡';
      evento.currentTarget.setAttribute('aria-pressed', String(quedoAgregado));
      evento.currentTarget.setAttribute(
        'aria-label',
        quedoAgregado ? 'Quitar de favoritos' : 'Guardar en favoritos'
      );
      evento.currentTarget.title = quedoAgregado ? 'Quitar de favoritos' : 'Guardar en favoritos';
    });

    figura.append(imagen, etiquetaModalidad, botonFav);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'product-body';

    const spanCategoria = document.createElement('span');
    spanCategoria.className = 'product-category';
    spanCategoria.textContent = producto.categoriaNombre || producto.categoria || '';

    const tituloH2 = document.createElement('h2');
    tituloH2.className = 'product-title';

    const enlaceTitulo = document.createElement('a');
    enlaceTitulo.href = `detalle-producto.php?id=${producto.id}`;
    enlaceTitulo.textContent = producto.titulo;
    tituloH2.appendChild(enlaceTitulo);

    const parrafoPrecio = document.createElement('p');
    parrafoPrecio.className = 'product-price';

    if (producto.modalidad === 'subasta') {
      parrafoPrecio.textContent = 'Puja actual: ';
      const montoStrong = document.createElement('strong');
      montoStrong.textContent = `$${Number(producto.precio).toFixed(2)} MXN`;
      parrafoPrecio.appendChild(montoStrong);
    } else {
      parrafoPrecio.textContent = `$${Number(producto.precio).toFixed(2)} MXN`;
    }

    const parrafoEntrega = document.createElement('p');
    parrafoEntrega.className = 'product-delivery';

    const etiquetaEntrega = document.createElement('strong');
    etiquetaEntrega.textContent = 'Entrega: ';

    const textoEntrega = document.createElement('span');
    textoEntrega.textContent = producto.entregaTexto || 'Consultar con vendedor';

    parrafoEntrega.append(etiquetaEntrega, textoEntrega);

    const pieVendedor = document.createElement('footer');
    pieVendedor.className = 'product-seller';

    const spanVendedor = document.createElement('span');
    spanVendedor.textContent = producto.vendedorNombre || 'Vendedor';

    const spanRating = document.createElement('span');
    spanRating.className = 'rating';

    const promedio = Number(producto.vendedorPromedio || 0);
    const totalResenas = Number(producto.vendedorTotalResenas || 0);

    spanRating.textContent = totalResenas
      ? `★ ${promedio.toFixed(1)} (${totalResenas})`
      : 'Sin calificaciones';

    pieVendedor.append(spanVendedor, spanRating);

    if (producto.modalidad === 'subasta') {
      const parrafoCierre = document.createElement('p');
      parrafoCierre.className = 'auction-timer';
      parrafoCierre.textContent = 'Cierra: ';

      const etiquetaTime = document.createElement('time');
      const fechaCierre = new Date(producto.cierreSubasta);

      if (Number.isNaN(fechaCierre.getTime())) {
        etiquetaTime.textContent = 'Próximamente';
      } else {
        etiquetaTime.dateTime = fechaCierre.toISOString();
        etiquetaTime.textContent = fechaCierre.toLocaleString('es-MX', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
      }

      parrafoCierre.appendChild(etiquetaTime);
      cuerpo.append(
        spanCategoria,
        tituloH2,
        parrafoPrecio,
        parrafoCierre,
        parrafoEntrega,
        pieVendedor
      );
    } else {
      cuerpo.append(
        spanCategoria,
        tituloH2,
        parrafoPrecio,
        parrafoEntrega,
        pieVendedor
      );
    }

    tarjeta.append(figura, cuerpo);
    return tarjeta;
  }

  function mostrarProductos(listaProductos) {
    contenedorGrid.innerHTML = '';
    contadorResultados.textContent =
      `Mostrando ${listaProductos.length} publicaciones activas`;

    if (listaProductos.length === 0) {
      contenedorGrid.setAttribute('hidden', '');
      if (estadoVacio) estadoVacio.removeAttribute('hidden');
      return;
    }

    contenedorGrid.removeAttribute('hidden');
    if (estadoVacio) estadoVacio.setAttribute('hidden', '');

    listaProductos.forEach(producto => {
      contenedorGrid.appendChild(crearTarjetaProducto(producto));
    });
  }

  function obtenerCriteriosDeFormulario() {
    const campus = [];
    const modalidades = [];

    let categoria = 'todas';
    let precioMin = '';
    let precioMax = '';

    if (formularioFiltros) {
      formularioFiltros
        .querySelectorAll('input[name="campus"]:checked')
        .forEach(control => campus.push(control.value));

      const radioCategoria = formularioFiltros.querySelector(
        'input[name="categoria"]:checked'
      );

      if (radioCategoria) categoria = radioCategoria.value;

      formularioFiltros
        .querySelectorAll('input[name="modalidad"]:checked')
        .forEach(control => modalidades.push(control.value));

      precioMin = formularioFiltros.querySelector('input[name="precio_min"]').value.trim();
      precioMax = formularioFiltros.querySelector('input[name="precio_max"]').value.trim();
    }

    return {
      campus,
      categoria,
      modalidades,
      precioMin,
      precioMax,
      busqueda: inputBusqueda ? inputBusqueda.value.trim() : '',
      orden: selectOrden ? selectOrden.value : 'recientes'
    };
  }

  function guardarPreferencias(criterios) {
    PreferenciasCatalogoStorage.guardar(criterios);
  }

  async function actualizarVistaCatalogo() {
    const criterios = obtenerCriteriosDeFormulario();
    guardarPreferencias(criterios);

    const numeroSolicitud = ++solicitudActual;

    // Si no hay modalidades seleccionadas, no se consulta la API.
    if (criterios.modalidades.length === 0) {
      mostrarProductos([]);
      return;
    }

    contadorResultados.textContent = 'Cargando publicaciones...';

    try {
      const respuesta = await window.jzProductos.filtrarCatalogo(criterios);

      // Evita que una respuesta antigua reemplace resultados más recientes.
      if (numeroSolicitud !== solicitudActual) return;

      if (!respuesta.ok) {
        throw new Error(respuesta.mensaje || 'No fue posible cargar las publicaciones.');
      }

      const productos = respuesta.datos?.productos || [];
      mostrarProductos(productos);
    } catch (error) {
      if (numeroSolicitud !== solicitudActual) return;

      console.error('Error al cargar el catálogo:', error);
      contenedorGrid.innerHTML = '';
      contenedorGrid.setAttribute('hidden', '');
      if (estadoVacio) estadoVacio.setAttribute('hidden', '');
      contadorResultados.textContent =
        `Error al cargar publicaciones: ${error.message}`;
    }
  }

  function programarBusqueda() {
    clearTimeout(temporizadorBusqueda);
    temporizadorBusqueda = setTimeout(() => {
      actualizarVistaCatalogo();
    }, 300);
  }

  if (formularioFiltros) {
    formularioFiltros.addEventListener('submit', evento => {
      evento.preventDefault();
      actualizarVistaCatalogo();
    });

    formularioFiltros.addEventListener('reset', () => {
      setTimeout(() => {
        if (inputBusqueda) inputBusqueda.value = '';

        PreferenciasCatalogoStorage.limpiar();
        actualizarVistaCatalogo();
      }, 10);
    });

    formularioFiltros.addEventListener('change', evento => {
      if (evento.target.matches(
        'input[name="campus"], input[name="categoria"], input[name="modalidad"], input[name="precio_min"], input[name="precio_max"]'
      )) {
        actualizarVistaCatalogo();
      }
    });

    formularioFiltros.addEventListener('input', evento => {
      if (evento.target.matches('input[name="precio_min"], input[name="precio_max"]')) {
        programarBusqueda();
      }
    });
  }

  if (formularioBusqueda) {
    formularioBusqueda.addEventListener('submit', evento => {
      evento.preventDefault();
      clearTimeout(temporizadorBusqueda);
      actualizarVistaCatalogo();
    });
  }

  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', programarBusqueda);
  }

  if (selectOrden) {
    selectOrden.addEventListener('change', () => actualizarVistaCatalogo());
  }

  actualizarVistaCatalogo();
});