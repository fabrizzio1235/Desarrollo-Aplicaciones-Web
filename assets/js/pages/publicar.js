'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  const formularioPublicar = document.getElementById('form-publicar-producto');
  if (!formularioPublicar) return;

  const inputTitulo = document.getElementById('prod-titulo');
  const selectCategoria = document.getElementById('prod-categoria');
  const inputStock = document.getElementById('prod-stock');
  const inputDescripcion = document.getElementById('prod-descripcion');
  const inputFotos = document.getElementById('prod-fotos');
  const inputPrecio = document.getElementById('prod-precio');
  const labelPrecio = document.getElementById('label-precio');
  const grupoFechaSubasta = document.getElementById('grupo-fecha-subasta');
  const inputCierreSubasta = document.getElementById('prod-cierre-subasta');
  const inputPuntoFisico = document.getElementById('prod-punto-fisico');
  const inputHorarios = document.getElementById('prod-horarios');
  const mensajeFeedback = document.getElementById('publicar-feedback');
  const contenedorVistaPrevia = document.getElementById('prod-fotos-preview');
  const botonSubmit = formularioPublicar.querySelector('button[type="submit"]');

  const MAX_FOTOGRAFIAS = 4;
  let fotografiasSeleccionadas = [];

  // En Fase 2 la subida real de archivos al servidor aún no está activa (Fase 3).
  if (inputFotos) {
    inputFotos.removeAttribute('required');
  }

  function mostrarMensajeError(texto) {
    if (mensajeFeedback) {
      mensajeFeedback.textContent = texto || '';
    }
  }

  function formatoDatetimeLocal(valor) {
    if (!valor) return '';
    return String(valor).trim().replace(' ', 'T').slice(0, 16);
  }

  function actualizarInterfazModalidad(modalidadSeleccionada) {
    if (modalidadSeleccionada === 'subasta') {
      if (grupoFechaSubasta) grupoFechaSubasta.removeAttribute('hidden');
      if (labelPrecio) labelPrecio.textContent = 'Precio inicial de subasta (MXN)';
      if (inputStock) {
        inputStock.value = '1';
        inputStock.setAttribute('disabled', '');
      }
    } else {
      if (grupoFechaSubasta) grupoFechaSubasta.setAttribute('hidden', '');
      if (inputCierreSubasta) inputCierreSubasta.value = '';
      if (labelPrecio) labelPrecio.textContent = 'Precio de venta (MXN)';
      if (inputStock) inputStock.removeAttribute('disabled');
    }
  }

  function actualizarVistaPreviaFotografias() {
    if (!contenedorVistaPrevia) return;
    contenedorVistaPrevia.replaceChildren();
    contenedorVistaPrevia.hidden = fotografiasSeleccionadas.length === 0;

    fotografiasSeleccionadas.forEach((archivo, indice) => {
      const tarjeta = document.createElement('div');
      tarjeta.className = 'foto-preview-item';

      const imagen = document.createElement('img');
      imagen.src = URL.createObjectURL(archivo);
      imagen.alt = `Vista previa de la fotografía ${indice + 1}`;
      imagen.onload = () => URL.revokeObjectURL(imagen.src);

      const pie = document.createElement('div');
      pie.className = 'foto-preview-footer';

      const nombre = document.createElement('span');
      nombre.textContent = archivo.name;
      nombre.title = archivo.name;

      const quitar = document.createElement('button');
      quitar.type = 'button';
      quitar.className = 'foto-preview-remove';
      quitar.textContent = 'Quitar';
      quitar.setAttribute('aria-label', `Quitar ${archivo.name}`);
      quitar.addEventListener('click', () => {
        fotografiasSeleccionadas.splice(indice, 1);
        actualizarVistaPreviaFotografias();
      });

      pie.append(nombre, quitar);
      tarjeta.append(imagen, pie);
      contenedorVistaPrevia.appendChild(tarjeta);
    });

    const contador = document.createElement('p');
    contador.className = 'foto-preview-count';
    contador.textContent = `${fotografiasSeleccionadas.length} de ${MAX_FOTOGRAFIAS} fotografías seleccionadas (la carga al servidor se activará en Fase 3)`;
    contenedorVistaPrevia.appendChild(contador);
  }

  if (inputFotos) {
    inputFotos.addEventListener('change', () => {
      const nuevas = Array.from(inputFotos.files || []);
      const repetidas = nuevas.filter(nueva =>
        fotografiasSeleccionadas.some(actual =>
          actual.name === nueva.name &&
          actual.size === nueva.size &&
          actual.lastModified === nueva.lastModified
        )
      );
      const unicas = nuevas.filter(nueva => !repetidas.includes(nueva));
      const disponibles = MAX_FOTOGRAFIAS - fotografiasSeleccionadas.length;

      if (unicas.length > disponibles) {
        mostrarMensajeError(
          `Solo puedes seleccionar hasta ${MAX_FOTOGRAFIAS} fotografías. Ya tienes ${fotografiasSeleccionadas.length}.`
        );
      } else if (unicas.length) {
        fotografiasSeleccionadas.push(...unicas);
        mostrarMensajeError('');
      }

      if (repetidas.length) {
        mostrarMensajeError('Una o más fotografías ya estaban seleccionadas; no se agregaron duplicados.');
      }

      inputFotos.value = '';
      actualizarVistaPreviaFotografias();
    });
  }

  // Verificar sesión real en el servidor y obtener CSRF
  const sesionResp = await window.jzAuth.cargarSesion();
  if (!sesionResp.ok || !sesionResp.datos.autenticado) {
    window.location.replace('login.php');
    return;
  }
  const usuarioActual = sesionResp.datos.usuario;

  // Modo edición (?editar=ID)
  const rawEditar = new URLSearchParams(window.location.search).get('editar');
  const idEdicion = rawEditar && /^\d+$/.test(rawEditar) ? Number(rawEditar) : 0;
  let productoEdicion = null;
  let modoEdicion = false;

  if (rawEditar !== null) {
    if (idEdicion <= 0) {
      window.alert('Identificador de publicación inválido.');
      window.location.replace('mis-publicaciones.php');
      return;
    }

    const respDetalle = await window.jzProductos.obtenerPorId(idEdicion);
    if (!respDetalle.ok || !respDetalle.datos?.producto) {
      window.alert(respDetalle.mensaje || 'No se encontró la publicación solicitada.');
      window.location.replace('mis-publicaciones.php');
      return;
    }

    productoEdicion = respDetalle.datos.producto;
    const esDueno = Number(productoEdicion.vendedorId) === Number(usuarioActual.id);
    const subastaCerrada = productoEdicion.modalidad === 'subasta' && productoEdicion.estado !== 'activa';

    if (!esDueno || subastaCerrada) {
      window.alert(
        subastaCerrada
          ? 'No se puede editar una subasta cerrada.'
          : 'Solo el vendedor puede editar esta publicación.'
      );
      window.location.replace('mis-publicaciones.php');
      return;
    }

    modoEdicion = true;
  }

  function obtenerDatosDeFormulario() {
    const radioModalidad = formularioPublicar.querySelector('input[name="modalidad"]:checked');
    const modalidad = modoEdicion && productoEdicion
      ? productoEdicion.modalidad
      : (radioModalidad ? radioModalidad.value : 'fijo');

    const campus = Array.from(
      formularioPublicar.querySelectorAll('input[name="campus_entrega"]:checked')
    ).map(chk => chk.value);

    const textoStock = inputStock ? inputStock.value.trim() : '1';
    const textoPrecio = inputPrecio ? inputPrecio.value.trim() : '';

    return {
      titulo: inputTitulo ? inputTitulo.value.trim() : '',
      categoria: selectCategoria ? selectCategoria.value : '',
      modalidad,
      precio: textoPrecio !== '' ? Number(textoPrecio) : NaN,
      stock: modalidad === 'subasta' ? 1 : (textoStock !== '' ? Number(textoStock) : NaN),
      cierreSubasta: modalidad === 'subasta' && inputCierreSubasta
        ? inputCierreSubasta.value.trim()
        : null,
      campus,
      puntoFisico: inputPuntoFisico ? inputPuntoFisico.value.trim() : '',
      horarios: inputHorarios ? inputHorarios.value.trim() : '',
      descripcion: inputDescripcion ? inputDescripcion.value.trim() : ''
    };
  }

  function validarDatosProducto(datos) {
    if (datos.titulo.length < 3) {
      return 'Ingresa un título de al menos 3 caracteres.';
    }
    if (datos.categoria === '') {
      return 'Selecciona una categoría académica válida.';
    }
    if (datos.modalidad === 'fijo') {
      if (Number.isNaN(datos.stock) || !Number.isInteger(datos.stock) || datos.stock < 1 || datos.stock > 50) {
        return 'El stock debe ser un número entero entre 1 y 50 unidades.';
      }
    }
    if (datos.descripcion.length < 5) {
      return 'Ingresa una descripción detallada del artículo (mínimo 5 caracteres).';
    }

    const tienePujas = modoEdicion && productoEdicion &&
      datos.modalidad === 'subasta' && Number(productoEdicion.totalPujas || 0) > 0;

    if (!tienePujas && (Number.isNaN(datos.precio) || datos.precio <= 0 || datos.precio > 999999.99)) {
      return 'Ingresa un precio válido mayor a $0.00 MXN.';
    }

    if (datos.modalidad === 'subasta' && !modoEdicion) {
      if (!datos.cierreSubasta) {
        return 'Indica la fecha y hora límite para el cierre de la subasta.';
      }
      const fechaCierreMs = new Date(datos.cierreSubasta).getTime();
      if (Number.isNaN(fechaCierreMs) || fechaCierreMs <= Date.now()) {
        return 'La fecha de cierre de la subasta debe ser posterior a la fecha y hora actual.';
      }
    }

    if (datos.campus.length === 0) {
      return 'Selecciona al menos un campus UADY donde puedas realizar la entrega.';
    }
    if (datos.puntoFisico === '' || datos.horarios === '') {
      return 'Indica los puntos físicos sugeridos y tus horarios disponibles.';
    }

    return null;
  }

  function precargarFormularioEdicion() {
    const producto = productoEdicion;
    const tienePujas = Number(producto.totalPujas || 0) > 0;

    document.title = 'Editar publicación | JaguarZon UADY';
    const tituloPagina = document.getElementById('publicar-titulo');
    if (tituloPagina) tituloPagina.textContent = 'Editar publicación';
    if (botonSubmit) botonSubmit.textContent = 'Guardar cambios';

    const ayudaFotos = formularioPublicar.querySelector('.form-help');
    if (ayudaFotos) ayudaFotos.textContent = 'Las fotografías actuales se conservan.';

    formularioPublicar.querySelectorAll('input[name="modalidad"]').forEach(radio => {
      radio.checked = radio.value === producto.modalidad;
      radio.disabled = true;
    });
    actualizarInterfazModalidad(producto.modalidad);

    if (inputTitulo) inputTitulo.value = producto.titulo || '';
    if (selectCategoria) selectCategoria.value = producto.categoria || '';
    if (inputStock) inputStock.value = String(producto.stock ?? 1);
    if (inputDescripcion) inputDescripcion.value = producto.descripcion || '';
    if (inputPrecio) inputPrecio.value = String(producto.precio ?? '');

    if (producto.modalidad === 'subasta') {
      if (inputCierreSubasta) {
        inputCierreSubasta.value = formatoDatetimeLocal(producto.cierreSubasta);
        inputCierreSubasta.disabled = true;
      }
      if (tienePujas && inputPrecio) {
        inputPrecio.disabled = true;
      }
    }

    const campusProducto = Array.isArray(producto.campus) ? producto.campus : [];
    formularioPublicar.querySelectorAll('input[name="campus_entrega"]').forEach(casilla => {
      casilla.checked = campusProducto.includes(casilla.value);
    });

    if (inputPuntoFisico) {
      inputPuntoFisico.value = Array.isArray(producto.puntosEntrega) && producto.puntosEntrega.length
        ? producto.puntosEntrega.join(', ')
        : (producto.entregaTexto || '');
    }
    if (inputHorarios) {
      inputHorarios.value = Array.isArray(producto.horariosEntrega)
        ? producto.horariosEntrega.join(', ')
        : '';
    }
  }

  const radioInicial = formularioPublicar.querySelector('input[name="modalidad"]:checked');
  actualizarInterfazModalidad(radioInicial ? radioInicial.value : 'fijo');
  if (modoEdicion) precargarFormularioEdicion();

  formularioPublicar.querySelectorAll('input[name="modalidad"]').forEach(radio => {
    radio.addEventListener('change', evento => {
      actualizarInterfazModalidad(evento.target.value);
    });
  });

  formularioPublicar.addEventListener('submit', async evento => {
    evento.preventDefault();
    mostrarMensajeError('');

    const datos = obtenerDatosDeFormulario();
    const errorValidacion = validarDatosProducto(datos);
    if (errorValidacion !== null) {
      mostrarMensajeError(errorValidacion);
      return;
    }

    const textoOriginal = botonSubmit ? botonSubmit.textContent : '';
    if (botonSubmit) {
      botonSubmit.disabled = true;
      botonSubmit.textContent = modoEdicion ? 'Guardando cambios...' : 'Publicando...';
    }

    const respuesta = modoEdicion
      ? await window.jzProductos.actualizarProducto(productoEdicion.id, datos)
      : await window.jzProductos.crearProducto(datos);

    if (botonSubmit) {
      botonSubmit.disabled = false;
      botonSubmit.textContent = textoOriginal;
    }

    if (respuesta.ok) {
      const destinoId = modoEdicion ? productoEdicion.id : respuesta.datos?.id;
      window.location.href = destinoId
        ? `detalle-producto.php?id=${encodeURIComponent(destinoId)}`
        : 'productos.php';
      return;
    }

    const primerError = respuesta.errores && typeof respuesta.errores === 'object'
      ? Object.values(respuesta.errores).find(v => typeof v === 'string' && v.trim() !== '')
      : null;

    mostrarMensajeError(primerError || respuesta.mensaje || 'No se pudo guardar la publicación.');
  });
});