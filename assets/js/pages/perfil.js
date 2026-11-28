'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const CAMPUS_LABELS = {
    exactas: 'Campus de Ciencias Exactas e Ingenierías',
    salud: 'Campus de Ciencias de la Salud',
    sociales: 'Campus de Ciencias Sociales y Humanidades',
    biologicas: 'Campus de Ciencias Biológicas y Agropecuarias',
    arquitectura: 'Campus de Arquitectura, Hábitat y Arte'
  };

  // Encabezado y cierre de sesión
  const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
  const elFoto = document.getElementById('perfil-foto');
  const elNombre = document.getElementById('perfil-nombre');
  const elCorreo = document.getElementById('perfil-correo');
  const elCampus = document.getElementById('perfil-campus');
  const elFacultad = document.getElementById('perfil-facultad');
  const elDescripcion = document.getElementById('perfil-descripcion');

  // Reputación
  const elPromedio = document.getElementById('promedio-estrellas');
  const elTotalResenas = document.getElementById('total-resenas');
  const elTotalVentas = document.getElementById('total-ventas');
  const btnEditarPerfil = document.getElementById('btn-editar-perfil');

  // Datos de cuenta y preferencias
  const elDatoNombre = document.getElementById('dato-nombre');
  const elDatoCorreo = document.getElementById('dato-correo');
  const elDatoCampus = document.getElementById('dato-campus');
  const elDatoFacultad = document.getElementById('dato-facultad');
  const elDatoRegistro = document.getElementById('dato-registro');
  const elDatoPuntos = document.getElementById('dato-puntos');
  const elDatoHorarios = document.getElementById('dato-horarios');

  // Pedidos y filtros
  const elContadorPedidos = document.getElementById('contador-pedidos');
  const filtroChips = Array.from(document.querySelectorAll('.order-filters .filter-chip'));
  const listaCompras = document.getElementById('lista-compras-usuario');
  const pedidosVacios = document.getElementById('pedidos-vacios');

  // Reseñas recibidas
  const listaResenas = document.getElementById('lista-resenas');
  const resenasVacias = document.getElementById('resenas-vacias');

  // Modal editar perfil
  const modalEditar = document.getElementById('modal-editar-perfil');
  const formEditar = document.getElementById('form-editar-perfil');
  const btnCerrarEdicion = document.getElementById('cerrar-edicion');
  const btnCancelarEdicion = document.getElementById('cancelar-edicion');
  const inputEditarNombre = document.getElementById('editar-nombre');
  const inputEditarDescripcion = document.getElementById('editar-descripcion');
  const inputEditarFoto = document.getElementById('editar-foto');
  const imgVistaPrevia = document.getElementById('vista-previa-foto');
  const selectEditarCampus = document.getElementById('editar-campus');
  const inputEditarFacultad = document.getElementById('editar-facultad');
  const inputEditarPuntos = document.getElementById('editar-puntos');
  const inputEditarHorarios = document.getElementById('editar-horarios');
  const perfilFeedback = document.getElementById('perfil-feedback');

  // Modal emitir reseña
  const modalResena = document.getElementById('modal-resena');
  const formResena = document.getElementById('form-emitir-resena');
  const elResenaContexto = document.getElementById('resena-contexto');
  const inputResenaPedidoId = document.getElementById('resena-pedido-id');
  const selectEstrellas = document.getElementById('calificacion-estrellas');
  const inputComentarioResena = document.getElementById('comentario-resena');
  const resenaFeedback = document.getElementById('resena-feedback');
  const btnCancelarResena = document.getElementById('btn-cancelar-resena');

  let usuarioActual = null;
  let pedidosCargados = [];
  let filtroActual = 'todos';

  const esc = (txt) => String(txt ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));

  const formatearFecha = (fechaIso) => {
    if (!fechaIso) return '—';
    const d = new Date(String(fechaIso).replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return String(fechaIso);
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const abrirDialogo = (dlg) => {
    if (!dlg) return;
    if (typeof dlg.showModal === 'function') {
      if (!dlg.open) dlg.showModal();
    } else {
      dlg.setAttribute('open', '');
    }
  };

  const cerrarDialogo = (dlg) => {
    if (!dlg) return;
    if (typeof dlg.close === 'function') {
      if (dlg.open) dlg.close();
    } else {
      dlg.removeAttribute('open');
    }
  };

  function renderizarPerfil(usuario, metricas) {
    usuarioActual = usuario;
    const nombre = usuario.nombre || 'Usuario';
    const campusTexto = CAMPUS_LABELS[usuario.campus] || usuario.campus || '';
    const foto = (usuario.fotoRuta || usuario.avatar || '').trim();

    if (elFoto) {
      if (foto) {
        elFoto.style.backgroundImage = `url("${encodeURI(foto)}")`;
        elFoto.classList.add('has-photo');
        elFoto.textContent = '';
      } else {
        elFoto.style.backgroundImage = '';
        elFoto.classList.remove('has-photo');
        elFoto.textContent = nombre.trim().charAt(0).toUpperCase() || 'U';
      }
    }

    if (elNombre) elNombre.textContent = nombre;
    if (elCorreo) elCorreo.textContent = usuario.correo || '';
    if (elCampus) elCampus.textContent = campusTexto;
    if (elFacultad) elFacultad.textContent = usuario.facultad || '';
    if (elDescripcion) elDescripcion.textContent = usuario.descripcion || '';

    const totalRes = Number(metricas.totalResenas || 0);
    const promedio = Number(metricas.promedio || 0);
    const ventas = Number(metricas.ventasCompletadas || 0);

    if (elPromedio) {
      elPromedio.textContent = totalRes > 0
        ? `★ ${promedio.toFixed(1)} / 5.0`
        : 'Sin calificaciones';
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

    if (!Array.isArray(resenas) || resenas.length === 0) {
      listaResenas.innerHTML = '';
      if (resenasVacias) resenasVacias.hidden = false;
      return;
    }

    if (resenasVacias) resenasVacias.hidden = true;
    listaResenas.innerHTML = resenas.map((r) => {
      const estrellas = Math.max(1, Math.min(5, Number(r.estrellas ?? r.calificacion ?? 5)));
      return `
        <li class="received-review">
          <div class="review-heading">
            <strong>${esc(r.autorNombre || 'Estudiante UADY')}</strong>
            <span class="review-stars" aria-label="${estrellas} de 5 estrellas">${'★'.repeat(estrellas)}${'☆'.repeat(5 - estrellas)}</span>
          </div>
          <p>${esc(r.comentario || 'Sin comentario adicional.')}</p>
          <small>Artículo: ${esc(r.productoTitulo || 'Publicación')} · ${esc(formatearFecha(r.creado_en))}</small>
        </li>
      `;
    }).join('');
  }

  function renderizarPedidos() {
    if (!listaCompras) return;

    const filtrados = filtroActual === 'todos'
      ? pedidosCargados
      : pedidosCargados.filter((p) => String(p.estado) === filtroActual);

    if (elContadorPedidos) {
      elContadorPedidos.textContent = String(filtrados.length);
    }

    if (filtrados.length === 0) {
      listaCompras.innerHTML = '';
      if (pedidosVacios) pedidosVacios.hidden = false;
      return;
    }

    if (pedidosVacios) pedidosVacios.hidden = true;
    listaCompras.innerHTML = filtrados.map((ped) => {
      const idPedido = Number(ped.idPedido || ped.id || 0);
      const estado = String(ped.estado || 'pendiente');
      const titulo = ped.tituloProducto || ped.titulo || 'Producto';
      const total = Number(ped.total || ped.precio || 0).toFixed(2);
      const vendedor = ped.vendedorNombre || 'Vendedor UADY';
      const punto = ped.puntoEntrega || ped.punto_entrega || 'Por acordar';
      const horario = ped.horarioEntrega || ped.horario_entrega || 'Por acordar';
      const yaCalificado = Boolean(Number(ped.yaCalificado || ped.ya_calificado || 0));

      let accionHtml = '';
      if (estado === 'completado') {
        accionHtml = yaCalificado
          ? '<span class="review-done">✓ Reseña publicada</span>'
          : `<button type="button" class="btn btn-primary btn-sm" data-action="abrir-resena" data-pedido-id="${idPedido}" data-producto="${esc(titulo)}" data-vendedor="${esc(vendedor)}">Calificar vendedor</button>`;
      }

      return `
        <li class="order-item" data-pedido-id="${idPedido}">
          <div class="order-details">
            <strong>${esc(titulo)} · $${total} MXN</strong>
            <p class="order-meta">Vendedor: ${esc(vendedor)} · Punto: ${esc(punto)} (${esc(horario)})</p>
            <span class="status-badge status-${esc(estado)}">${esc(estado.toUpperCase())}</span>
          </div>
          <div class="order-actions">${accionHtml}</div>
        </li>
      `;
    }).join('');
  }

  async function cargarTodo() {
    if (!window.jzPerfil) return;

    try {
      const res = await window.jzPerfil.obtener();
      if (!res || !res.ok) {
        if (perfilFeedback) {
          perfilFeedback.textContent = res?.mensaje || 'No se pudo cargar la información del perfil.';
        }
        return;
      }

      const { usuario = {}, metricas = {}, resenas = [] } = res.datos || {};
      renderizarPerfil(usuario, metricas);
      renderizarResenas(resenas);

      if (window.jzPedidos && typeof window.jzPedidos.listar === 'function') {
        const resPed = await window.jzPedidos.listar('comprador');
        if (resPed && resPed.ok) {
          pedidosCargados = Array.isArray(resPed.datos?.pedidos)
            ? resPed.datos.pedidos
            : (Array.isArray(resPed.datos) ? resPed.datos : []);
        } else {
          pedidosCargados = [];
        }
      }
      renderizarPedidos();
    } catch (err) {
      if (perfilFeedback) {
        perfilFeedback.textContent = err.message || 'Error inesperado al cargar el perfil.';
      }
    }
  }

  // Filtros de pedidos
  filtroChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filtroActual = chip.dataset.filtro || 'todos';
      filtroChips.forEach((btn) => {
        const activo = btn === chip;
        btn.classList.toggle('active', activo);
        btn.setAttribute('aria-pressed', activo ? 'true' : 'false');
      });
      renderizarPedidos();
    });
  });

  // Abrir / cerrar modal de edición de perfil
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
      if (inputEditarFoto) inputEditarFoto.value = '';
      if (imgVistaPrevia) {
        imgVistaPrevia.hidden = true;
        imgVistaPrevia.removeAttribute('src');
      }
      if (perfilFeedback) perfilFeedback.textContent = '';
      abrirDialogo(modalEditar);
    });
  }

  if (btnCerrarEdicion) btnCerrarEdicion.addEventListener('click', () => cerrarDialogo(modalEditar));
  if (btnCancelarEdicion) btnCancelarEdicion.addEventListener('click', () => cerrarDialogo(modalEditar));

  // Vista previa de foto en el modal
  if (inputEditarFoto && imgVistaPrevia) {
    inputEditarFoto.addEventListener('change', () => {
      const archivo = inputEditarFoto.files?.[0];
      if (!archivo) {
        imgVistaPrevia.hidden = true;
        return;
      }
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
      if (!tiposPermitidos.includes(archivo.type)) {
        if (perfilFeedback) perfilFeedback.textContent = 'Formato inválido. Usa JPG, PNG o WEBP.';
        inputEditarFoto.value = '';
        imgVistaPrevia.hidden = true;
        return;
      }
      if (archivo.size > 1024 * 1024) {
        if (perfilFeedback) perfilFeedback.textContent = 'La imagen supera el tamaño máximo de 1 MB.';
        inputEditarFoto.value = '';
        imgVistaPrevia.hidden = true;
        return;
      }
      if (perfilFeedback) perfilFeedback.textContent = '';
      imgVistaPrevia.src = URL.createObjectURL(archivo);
      imgVistaPrevia.hidden = false;
    });
  }

  // Guardar cambios del perfil
  if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (perfilFeedback) perfilFeedback.textContent = '';

      const payload = {
        nombre: inputEditarNombre?.value.trim() || '',
        campus: selectEditarCampus?.value || '',
        facultad: inputEditarFacultad?.value.trim() || '',
        descripcion: inputEditarDescripcion?.value.trim() || '',
        puntosFrecuentes: inputEditarPuntos?.value.trim() || '',
        horariosHabituales: inputEditarHorarios?.value.trim() || ''
      };

      try {
        const res = await window.jzPerfil.actualizar(payload);
        if (!res || !res.ok) {
          if (perfilFeedback) {
            perfilFeedback.textContent = res?.mensaje || 'No se pudo actualizar el perfil.';
          }
          return;
        }

        cerrarDialogo(modalEditar);
        await cargarTodo();
      } catch (err) {
        if (perfilFeedback) {
          perfilFeedback.textContent = err.message || 'Error al guardar los cambios.';
        }
      }
    });
  }

  // Abrir modal para calificar vendedor desde la lista de compras
  if (listaCompras) {
    listaCompras.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="abrir-resena"]');
      if (!btn) return;

      if (inputResenaPedidoId) inputResenaPedidoId.value = btn.dataset.pedidoId || '';
      if (elResenaContexto) {
        elResenaContexto.textContent = `Pedido: ${btn.dataset.producto || ''} · Vendedor: ${btn.dataset.vendedor || ''}`;
      }
      if (selectEstrellas) selectEstrellas.value = '5';
      if (inputComentarioResena) inputComentarioResena.value = '';
      if (resenaFeedback) resenaFeedback.textContent = '';
      abrirDialogo(modalResena);
    });
  }

  if (btnCancelarResena) btnCancelarResena.addEventListener('click', () => cerrarDialogo(modalResena));

  // Publicar reseña
  if (formResena) {
    formResena.addEventListener('submit', async (e) => {
      e.preventDefault();
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

      try {
        const res = await window.jzPerfil.enviarResena(pedidoId, calificacion, comentario);
        if (!res || !res.ok) {
          if (resenaFeedback) {
            resenaFeedback.textContent = res?.mensaje || 'No se pudo publicar la reseña.';
          }
          return;
        }

        cerrarDialogo(modalResena);
        await cargarTodo();
      } catch (err) {
        if (resenaFeedback) {
          resenaFeedback.textContent = err.message || 'Error al enviar la reseña.';
        }
      }
    });
  }

  // Cerrar sesión
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', async () => {
      if (window.jzAuth && typeof window.jzAuth.cerrarSesion === 'function') {
        await window.jzAuth.cerrarSesion();
      } else {
        window.location.href = 'login.php';
      }
    });
  }

  await cargarTodo();
});