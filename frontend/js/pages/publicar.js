
document.addEventListener('DOMContentLoaded', () => {
  const formularioPublicar = document.getElementById('form-publicar-producto');
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
  const MAX_FOTOGRAFIAS = 4;
  // Mantiene una selección acumulada aunque el usuario abra el selector varias veces.
  let fotografiasSeleccionadas = [];

  // Modo edición: publicar-producto.html?editar=ID reutiliza este mismo formulario
  const idEdicion = new URLSearchParams(window.location.search).get('editar');
  const productoEdicion = idEdicion ? ApiProductos.obtenerPorId(idEdicion) : null;
  const modoEdicion = Boolean(productoEdicion);

  if (idEdicion) {
    const sesionActual = ApiAutenticacion.obtenerSesion();
    const puedeEditar = productoEdicion
      && sesionActual
      && String(productoEdicion.vendedorCorreo || '').toLowerCase() === String(sesionActual.correo || '').toLowerCase()
      && !ApiProductos.subastaCerrada(productoEdicion);
    if (!puedeEditar) {
      window.alert('No puedes editar esta publicación.');
      window.location.replace('mis-publicaciones.html');
      return;
    }
  }

  // Ajusta visibilidad del cierre de subasta y bloquea el stock en 1 cuando es subasta
  function actualizarInterfazModalidad(modalidadSeleccionada) {
    if (modalidadSeleccionada === 'subasta') {
      grupoFechaSubasta.removeAttribute('hidden');
      labelPrecio.textContent = 'Precio inicial de subasta (MXN)';
      inputStock.value = '1';
      inputStock.setAttribute('disabled', '');
    } else {
      grupoFechaSubasta.setAttribute('hidden', '');
      inputCierreSubasta.value = '';
      labelPrecio.textContent = 'Precio de venta (MXN)';
      inputStock.removeAttribute('disabled');
    }
  }

  function mostrarMensajeError(texto) {
    if (mensajeFeedback) {
      mensajeFeedback.textContent = texto;
    }
  }

  // Extrae y normaliza los valores actuales de todos los campos del formulario
  function obtenerDatosDeFormulario() {
    const radioModalidad = formularioPublicar.querySelector('input[name="modalidad"]:checked');
    const modalidad = radioModalidad ? radioModalidad.value : 'fijo';

    const checkboxesCampus = formularioPublicar.querySelectorAll('input[name="campus_entrega"]:checked');
    const campusSeleccionados = [];
    checkboxesCampus.forEach(chk => campusSeleccionados.push(chk.value));

    const textoStock = inputStock.value.trim();
    const textoPrecio = inputPrecio.value.trim();

    return {
      titulo: inputTitulo.value.trim(),
      categoria: selectCategoria.value,
      stock: textoStock !== '' ? Number(textoStock) : NaN,
      descripcion: inputDescripcion.value.trim(),
      cantidadFotos: fotografiasSeleccionadas.length,
      modalidad: modalidad,
      precio: textoPrecio !== '' ? Number(textoPrecio) : NaN,
      cierreSubasta: modalidad === 'subasta' ? inputCierreSubasta.value.trim() : null,
      campus: campusSeleccionados,
      puntoFisico: inputPuntoFisico.value.trim(),
      horarios: inputHorarios.value.trim(),
      imagen: '../assets/images/image-placeholder.jpg',
      imagenes: []
    };
  }

  // Convierte las fotografías seleccionadas a imágenes JPEG optimizadas para localStorage.
  function procesarFotografia(archivo) {
    return new Promise((resolve, reject) => {
      if (!archivo) { resolve('../assets/images/image-placeholder.jpg'); return; }
      const lector = new FileReader();
      lector.onerror = () => reject(new Error('No fue posible leer una de las fotografías.'));
      lector.onload = () => {
        const imagen = new Image();
        imagen.onerror = () => reject(new Error('Uno de los archivos seleccionados no es una imagen válida.'));
        imagen.onload = () => {
          const limite = 900;
          const escala = Math.min(1, limite / Math.max(imagen.width, imagen.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(imagen.width * escala));
          canvas.height = Math.max(1, Math.round(imagen.height * escala));
          const contexto = canvas.getContext('2d');
          contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        imagen.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  async function procesarFotografias(archivos) {
    return Promise.all(Array.from(archivos || []).slice(0, MAX_FOTOGRAFIAS).map(procesarFotografia));
  }

  // Dibuja miniaturas de las fotografías acumuladas y permite retirar cada una.
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
    contador.textContent = `${fotografiasSeleccionadas.length} de ${MAX_FOTOGRAFIAS} fotografías seleccionadas`;
    contenedorVistaPrevia.appendChild(contador);
  }

  if (inputFotos) {
    inputFotos.addEventListener('change', () => {
      const nuevas = Array.from(inputFotos.files || []);
      const repetidas = nuevas.filter(nueva => fotografiasSeleccionadas.some(actual =>
        actual.name === nueva.name && actual.size === nueva.size && actual.lastModified === nueva.lastModified
      ));
      const unicas = nuevas.filter(nueva => !repetidas.includes(nueva));
      const disponibles = MAX_FOTOGRAFIAS - fotografiasSeleccionadas.length;

      if (unicas.length > disponibles) {
        mostrarMensajeError(`Solo puedes publicar hasta ${MAX_FOTOGRAFIAS} fotografías. Ya tienes ${fotografiasSeleccionadas.length} seleccionadas.`);
      } else if (unicas.length) {
        fotografiasSeleccionadas.push(...unicas);
        mostrarMensajeError('');
      }

      if (repetidas.length) {
        mostrarMensajeError('Una o más fotografías ya estaban seleccionadas; no se agregaron duplicados.');
      }

      // Vaciar el input permite volver a seleccionar archivos y acumularlos.
      inputFotos.value = '';
      actualizarVistaPreviaFotografias();
    });
  }

  // Valida las reglas de negocio; devuelve el mensaje de error o null si todo es válido
  function validarDatosProducto(datos) {
    if (datos.titulo === '') {
      return 'Ingresa el título de la publicación.';
    }

    if (datos.categoria === '') {
      return 'Selecciona una categoría académica para el artículo.';
    }

    if (Number.isNaN(datos.stock) || !Number.isInteger(datos.stock) || datos.stock < 1 || datos.stock > 50) {
      return 'El stock debe ser un número entero entre 1 y 50 unidades.';
    }

    if (datos.descripcion === '') {
      return 'Ingresa una descripción detallada del estado del artículo.';
    }

    if (!modoEdicion && (datos.cantidadFotos < 1 || datos.cantidadFotos > 4)) {
      return 'Selecciona entre 1 y 4 fotografías para el artículo.';
    }

    if (Number.isNaN(datos.precio) || datos.precio <= 0) {
      return 'Ingresa un precio válido mayor a $0.00 MXN.';
    }

    if (datos.modalidad === 'subasta' && !modoEdicion) {
      if (!datos.cierreSubasta || datos.cierreSubasta === '') {
        return 'Indica la fecha y hora límite para el cierre de la subasta.';
      }

      const fechaCierreMs = new Date(datos.cierreSubasta).getTime();
      const fechaActualMs = new Date().getTime();

      if (Number.isNaN(fechaCierreMs) || fechaCierreMs <= fechaActualMs) {
        return 'La fecha de cierre de la subasta debe ser posterior a la fecha y hora actual.';
      }
    }

    if (datos.campus.length === 0) {
      return 'Selecciona al menos un campus UADY donde puedas realizar la entrega.';
    }

    if (datos.puntoFisico === '' || datos.horarios === '') {
      return 'Indica los puntos físicos sugeridos y tus horarios de disponibilidad.';
    }

    return null;
  }

  // Rellena el formulario con los datos de la publicación que se está editando
  function precargarFormularioEdicion() {
    const producto = productoEdicion;
    const tienePujas = Array.isArray(producto.pujas) && producto.pujas.length > 0;

    document.title = 'Editar publicación | JaguarZon UADY';
    document.getElementById('publicar-titulo').textContent = 'Editar publicación';
    formularioPublicar.querySelector('button[type="submit"]').textContent = 'Guardar cambios';
    const ayudaFotos = formularioPublicar.querySelector('.form-help');
    if (ayudaFotos) ayudaFotos.textContent = 'Si no seleccionas fotografías nuevas se conservan las actuales.';

    // La modalidad no se puede cambiar una vez publicada
    formularioPublicar.querySelectorAll('input[name="modalidad"]').forEach(radio => {
      radio.checked = radio.value === producto.modalidad;
      radio.disabled = true;
    });
    actualizarInterfazModalidad(producto.modalidad);

    inputTitulo.value = producto.titulo;
    selectCategoria.value = producto.categoria;
    inputStock.value = producto.stock;
    inputDescripcion.value = producto.descripcion;
    inputPrecio.value = producto.precio;
    if (producto.modalidad === 'subasta') {
      inputCierreSubasta.value = producto.cierreSubasta || '';
      inputCierreSubasta.disabled = true;
      if (tienePujas) inputPrecio.disabled = true; // con pujas el precio ya no se toca
    }
    formularioPublicar.querySelectorAll('input[name="campus_entrega"]').forEach(casilla => {
      casilla.checked = producto.campus.includes(casilla.value);
    });
    inputPuntoFisico.value = (producto.puntosEntrega || []).join(', ') || producto.entregaTexto || '';
    inputHorarios.value = (producto.horariosEntrega || []).join(', ');
  }

  if (formularioPublicar) {
    // Sincroniza el estado inicial de la vista por si el navegador conserva una selección previa
    const radioInicial = formularioPublicar.querySelector('input[name="modalidad"]:checked');
    actualizarInterfazModalidad(radioInicial ? radioInicial.value : 'fijo');
    if (modoEdicion) precargarFormularioEdicion();

    const radiosModalidad = formularioPublicar.querySelectorAll('input[name="modalidad"]');
    radiosModalidad.forEach(radio => {
      radio.addEventListener('change', (evento) => {
        actualizarInterfazModalidad(evento.target.value);
      });
    });

    formularioPublicar.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      mostrarMensajeError('');

      const datosNuevoProducto = obtenerDatosDeFormulario();
      const errorValidacion = validarDatosProducto(datosNuevoProducto);

      if (errorValidacion !== null) {
        mostrarMensajeError(errorValidacion);
        return;
      }

      try {
        if (fotografiasSeleccionadas.length) {
          datosNuevoProducto.imagenes = await procesarFotografias(fotografiasSeleccionadas);
          datosNuevoProducto.imagen = datosNuevoProducto.imagenes[0] || '../assets/images/image-placeholder.jpg';
        }
      } catch (error) {
        mostrarMensajeError(error.message || 'No fue posible procesar la fotografía.');
        return;
      }

      const respuesta = modoEdicion
        ? ApiProductos.actualizarProducto(productoEdicion.id, datosNuevoProducto)
        : ApiProductos.crearProducto(datosNuevoProducto);

      if (respuesta.exito) {
        window.location.href = modoEdicion ? 'mis-publicaciones.html' : 'productos.html';
      } else {
        mostrarMensajeError(respuesta.mensaje);
      }
    });
  }
});