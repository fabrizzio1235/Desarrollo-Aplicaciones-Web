'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById('detalle-articulo');
  if (!contenedor) return;

  const parametros = new URLSearchParams(window.location.search);
  const idProducto = parametros.get('id');
  const formulario = document.getElementById('form-solicitud-compra');
  const modal = document.getElementById('modal-confirmacion-pedido');

  const $ = selector => document.querySelector(selector);
  const moneda = valor => `$${Number(valor || 0).toFixed(2)} MXN`;
  const texto = (selector, valor) => {
    const nodo = $(selector);
    if (nodo) nodo.textContent = valor;
    return nodo;
  };
  const placeholder = '../assets/images/image-placeholder.jpg';

  // Obtener producto
  let producto = null;

  try {
    if (!idProducto) throw new Error('No se especificó un producto.');

    const respuesta = await window.jzProductos.obtenerPorId(idProducto);

    if (respuesta.ok && respuesta.datos?.producto) {
      producto = respuesta.datos.producto;
    } else {
      throw new Error(respuesta.mensaje || 'No se encontró el producto.');
    }
  } catch (error) {
    console.error('Error al obtener el producto:', error);
  }

  if (!producto) {
    contenedor.replaceChildren();

    const aviso = document.createElement('section');
    aviso.className = 'empty-state';

    const titulo = document.createElement('h1');
    titulo.textContent = 'Producto no encontrado';

    const mensaje = document.createElement('p');
    mensaje.textContent = 'La publicación pudo haber sido eliminada o el enlace no es válido.';

    const enlace = document.createElement('a');
    enlace.className = 'btn btn-primary';
    enlace.href = 'productos.php';
    enlace.textContent = 'Volver al catálogo';

    aviso.append(titulo, mensaje, enlace);
    contenedor.appendChild(aviso);

    if (formulario) formulario.hidden = true;
    const resenas = $('.reviews-section');
    if (resenas) resenas.hidden = true;
    return;
  }

  // Información del producto
  contenedor.dataset.productoId = producto.id;
  document.title = `${producto.titulo} | JaguarZon UADY`;

  texto('#detalle-titulo', producto.titulo);
  texto('#breadcrumb-producto', producto.titulo);

  const categoria = producto.categoriaNombre || producto.categoria || 'Productos';
  const linkCategoria = $('#breadcrumb-categoria');

  if (linkCategoria) {
    linkCategoria.textContent = categoria;
    linkCategoria.href = `productos.php?categoria=${encodeURIComponent(producto.categoria || '')}`;
  }

  texto(
    '#detalle-precio',
    producto.modalidad === 'subasta'
      ? `Puja actual: ${moneda(producto.precio)}`
      : moneda(producto.precio)
  );

  texto(
    '#detalle-stock',
    Number(producto.stock || 0) > 0
      ? `Disponible: ${Number(producto.stock)} unidades`
      : 'Agotado'
  );

  texto('#detalle-modalidad', producto.modalidad === 'subasta' ? 'Subasta' : 'Precio fijo');
  texto('#detalle-descripcion', producto.descripcion || 'El vendedor no agregó una descripción.');

  // Galería de imágenes
  const imagenes = (
    Array.isArray(producto.imagenes) && producto.imagenes.length
      ? producto.imagenes
      : [producto.imagen || placeholder]
  ).slice(0, 4);

  const imagenPrincipal = $('#img-principal');
  const listaMiniaturas = $('#lista-miniaturas');

  function seleccionarImagen(src, botonActivo) {
    if (imagenPrincipal) {
      imagenPrincipal.src = src || placeholder;
      imagenPrincipal.alt = `Fotografía de ${producto.titulo}`;
    }

    if (listaMiniaturas) {
      listaMiniaturas.querySelectorAll('.thumb').forEach(boton => {
        boton.classList.toggle('active', boton === botonActivo);
      });
    }
  }

  if (imagenPrincipal) {
    imagenPrincipal.onerror = () => {
      imagenPrincipal.src = placeholder;
    };
  }

  if (listaMiniaturas) {
    listaMiniaturas.replaceChildren();

    imagenes.forEach((src, indice) => {
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = `thumb${indice === 0 ? ' active' : ''}`;
      boton.setAttribute('aria-label', `Ver fotografía ${indice + 1}`);

      const img = document.createElement('img');
      img.src = src || placeholder;
      img.alt = `Fotografía ${indice + 1} de ${producto.titulo}`;
      img.onerror = () => {
        img.src = placeholder;
      };

      boton.appendChild(img);
      boton.addEventListener('click', () => seleccionarImagen(src, boton));
      listaMiniaturas.appendChild(boton);
    });
  }

  seleccionarImagen(imagenes[0], listaMiniaturas?.querySelector('.thumb'));

  // Información del vendedor
  texto('#detalle-vendedor-nombre', producto.vendedorNombre || 'Vendedor JaguarZon');
  texto('#detalle-vendedor-facultad', producto.vendedorFacultad || 'Comunidad UADY');

  const correoVendedor = String(producto.vendedorCorreo || '').toLowerCase();

  let reputacion = { total: 0, promedio: 0, resenas: [] };

  if (window.ApiAutenticacion?.obtenerReputacion) {
    reputacion = ApiAutenticacion.obtenerReputacion(correoVendedor);
  }

  const promedio = reputacion.total ? reputacion.promedio : 0;
  const estrellasTexto = reputacion.total
    ? `${'★'.repeat(Math.round(promedio))}${'☆'.repeat(5 - Math.round(promedio))}`
    : '☆☆☆☆☆';

  const estrellasNodo = $('#detalle-vendedor-estrellas');

  if (estrellasNodo) {
    estrellasNodo.textContent = estrellasTexto;
    estrellasNodo.setAttribute(
      'aria-label',
      reputacion.total ? `${promedio.toFixed(1)} de 5 estrellas` : 'Sin calificaciones'
    );
  }

  texto(
    '#detalle-vendedor-promedio',
    reputacion.total ? `${promedio.toFixed(1)} / 5.0` : 'Sin calificaciones'
  );

  texto(
    '#detalle-vendedor-ventas',
    `(${Number(producto.vendedorVentas || 0)} ventas completadas)`
  );

  // Reseñas
  const listaResenas = $('#lista-resenas-producto');
  const avisoResenas = $('#resenas-sin-resultados');

  if (listaResenas) {
    listaResenas.replaceChildren();

    const resenas = Array.isArray(reputacion.resenas)
      ? reputacion.resenas.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      : [];

    if (avisoResenas) avisoResenas.hidden = resenas.length > 0;

    resenas.forEach(resena => {
      const item = document.createElement('li');
      item.className = 'review-item';

      const cabecera = document.createElement('header');

      const autor = document.createElement('strong');
      autor.textContent = resena.compradorNombre || 'Comprador UADY';

      const estrellas = document.createElement('span');
      const puntuacion = Math.min(5, Math.max(0, Number(resena.estrellas || 0)));

      estrellas.textContent = `${'★'.repeat(puntuacion)}${'☆'.repeat(5 - puntuacion)}`;
      estrellas.setAttribute('aria-label', `${puntuacion} de 5 estrellas`);

      const fecha = document.createElement('time');

      if (resena.fecha) {
        const date = new Date(resena.fecha);

        if (!Number.isNaN(date.getTime())) {
          fecha.dateTime = date.toISOString();
          fecha.textContent = date.toLocaleDateString('es-MX');
        }
      }

      cabecera.append(autor, estrellas, fecha);

      const comentario = document.createElement('p');
      comentario.textContent = resena.comentario || 'Sin comentario.';

      item.append(cabecera, comentario);
      listaResenas.appendChild(item);
    });
  }

  // Opciones de entrega
  const puntos = Array.isArray(producto.puntosEntrega) && producto.puntosEntrega.length
    ? producto.puntosEntrega
    : (producto.entregaTexto ? [producto.entregaTexto] : []);

  const horarios = Array.isArray(producto.horariosEntrega)
    ? producto.horariosEntrega
    : [];

  function poblarSelect(select, opciones, textoVacio) {
    if (!select) return;

    select.replaceChildren();

    if (!opciones.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = textoVacio;
      select.appendChild(option);
      select.disabled = true;
      return;
    }

    opciones.forEach(valor => {
      const option = document.createElement('option');
      option.value = valor;
      option.textContent = valor;
      select.appendChild(option);
    });

    select.disabled = false;
  }

  poblarSelect($('#punto-entrega-select'), puntos, 'El vendedor aún no especifica un punto');
  poblarSelect($('#horario-entrega-select'), horarios, 'Horario por acordar');

  // Modalidad y disponibilidad
  const esSubasta = producto.modalidad === 'subasta';
  const bloqueFijo = $('#bloque-precio-fijo');
  const bloqueSubasta = $('#bloque-subasta');

  if (bloqueFijo) bloqueFijo.hidden = esSubasta;
  if (bloqueSubasta) bloqueSubasta.hidden = !esSubasta;

  const cantidad = $('#cantidad-compra');
  const stockInicial = Number(producto.stock || 0);

  if (cantidad) {
    cantidad.max = String(Math.max(1, stockInicial));
    cantidad.value = '1';
    cantidad.disabled = stockInicial < 1;
  }

  if (stockInicial < 1 && formulario && !esSubasta) {
    formulario.hidden = true;
  }

  // Validar sesión y propietario
  const sesion = ApiAutenticacion.obtenerSesion();
  const esVendedor = sesion &&
    String(sesion.correo || '').toLowerCase() === correoVendedor;

  if (formulario && esVendedor) {
    formulario.hidden = true;

    const aviso = document.createElement('p');
    aviso.className = 'payment-notice';
    aviso.textContent = 'Esta es tu publicación. No puedes comprar ni pujar por tu propio producto.';

    formulario.parentElement.insertBefore(aviso, formulario);
  }

  // Favoritos
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
        window.location.href = 'login.php';
        return;
      }

      ApiProductos.alternarFavorito(producto.id);
      actualizarFavorito();
    });
  }

  // Registrar pedido
  if (formulario && !esSubasta) {
    formulario.addEventListener('submit', async evento => {
      evento.preventDefault();

      const botonCompra = formulario.querySelector('button[type="submit"]');

      const datosPedido = {
        producto_id: Number(producto.id),
        cantidad: Number(cantidad?.value || 1),
        punto_entrega: $('#punto-entrega-select')?.value || '',
        horario_entrega: $('#horario-entrega-select')?.value || ''
      };

      if (!Number.isInteger(datosPedido.cantidad) || datosPedido.cantidad < 1) {
        window.alert('La cantidad debe ser al menos una unidad.');
        return;
      }

      try {
        if (botonCompra) {
          botonCompra.disabled = true;
          botonCompra.textContent = 'Procesando compra...';
        }

        const resultado = await window.jzPedidos.crearPedido(datosPedido);
        console.log('Pedido registrado:', resultado);

        const respuestaProducto = await window.jzProductos.obtenerPorId(producto.id);

        if (respuestaProducto.ok && respuestaProducto.datos?.producto) {
          producto = respuestaProducto.datos.producto;
          const stockActual = Number(producto.stock || 0);

          texto(
            '#detalle-stock',
            stockActual > 0 ? `Disponible: ${stockActual} unidades` : 'Agotado'
          );

          if (cantidad) {
            cantidad.max = String(Math.max(1, stockActual));
            cantidad.disabled = stockActual < 1;
          }

          if (stockActual === 0) formulario.hidden = true;
        }

        if (modal?.showModal) {
          modal.showModal();
        } else {
          window.alert('Tu solicitud de compra fue registrada correctamente.');
        }
      } catch (error) {
        console.error('Error al registrar el pedido:', error);
        window.alert(error.message || 'No se pudo registrar la solicitud de compra.');
      } finally {
        if (botonCompra && !formulario.hidden) {
          botonCompra.disabled = false;
          botonCompra.textContent = 'Solicitar compra a contraentrega';
        }
      }
    });
  }

  // Subastas
  const botonPujar = $('#btn-pujar');

  if (esSubasta && botonPujar) {
    const inputPuja = $('#monto-puja');
    const textoPuja = $('#texto-puja');
    const cuentaRegresiva = $('#cuenta-regresiva');
    const infoPujas = $('#info-pujas');

    let temporizador = null;
    let fechaCierre = new Date(producto.cierreSubasta);

    const dosDigitos = numero => String(numero).padStart(2, '0');

    function formatoTiempoRestante(milisegundos) {
      const totalSegundos = Math.max(0, Math.floor(milisegundos / 1000));
      const dias = Math.floor(totalSegundos / 86400);
      const horas = Math.floor((totalSegundos % 86400) / 3600);
      const minutos = Math.floor((totalSegundos % 3600) / 60);
      const segundos = totalSegundos % 60;
      const prefijoDias = dias > 0 ? `${dias} d ` : '';

      return `${prefijoDias}${dosDigitos(horas)}:${dosDigitos(minutos)}:${dosDigitos(segundos)}`;
    }

    function actualizarReloj() {
      const restante = fechaCierre.getTime() - Date.now();

      if (restante <= 0) {
        pintarSubasta();
        return;
      }

      if (cuentaRegresiva) {
        cuentaRegresiva.textContent = `Cierra en ${formatoTiempoRestante(restante)}`;
      }
    }

    function pintarSubasta() {
      const actual = window.jzProductos.obtenerPorId(producto.id) || producto;
      const pujas = Array.isArray(actual.pujas) ? actual.pujas : [];
      const cerrada = window.jzProductos.subastaCerrada(actual);

      fechaCierre = new Date(actual.cierreSubasta);

      if (infoPujas) {
        if (pujas.length) {
          const lider = pujas[pujas.length - 1];
          infoPujas.textContent = `${pujas.length} ${pujas.length === 1 ? 'puja' : 'pujas'} · Puja más alta de ${lider.nombre}`;
        } else {
          infoPujas.textContent = 'Aún no hay pujas. ¡Sé el primero en ofertar!';
        }
      }

      if (cerrada) {
        clearInterval(temporizador);
        texto('#detalle-precio', `${pujas.length ? 'Puja ganadora' : 'Precio inicial'}: ${moneda(actual.precio)}`);
        texto('#detalle-stock', 'Subasta cerrada');

        if (cuentaRegresiva) cuentaRegresiva.textContent = 'Subasta cerrada';
        if (inputPuja) inputPuja.disabled = true;

        botonPujar.disabled = true;

        const gane = sesion &&
          actual.ganadorCorreo === String(sesion.correo || '').toLowerCase();

        if (textoPuja) {
          if (gane) {
            textoPuja.textContent = '¡Ganaste esta subasta! Revisa tu pedido en Mi Perfil y coordina la entrega en el chat.';
          } else if (actual.ganadorNombre) {
            textoPuja.textContent = `Ganador: ${actual.ganadorNombre} con ${moneda(actual.precio)}.`;
          } else {
            textoPuja.textContent = 'La subasta cerró sin pujas.';
          }
        }

        return true;
      }

      const minimo = Number(actual.precio || 0) + 10;

      texto('#detalle-precio', `Puja actual: ${moneda(actual.precio)}`);
      texto('#detalle-stock', 'Subasta en curso');

      if (inputPuja) {
        inputPuja.min = String(minimo);
        inputPuja.placeholder = `Oferta mínima: ${moneda(minimo)}`;
      }

      if (textoPuja) {
        textoPuja.textContent = `Puja mínima siguiente: ${moneda(minimo)} · Cierre: ${fechaCierre.toLocaleString('es-MX', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })}`;
      }

      actualizarReloj();
      return false;
    }

    botonPujar.addEventListener('click', () => {
      const resultado = window.jzProductos.registrarPuja(
        producto.id,
        Number(inputPuja?.value)
      );

      if (!resultado.exito) {
        window.alert(resultado.mensaje);
        pintarSubasta();
        return;
      }

      if (inputPuja) inputPuja.value = '';

      pintarSubasta();
      window.alert('Tu puja se registró correctamente.');
    });

    if (formulario) {
      formulario.addEventListener('submit', evento => {
        evento.preventDefault();
        botonPujar.click();
      });
    }

    if (!pintarSubasta()) {
      temporizador = setInterval(actualizarReloj, 1000);
    }
  }

  // Modal y chat
  const cerrarModal = $('#btn-cerrar-modal');

  if (cerrarModal && modal) {
    cerrarModal.addEventListener('click', () => modal.close());
  }

  const enlaceChat = $('.secondary-actions a[href^="mensajes.php"]');

  if (enlaceChat) {
    enlaceChat.href = `mensajes.php?producto=${encodeURIComponent(producto.id)}&vendedor=${encodeURIComponent(correoVendedor)}`;
  }

  const enlaceChatModal = modal?.querySelector('a[href^="mensajes.php"]');

  if (enlaceChatModal) {
    enlaceChatModal.href = `mensajes.php?producto=${encodeURIComponent(producto.id)}`;
  }
});