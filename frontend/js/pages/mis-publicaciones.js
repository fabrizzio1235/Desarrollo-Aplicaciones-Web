document.addEventListener('DOMContentLoaded', () => {
  const sesion = ApiAutenticacion.obtenerSesion();
  const lista = document.getElementById('lista-mis-publicaciones');
  const tablaPedidos = document.getElementById('tabla-pedidos-vendedor');

  if (!sesion || !lista || !tablaPedidos) return;

  const correoActual = String(sesion.correo || '').toLowerCase();
  const moneda = valor => `$${Number(valor || 0).toFixed(2)} MXN`;
  const fecha = valor => {
    if (!valor) return 'Sin fecha';
    const date = new Date(valor);
    return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString('es-MX');
  };
  const crear = (tag, clase, texto) => {
    const nodo = document.createElement(tag);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  };

  function mostrarPublicaciones() {
    const productos = ApiProductos.obtenerTodosLosProductos()
      .filter(p => String(p.vendedorCorreo || '').toLowerCase() === correoActual)
      .sort((a, b) => Number(b.fechaCreacion || 0) - Number(a.fechaCreacion || 0));

    lista.replaceChildren();
    if (!productos.length) {
      lista.appendChild(crear('p', 'empty-state', 'Todavía no tienes publicaciones. Cuando publiques un producto aparecerá aquí.'));
      return;
    }

    productos.forEach(producto => {
      const articulo = crear('article', 'listing-row');
      articulo.dataset.productoId = producto.id;
      const imagen = crear('img');
      imagen.src = producto.imagen || '../assets/images/image-placeholder.jpg';
      imagen.alt = `Imagen de ${producto.titulo}`;
      imagen.onerror = () => { imagen.src = '../assets/images/image-placeholder.jpg'; };

      const info = crear('div', 'listing-info');
      const titulo = crear('h3');
      const enlace = crear('a', '', producto.titulo);
      enlace.href = `detalle-producto.html?id=${encodeURIComponent(producto.id)}`;
      titulo.appendChild(enlace);
      const modalidad = producto.modalidad === 'subasta' ? 'Subasta' : 'Precio fijo';
      info.append(titulo,
        crear('p', '', `Modalidad: ${modalidad} (${moneda(producto.precio)}) · Stock restante: ${Number(producto.stock || 0)}`),
        crear('p', '', `Entrega en: ${producto.entregaTexto || (producto.campus || []).join(', ') || 'Por definir'}`),
        crear('p', '', `Publicado: ${fecha(producto.fechaCreacion)}`));

      const acciones = crear('div', 'listing-actions');
      const ver = crear('a', 'btn btn-secondary btn-sm', 'Ver detalle');
      ver.href = enlace.href;
      acciones.appendChild(ver);
      articulo.append(imagen, info, acciones);
      lista.appendChild(articulo);
    });
  }

  function mostrarPedidos() {
    const pedidos = JSON.parse(localStorage.getItem('jz_pedidos') || '[]')
      .filter(p => String(p.vendedorCorreo || '').toLowerCase() === correoActual)
      .sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0));

    tablaPedidos.replaceChildren();
    if (!pedidos.length) {
      const fila = crear('tr');
      const celda = crear('td', '', 'Todavía no has recibido pedidos de tus publicaciones.');
      celda.colSpan = 6;
      fila.appendChild(celda);
      tablaPedidos.appendChild(fila);
      return;
    }

    pedidos.forEach(pedido => {
      const fila = crear('tr');
      fila.dataset.pedidoId = pedido.idPedido;
      fila.dataset.estado = pedido.estado;
      const articulo = crear('td', '', `${pedido.tituloProducto || 'Producto'} (x${pedido.cantidad || 1})`);
      const comprador = crear('td', '', pedido.compradorCorreo || 'Comprador');
      const entrega = crear('td', '', `${pedido.puntoEntrega || 'Por acordar'} · ${pedido.horarioEntrega || 'Horario por acordar'}`);
      const total = crear('td', '', moneda(pedido.total));
      const estado = crear('td');
      const etiqueta = crear('span', `status-badge status-${pedido.estado || 'pendiente'}`,
        pedido.estado === 'completado' ? 'Entregado / Completado' : pedido.estado === 'cancelado' ? 'Cancelado' : 'Pendiente de entrega');
      estado.appendChild(etiqueta);
      const acciones = crear('td', 'table-actions');
      if (pedido.estado === 'pendiente') {
        const completar = crear('button', 'btn btn-success btn-sm', 'Marcar entregado');
        completar.type = 'button';
        completar.dataset.action = 'completar';
        completar.addEventListener('click', () => cambiarEstado(pedido.idPedido, 'completado'));
        const cancelar = crear('button', 'btn btn-danger btn-sm', 'Cancelar');
        cancelar.type = 'button';
        cancelar.dataset.action = 'cancelar';
        cancelar.addEventListener('click', () => cambiarEstado(pedido.idPedido, 'cancelado'));
        const chat = crear('a', 'btn btn-secondary btn-sm', 'Chat');
        chat.href = `mensajes.html?pedido=${encodeURIComponent(pedido.idPedido)}`;
        acciones.append(completar, cancelar, chat);
      } else {
        acciones.textContent = 'Transacción cerrada';
      }
      fila.append(articulo, comprador, entrega, total, estado, acciones);
      tablaPedidos.appendChild(fila);
    });
  }

  function cambiarEstado(idPedido, estado) {
    const confirmacion = estado === 'cancelado'
      ? '¿Deseas cancelar este pedido? El stock se devolverá a la publicación.'
      : '¿Confirmas que el producto ya fue entregado?';
    if (!window.confirm(confirmacion)) return;
    const resultado = ApiProductos.actualizarEstadoPedido(idPedido, estado);
    if (!resultado.exito) {
      window.alert(resultado.mensaje);
      return;
    }
    mostrarPedidos();
    mostrarPublicaciones();
  }

  mostrarPublicaciones();
  mostrarPedidos();
});
