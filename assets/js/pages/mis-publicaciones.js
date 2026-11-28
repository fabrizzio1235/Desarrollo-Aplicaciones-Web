'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const lista = document.getElementById('lista-mis-publicaciones');
  const tablaPedidos = document.getElementById('tabla-pedidos-vendedor');

  if (!lista || !tablaPedidos) return;

  const moneda = valor =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(Number(valor || 0));

  const crear = (tag, clase, texto) => {
    const nodo = document.createElement(tag);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  };

  function validarRespuesta(respuesta) {
    if (!respuesta.ok) {
      throw new Error(
        respuesta.mensaje || 'No se pudo completar la solicitud.'
      );
    }

    return respuesta.datos || {};
  }

  // ----------------------------------------
  // PUBLICACIONES DEL VENDEDOR
  // ----------------------------------------

  async function cargarPublicaciones() {
    lista.replaceChildren(
      crear('p', '', 'Cargando tus publicaciones...')
    );

    try {
      const respuesta = await window.jzProductos.filtrarCatalogo({
        mias: true
      });

      const datos = validarRespuesta(respuesta);
      const productos = datos.productos || [];

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
          imagen.src = '../assets/images/image-placeholder.jpg';
        };

        const info = crear('div', 'listing-info');

        const titulo = crear('h3');
        const enlace = crear('a', '', producto.titulo);
        enlace.href = `detalle-producto.php?id=${encodeURIComponent(producto.id)}`;
        titulo.appendChild(enlace);

        info.append(
          titulo,
          crear(
            'p',
            '',
            `Modalidad: ${producto.modalidad === 'subasta' ? 'Subasta' : 'Precio fijo'}`
          ),
          crear('p', '', `Precio: ${moneda(producto.precio)}`),
          crear(
            'p',
            '',
            `Stock: ${producto.stock} · Estado: ${producto.estado}`
          ),
          crear(
            'p',
            '',
            `Entrega en: ${producto.entregaTexto || 'Por definir'}`
          )
        );

        const acciones = crear('div', 'listing-actions');

        const ver = crear('a', 'btn btn-secondary btn-sm', 'Ver detalle');
        ver.href = enlace.href;

        const editar = crear('a', 'btn btn-outline btn-sm', 'Editar');
        editar.href = `publicar-producto.php?editar=${encodeURIComponent(producto.id)}`;

        const eliminar = crear('button', 'btn btn-danger btn-sm', 'Eliminar');
        eliminar.type = 'button';
        eliminar.addEventListener('click', () => eliminarPublicacion(producto.id));

        acciones.append(ver, editar, eliminar);
        articulo.append(imagen, info, acciones);
        lista.appendChild(articulo);
      });

    } catch (error) {
      lista.replaceChildren(
        crear('p', 'alerta-error', error.message)
      );
    }
  }

  async function eliminarPublicacion(idProducto) {
    if (!window.confirm('¿Seguro que deseas eliminar esta publicación?')) {
      return;
    }

    try {
      const respuesta = await window.jzProductos.eliminarProducto(idProducto);
      validarRespuesta(respuesta);

      await cargarPublicaciones();

    } catch (error) {
      window.alert(error.message || 'No se pudo eliminar la publicación.');
    }
  }

  // ----------------------------------------
  // PEDIDOS RECIBIDOS POR EL VENDEDOR
  // ----------------------------------------

  async function cargarPedidosVendedor() {
    tablaPedidos.replaceChildren();

    const cargando = crear('tr');
    const celdaCargando = crear('td', '', 'Cargando pedidos...');
    celdaCargando.colSpan = 6;
    cargando.appendChild(celdaCargando);
    tablaPedidos.appendChild(cargando);

    try {
      const datos = await window.jzPedidos.listar('vendedor');
      const pedidos = datos.pedidos || [];

      tablaPedidos.replaceChildren();

      if (pedidos.length === 0) {
        const fila = crear('tr');
        const celda = crear(
          'td',
          '',
          'Todavía no has recibido pedidos de tus publicaciones.'
        );
        celda.colSpan = 6;
        fila.appendChild(celda);
        tablaPedidos.appendChild(fila);
        return;
      }

      pedidos.forEach(pedido => {
        const fila = crear('tr');
        fila.dataset.pedidoId = pedido.idPedido;
        fila.dataset.estado = pedido.estado;

        const articulo = crear(
          'td',
          '',
          `${pedido.tituloProducto || 'Producto'} (x${pedido.cantidad || 1})`
        );

        const comprador = crear(
          'td',
          '',
          pedido.compradorCorreo || pedido.compradorNombre || 'Comprador'
        );

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

        estado.appendChild(
          crear(
            'span',
            `status-badge status-${pedido.estado || 'pendiente'}`,
            textoEstado
          )
        );

        const acciones = crear('td', 'table-actions');

        if (pedido.estado === 'pendiente') {
          const completar = crear(
            'button',
            'btn btn-success btn-sm',
            'Marcar entregado'
          );
          completar.type = 'button';
          completar.addEventListener('click', () => {
            cambiarEstado(pedido.idPedido, 'completado');
          });

          const cancelar = crear(
            'button',
            'btn btn-danger btn-sm',
            'Cancelar'
          );
          cancelar.type = 'button';
          cancelar.addEventListener('click', () => {
            cambiarEstado(pedido.idPedido, 'cancelado');
          });

          acciones.append(completar, cancelar);
        } else {
          acciones.textContent = 'Transacción cerrada';
        }

        fila.append(articulo, comprador, entrega, total, estado, acciones);
        tablaPedidos.appendChild(fila);
      });

    } catch (error) {
      tablaPedidos.replaceChildren();

      const fila = crear('tr');
      const celda = crear(
        'td',
        'alerta-error',
        error.message || 'No se pudieron cargar los pedidos.'
      );
      celda.colSpan = 6;

      fila.appendChild(celda);
      tablaPedidos.appendChild(fila);
    }
  }

  async function cambiarEstado(idPedido, estado) {
    const confirmacion = estado === 'cancelado'
      ? '¿Deseas cancelar este pedido? El stock se devolverá a la publicación.'
      : '¿Confirmas que el producto ya fue entregado?';

    if (!window.confirm(confirmacion)) return;

    try {
      const respuesta = await window.jzPedidos.actualizarEstado(
        Number(idPedido),
        estado
      );

      window.alert(respuesta.mensaje || 'Estado actualizado correctamente.');

      await Promise.all([
        cargarPedidosVendedor(),
        cargarPublicaciones()
      ]);

    } catch (error) {
      window.alert(error.message || 'No se pudo actualizar el pedido.');
    }
  }

  // Carga inicial del panel.
  if (!window.jzProductos || !window.jzPedidos) {
    window.alert('No se pudieron cargar los servicios de la aplicación.');
    return;
  }

  await Promise.all([
    cargarPublicaciones(),
    cargarPedidosVendedor()
  ]);
});