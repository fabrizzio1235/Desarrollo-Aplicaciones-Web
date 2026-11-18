
const ApiProductos = {
  // Inicializa los 3 artículos de prueba en localStorage si aún no existen[cite: 45]
  inicializarDefecto() {
    const datosExistentes = localStorage.getItem('jz_productos');
    if (datosExistentes) {
      return;
    }

    const productosDefecto = [
      {
        id: 101,
        titulo: 'Cálculo de una Variable - James Stewart (8ª Ed.)',
        categoria: 'libros',
        categoriaNombre: 'Libros',
        modalidad: 'fijo',
        precio: 350.00,
        stock: 2,
        cierreSubasta: null,
        campus: ['exactas'],
        entregaTexto: 'Campus Exactas (FIUADY / FMAT)',
        puntosEntrega: [
          'Campus Exactas — Cafetería FIUADY',
          'Campus Exactas — Entrada Biblioteca Central',
          'Campus Exactas — Explanada FMAT'
        ],
        horariosEntrega: [
          'Lunes y Miércoles: 11:00 AM – 12:00 PM',
          'Martes y Jueves: 2:00 PM – 3:00 PM'
        ],
        descripcion: 'Libro en excelente estado, sin páginas subrayadas ni roturas. Ideal para Cálculo Diferencial e Integral en FIUADY o FMAT.',
        imagen: '../assets/images/image-placeholder.jpg',
        vendedorNombre: 'Ana Sofía Martínez',
        vendedorCorreo: 'anasofia@alumnos.uady.mx',
        vendedorFacultad: 'Facultad de Ingeniería (FIUADY)',
        reputacion: 4.9,
        ventasCompletadas: 14,
        fechaCreacion: 1731680000000
      },
      {
        id: 102,
        titulo: 'Kit Arduino Uno R3 + Protoboard y Sensores',
        categoria: 'electronica',
        categoriaNombre: 'Electrónica',
        modalidad: 'subasta',
        precio: 280.00,
        stock: 1,
        cierreSubasta: '2026-11-25T18:00',
        campus: ['exactas', 'salud'],
        entregaTexto: 'Exactas / Ciencias de la Salud',
        puntosEntrega: [
          'Campus Exactas — Cafetería FIUADY',
          'Campus Salud — Biblioteca'
        ],
        horariosEntrega: [
          'Viernes: 12:00 PM – 2:00 PM'
        ],
        descripcion: 'Kit completo usado un solo semestre. Incluye placa Uno R3, cable USB, protoboard, jumpers y sensor ultrasónico.',
        imagen: '../assets/images/image-placeholder.jpg',
        vendedorNombre: 'Luis Fernando R.',
        vendedorCorreo: 'luis.r@alumnos.uady.mx',
        vendedorFacultad: 'Facultad de Matemáticas (FMAT)',
        reputacion: 5.0,
        ventasCompletadas: 8,
        fechaCreacion: 1731760000000
      },
      {
        id: 103,
        titulo: 'Bata de Laboratorio 100% Algodón Talla M',
        categoria: 'laboratorio',
        categoriaNombre: 'Material de laboratorio',
        modalidad: 'fijo',
        precio: 220.00,
        stock: 1,
        cierreSubasta: null,
        campus: ['salud'],
        entregaTexto: 'Campus Ciencias de la Salud',
        puntosEntrega: [
          'Campus Salud — Explanada Medicina',
          'Campus Salud — Cafetería Química'
        ],
        horariosEntrega: [
          'Lunes a Jueves: 1:00 PM – 2:30 PM'
        ],
        descripcion: 'Bata reglamentaria de algodón grueso, sin manchas de reactivos. Talla mediana.',
        imagen: '../assets/images/image-placeholder.jpg',
        vendedorNombre: 'Valeria C.',
        vendedorCorreo: 'valeria.c@alumnos.uady.mx',
        vendedorFacultad: 'Facultad de Química',
        reputacion: 4.8,
        ventasCompletadas: 21,
        fechaCreacion: 1731840000000
      }
    ];

    localStorage.setItem('jz_productos', JSON.stringify(productosDefecto));
  },

  // Devuelve el arreglo completo de productos
  obtenerTodosLosProductos() {
    this.inicializarDefecto();
    const datos = localStorage.getItem('jz_productos');
    return datos ? JSON.parse(datos) : [];
  },

  // Busca un producto específico por su ID numérico
  obtenerPorId(idBuscado) {
    const productos = this.obtenerTodosLosProductos();
    const idNumero = Number(idBuscado);
    return productos.find(p => p.id === idNumero) || null;
  },

  // Motor centralizado de filtrado y ordenamiento del catálogo
  filtrarCatalogo(criterios) {
    let productos = this.obtenerTodosLosProductos();

    // 1. Filtrar por campus (si hay al menos uno seleccionado)
    if (criterios.campus && criterios.campus.length > 0) {
      productos = productos.filter(p => {
        for (const campusBuscado of criterios.campus) {
          if (p.campus.includes(campusBuscado)) {
            return true;
          }
        }
        return false;
      });
    }

    // 2. Filtrar por categoría
    if (criterios.categoria && criterios.categoria !== 'todas') {
      productos = productos.filter(p => p.categoria === criterios.categoria);
    }

    // 3. Filtrar por modalidad de venta
    if (criterios.modalidades) {
      if (criterios.modalidades.length > 0) {
        productos = productos.filter(p => criterios.modalidades.includes(p.modalidad));
      } else {
        return [];
      }
    }

    // 4. Filtrar por precio mínimo y máximo
    if (criterios.precioMin !== null && !Number.isNaN(criterios.precioMin)) {
      productos = productos.filter(p => p.precio >= criterios.precioMin);
    }

    if (criterios.precioMax !== null && !Number.isNaN(criterios.precioMax)) {
      productos = productos.filter(p => p.precio <= criterios.precioMax);
    }

    // 5. Filtrar por si el usuario escribió para búsqueda de título o descripción
    if (criterios.busqueda && criterios.busqueda !== '') {
      const termino = criterios.busqueda.toUpperCase();
      productos = productos.filter(p =>
        p.titulo.toUpperCase().includes(termino) ||
        p.descripcion.toUpperCase().includes(termino)
      );
    }

    // 6. Ordenar resultados
    if (criterios.orden === 'precio-asc') {
      productos.sort((a, b) => a.precio - b.precio);
    } else if (criterios.orden === 'precio-desc') {
      productos.sort((a, b) => b.precio - a.precio);
    } else if (criterios.orden === 'reputacion') {
      productos.sort((a, b) => b.reputacion - a.reputacion);
    } else {
      productos.sort((a, b) => b.fechaCreacion - a.fechaCreacion);
    }

    return productos;
  },

  // Guarda una nueva publicación exigiendo sesión activa
  crearProducto(datosNuevo) {
    const sesion = ApiAutenticacion.obtenerSesion();
    if (!sesion) {
      return { exito: false, mensaje: 'Debes iniciar sesión para publicar un artículo.' };
    }

    const productos = this.obtenerTodosLosProductos();

    const nombresCategorias = {
      libros: 'Libros',
      laboratorio: 'Material de laboratorio',
      electronica: 'Electrónica',
      papeleria: 'Papelería',
      uniformes: 'Uniformes',
      otros: 'Otros'
    };

    const nuevoId = new Date().getTime();

    const nuevoProducto = {
      id: nuevoId,
      titulo: datosNuevo.titulo,
      categoria: datosNuevo.categoria,
      categoriaNombre: nombresCategorias[datosNuevo.categoria] || 'Otros',
      modalidad: datosNuevo.modalidad,
      precio: datosNuevo.precio,
      stock: datosNuevo.stock,
      cierreSubasta: datosNuevo.cierreSubasta || null,
      campus: datosNuevo.campus,
      entregaTexto: datosNuevo.puntoFisico,
      puntosEntrega: [datosNuevo.puntoFisico],
      horariosEntrega: [datosNuevo.horarios],
      descripcion: datosNuevo.descripcion,
      imagen: datosNuevo.imagen || '../assets/images/image-placeholder.jpg',
      vendedorNombre: sesion.nombre,
      vendedorCorreo: sesion.correo,
      vendedorFacultad: `Campus: ${sesion.campus}`,
      reputacion: 5.0,
      ventasCompletadas: 0,
      fechaCreacion: nuevoId
    };

    productos.push(nuevoProducto);
    localStorage.setItem('jz_productos', JSON.stringify(productos));
    return { exito: true, producto: nuevoProducto };
  },

  // Actualiza la oferta más alta en artículos de modalidad subasta exigiendo sesión activa
  registrarPuja(idProducto, nuevoMonto) {
    const sesion = ApiAutenticacion.obtenerSesion();
    if (!sesion) {
      return { exito: false, mensaje: 'Debes iniciar sesión para realizar una puja.' };
    }

    const productos = this.obtenerTodosLosProductos();
    const producto = productos.find(p => p.id === Number(idProducto));

    if (!producto || producto.modalidad !== 'subasta') {
      return { exito: false, mensaje: 'Este artículo no admite pujas.' };
    }

    const pujaMinima = producto.precio + 10;
    if (nuevoMonto < pujaMinima) {
      return { exito: false, mensaje: `La puja debe ser de al menos $${pujaMinima}.00 MXN.` };
    }

    producto.precio = nuevoMonto;
    localStorage.setItem('jz_productos', JSON.stringify(productos));
    return { exito: true, nuevoPrecio: producto.precio };
  },

  // Descuenta stock de un artículo de precio fijo y registra el pedido exigiendo sesión activa
  registrarPedido(idProducto, cantidadSolicitada, puntoEntrega, horarioEntrega) {
    const sesion = ApiAutenticacion.obtenerSesion();
    if (!sesion) {
      return { exito: false, mensaje: 'Debes iniciar sesión para solicitar una compra.' };
    }

    const productos = this.obtenerTodosLosProductos();
    const producto = productos.find(p => p.id === Number(idProducto));

    if (!producto) {
      return { exito: false, mensaje: 'El artículo no existe.' };
    }

    if (cantidadSolicitada > producto.stock || producto.stock <= 0) {
      return { exito: false, mensaje: 'No hay suficiente stock disponible.' };
    }

    producto.stock -= cantidadSolicitada;
    localStorage.setItem('jz_productos', JSON.stringify(productos));

    const datosPedidos = localStorage.getItem('jz_pedidos');
    const pedidos = datosPedidos ? JSON.parse(datosPedidos) : [];

    pedidos.push({
      idPedido: new Date().getTime(),
      idProducto: producto.id,
      tituloProducto: producto.titulo,
      cantidad: cantidadSolicitada,
      total: producto.precio * cantidadSolicitada,
      puntoEntrega: puntoEntrega,
      horarioEntrega: horarioEntrega,
      compradorCorreo: sesion.correo,
      vendedorNombre: producto.vendedorNombre,
      estado: 'pendiente'
    });

    localStorage.setItem('jz_pedidos', JSON.stringify(pedidos));
    return { exito: true, stockRestante: producto.stock };
  },

  // Obtiene el arreglo de IDs marcados como favoritos por el usuario en sesión
  obtenerIdsFavoritos() {
    const sesion = ApiAutenticacion.obtenerSesion();
    if (!sesion) return [];

    const claveFavoritos = `jz_favoritos_${sesion.correo}`;
    const datos = localStorage.getItem(claveFavoritos);
    return datos ? JSON.parse(datos) : [];
  },

  esFavorito(idProducto) {
    const ids = this.obtenerIdsFavoritos();
    return ids.includes(Number(idProducto));
  },

  // Agrega o elimina un ID de la lista de favoritos del usuario activo
  alternarFavorito(idProducto) {
    const sesion = ApiAutenticacion.obtenerSesion();
    if (!sesion) return false;

    const claveFavoritos = `jz_favoritos_${sesion.correo}`;
    const ids = this.obtenerIdsFavoritos();
    const idNum = Number(idProducto);

    let nuevosIds = [];
    let agregado = false;

    if (ids.includes(idNum)) {
      nuevosIds = ids.filter(id => id !== idNum);
      agregado = false;
    } else {
      ids.push(idNum);
      nuevosIds = ids;
      agregado = true;
    }

    localStorage.setItem(claveFavoritos, JSON.stringify(nuevosIds));
    return agregado;
  },

  // Devuelve los objetos completos de los productos que el usuario tiene en favoritos
  obtenerProductosFavoritos() {
    const idsFavoritos = this.obtenerIdsFavoritos();
    const todos = this.obtenerTodosLosProductos();
    return todos.filter(p => idsFavoritos.includes(p.id));
  }
};

ApiProductos.inicializarDefecto();