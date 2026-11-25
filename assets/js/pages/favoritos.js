document.addEventListener('DOMContentLoaded', () => {
  const lista = document.getElementById('lista-favoritos');
  const vacio = document.getElementById('favoritos-vacio');
  const contador = document.getElementById('favoritos-contador');
  if (!lista || !vacio) return;

  const moneda = valor => `$${Number(valor || 0).toFixed(2)} MXN`;
  const placeholder = '../assets/images/image-placeholder.jpg';

  function crearTarjeta(producto) {
    const tarjeta = document.createElement('article');
    tarjeta.className = 'product-card';
    tarjeta.dataset.productoId = producto.id;

    const figura = document.createElement('figure');
    figura.className = 'product-media';
    const imagen = document.createElement('img');
    imagen.src = producto.imagen || (Array.isArray(producto.imagenes) ? producto.imagenes[0] : '') || placeholder;
    imagen.alt = `Imagen de ${producto.titulo}`;
    imagen.onerror = () => { imagen.onerror = null; imagen.src = placeholder; };

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
    enlaceTitulo.href = `detalle-producto.php?id=${encodeURIComponent(producto.id)}`;
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

    const acciones = document.createElement('div');
    acciones.className = 'card-actions';
    const ver = document.createElement('a');
    ver.className = 'btn btn-primary btn-sm';
    ver.href = `detalle-producto.php?id=${encodeURIComponent(producto.id)}`;
    ver.textContent = 'Ver publicación';

    const quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.className = 'btn btn-outline btn-sm';
    quitar.dataset.action = 'quitar-favorito';
    quitar.dataset.id = producto.id;
    quitar.textContent = 'Quitar de favoritos';

    acciones.append(ver, quitar);
    cuerpo.append(categoria, titulo, precio, entrega, acciones);
    tarjeta.append(figura, cuerpo);
    return tarjeta;
  }

  function renderizar() {
    const productos = ApiProductos.obtenerProductosFavoritos();
    lista.replaceChildren();
    productos.forEach(producto => lista.appendChild(crearTarjeta(producto)));
    vacio.hidden = productos.length > 0;
    lista.hidden = productos.length === 0;
    if (contador) {
      contador.textContent = productos.length === 1
        ? 'Tienes 1 publicación guardada.'
        : `Tienes ${productos.length} publicaciones guardadas.`;
    }
  }

  lista.addEventListener('click', evento => {
    const boton = evento.target.closest('[data-action="quitar-favorito"]');
    if (!boton) return;
    const resultado = ApiProductos.quitarFavorito(boton.dataset.id);
    if (!resultado.exito) {
      window.alert(resultado.mensaje);
      return;
    }
    renderizar();
  });

  renderizar();
});
