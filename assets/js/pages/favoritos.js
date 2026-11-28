'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const listaEl = document.getElementById('lista-favoritos');
  const vacioEl = document.getElementById('favoritos-vacio');
  const contadorEl = document.getElementById('favoritos-contador');
  if (!listaEl || !vacioEl) return;

  const moneda = valor => `$${Number(valor || 0).toFixed(2)} MXN`;
  const placeholder = '../assets/images/image-placeholder.jpg';

  function resolverRutaImagen(ruta) {
    const limpia = String(ruta || '').trim();
    if (!limpia) return placeholder;
    if (limpia.startsWith('../') || limpia.startsWith('http')) return limpia;
    return `../${limpia.replace(/^\/+/, '')}`;
  }

  function crearTarjeta(producto) {
    const idProducto = Number(producto.id || 0);

    const tarjeta = document.createElement('article');
    tarjeta.className = 'product-card';
    tarjeta.dataset.productoId = String(idProducto);

    const figura = document.createElement('figure');
    figura.className = 'product-media';

    const imagen = document.createElement('img');
    imagen.src = resolverRutaImagen(producto.imagen);
    imagen.alt = `Imagen de ${producto.titulo || 'publicación'}`;
    imagen.onerror = () => {
      imagen.onerror = null;
      imagen.src = placeholder;
    };

    const modalidad = document.createElement('span');
    modalidad.className = producto.modalidad === 'subasta' ? 'tag tag-subasta' : 'tag tag-fijo';
    modalidad.textContent = producto.modalidad === 'subasta' ? 'Subasta' : 'Precio fijo';
    figura.append(imagen, modalidad);

    const cuerpo = document.createElement('div');
    cuerpo.className = 'product-body';

    const categoria = document.createElement('span');
    categoria.className = 'product-category';
    categoria.textContent = producto.categoriaNombre || producto.categoria || 'Producto';

    const titulo = document.createElement('h2');
    titulo.className = 'product-title';
    const enlaceTitulo = document.createElement('a');
    enlaceTitulo.href = `detalle-producto.php?id=${encodeURIComponent(idProducto)}`;
    enlaceTitulo.textContent = producto.titulo || 'Publicación sin título';
    titulo.appendChild(enlaceTitulo);

    const precio = document.createElement('p');
    precio.className = 'product-price';
    precio.textContent = producto.modalidad === 'subasta'
      ? `Puja actual: ${moneda(producto.precio)}`
      : moneda(producto.precio);

    const entrega = document.createElement('p');
    entrega.className = 'product-delivery';
    const etiquetaEntrega = document.createElement('strong');
    etiquetaEntrega.textContent = 'Entrega: ';
    const textoEntrega = document.createElement('span');
    textoEntrega.textContent = producto.entregaTexto || 'Punto por acordar';
    entrega.append(etiquetaEntrega, textoEntrega);

    const vendedor = document.createElement('footer');
    vendedor.className = 'product-seller';
    const nombreVendedor = document.createElement('span');
    nombreVendedor.textContent = producto.vendedorNombre || 'Estudiante UADY';
    const rating = document.createElement('span');
    rating.className = 'rating';
    const totalResenas = Number(producto.vendedorTotalResenas || 0);
    rating.textContent = totalResenas > 0
      ? `★ ${Number(producto.vendedorPromedio || 0).toFixed(1)} (${totalResenas})`
      : 'Sin calificaciones';
    vendedor.append(nombreVendedor, rating);

    const acciones = document.createElement('div');
    acciones.className = 'card-actions';

    const ver = document.createElement('a');
    ver.className = 'btn btn-primary btn-sm';
    ver.href = `detalle-producto.php?id=${encodeURIComponent(idProducto)}`;
    ver.textContent = 'Ver publicación';

    const quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.className = 'btn btn-outline btn-sm';
    quitar.dataset.action = 'quitar-favorito';
    quitar.dataset.id = String(idProducto);
    quitar.textContent = 'Quitar de favoritos';

    acciones.append(ver, quitar);
    cuerpo.append(categoria, titulo, precio, entrega, vendedor, acciones);
    tarjeta.append(figura, cuerpo);
    return tarjeta;
  }

  function mostrarError(texto) {
    const aviso = document.createElement('p');
    aviso.className = 'feedback-msg';
    aviso.textContent = texto;
    listaEl.replaceChildren(aviso);
    listaEl.hidden = false;
    vacioEl.hidden = true;
  }

  async function cargarFavoritos() {
    if (!window.jzFavoritos) {
      mostrarError('No se pudo cargar el servicio de favoritos.');
      return;
    }

    const res = await window.jzFavoritos.listar();
    if (!res.ok) {
      mostrarError(res.mensaje || 'No se pudieron cargar tus favoritos.');
      return;
    }

    const productos = Array.isArray(res.datos?.favoritos) ? res.datos.favoritos : [];
    listaEl.replaceChildren();
    productos.forEach(producto => listaEl.appendChild(crearTarjeta(producto)));

    vacioEl.hidden = productos.length > 0;
    listaEl.hidden = productos.length === 0;

    if (contadorEl) {
      contadorEl.textContent = productos.length === 1
        ? 'Tienes 1 publicación guardada.'
        : `Tienes ${productos.length} publicaciones guardadas.`;
    }
  }

  listaEl.addEventListener('click', async evento => {
    const boton = evento.target.closest('[data-action="quitar-favorito"]');
    if (!boton) return;

    boton.disabled = true;
    const res = await window.jzFavoritos.toggle(Number(boton.dataset.id));
    if (!res.ok) {
      window.alert(res.mensaje || 'No se pudo actualizar tus favoritos.');
      boton.disabled = false;
      return;
    }

    await cargarFavoritos();
  });

  await cargarFavoritos();
});