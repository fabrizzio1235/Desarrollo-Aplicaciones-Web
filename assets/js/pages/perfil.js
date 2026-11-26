document.addEventListener('DOMContentLoaded', () => {
  const usuario = ApiAutenticacion.obtenerUsuarioActual();
  if (!usuario) { window.location.replace('login.php'); return; }

  // Función auxiliar para obtener elementos por ID
  const $ = id => document.getElementById(id);

  const campusNombres = {
    exactas: 'Campus de Ciencias Exactas e Ingenierías',
    salud: 'Campus de Ciencias de la Salud',
    sociales: 'Campus de Ciencias Sociales y Humanidades',
    biologicas: 'Campus de Ciencias Biológicas y Agropecuarias',
    arquitectura: 'Campus de Arquitectura, Hábitat y Arte'
  };

  const leer = (clave, defecto = []) => {
    try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; }
    catch { return defecto; }
  };

  // Función auxiliar para escapar iniciales de un nombre, para la imagen de perfil inicial.
  const escaparIniciales = nombre => String(nombre || 'U').trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();

  let filtroActual = 'todos';
  let fotoPendiente = null;

  function pedidosUsuario() {
    return leer('jz_pedidos').filter(p => String(p.compradorCorreo || '').toLowerCase() === String(usuario.correo).toLowerCase())
      .sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0));
  }
  
  function renderPerfil() {
    const actual = ApiAutenticacion.obtenerUsuarioActual() || usuario;
    $('perfil-nombre').textContent = actual.nombre || 'Usuario JaguarZon';
    $('perfil-correo').textContent = actual.correo || '';
    $('perfil-campus').textContent = campusNombres[actual.campus] || actual.campus || 'Campus no especificado';
    $('perfil-facultad').textContent = actual.facultad || '';
    $('perfil-descripcion').textContent = actual.descripcion || 'Aún no has agregado una descripción personal.';
    $('dato-nombre').textContent = actual.nombre || '—';
    $('dato-correo').textContent = actual.correo || '—';
    $('dato-campus').textContent = campusNombres[actual.campus] || actual.campus || '—';
    $('dato-facultad').textContent = actual.facultad || 'No especificada';
    $('dato-registro').textContent = actual.fechaRegistro ? new Date(actual.fechaRegistro).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No disponible';
    $('dato-puntos').textContent = actual.puntosFrecuentes || 'No especificados';
    $('dato-horarios').textContent = actual.horariosHabituales || 'No especificado';
    const avatar = $('perfil-foto');
    avatar.textContent = actual.foto ? '' : escaparIniciales(actual.nombre);
    avatar.style.backgroundImage = actual.foto ? `url("${actual.foto}")` : 'none';
    avatar.classList.toggle('has-photo', Boolean(actual.foto));

    const pedidos = pedidosUsuario();
    // completados se calcula desde pedidos donde el usuario figura como comprador.
    const completados = pedidos.filter(p => p.estado === 'completado').length;

    const reputacion = ApiAutenticacion.obtenerReputacion(actual.correo);
    $('promedio-estrellas').textContent = reputacion.total ? `★ ${reputacion.promedio.toFixed(1)} / 5.0` : 'Sin calificaciones';
    $('total-resenas').textContent = `${reputacion.total} ${reputacion.total === 1 ? 'reseña verificada' : 'reseñas verificadas'}`;
    
    // Las ventas completadas se calculan desde pedidos donde el usuario figura como vendedor.
    const ventas = leer('jz_pedidos').filter(p => p.vendedorCorreo === actual.correo && p.estado === 'completado').length;
    $('total-ventas').textContent = `${ventas} ${ventas === 1 ? 'venta completada' : 'ventas completadas'}`;
    renderPedidos();
    renderResenas(reputacion.resenas);
  }

  function renderPedidos() {
    const pedidos = pedidosUsuario();
    const filtrados = filtroActual === 'todos' ? pedidos : pedidos.filter(p => p.estado === filtroActual);
    const lista = $('lista-compras-usuario');
    lista.replaceChildren();
    $('contador-pedidos').textContent = String(pedidos.length);
    $('pedidos-vacios').hidden = filtrados.length !== 0;
    filtrados.forEach(pedido => {
      const li = document.createElement('li'); li.className = 'order-item';
      const detalle = document.createElement('div'); detalle.className = 'order-details';
      const titulo = document.createElement('strong'); titulo.textContent = pedido.tituloProducto || `Producto #${pedido.idProducto || ''}`;
      const meta = document.createElement('p');
      meta.textContent = `Vendedor: ${pedido.vendedorNombre || 'No disponible'} · Cantidad: ${pedido.cantidad || 1} · Punto: ${pedido.puntoEntrega || 'Por acordar'}`;
      const horario = document.createElement('p'); horario.className = 'order-meta';
      horario.textContent = `Horario: ${pedido.horarioEntrega || 'Por acordar'} · Total: $${Number(pedido.total || 0).toFixed(2)} MXN`;
      const estado = document.createElement('span');
      const estadoNormalizado = ['pendiente', 'completado', 'cancelado'].includes(pedido.estado) ? pedido.estado : 'pendiente';
      estado.className = `status-badge status-${estadoNormalizado}`;
      estado.textContent = estadoNormalizado === 'completado' ? 'Entregado / Completado' : estadoNormalizado === 'cancelado' ? 'Cancelado' : 'Pendiente de entrega';
      detalle.append(titulo, meta, horario, estado);
      const acciones = document.createElement('div'); acciones.className = 'order-actions';
      if (estadoNormalizado === 'completado') {
        const yaCalifico = leer('jz_resenas').some(r => String(r.idPedido) === String(pedido.idPedido));
        if (yaCalifico) { const etiqueta = document.createElement('span'); etiqueta.className = 'review-done'; etiqueta.textContent = '✓ Vendedor calificado'; acciones.append(etiqueta); }
        else { const boton = document.createElement('button'); boton.type = 'button'; boton.className = 'btn btn-primary btn-sm'; boton.textContent = 'Calificar vendedor'; boton.addEventListener('click', () => abrirResena(pedido)); acciones.append(boton); }
      } else if (estadoNormalizado === 'pendiente') {
        const chat = document.createElement('a'); chat.className = 'btn btn-secondary btn-sm'; chat.href = `mensajes.php?pedido=${encodeURIComponent(pedido.idPedido)}`; chat.textContent = 'Ver chat'; acciones.append(chat);
      }
      li.append(detalle, acciones); lista.append(li);
    });
  }

  function renderResenas(resenas) {
    const lista = $('lista-resenas'); lista.replaceChildren();
    $('resenas-vacias').hidden = resenas.length > 0;
    resenas.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).forEach(r => {
      const li = document.createElement('li'); li.className = 'received-review';
      const cabecera = document.createElement('div'); cabecera.className = 'review-heading';
      const autor = document.createElement('strong'); autor.textContent = r.compradorNombre || 'Comprador UADY';
      const estrellas = document.createElement('span'); estrellas.className = 'review-stars'; estrellas.textContent = `${'★'.repeat(Number(r.estrellas))}${'☆'.repeat(5 - Number(r.estrellas))}`;
      cabecera.append(autor, estrellas);
      const comentario = document.createElement('p'); comentario.textContent = r.comentario;
      const fecha = document.createElement('small'); fecha.textContent = r.fecha ? new Date(r.fecha).toLocaleDateString('es-MX') : '';
      li.append(cabecera, comentario, fecha); lista.append(li);
    });
  }

  function abrirResena(pedido) {
    $('resena-pedido-id').value = pedido.idPedido;
    $('resena-contexto').textContent = `Pedido: ${pedido.tituloProducto || 'Artículo'} · Vendedor: ${pedido.vendedorNombre || 'Vendedor'}`;
    $('resena-feedback').textContent = '';
    $('form-emitir-resena').reset();
    $('modal-resena').showModal();
  }

  function abrirEdicion() {
    const actual = ApiAutenticacion.obtenerUsuarioActual() || usuario;
    $('editar-nombre').value = actual.nombre || '';
    $('editar-descripcion').value = actual.descripcion || '';
    $('editar-campus').value = actual.campus || 'exactas';
    $('editar-facultad').value = actual.facultad || '';
    $('editar-puntos').value = actual.puntosFrecuentes || '';
    $('editar-horarios').value = actual.horariosHabituales || '';
    $('editar-foto').value = ''; fotoPendiente = null;
    $('vista-previa-foto').hidden = true;
    $('perfil-feedback').textContent = '';
    $('modal-editar-perfil').showModal();
  }

  $('btn-editar-perfil').addEventListener('click', abrirEdicion);
  ['cerrar-edicion', 'cancelar-edicion'].forEach(id => $(id).addEventListener('click', () => $('modal-editar-perfil').close()));
  $('editar-foto').addEventListener('change', evento => {
    const archivo = evento.target.files[0]; if (!archivo) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type) || archivo.size > 1024 * 1024) {
      $('perfil-feedback').textContent = 'Selecciona una imagen JPG, PNG o WEBP de máximo 1 MB.'; evento.target.value = ''; return;
    }
    const lector = new FileReader();
    lector.onload = () => { fotoPendiente = lector.result; $('vista-previa-foto').src = fotoPendiente; $('vista-previa-foto').hidden = false; };
    lector.readAsDataURL(archivo);
  });
  $('form-editar-perfil').addEventListener('submit', evento => {
    evento.preventDefault();
    const cambios = {
      nombre: $('editar-nombre').value.trim(), descripcion: $('editar-descripcion').value.trim(),
      campus: $('editar-campus').value, facultad: $('editar-facultad').value.trim(),
      puntosFrecuentes: $('editar-puntos').value.trim(), horariosHabituales: $('editar-horarios').value.trim()
    };
    if (!cambios.nombre) { $('perfil-feedback').textContent = 'El nombre es obligatorio.'; return; }
    if (fotoPendiente) cambios.foto = fotoPendiente;
    const resultado = ApiAutenticacion.actualizarPerfil(cambios);
    if (!resultado.exito) { $('perfil-feedback').textContent = resultado.mensaje; return; }
    $('modal-editar-perfil').close(); renderPerfil();
  });

  ['btn-cancelar-resena'].forEach(id => $(id).addEventListener('click', () => $('modal-resena').close()));
  $('form-emitir-resena').addEventListener('submit', evento => {
    evento.preventDefault();
    const resultado = ApiAutenticacion.registrarResena({
      idPedido: $('resena-pedido-id').value,
      estrellas: Number($('calificacion-estrellas').value),
      comentario: $('comentario-resena').value
    });
    if (!resultado.exito) { $('resena-feedback').textContent = resultado.mensaje; return; }
    $('modal-resena').close(); renderPerfil();
  });

  document.querySelectorAll('[data-filtro]').forEach(boton => boton.addEventListener('click', () => {
    filtroActual = boton.dataset.filtro;
    document.querySelectorAll('[data-filtro]').forEach(b => {
      const activo = b === boton; b.classList.toggle('active', activo); b.setAttribute('aria-pressed', String(activo));
    });
    renderPedidos();
  }));

  $('btn-cerrar-sesion').addEventListener('click', async () => {
    if (!window.confirm('¿Estás seguro de que deseas cerrar sesión?')) return;
    await window.jzAuth.cerrarSesion();
    ApiAutenticacion.cerrarSesion();
    window.location.replace('login.php');
  });

  renderPerfil();
});
