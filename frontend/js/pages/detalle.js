document.addEventListener('DOMContentLoaded', () => {
  const contenedor = document.getElementById('detalle-articulo');
  if (!contenedor) return;

  const parametros = new URLSearchParams(window.location.search);
  const idProducto = parametros.get('id');
  const producto = idProducto ? ApiProductos.obtenerPorId(idProducto) : null;
  const formulario = document.getElementById('form-solicitud-compra');
  const modal = document.getElementById('modal-confirmacion-pedido');
  const moneda = valor => `$${Number(valor || 0).toFixed(2)} MXN`;
  const $ = selector => document.querySelector(selector);
  const texto = (selector, valor) => { const nodo = $(selector); if (nodo) nodo.textContent = valor; return nodo; };
  const placeholder = '../assets/images/image-placeholder.jpg';

  if (!producto) {
    contenedor.replaceChildren();
    const aviso = document.createElement('section'); aviso.className = 'empty-state';
    const titulo = document.createElement('h1'); titulo.textContent = 'Producto no encontrado';
    const mensaje = document.createElement('p'); mensaje.textContent = 'La publicación pudo haber sido eliminada o el enlace no es válido.';
    const enlace = document.createElement('a'); enlace.className = 'btn btn-primary'; enlace.href = 'productos.html'; enlace.textContent = 'Volver al catálogo';
    aviso.append(titulo, mensaje, enlace); contenedor.appendChild(aviso);
    if (formulario) formulario.hidden = true;
    const resenas = $('.reviews-section'); if (resenas) resenas.hidden = true;
    return;
  }

  contenedor.dataset.productoId = producto.id;
  document.title = `${producto.titulo} | JaguarZon UADY`;
  texto('#detalle-titulo', producto.titulo);
  texto('#breadcrumb-producto', producto.titulo);
  const categoria = producto.categoriaNombre || producto.categoria || 'Productos';
  const linkCategoria = $('#breadcrumb-categoria');
  if (linkCategoria) { linkCategoria.textContent = categoria; linkCategoria.href = `productos.html?categoria=${encodeURIComponent(producto.categoria || '')}`; }
  texto('#detalle-precio', producto.modalidad === 'subasta' ? `Puja actual: ${moneda(producto.precio)}` : moneda(producto.precio));
  texto('#detalle-stock', Number(producto.stock || 0) > 0 ? `Disponible: ${Number(producto.stock)} unidades` : 'Agotado');
  texto('#detalle-modalidad', producto.modalidad === 'subasta' ? 'Subasta' : 'Precio fijo');
  texto('#detalle-descripcion', producto.descripcion || 'El vendedor no agregó una descripción.');

  // Galería: utiliza las fotografías guardadas en la publicación. Las publicaciones antiguas
  // que solo tengan "imagen" continúan siendo compatibles.
  const imagenes = (Array.isArray(producto.imagenes) && producto.imagenes.length ? producto.imagenes : [producto.imagen || placeholder]).slice(0, 4);
  const imagenPrincipal = $('#img-principal');
  const listaMiniaturas = $('#lista-miniaturas');
  function seleccionarImagen(src, botonActivo) {
    if (imagenPrincipal) { imagenPrincipal.src = src || placeholder; imagenPrincipal.alt = `Fotografía de ${producto.titulo}`; }
    if (listaMiniaturas) listaMiniaturas.querySelectorAll('.thumb').forEach(b => b.classList.toggle('active', b === botonActivo));
  }
  if (imagenPrincipal) imagenPrincipal.onerror = () => { imagenPrincipal.src = placeholder; };
  if (listaMiniaturas) {
    listaMiniaturas.replaceChildren();
    imagenes.forEach((src, indice) => {
      const boton = document.createElement('button'); boton.type = 'button'; boton.className = `thumb${indice === 0 ? ' active' : ''}`;
      boton.setAttribute('aria-label', `Ver fotografía ${indice + 1}`);
      const img = document.createElement('img'); img.src = src || placeholder; img.alt = `Fotografía ${indice + 1} de ${producto.titulo}`;
      img.onerror = () => { img.src = placeholder; };
      boton.appendChild(img); boton.addEventListener('click', () => seleccionarImagen(src, boton)); listaMiniaturas.appendChild(boton);
    });
  }
  seleccionarImagen(imagenes[0], listaMiniaturas?.querySelector('.thumb'));

  // Datos reales del vendedor y reputación compartida con Mi Perfil.
  texto('#detalle-vendedor-nombre', producto.vendedorNombre || 'Vendedor JaguarZon');
  texto('#detalle-vendedor-facultad', producto.vendedorFacultad || 'Comunidad UADY');
  const correoVendedor = String(producto.vendedorCorreo || '').toLowerCase();
  const reputacion = ApiAutenticacion.obtenerReputacion(correoVendedor);
  const promedio = reputacion.total ? reputacion.promedio : 0;
  const estrellasTexto = reputacion.total ? `${'★'.repeat(Math.round(promedio))}${'☆'.repeat(5 - Math.round(promedio))}` : '☆☆☆☆☆';
  const estrellasNodo = $('#detalle-vendedor-estrellas');
  if (estrellasNodo) { estrellasNodo.textContent = estrellasTexto; estrellasNodo.setAttribute('aria-label', reputacion.total ? `${promedio.toFixed(1)} de 5 estrellas` : 'Sin calificaciones'); }
  texto('#detalle-vendedor-promedio', reputacion.total ? `${promedio.toFixed(1)} / 5.0` : 'Sin calificaciones');
  const pedidos = JSON.parse(localStorage.getItem('jz_pedidos') || '[]');
  const ventasCompletadas = pedidos.filter(p => String(p.vendedorCorreo || '').toLowerCase() === correoVendedor && p.estado === 'completado').length;
  texto('#detalle-vendedor-ventas', `(${ventasCompletadas} ventas completadas)`);

  // Reseñas: únicamente las que registró ApiAutenticacion tras pedidos completados.
  const listaResenas = $('#lista-resenas-producto');
  const avisoResenas = $('#resenas-sin-resultados');
  if (listaResenas) {
    listaResenas.replaceChildren();
    const resenas = reputacion.resenas.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    if (avisoResenas) avisoResenas.hidden = resenas.length > 0;
    resenas.forEach(r => {
      const item = document.createElement('li'); item.className = 'review-item';
      const cabecera = document.createElement('header');
      const autor = document.createElement('strong'); autor.textContent = r.compradorNombre || 'Comprador UADY';
      const estrellas = document.createElement('span'); estrellas.textContent = `${'★'.repeat(Number(r.estrellas || 0))}${'☆'.repeat(5 - Number(r.estrellas || 0))}`; estrellas.setAttribute('aria-label', `${Number(r.estrellas || 0)} de 5 estrellas`);
      const fecha = document.createElement('time');
      if (r.fecha) { const date = new Date(r.fecha); if (!Number.isNaN(date.getTime())) { fecha.dateTime = date.toISOString(); fecha.textContent = date.toLocaleDateString('es-MX'); } }
      cabecera.append(autor, estrellas, fecha);
      const comentario = document.createElement('p'); comentario.textContent = r.comentario || 'Sin comentario.';
      item.append(cabecera, comentario); listaResenas.appendChild(item);
    });
  }

  const puntos = Array.isArray(producto.puntosEntrega) && producto.puntosEntrega.length ? producto.puntosEntrega : (producto.entregaTexto ? [producto.entregaTexto] : []);
  const horarios = Array.isArray(producto.horariosEntrega) ? producto.horariosEntrega : [];
  function poblarSelect(select, opciones, textoVacio) {
    if (!select) return;
    select.replaceChildren();
    if (!opciones.length) { const option = document.createElement('option'); option.value = ''; option.textContent = textoVacio; select.appendChild(option); select.disabled = true; return; }
    opciones.forEach(valor => { const option = document.createElement('option'); option.value = valor; option.textContent = valor; select.appendChild(option); });
    select.disabled = false;
  }
  poblarSelect($('#punto-entrega-select'), puntos, 'El vendedor aún no especifica un punto');
  poblarSelect($('#horario-entrega-select'), horarios, 'Horario por acordar');

  const esSubasta = producto.modalidad === 'subasta';
  const bloqueFijo = $('#bloque-precio-fijo'); const bloqueSubasta = $('#bloque-subasta');
  if (bloqueFijo) bloqueFijo.hidden = esSubasta;
  if (bloqueSubasta) bloqueSubasta.hidden = !esSubasta;
  const cantidad = $('#cantidad-compra');
  if (cantidad) { cantidad.max = String(Math.max(1, Number(producto.stock || 0))); cantidad.value = '1'; cantidad.disabled = Number(producto.stock || 0) < 1; }
  if (Number(producto.stock || 0) < 1 && formulario) formulario.hidden = true;

  const sesion = ApiAutenticacion.obtenerSesion();
  const esVendedor = sesion && String(sesion.correo || '').toLowerCase() === correoVendedor;
  if (formulario && esVendedor) {
    formulario.hidden = true;
    const aviso = document.createElement('p'); aviso.className = 'payment-notice'; aviso.textContent = 'Esta es tu publicación. No puedes comprar ni pujar por tu propio producto.';
    formulario.parentElement.insertBefore(aviso, formulario);
  }

  const botonFavorito = $('#btn-guardar-favorito');
  function actualizarFavorito() {
    if (!botonFavorito) return;
    const activo = ApiProductos.esFavorito(producto.id);
    botonFavorito.textContent = activo ? '♥ Guardado en favoritos' : '♡ Guardar en favoritos';
    botonFavorito.setAttribute('aria-pressed', String(activo));
    botonFavorito.setAttribute('aria-label', activo ? 'Quitar de favoritos' : 'Guardar en favoritos');
  }
  if (botonFavorito) {
    actualizarFavorito();
    botonFavorito.addEventListener('click', () => {
      if (!ApiAutenticacion.obtenerSesion()) {
        window.alert('Inicia sesión para guardar publicaciones en favoritos.');
        window.location.href = 'login.html';
        return;
      }
      ApiProductos.alternarFavorito(producto.id);
      actualizarFavorito();
    });
  }

  if (formulario && !esSubasta) formulario.addEventListener('submit', evento => {
    evento.preventDefault();
    const resultado = ApiProductos.registrarPedido(producto.id, Number(cantidad?.value || 1), $('#punto-entrega-select')?.value || '', $('#horario-entrega-select')?.value || '');
    if (!resultado.exito) { window.alert(resultado.mensaje); return; }
    texto('#detalle-stock', resultado.stockRestante > 0 ? `Disponible: ${resultado.stockRestante} unidades` : 'Agotado');
    if (cantidad) { cantidad.max = String(Math.max(1, resultado.stockRestante)); if (resultado.stockRestante === 0) formulario.hidden = true; }
    if (modal?.showModal) modal.showModal(); else window.alert('Tu solicitud quedó registrada como pendiente de entrega.');
  });

  const botonPujar = $('#btn-pujar');
  if (botonPujar) {
    const inputPuja = $('#monto-puja'); const textoPuja = $('#texto-puja');
    const minimo = Number(producto.precio || 0) + 10;
    if (inputPuja) { inputPuja.min = String(minimo); inputPuja.placeholder = `Oferta mínima: ${moneda(minimo)}`; }
    if (textoPuja) textoPuja.textContent = `Puja mínima siguiente: ${moneda(minimo)} · Cierre: ${producto.cierreSubasta || 'según lo acordado'}`;
    botonPujar.addEventListener('click', () => {
      const resultado = ApiProductos.registrarPuja(producto.id, Number(inputPuja?.value));
      if (!resultado.exito) { window.alert(resultado.mensaje); return; }
      texto('#detalle-precio', `Puja actual: ${moneda(resultado.nuevoPrecio)}`);
      if (inputPuja) { inputPuja.value = ''; inputPuja.min = String(resultado.nuevoPrecio + 10); }
      if (textoPuja) textoPuja.textContent = `Puja mínima siguiente: ${moneda(resultado.nuevoPrecio + 10)} · Cierre: ${producto.cierreSubasta || 'según lo acordado'}`;
      window.alert('Tu puja se registró correctamente.');
    });
  }

  const cerrarModal = $('#btn-cerrar-modal'); if (cerrarModal && modal) cerrarModal.addEventListener('click', () => modal.close());
  const enlaceChat = $('.secondary-actions a[href^="mensajes.html"]');
  if (enlaceChat) enlaceChat.href = `mensajes.html?producto=${encodeURIComponent(producto.id)}&vendedor=${encodeURIComponent(correoVendedor)}`;
  const enlaceChatModal = modal?.querySelector('a[href^="mensajes.html"]');
  if (enlaceChatModal) enlaceChatModal.href = `mensajes.html?producto=${encodeURIComponent(producto.id)}`;
});
