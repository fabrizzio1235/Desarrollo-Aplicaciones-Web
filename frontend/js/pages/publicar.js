
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
      cantidadFotos: inputFotos && inputFotos.files ? inputFotos.files.length : 0,
      modalidad: modalidad,
      precio: textoPrecio !== '' ? Number(textoPrecio) : NaN,
      cierreSubasta: modalidad === 'subasta' ? inputCierreSubasta.value.trim() : null,
      campus: campusSeleccionados,
      puntoFisico: inputPuntoFisico.value.trim(),
      horarios: inputHorarios.value.trim(),
      imagen: '../assets/images/image-placeholder.jpg'
    };
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

    if (datos.cantidadFotos < 1 || datos.cantidadFotos > 4) {
      return 'Selecciona entre 1 y 4 fotografías para el artículo.';
    }

    if (Number.isNaN(datos.precio) || datos.precio <= 0) {
      return 'Ingresa un precio válido mayor a $0.00 MXN.';
    }

    if (datos.modalidad === 'subasta') {
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

  if (formularioPublicar) {
    // Sincroniza el estado inicial de la vista por si el navegador conserva una selección previa
    const radioInicial = formularioPublicar.querySelector('input[name="modalidad"]:checked');
    actualizarInterfazModalidad(radioInicial ? radioInicial.value : 'fijo');

    const radiosModalidad = formularioPublicar.querySelectorAll('input[name="modalidad"]');
    radiosModalidad.forEach(radio => {
      radio.addEventListener('change', (evento) => {
        actualizarInterfazModalidad(evento.target.value);
      });
    });

    formularioPublicar.addEventListener('submit', (evento) => {
      evento.preventDefault();
      mostrarMensajeError('');

      const datosNuevoProducto = obtenerDatosDeFormulario();
      const errorValidacion = validarDatosProducto(datosNuevoProducto);

      if (errorValidacion !== null) {
        mostrarMensajeError(errorValidacion);
        return;
      }

      const respuesta = ApiProductos.crearProducto(datosNuevoProducto);

      if (respuesta.exito) {
        window.location.href = 'productos.html';
      } else {
        mostrarMensajeError(respuesta.mensaje);
      }
    });
  }
});