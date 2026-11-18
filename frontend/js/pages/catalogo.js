
document.addEventListener('DOMContentLoaded', () => {
  const contenedorGrid = document.getElementById('grid-productos');
  const estadoVacio = document.getElementById('catalogo-vacio');
  const contadorResultados = document.getElementById('resultados-contador');
  const formularioFiltros = document.getElementById('form-filtros');
  const formularioBusqueda = document.getElementById('form-busqueda-global');
  const inputBusqueda = document.getElementById('input-busqueda');
  const selectOrden = document.getElementById('ordenar-por');

  // Sincroniza el filtro de categoría si el usuario entra desde un enlace con ?categoria=...
  const parametrosUrl = new URLSearchParams(window.location.search); //extrae la cadena de consulta de la URL actual a partir del ? a un objeto
  const categoriaUrl = parametrosUrl.get('categoria');
  if (categoriaUrl && formularioFiltros) {
    const radioCategoria = formularioFiltros.querySelector(`input[name="categoria"][value="${categoriaUrl}"]`);
    if (radioCategoria) {
      radioCategoria.checked = true;
    }
  }

  // Se usa createElement y textContent en lugar de innerHTML para prevenir inyección XSS
  function crearTarjetaProducto(producto) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'product-card';

    // Se usa data-* en lugar de id para almacenar el ID de negocio sin exigir unicidad en el DOM ni romper selectores CSS numéricos
    tarjeta.setAttribute('data-producto-id', producto.id);

    //  Contenedor de imagen (semántico), etiqueta de modalidad y botón favorito
    const figura = document.createElement('figure');
    figura.className = 'product-media';

    const imagen = document.createElement('img');
    imagen.src = producto.imagen;
    imagen.alt = `Imagen de ${producto.titulo}`;

    const etiquetaModalidad = document.createElement('span');
    etiquetaModalidad.className = producto.modalidad === 'subasta' ? 'tag tag-subasta' : 'tag tag-fijo';
    etiquetaModalidad.textContent = producto.modalidad === 'subasta' ? 'Subasta' : 'Precio fijo';

    const activoFav = ApiProductos.esFavorito(producto.id);
    const botonFav = document.createElement('button');
    botonFav.type = 'button';
    botonFav.className = 'btn-fav';
    botonFav.setAttribute('data-id', producto.id);
    botonFav.setAttribute('aria-label', 'Guardar en favoritos');
    botonFav.setAttribute('aria-pressed', activoFav ? 'true' : 'false');
    botonFav.textContent = activoFav ? '♥' : '♡';

    botonFav.addEventListener('click', (evento) => {
      const idProd = evento.currentTarget.dataset.id;
      const quedoAgregado = ApiProductos.alternarFavorito(idProd);
      evento.currentTarget.textContent = quedoAgregado ? '♥' : '♡';
      evento.currentTarget.setAttribute('aria-pressed', quedoAgregado ? 'true' : 'false');
    });

    figura.append(imagen, etiquetaModalidad, botonFav);

    // Cuerpo de la tarjeta
    const cuerpo = document.createElement('div');
    cuerpo.className = 'product-body';

    const spanCategoria = document.createElement('span');
    spanCategoria.className = 'product-category';
    spanCategoria.textContent = producto.categoriaNombre;

    const tituloH2 = document.createElement('h2');
    tituloH2.className = 'product-title';
    const enlaceTitulo = document.createElement('a');
    enlaceTitulo.href = `detalle-producto.html?id=${producto.id}`;
    enlaceTitulo.textContent = producto.titulo;
    tituloH2.appendChild(enlaceTitulo);

    const parrafoPrecio = document.createElement('p');
    parrafoPrecio.className = 'product-price';

    if (producto.modalidad === 'subasta') {
      parrafoPrecio.textContent = 'Puja actual: ';
      const montoStrong = document.createElement('strong');
      montoStrong.textContent = `$${producto.precio.toFixed(2)} MXN`;
      parrafoPrecio.appendChild(montoStrong);
    } else {
      parrafoPrecio.textContent = `$${producto.precio.toFixed(2)} MXN`;
    }

    const parrafoEntrega = document.createElement('p');
    parrafoEntrega.className = 'product-delivery';
    const etiquetaEntrega = document.createElement('strong');
    etiquetaEntrega.textContent = 'Entrega: ';
    const textoEntrega = document.createElement('span');
    textoEntrega.textContent = producto.entregaTexto;
    parrafoEntrega.append(etiquetaEntrega, textoEntrega);

    const pieVendedor = document.createElement('footer');
    pieVendedor.className = 'product-seller';
    const spanVendedor = document.createElement('span');
    spanVendedor.textContent = producto.vendedorNombre;
    const spanRating = document.createElement('span');
    spanRating.className = 'rating';
    spanRating.textContent = `★ ${producto.reputacion} (${producto.ventasCompletadas})`;
    pieVendedor.append(spanVendedor, spanRating);

    // Si es subasta, incluimos el reloj de cierre definido en productos.css
    if (producto.modalidad === 'subasta') {
      const parrafoCierre = document.createElement('p');
      parrafoCierre.className = 'auction-timer';
      parrafoCierre.textContent = 'Cierra: ';
      const etiquetaTime = document.createElement('time');
      etiquetaTime.textContent = producto.cierreSubasta || 'Próximamente';
      parrafoCierre.appendChild(etiquetaTime);

      cuerpo.append(spanCategoria, tituloH2, parrafoPrecio, parrafoCierre, parrafoEntrega, pieVendedor);
    } else {
      cuerpo.append(spanCategoria, tituloH2, parrafoPrecio, parrafoEntrega, pieVendedor);
    }

    tarjeta.append(figura, cuerpo);
    return tarjeta;
  }

  //  Limpiar y poblar el contenedor del catálogo en el DOM
  function mostrarProductos(listaProductos) {
    contenedorGrid.innerHTML = '';
    contadorResultados.textContent = `Mostrando ${listaProductos.length} publicaciones activas`;

    if (listaProductos.length === 0) {
      contenedorGrid.setAttribute('hidden', '');
      if (estadoVacio) {
        estadoVacio.removeAttribute('hidden');
      }
      return;
    }

    contenedorGrid.removeAttribute('hidden');
    if (estadoVacio) {
      estadoVacio.setAttribute('hidden', '');
    }

    listaProductos.forEach(producto => {
      const tarjeta = crearTarjetaProducto(producto);
      contenedorGrid.appendChild(tarjeta);
    });
  }

  //  Leer el estado actual de los inputs del DOM y empaquetarlo en una estructura de categorías
  function obtenerCriteriosDeFormulario() {
    const campusSeleccionados = [];
    const modalidadesSeleccionadas = [];
    let categoriaSeleccionada = 'todas';
    let precioMin = null;
    let precioMax = null;

    if (formularioFiltros) {
      const checkboxesCampus = formularioFiltros.querySelectorAll('input[name="campus"]:checked');
      checkboxesCampus.forEach(chk => campusSeleccionados.push(chk.value));

      const radioCategoria = formularioFiltros.querySelector('input[name="categoria"]:checked');
      if (radioCategoria) {
        categoriaSeleccionada = radioCategoria.value;
      }

      const checkboxesModalidad = formularioFiltros.querySelectorAll('input[name="modalidad"]:checked');
      checkboxesModalidad.forEach(chk => modalidadesSeleccionadas.push(chk.value));

      const textoMin = formularioFiltros.querySelector('input[name="precio_min"]').value.trim();
      const textoMax = formularioFiltros.querySelector('input[name="precio_max"]').value.trim();

      if (textoMin !== '') {
        precioMin = Number(textoMin);
      }
      if (textoMax !== '') {
        precioMax = Number(textoMax);
      }
    }

    return {
      campus: campusSeleccionados,
      categoria: categoriaSeleccionada,
      modalidades: modalidadesSeleccionadas,
      precioMin: precioMin,
      precioMax: precioMax,
      busqueda: inputBusqueda ? inputBusqueda.value.trim() : '',
      orden: selectOrden ? selectOrden.value : 'recientes'
    };
  }

  // Coordinar la lectura de filtros con la API y el renderizado
  function actualizarVistaCatalogo() {
    const criterios = obtenerCriteriosDeFormulario();
    const productosFiltrados = ApiProductos.filtrarCatalogo(criterios);
    mostrarProductos(productosFiltrados);
  }

  // Registro de manejadores de eventos
  if (formularioFiltros) {
    formularioFiltros.addEventListener('submit', (evento) => {
      evento.preventDefault();
      actualizarVistaCatalogo();
    });

    formularioFiltros.addEventListener('reset', () => {
      setTimeout(() => {
        if (inputBusqueda) inputBusqueda.value = '';
        actualizarVistaCatalogo();
      }, 10);
    });
  }

  if (formularioBusqueda) {
    formularioBusqueda.addEventListener('submit', (evento) => {
      evento.preventDefault();
      actualizarVistaCatalogo();
    });
  }

  if (selectOrden) {
    selectOrden.addEventListener('change', () => {
      actualizarVistaCatalogo();
    });
  }

  actualizarVistaCatalogo();
});