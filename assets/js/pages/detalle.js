'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const contenedor = document.getElementById('detalle-articulo');
  if (!contenedor) return;

  const parametros = new URLSearchParams(window.location.search);
  const rawId = parametros.get('id');
  const idProducto = rawId && /^\d+$/.test(rawId) ? Number(rawId) : 0;

  const formulario = document.getElementById('form-solicitud-compra');
  const modal = document.getElementById('modal-confirmacion-pedido');
  const $ = selector => document.querySelector(selector);
  const moneda = valor => `$${Number(valor || 0).toFixed(2)} MXN`;
  const placeholder = '../assets/images/image-placeholder.jpg';

  const texto = (selector, valor) => {
    const nodo = $(selector);
    if (nodo) nodo.textContent = valor;
    return nodo;
  };

  const resolverRutaImagen = ruta => {
    const limpia = String(ruta || '').trim();
    if (!limpia) return placeholder;
    if (limpia.startsWith('../') || limpia.startsWith('http') || limpia.startsWith('data:')) {
      return limpia;
    }
    return `../${limpia.replace(/^\/+/, '')}`;
  };

  const parsearFecha = valor => {
    if (!valor) return null;
    const d = new Date(String(valor).trim().replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? null : d;
  };

  function mostrarNoEncontrado(mensajeDetalle) {
    contenedor.replaceChildren();
    const aviso = document.createElement('section');
    aviso.className = 'empty-state';

    const titulo = document.createElement('h1');
    titulo.textContent = 'Producto no encontrado';

    const mensaje = document.createElement('p');
    mensaje.textContent = mensajeDetalle || 'La publicación pudo haber sido eliminada o el enlace no es válido.';

    const enlace = document.createElement('a');
    enlace.className = 'btn btn-primary';
    enlace.href = 'productos.php';
    enlace.textContent = 'Volver al catálogo';

    aviso.append(titulo, mensaje, enlace);
    contenedor.appendChild(aviso);

    if (formulario) formulario.hidden = true;
    const resenas = $('.reviews-section');
    if (resenas) resenas.hidden = true;
  }

  if (idProducto <= 0) {
    mostrarNoEncontrado('El identificador de la publicación no es válido.');
    return;
  }

  const [sesionResp, prodResp] = await Promise.all([
    window.jzAuth.cargarSesion(),
    window.jzProductos.obtenerPorId(idProducto)
  ]);

  if (!prodResp.ok || !prodResp.datos?.producto) {
    mostrarNoEncontrado(prodResp.mensaje);
    return;
  }

  const usuarioActual = sesionResp.ok && sesionResp.datos.autenticado
    ? sesionResp.datos.usuario
    : null;
  let producto = prodResp.datos.producto;

  contenedor.dataset.productoId = String(producto.id);
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

  // Galería de fotografías
  const imagenesCrudas = Array.isArray(producto.imagenes) && producto.imagenes.length
    ? producto.imagenes
    : [producto.imagen || placeholder];
  const imagenes = imagenesCrudas.slice(0, 4).map(resolverRutaImagen);

  const imagenPrincipal = $('#img-principal');
  const listaMiniaturas = $('#lista-miniaturas');

  function seleccionarImagen(src, botonActivo) {
    if (imagenPrincipal) {
      imagenPrincipal.src = src || placeholder;
      imagenPrincipal.alt = `Fotografía de ${producto.titulo}`;
    }
    if (listaMiniaturas) {
      listaMiniaturas.querySelectorAll('.thumb').forEach(b => {
        b.classList.toggle('active', b === botonActivo);
      });
    }
  }

  if (imagenPrincipal) {
    imagenPrincipal.onerror = () => {
      imagenPrincipal.onerror = null;
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
        img.onerror = null;
        img.src = placeholder;
      };

      boton.appendChild(img);
      boton.addEventListener('click', () => seleccionarImagen(src, boton));
      listaMiniaturas.appendChild(boton);
    });
  }
  seleccionarImagen(imagenes[0], listaMiniaturas?.querySelector('.thumb'));

  // Reputación y reseñas del vendedor desde MySQL (api/perfil/obtener.php?id=...)
  texto('#detalle-vendedor-nombre', producto.vendedorNombre || 'Vendedor JaguarZon');
  texto('#detalle-vendedor-facultad', producto.vendedorFacultad || 'Comunidad UADY');

  function pintarReputacionYResenas(promedio, totalResenas, ventasCompletadas, resenas) {
    const estrellasTexto = totalResenas > 0
      ? `${'★'.repeat(Math.round(promedio))}${'☆'.repeat(5 - Math.round(promedio))}`
      : '☆☆☆☆☆';

    const estrellasNodo = $('#detalle-vendedor-estrellas');
    if (estrellasNodo) {
      estrellasNodo.textContent = estrellasTexto;
      estrellasNodo.setAttribute(
        'aria-label',
        totalResenas > 0 ? `${promedio.toFixed(1)} de 5 estrellas` : 'Sin calificaciones'
      );
    }

    texto(
      '#detalle-vendedor-promedio',
      totalResenas > 0 ? `${promedio.toFixed(1)} / 5.0` : 'Sin calificaciones'
    );
    texto(
      '#detalle-vendedor-ventas',
      `(${ventasCompletadas} ${ventasCompletadas === 1 ? 'venta completada' : 'ventas completadas'})`
    );

    const listaResenas = $('#lista-resenas-producto');
    const avisoResenas = $('#resenas-sin-resultados');
    if (!listaResenas) return;

    listaResenas.replaceChildren();
    if (avisoResenas) avisoResenas.hidden = resenas.length > 0;

    resenas.forEach(r => {
      const item = document.createElement('li');
      item.className = 'review-item';

      const cabecera = document.createElement('header');

      const autor = document.createElement('strong');
      autor.textContent = r.autorNombre || 'Comprador UADY';

      const puntos = Math.max(1, Math.min(5, Number(r.estrellas ?? r.calificacion ?? 5)));
      const estrellas = document.createElement('span');
      estrellas.textContent = `${'★'.repeat(puntos)}${'☆'.repeat(5 - puntos)}`;
      estrellas.setAttribute('aria-label', `${puntos} de 5 estrellas`);

      const fecha = document.createElement('time');
      const fechaObj = parsearFecha(r.creado_en);
      if (fechaObj) {
        fecha.dateTime = fechaObj.toISOString();
        fecha.textContent = fechaObj.toLocaleDateString('es-MX');
      }

      cabecera.append(autor, estrellas, fecha);

      const comentario = document.createElement('p');
      comentario.textContent = r.comentario || 'Sin comentario.';

      item.append(cabecera, comentario);
      listaResenas.appendChild(item);
    });
  }

  pintarReputacionYResenas(
    Number(producto.vendedorPromedio || 0),
    Number(producto.vendedorTotalResenas || 0),
    0,
    []
  );

  if (window.jzPerfil && Number(producto.vendedorId) > 0) {
    const perfilResp = await window.jzPerfil.obtener(Number(producto.vendedorId));
    if (perfilResp.ok && perfilResp.datos) {
      const metricas = perfilResp.datos.metricas || {};
      const resenas = Array.isArray(perfilResp.datos.resenas) ? perfilResp.datos.resenas : [];
      if (perfilResp.datos.usuario?.facultad) {
        texto('#detalle-vendedor-facultad', perfilResp.datos.usuario.facultad);
      }
      pintarReputacionYResenas(
        Number(metricas.promedio || 0),
        Number(metricas.totalResenas || 0),
        Number(metricas.ventasCompletadas || 0),
        resenas
      );
    }
  }

  // Opciones de entrega
  const puntos = Array.isArray(producto.puntosEntrega) && producto.puntosEntrega.length
    ? producto.puntosEntrega
    : (producto.entregaTexto ? [producto.entregaTexto] : []);
  const horarios = Array.isArray(producto.horariosEntrega) ? producto.horariosEntrega : [];

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

  // Modalidad, disponibilidad y propietario
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
  if ((stockInicial < 1 || producto.estado !== 'activa') && formulario && !esSubasta) {
    formulario.hidden = true;
  }

  const esVendedor = Boolean(
    usuarioActual && Number(usuarioActual.id) === Number(producto.vendedorId)
  );

  if (formulario && esVendedor) {
    formulario.hidden = true;
    const aviso = document.createElement('p');
    aviso.className = 'payment-notice';
    aviso.textContent = 'Esta es tu publicación. No puedes comprar ni pujar por tu propio producto.';
    formulario.parentElement.insertBefore(aviso, formulario);
  }

  // Enlaces de chat (compatibles con api/mensajes/abrir-producto.php y abrir-pedido.php)
  const enlaceChat = $('.secondary-actions a[href^="mensajes.php"]');
  if (enlaceChat) {
    if (esVendedor) {
      enlaceChat.hidden = true;
    } else {
      enlaceChat.href = `mensajes.php?producto=${encodeURIComponent(producto.id)}`;
    }
  }
  const enlaceChatModal = modal?.querySelector('a[href^="mensajes.php"]');
  if (enlaceChatModal) {
    enlaceChatModal.href = `mensajes.php?producto=${encodeURIComponent(producto.id)}`;
  }

  // Favoritos contra MySQL (window.jzFavoritos)
  const botonFavorito = $('#btn-guardar-favorito');
  let esFavoritoActual = false;

  function pintarBotonFavorito(activo) {
    esFavoritoActual = activo;
    if (!botonFavorito) return;
    botonFavorito.textContent = activo ? '♥ Guardado en favoritos' : '♡ Guardar en favoritos';
    botonFavorito.setAttribute('aria-pressed', String(activo));
    botonFavorito.setAttribute('aria-label', activo ? 'Quitar de favoritos' : 'Guardar en favoritos');
  }

  if (botonFavorito && window.jzFavoritos) {
    const favResp = await window.jzFavoritos.listar();
    const idsFav = favResp.ok && Array.isArray(favResp.datos?.ids)
      ? favResp.datos.ids.map(Number)
      : [];
    pintarBotonFavorito(idsFav.includes(Number(producto.id)));

    botonFavorito.addEventListener('click', async () => {
      botonFavorito.disabled = true;
      const res = await window.jzFavoritos.toggle(Number(producto.id));
      botonFavorito.disabled = false;

      if (!res.ok) {
        window.alert(res.mensaje || 'No se pudo actualizar tus favoritos.');
        return;
      }

      pintarBotonFavorito(Boolean(res.datos?.esFavorito));
    });
  }

  // Compra directa contra MySQL (sp_registrar_pedido vía window.jzPedidos)
  if (formulario && !esSubasta && !esVendedor) {
    formulario.addEventListener('submit', async evento => {
      evento.preventDefault();

      const botonCompra = formulario.querySelector('button[type="submit"]');
      const cant = Number(cantidad?.value || 1);
      if (!Number.isInteger(cant) || cant < 1) {
        window.alert('La cantidad debe ser un número entero mayor que cero.');
        return;
      }

      const textoOriginal = botonCompra ? botonCompra.textContent : '';
      if (botonCompra) {
        botonCompra.disabled = true;
        botonCompra.textContent = 'Procesando compra...';
      }

      const resultado = await window.jzPedidos.crearPedido({
        producto_id: Number(producto.id),
        cantidad: cant,
        punto_entrega: $('#punto-entrega-select')?.value || 'Por acordar',
        horario_entrega: $('#horario-entrega-select')?.value || 'Por acordar'
      });

      if (botonCompra) {
        botonCompra.disabled = false;
        botonCompra.textContent = textoOriginal;
      }

      if (!resultado.ok) {
        window.alert(resultado.mensaje || 'No se pudo registrar la solicitud de compra.');
        return;
      }

      const idPedidoNuevo = resultado.datos?.idPedido;
      if (enlaceChatModal && idPedidoNuevo) {
        enlaceChatModal.href = `mensajes.php?pedido=${encodeURIComponent(idPedidoNuevo)}`;
      }

      const recarga = await window.jzProductos.obtenerPorId(producto.id);
      if (recarga.ok && recarga.datos?.producto) {
        producto = recarga.datos.producto;
        const stockRestante = Number(producto.stock || 0);
        texto(
          '#detalle-stock',
          stockRestante > 0 ? `Disponible: ${stockRestante} unidades` : 'Agotado'
        );
        if (cantidad) {
          cantidad.max = String(Math.max(1, stockRestante));
          cantidad.value = '1';
          cantidad.disabled = stockRestante < 1;
        }
        if (stockRestante < 1) {
          formulario.hidden = true;
        }
      }

      if (modal?.showModal) {
        modal.showModal();
      } else {
        window.alert('Tu solicitud quedó registrada como pendiente de entrega.');
      }
    });
  }

  // Subasta: cuenta regresiva y pujas contra MySQL (window.jzProductos.registrarPuja)
  const botonPujar = $('#btn-pujar');
  if (esSubasta && botonPujar) {
    const inputPuja = $('#monto-puja');
    const textoPuja = $('#texto-puja');
    const cuentaRegresiva = $('#cuenta-regresiva');
    const infoPujas = $('#info-pujas');

    let temporizador = null;
    let fechaCierre = parsearFecha(producto.cierreSubasta);
    let cierreConsultado = false;

    const dosDigitos = n => String(n).padStart(2, '0');

    function formatoTiempoRestante(ms) {
      const totalSeg = Math.max(0, Math.floor(ms / 1000));
      const dias = Math.floor(totalSeg / 86400);
      const horas = Math.floor((totalSeg % 86400) / 3600);
      const minutos = Math.floor((totalSeg % 3600) / 60);
      const segundos = totalSeg % 60;
      return `${dias > 0 ? `${dias} d ` : ''}${dosDigitos(horas)}:${dosDigitos(minutos)}:${dosDigitos(segundos)}`;
    }

    function actualizarReloj() {
      if (!fechaCierre || !cuentaRegresiva) return;
      const restante = fechaCierre.getTime() - Date.now();
      if (restante <= 0) {
        clearInterval(temporizador);
        if (!cierreConsultado) {
          cierreConsultado = true;
          pintarSubasta(true);
        }
        return;
      }
      cuentaRegresiva.textContent = `Cierra en ${formatoTiempoRestante(restante)}`;
    }

    async function pintarSubasta(recargarDesdeApi = false) {
      if (recargarDesdeApi) {
        const resp = await window.jzProductos.obtenerPorId(producto.id);
        if (resp.ok && resp.datos?.producto) {
          producto = resp.datos.producto;
        }
      }

      const actual = producto;
      const pujas = Array.isArray(actual.pujas) ? actual.pujas : [];
      const totalPujas = Number(actual.totalPujas ?? pujas.length ?? 0);
      fechaCierre = parsearFecha(actual.cierreSubasta);

      const vencida = Boolean(fechaCierre && fechaCierre.getTime() <= Date.now());
      const cerrada = actual.estado !== 'activa' || vencida;

      if (infoPujas) {
        if (pujas.length > 0) {
          const lider = pujas[pujas.length - 1];
          const nombreLider = lider.nombre || lider.compradorNombre || 'estudiante UADY';
          infoPujas.textContent = `${totalPujas} ${totalPujas === 1 ? 'puja' : 'pujas'} · Puja más alta de ${nombreLider}`;
        } else if (totalPujas > 0) {
          infoPujas.textContent = `${totalPujas} ${totalPujas === 1 ? 'puja registrada' : 'pujas registradas'}`;
        } else {
          infoPujas.textContent = 'Aún no hay pujas. ¡Sé el primero en ofertar!';
        }
      }

      if (cerrada) {
        clearInterval(temporizador);
        texto('#detalle-precio', `${totalPujas > 0 ? 'Puja ganadora' : 'Precio inicial'}: ${moneda(actual.precio)}`);
        texto('#detalle-stock', 'Subasta cerrada');
        if (cuentaRegresiva) cuentaRegresiva.textContent = 'Subasta cerrada';
        if (inputPuja) inputPuja.disabled = true;
        botonPujar.disabled = true;

        if (textoPuja) {
          const gane = Boolean(
            usuarioActual &&
            actual.ganadorCorreo &&
            String(actual.ganadorCorreo).toLowerCase() === String(usuarioActual.correo || '').toLowerCase()
          );
          if (gane) {
            textoPuja.textContent = '¡Ganaste esta subasta! Revisa tu pedido en Mi Perfil y coordina la entrega en el chat.';
          } else if (actual.ganadorNombre) {
            textoPuja.textContent = `Ganador: ${actual.ganadorNombre} con ${moneda(actual.precio)}.`;
          } else if (totalPujas > 0) {
            textoPuja.textContent = `Subasta cerrada con puja final de ${moneda(actual.precio)}.`;
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
        const cierreTxt = fechaCierre
          ? fechaCierre.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
          : 'Próximamente';
        textoPuja.textContent = `Puja mínima siguiente: ${moneda(minimo)} · Cierre: ${cierreTxt}`;
      }

      actualizarReloj();
      return false;
    }

    if (!esVendedor) {
      botonPujar.addEventListener('click', async () => {
        const monto = Number(inputPuja?.value);
        if (!Number.isFinite(monto) || monto <= 0) {
          window.alert('Indica un monto de puja válido.');
          return;
        }

        botonPujar.disabled = true;
        const resultado = await window.jzProductos.registrarPuja(Number(producto.id), monto);
        botonPujar.disabled = false;

        if (!resultado.ok) {
          window.alert(resultado.mensaje || 'No se pudo registrar la puja.');
          await pintarSubasta(true);
          return;
        }

        if (inputPuja) inputPuja.value = '';
        await pintarSubasta(true);
        window.alert(resultado.mensaje || 'Tu puja se registró correctamente.');
      });

      if (formulario) {
        formulario.addEventListener('submit', evento => {
          evento.preventDefault();
          botonPujar.click();
        });
      }
    }

    const estaCerrada = await pintarSubasta(false);
    if (!estaCerrada) {
      temporizador = setInterval(actualizarReloj, 1000);
    }
  }

  const cerrarModal = $('#btn-cerrar-modal');
  if (cerrarModal && modal) {
    cerrarModal.addEventListener('click', () => modal.close());
  }
});