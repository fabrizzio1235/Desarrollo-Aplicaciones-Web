'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const lista = document.getElementById('lista-mis-publicaciones');
  const tablaPedidos = document.getElementById('tabla-pedidos-vendedor');

  if (!lista || !tablaPedidos) return;

  const moneda = valor => `$${Number(valor || 0).toFixed(2)} MXN`;

  const parsearFecha = valor => {
    if (!valor) return null;
    const fecha = new Date(String(valor).replace(' ', 'T'));
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  };

  const formatoFecha = valor => {
    const fecha = parsearFecha(valor);
    return fecha ? fecha.toLocaleDateString('es-MX') : 'Sin fecha';
  };

  const formatoFechaHora = valor => {
    const fecha = parsearFecha(valor);
    return fecha
      ? fecha.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
      : 'sin fecha';
  };

  const crear = (tag, clase, texto) => {
    const nodo = document.createElement(tag);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  };

  async function cargarPublicaciones() {
    lista.replaceChildren(crear('p', '', 'Cargando tus publicaciones...'));

    const respuesta = await window.jzProductos.filtrarCatalogo({ mias: true });
    if (!respuesta.ok) {
      lista.replaceChildren(
        crear('p', 'feedback-msg', respuesta.mensaje || 'No se pudieron cargar tus publicaciones.')
      );
      return;
    }

    const productos = Array.isArray(respuesta.datos?.productos)
      ? respuesta.datos.productos
      : [];

    lista.replaceChildren();

    if (productos.length === 0) {
      lista.appendChild(
        crear(
          'p',
          'empty-state',
          'Todavía no tienes publicaciones. Cuando publiques un producto aparecerá aquí.'
        )
      );
      return;
    }

    productos.forEach(producto => {
      const articulo = crear('article', 'listing-row');
      articulo.dataset.productoId = producto.id;

      const imagen = crear('img');
      imagen.src = producto.imagen || '../assets/images/image-placeholder.jpg';
      imagen.alt = `Imagen de ${producto.titulo}`;
      imagen.onerror = () => {
        imagen.onerror = null;
        imagen.src = '../assets/images/image-placeholder.jpg';
      };

      const info = crear('div', 'listing-info');

      const titulo = crear('h3');
      const enlace = crear('a', '', producto.titulo);
      enlace.href = `detalle-producto.php?id=${encodeURIComponent(producto.id)}`;
      titulo.appendChild(enlace);

      const esSubasta = producto.modalidad === 'subasta';
      const subastaCerrada = esSubasta && producto.estado !== 'activa';
      const detalleModalidad = esSubasta
        ? `Subasta (${moneda(producto.precio)}) · ${subastaCerrada ? `Cerrada (${producto.estado})` : `Cierra ${formatoFechaHora(producto.cierreSubasta)}`} · ${Number(producto.totalPujas || 0)} pujas`
        : `Precio fijo (${moneda(producto.precio)}) · Stock restante: ${Number(producto.stock || 0)} (${producto.estado})`;

      info.append(
        titulo,
        crear('p', '', `Modalidad: ${detalleModalidad}`),
        crear('p', '', `Entrega en: ${producto.entregaTexto || 'Por definir'}`),
        crear('p', '', `Publicado: ${formatoFecha(producto.fechaCreacion)}`)
      );

      const acciones = crear('div', 'listing-actions');

      const ver = crear('a', 'btn btn-secondary btn-sm', 'Ver detalle');
      ver.href = enlace.href;
      acciones.appendChild(ver);

      if (!subastaCerrada) {
        const editar = crear('a', 'btn btn-outline btn-sm', 'Editar');
        editar.href = `publicar-producto.php?editar=${encodeURIComponent(producto.id)}`;
        acciones.appendChild(editar);
      }

      const eliminar = crear('button', 'btn btn-danger btn-sm', 'Eliminar');
      eliminar.type = 'button';
      eliminar.addEventListener('click', () => eliminarPublicacion(producto));
      acciones.appendChild(eliminar);

      articulo.append(imagen, info, acciones);
      lista.appendChild(articulo);
    });
  }

  async function eliminarPublicacion(producto) {
    if (!window.confirm(`¿Eliminar la publicación "${producto.titulo}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    const respuesta = await window.jzProductos.eliminarProducto(Number(producto.id));
    if (!respuesta.ok) {
      window.alert(respuesta.mensaje || 'No se pudo eliminar la publicación.');
      return;
    }

    await cargarPublicaciones();
  }

  async function cargarPedidosVendedor() {
    tablaPedidos.replaceChildren();
    const filaCarga = crear('tr');
    const celdaCarga = crear('td', '', 'Cargando pedidos...');
    celdaCarga.colSpan = 6;
    filaCarga.appendChild(celdaCarga);
    tablaPedidos.appendChild(filaCarga);

    const respuesta = await window.jzPedidos.listar('vendedor');
    if (!respuesta.ok) {
      tablaPedidos.replaceChildren();
      const filaErr = crear('tr');
      const celdaErr = crear('td', 'feedback-msg', respuesta.mensaje || 'No se pudieron cargar los pedidos.');
      celdaErr.colSpan = 6;
      filaErr.appendChild(celdaErr);
      tablaPedidos.appendChild(filaErr);
      return;
    }

    const pedidos = Array.isArray(respuesta.datos?.pedidos)
      ? respuesta.datos.pedidos
      : [];

    tablaPedidos.replaceChildren();

    if (pedidos.length === 0) {
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
      const comprador = crear('td', '', pedido.compradorCorreo || pedido.compradorNombre || 'Comprador');
      const entrega = crear(
        'td',
        '',
        `${pedido.puntoEntrega || 'Por acordar'} · ${pedido.horarioEntrega || 'Horario por acordar'}`
      );
      const total = crear('td', '', moneda(pedido.total));

      const estado = crear('td');
      const textoEstado = pedido.estado === 'completado'
        ? 'Entregado / Completado'
        : pedido.estado === 'cancelado'
          ? 'Cancelado'
          : 'Pendiente de entrega';
      estado.appendChild(crear('span', `status-badge status-${pedido.estado || 'pendiente'}`, textoEstado));

      const acciones = crear('td', 'table-actions');
      if (pedido.estado === 'pendiente') {
        const completar = crear('button', 'btn btn-success btn-sm', 'Marcar entregado');
        completar.type = 'button';
        completar.addEventListener('click', () => cambiarEstado(pedido.idPedido, 'completado'));

        const cancelar = crear('button', 'btn btn-danger btn-sm', 'Cancelar');
        cancelar.type = 'button';
        cancelar.addEventListener('click', () => cambiarEstado(pedido.idPedido, 'cancelado'));

        const chat = crear('a', 'btn btn-secondary btn-sm', 'Chat');
        chat.href = `mensajes.php?pedido=${encodeURIComponent(pedido.idPedido)}`;

        acciones.append(completar, cancelar, chat);
      } else {
        acciones.textContent = 'Transacción cerrada';
      }

      fila.append(articulo, comprador, entrega, total, estado, acciones);
      tablaPedidos.appendChild(fila);
    });
  }

  async function cambiarEstado(idPedido, estado) {
    const confirmacion = estado === 'cancelado'
      ? '¿Deseas cancelar este pedido? El stock se devolverá a la publicación.'
      : '¿Confirmas que el producto ya fue entregado?';

    if (!window.confirm(confirmacion)) return;

    const respuesta = await window.jzPedidos.actualizarEstado(Number(idPedido), estado);
    if (!respuesta.ok) {
      window.alert(respuesta.mensaje || 'No se pudo actualizar el pedido.');
      return;
    }

    window.alert(respuesta.mensaje || 'Estado actualizado correctamente.');
    await Promise.all([cargarPedidosVendedor(), cargarPublicaciones()]);
  }

  if (!window.jzProductos || !window.jzPedidos) {
    lista.replaceChildren(crear('p', 'feedback-msg', 'No se pudieron cargar los servicios de la aplicación.'));
    return;
  }

  await Promise.all([cargarPublicaciones(), cargarPedidosVendedor()]);
});