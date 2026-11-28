'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const CAMPUS_LABELS = {
    exactas: 'Campus de Ciencias Exactas e Ingenierías',
    salud: 'Campus de Ciencias de la Salud',
    sociales: 'Campus de Ciencias Sociales y Humanidades',
    biologicas: 'Campus de Ciencias Biológicas y Agropecuarias',
    arquitectura: 'Campus de Arquitectura, Hábitat y Arte'
  };

  const $ = id => document.getElementById(id);

  const btnCerrarSesion = $('btn-cerrar-sesion');
  const elFoto = $('perfil-foto');
  const elNombre = $('perfil-nombre');
  const elCorreo = $('perfil-correo');
  const elCampus = $('perfil-campus');
  const elFacultad = $('perfil-facultad');
  const elDescripcion = $('perfil-descripcion');

  const elPromedio = $('promedio-estrellas');
  const elTotalResenas = $('total-resenas');
  const elTotalVentas = $('total-ventas');
  const btnEditarPerfil = $('btn-editar-perfil');

  const elDatoNombre = $('dato-nombre');
  const elDatoCorreo = $('dato-correo');
  const elDatoCampus = $('dato-campus');
  const elDatoFacultad = $('dato-facultad');
  const elDatoRegistro = $('dato-registro');
  const elDatoPuntos = $('dato-puntos');
  const elDatoHorarios = $('dato-horarios');

  const elContadorPedidos = $('contador-pedidos');
  const filtroChips = Array.from(document.querySelectorAll('[data-filtro]'));
  const listaCompras = $('lista-compras-usuario');
  const pedidosVacios = $('pedidos-vacios');

  const listaResenas = $('lista-resenas');
  const resenasVacias = $('resenas-vacias');

  const modalEditar = $('modal-editar-perfil');
  const formEditar = $('form-editar-perfil');
  const btnCerrarEdicion = $('cerrar-edicion');
  const btnCancelarEdicion = $('cancelar-edicion');
  const inputEditarNombre = $('editar-nombre');
  const inputEditarDescripcion = $('editar-descripcion');
  const inputEditarFoto = $('editar-foto');
  const imgVistaPrevia = $('vista-previa-foto');
  const selectEditarCampus = $('editar-campus');
  const inputEditarFacultad = $('editar-facultad');
  const inputEditarPuntos = $('editar-puntos');
  const inputEditarHorarios = $('editar-horarios');
  const perfilFeedback = $('perfil-feedback');

  const modalResena = $('modal-resena');
  const formResena = $('form-emitir-resena');
  const elResenaContexto = $('resena-contexto');
  const inputResenaPedidoId = $('resena-pedido-id');
  const selectEstrellas = $('calificacion-estrellas');
  const inputComentarioResena = $('comentario-resena');
  const resenaFeedback = $('resena-feedback');
  const btnCancelarResena = $('btn-cancelar-resena');

  let usuarioActual = null;
  let pedidosCargados = [];
  let filtroActual = 'todos';
  let urlPreviewFoto = null;

  const inicialesDe = nombre =>
    String(nombre || 'U')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(parte => parte[0])
      .join('')
      .toUpperCase() || 'U';

  const formatearFecha = fechaSql => {
    if (!fechaSql) return 'No disponible';
    const d = new Date(String(fechaSql).replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return String(fechaSql);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatearFechaCorta = fechaSql => {
    if (!fechaSql) return '';
    const d = new Date(String(fechaSql).replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX');
  };

  const abrirDialogo = dlg => {
    if (!dlg) return;
    if (typeof dlg.showModal === 'function') {
      if (!dlg.open) dlg.showModal();
    } else {
      dlg.setAttribute('open', '');
    }
  };

  const cerrarDialogo = dlg => {
    if (!dlg) return;
    if (typeof dlg.close === 'function') {
      if (dlg.open) dlg.close();
    } else {
      dlg.removeAttribute('open');
    }
  };

  const liberarPreview = () => {
    if (urlPreviewFoto) {
      URL.revokeObjectURL(urlPreviewFoto);
      urlPreviewFoto = null;
    }
  };

  function renderizarPerfil(usuario, metricas) {
    usuarioActual = usuario;
    const nombre = usuario.nombre || 'Usuario JaguarZon';
    const campusTexto = CAMPUS_LABELS[usuario.campus] || usuario.campusNombre || usuario.campus || 'Campus no especificado';
    const foto = String(usuario.fotoRuta || usuario.avatar || '').trim();

    if (elFoto) {
      if (foto) {
        elFoto.style.backgroundImage = `url("${encodeURI(foto)}")`;
        elFoto.classList.add('has-photo');
        elFoto.textContent = '';
      } else {
        elFoto.style.backgroundImage = 'none';
        elFoto.classList.remove('has-photo');
        elFoto.textContent = inicialesDe(nombre);
      }
    }

    if (elNombre) elNombre.textContent = nombre;
    if (elCorreo) elCorreo.textContent = usuario.correo || '';
    if (elCampus) elCampus.textContent = campusTexto;
    if (elFacultad) elFacultad.textContent = usuario.facultad || '';
    if (elDescripcion) {
      elDescripcion.textContent = usuario.descripcion || 'Aún no has agregado una descripción personal.';
    }

    const totalRes = Number(metricas.totalResenas || 0);
    const promedio = Number(metricas.promedio || 0);
    const ventas = Number(metricas.ventasCompletadas || 0);

    if (elPromedio) {
      elPromedio.textContent = totalRes > 0 ? `★ ${promedio.toFixed(1)} / 5.0` : 'Sin calificaciones';
    }
    if (elTotalResenas) {
      elTotalResenas.textContent = `${totalRes} ${totalRes === 1 ? 'reseña verificada' : 'reseñas verificadas'}`;
    }
    if (elTotalVentas) {
      elTotalVentas.textContent = `${ventas} ${ventas === 1 ? 'venta completada' : 'ventas completadas'}`;
    }

    if (elDatoNombre) elDatoNombre.textContent = nombre;
    if (elDatoCorreo) elDatoCorreo.textContent = usuario.correo || '—';
    if (elDatoCampus) elDatoCampus.textContent = campusTexto || '—';
    if (elDatoFacultad) elDatoFacultad.textContent = usuario.facultad || 'No especificada';
    if (elDatoRegistro) elDatoRegistro.textContent = formatearFecha(usuario.creado_en);
    if (elDatoPuntos) elDatoPuntos.textContent = usuario.puntosFrecuentes || 'No especificados';
    if (elDatoHorarios) elDatoHorarios.textContent = usuario.horariosHabituales || 'No especificado';
  }

  function renderizarResenas(resenas) {
    if (!listaResenas) return;
    listaResenas.replaceChildren();

    const lista = Array.isArray(resenas) ? resenas : [];
    if (resenasVacias) resenasVacias.hidden = lista.length > 0;

    lista.forEach(r => {
      const estrellasNum = Math.max(1, Math.min(5, Number(r.estrellas ?? r.calificacion ?? 5)));

      const li = document.createElement('li');
      li.className = 'received-review';

      const cabecera = document.createElement('div');
      cabecera.className = 'review-heading';

      const autor = document.createElement('strong');
      autor.textContent = r.autorNombre || 'Estudiante UADY';

      const estrellas = document.createElement('span');
      estrellas.className = 'review-stars';
      estrellas.textContent = `${'★'.repeat(estrellasNum)}${'☆'.repeat(5 - estrellasNum)}`;
      estrellas.setAttribute('aria-label', `${estrellasNum} de 5 estrellas`);

      cabecera.append(autor, estrellas);

      const comentario = document.createElement('p');
      comentario.textContent = r.comentario || 'Sin comentario adicional.';

      const meta = document.createElement('small');
      const fechaTexto = formatearFechaCorta(r.creado_en);
      meta.textContent = fechaTexto
        ? `Artículo: ${r.productoTitulo || 'Publicación'} · ${fechaTexto}`
        : `Artículo: ${r.productoTitulo || 'Publicación'}`;

      li.append(cabecera, comentario, meta);
      listaResenas.appendChild(li);
    });
  }

  function abrirModalResena(pedido) {
    if (inputResenaPedidoId) inputResenaPedidoId.value = String(pedido.idPedido);
    if (elResenaContexto) {
      elResenaContexto.textContent = `Pedido: ${pedido.tituloProducto || 'Artículo'} · Vendedor: ${pedido.vendedorNombre || 'Vendedor'}`;
    }
    if (resenaFeedback) resenaFeedback.textContent = '';
    if (formResena) formResena.reset();
    if (selectEstrellas) selectEstrellas.value = '5';
    abrirDialogo(modalResena);
  }

  function renderizarPedidos() {
    if (!listaCompras) return;

    const filtrados = filtroActual === 'todos'
      ? pedidosCargados
      : pedidosCargados.filter(p => String(p.estado) === filtroActual);

    listaCompras.replaceChildren();
    if (elContadorPedidos) elContadorPedidos.textContent = String(pedidosCargados.length);
    if (pedidosVacios) pedidosVacios.hidden = filtrados.length > 0;

    filtrados.forEach(pedido => {
      const idPedido = Number(pedido.idPedido || 0);
      const estadoNorm = ['pendiente', 'completado', 'cancelado'].includes(pedido.estado)
        ? pedido.estado
        : 'pendiente';

      const li = document.createElement('li');
      li.className = 'order-item';
      li.dataset.pedidoId = String(idPedido);

      const detalle = document.createElement('div');
      detalle.className = 'order-details';

      const titulo = document.createElement('strong');
      titulo.textContent = pedido.tituloProducto || `Producto #${pedido.idProducto || ''}`;

      const meta = document.createElement('p');
      meta.textContent = `Vendedor: ${pedido.vendedorNombre || 'No disponible'} · Cantidad: ${pedido.cantidad || 1} · Punto: ${pedido.puntoEntrega || 'Por acordar'}`;

      const horario = document.createElement('p');
      horario.className = 'order-meta';
      horario.textContent = `Horario: ${pedido.horarioEntrega || 'Por acordar'} · Total: $${Number(pedido.total || 0).toFixed(2)} MXN`;

      const estado = document.createElement('span');
      estado.className = `status-badge status-${estadoNorm}`;
      estado.textContent = estadoNorm === 'completado'
        ? 'Entregado / Completado'
        : estadoNorm === 'cancelado'
          ? 'Cancelado'
          : 'Pendiente de entrega';

      detalle.append(titulo, meta, horario, estado);

      const acciones = document.createElement('div');
      acciones.className = 'order-actions';

      if (estadoNorm === 'completado') {
        if (Boolean(Number(pedido.yaCalificado || 0))) {
          const etiqueta = document.createElement('span');
          etiqueta.className = 'review-done';
          etiqueta.textContent = '✓ Vendedor calificado';
          acciones.appendChild(etiqueta);
        } else {
          const boton = document.createElement('button');
          boton.type = 'button';
          boton.className = 'btn btn-primary btn-sm';
          boton.textContent = 'Calificar vendedor';
          boton.addEventListener('click', () => abrirModalResena(pedido));
          acciones.appendChild(boton);
        }
      } else if (estadoNorm === 'pendiente') {
        const chat = document.createElement('a');
        chat.className = 'btn btn-secondary btn-sm';
        chat.href = `mensajes.php?pedido=${encodeURIComponent(idPedido)}`;
        chat.textContent = 'Ver chat';
        acciones.appendChild(chat);
      }

      li.append(detalle, acciones);
      listaCompras.appendChild(li);
    });
  }

  async function cargarTodo() {
    if (!window.jzPerfil) return;

    const res = await window.jzPerfil.obtener();
    if (!res.ok) {
      if (elDescripcion) {
        elDescripcion.textContent = res.mensaje || 'No se pudo cargar la información del perfil.';
      }
      return;
    }

    const { usuario = {}, metricas = {}, resenas = [] } = res.datos || {};
    renderizarPerfil(usuario, metricas);
    renderizarResenas(resenas);

    if (window.jzPedidos && typeof window.jzPedidos.listar === 'function') {
      const resPed = await window.jzPedidos.listar('comprador');
      pedidosCargados = resPed.ok && Array.isArray(resPed.datos?.pedidos)
        ? resPed.datos.pedidos
        : [];
    } else {
      pedidosCargados = [];
    }

    renderizarPedidos();
  }

  filtroChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filtroActual = chip.dataset.filtro || 'todos';
      filtroChips.forEach(btn => {
        const activo = btn === chip;
        btn.classList.toggle('active', activo);
        btn.setAttribute('aria-pressed', String(activo));
      });
      renderizarPedidos();
    });
  });

  if (btnEditarPerfil) {
    btnEditarPerfil.addEventListener('click', () => {
      if (usuarioActual) {
        if (inputEditarNombre) inputEditarNombre.value = usuarioActual.nombre || '';
        if (inputEditarDescripcion) inputEditarDescripcion.value = usuarioActual.descripcion || '';
        if (selectEditarCampus && usuarioActual.campus) selectEditarCampus.value = usuarioActual.campus;
        if (inputEditarFacultad) inputEditarFacultad.value = usuarioActual.facultad || '';
        if (inputEditarPuntos) inputEditarPuntos.value = usuarioActual.puntosFrecuentes || '';
        if (inputEditarHorarios) inputEditarHorarios.value = usuarioActual.horariosHabituales || '';
      }
      liberarPreview();
      if (inputEditarFoto) inputEditarFoto.value = '';
      if (imgVistaPrevia) {
        imgVistaPrevia.hidden = true;
        imgVistaPrevia.removeAttribute('src');
      }
      if (perfilFeedback) perfilFeedback.textContent = '';
      abrirDialogo(modalEditar);
    });
  }

  [btnCerrarEdicion, btnCancelarEdicion].forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
      liberarPreview();
      cerrarDialogo(modalEditar);
    });
  });

  if (inputEditarFoto && imgVistaPrevia) {
    inputEditarFoto.addEventListener('change', () => {
      liberarPreview();
      const archivo = inputEditarFoto.files?.[0];
      if (!archivo) {
        imgVistaPrevia.hidden = true;
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type) || archivo.size > 1024 * 1024) {
        if (perfilFeedback) {
          perfilFeedback.textContent = 'Selecciona una imagen JPG, PNG o WEBP de máximo 1 MB.';
        }
        inputEditarFoto.value = '';
        imgVistaPrevia.hidden = true;
        return;
      }
      if (perfilFeedback) perfilFeedback.textContent = '';
      urlPreviewFoto = URL.createObjectURL(archivo);
      imgVistaPrevia.src = urlPreviewFoto;
      imgVistaPrevia.hidden = false;
    });
  }

  if (formEditar) {
    formEditar.addEventListener('submit', async evento => {
      evento.preventDefault();
      if (perfilFeedback) perfilFeedback.textContent = '';

      const payload = {
        nombre: inputEditarNombre?.value.trim() || '',
        campus: selectEditarCampus?.value || '',
        facultad: inputEditarFacultad?.value.trim() || '',
        descripcion: inputEditarDescripcion?.value.trim() || '',
        puntosFrecuentes: inputEditarPuntos?.value.trim() || '',
        horariosHabituales: inputEditarHorarios?.value.trim() || ''
      };

      if (payload.nombre.length < 3) {
        if (perfilFeedback) perfilFeedback.textContent = 'Ingresa tu nombre completo (mínimo 3 caracteres).';
        return;
      }

      const res = await window.jzPerfil.actualizar(payload);
      if (!res.ok) {
        if (perfilFeedback) perfilFeedback.textContent = res.mensaje || 'No se pudo actualizar el perfil.';
        return;
      }

      liberarPreview();
      cerrarDialogo(modalEditar);
      await cargarTodo();
    });
  }

  if (btnCancelarResena) {
    btnCancelarResena.addEventListener('click', () => cerrarDialogo(modalResena));
  }

  if (formResena) {
    formResena.addEventListener('submit', async evento => {
      evento.preventDefault();
      if (resenaFeedback) resenaFeedback.textContent = '';

      const pedidoId = Number(inputResenaPedidoId?.value || 0);
      const calificacion = Number(selectEstrellas?.value || 0);
      const comentario = inputComentarioResena?.value.trim() || '';

      if (!comentario) {
        if (resenaFeedback) resenaFeedback.textContent = 'Escribe un comentario sobre tu experiencia.';
        return;
      }
      if (comentario.length > 500) {
        if (resenaFeedback) resenaFeedback.textContent = 'El comentario no puede superar los 500 caracteres.';
        return;
      }

      const res = await window.jzPerfil.enviarResena(pedidoId, calificacion, comentario);
      if (!res.ok) {
        if (resenaFeedback) resenaFeedback.textContent = res.mensaje || 'No se pudo publicar la reseña.';
        return;
      }

      cerrarDialogo(modalResena);
      await cargarTodo();
    });
  }

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', async () => {
      if (!window.confirm('¿Estás seguro de que deseas cerrar sesión?')) return;
      if (window.jzAuth && typeof window.jzAuth.cerrarSesion === 'function') {
        await window.jzAuth.cerrarSesion();
      }
      window.location.replace('login.php');
    });
  }

  await cargarTodo();
});