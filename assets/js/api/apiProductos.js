
const NOMBRES_CAMPUS = {
  exactas: 'Campus de Ciencias Exactas e Ingenierías',
  salud: 'Campus de Ciencias de la Salud',
  sociales: 'Campus de Ciencias Sociales y Humanidades',
  biologicas: 'Campus de Ciencias Biológicas y Agropecuarias',
  arquitectura: 'Campus de Arquitectura, Hábitat y Arte'
};

const NOMBRES_CATEGORIAS = {
  libros: 'Libros',
  laboratorio: 'Material de laboratorio',
  electronica: 'Electrónica',
  papeleria: 'Papelería',
  uniformes: 'Uniformes',
  otros: 'Otros'
};

const MENSAJE_SIN_ESPACIO = 'No hay espacio disponible en el navegador. Elimina publicaciones antiguas o usa menos fotografías.';

const ApiProductos = {
  // Da formato YYYY-MM-DDTHH:mm (el mismo que usa <input type="datetime-local">)
  _formatoFechaLocal(fecha) {
    const dos = n => String(n).padStart(2, '0');
    return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
  },

  // Lee los productos tal como están guardados y reconstruye la imagen principal
  _leerProductos() {
    const datos = localStorage.getItem('jz_productos');
    const productos = datos ? JSON.parse(datos) : [];
    productos.forEach(p => {
      if (!p.imagen) {
        p.imagen = (Array.isArray(p.imagenes) && p.imagenes[0]) || '../assets/images/image-placeholder.jpg';
      }
    });
    return productos;
  },

  // Guarda los productos sin duplicar la foto principal (ahorra espacio en localStorage).
  // Devuelve false si el navegador no tiene espacio.
  _guardarProductos(productos) {
    const compactos = productos.map(p => {
      if (Array.isArray(p.imagenes) && p.imagenes.length && p.imagen === p.imagenes[0]) {
        const { imagen, ...resto } = p;
        return resto;
      }
      return p;
    });
    try {
      localStorage.setItem('jz_productos', JSON.stringify(compactos));
      return true;
    } catch (error) {
      console.error('No fue posible guardar los productos:', error);
      return false;
    }
  },

  // Resumen público de un vendedor calculado con sus reseñas y pedidos reales
  obtenerResumenVendedor(correo) {
    const normalizado = String(correo || '').toLowerCase();
    const reputacion = ApiAutenticacion.obtenerReputacion(normalizado);
    const pedidos = JSON.parse(localStorage.getItem('jz_pedidos') || '[]');
    const ventas = pedidos.filter(p =>
      String(p.vendedorCorreo || '').toLowerCase() === normalizado && p.estado === 'completado'
    ).length;
    return { promedio: reputacion.promedio, totalResenas: reputacion.total, ventas };
  },

  // Inicializa los 3 artículos de prueba en localStorage si aún no existen
  inicializarDefecto() {
    const datosExistentes = localStorage.getItem('jz_productos');
    if (datosExistentes) {
      return;
    }

    // La subasta de ejemplo cierra siempre 7 días después de la primera visita
    const cierreDemo = this._formatoFechaLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

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
        vendedorCorreo: 'a21000001@alumnos.uady.mx',
        vendedorFacultad: 'Facultad de Ingeniería (FIUADY)',
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
        cierreSubasta: cierreDemo,
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
        vendedorCorreo: 'a21000002@alumnos.uady.mx',
        vendedorFacultad: 'Facultad de Matemáticas (FMAT)',
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
        vendedorCorreo: 'a21000003@alumnos.uady.mx',
        vendedorFacultad: 'Facultad de Química',
        fechaCreacion: 1731840000000
      }
    ];

    localStorage.setItem('jz_productos', JSON.stringify(productosDefecto));
  },

  // Devuelve el arreglo completo de productos
  obtenerTodosLosProductos() {
    this.inicializarDefecto();
    this.cerrarSubastasVencidas();
    return this._leerProductos();
  },

  // Busca un producto específico por su ID numérico
  obtenerPorId(idBuscado) {
    const productos = this.obtenerTodosLosProductos();
    const idNumero = Number(idBuscado);
    return productos.find(p => p.id === idNumero) || null;
  },

  // Motor centralizado de filtrado y ordenamiento del catálogo
  filtrarCatalogo(criterios) {
    // Solo publicaciones activas (sin subastas cerradas ni productos agotados)
    let productos = this.obtenerTodosLosProductos().filter(p => this.estaActiva(p));

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
      const promedios = new Map();
      productos.forEach(p => {
        if (!promedios.has(p.vendedorCorreo)) {
          promedios.set(p.vendedorCorreo, this.obtenerResumenVendedor(p.vendedorCorreo).promedio);
        }
      });
      productos.sort((a, b) => promedios.get(b.vendedorCorreo) - promedios.get(a.vendedorCorreo));
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
    const usuario = ApiAutenticacion.obtenerUsuarioActual() || sesion;

    const nuevoId = new Date().getTime();

    const nuevoProducto = {
      id: nuevoId,
      titulo: String(datosNuevo.titulo || '').trim(),
      categoria: datosNuevo.categoria,
      categoriaNombre: NOMBRES_CATEGORIAS[datosNuevo.categoria] || 'Otros',
      modalidad: datosNuevo.modalidad,
      precio: datosNuevo.precio,
      stock: Number(datosNuevo.stock),
      cierreSubasta: datosNuevo.cierreSubasta || null,
      campus: Array.isArray(datosNuevo.campus) ? datosNuevo.campus : [],
      entregaTexto: datosNuevo.puntoFisico,
      puntosEntrega: String(datosNuevo.puntoFisico || '').split(',').map(x => x.trim()).filter(Boolean),
      horariosEntrega: String(datosNuevo.horarios || '').split(',').map(x => x.trim()).filter(Boolean),
      descripcion: datosNuevo.descripcion,
      imagen: datosNuevo.imagen || (Array.isArray(datosNuevo.imagenes) && datosNuevo.imagenes[0]) || '../assets/images/image-placeholder.jpg',
      imagenes: Array.isArray(datosNuevo.imagenes) && datosNuevo.imagenes.length
        ? datosNuevo.imagenes.slice(0, 4)
        : [datosNuevo.imagen || '../assets/images/image-placeholder.jpg'],
      vendedorNombre: sesion.nombre || sesion.nombreCompleto || 'Vendedor',
      vendedorCorreo: String(sesion.correo || '').toLowerCase(),
      vendedorFacultad: usuario.facultad || NOMBRES_CAMPUS[usuario.campus] || 'Comunidad UADY',
      fechaCreacion: nuevoId
    };

    productos.push(nuevoProducto);
    if (!this._guardarProductos(productos)) {
      return { exito: false, mensaje: MENSAJE_SIN_ESPACIO };
    }
    return { exito: true, producto: nuevoProducto };
  },

  // ¿La subasta ya terminó? (por fecha de cierre o porque ya fue cerrada)
  subastaCerrada(producto) {
    if (!producto || producto.modalidad !== 'subasta') return false;
    if (producto.estadoSubasta === 'cerrada') return true;
    const cierre = new Date(producto.cierreSubasta).getTime();
    return !Number.isNaN(cierre) && cierre <= Date.now();
  },

  // ¿La publicación debe aparecer en el catálogo?
  estaActiva(producto) {
    if (producto.estadoPublicacion === 'cerrada' || producto.estadoPublicacion === 'vendido') return false;
    if (producto.modalidad === 'subasta') return !this.subastaCerrada(producto);
    return Number(producto.stock) > 0;
  },

  // Cierra las subastas vencidas. Si hubo pujas, la más alta gana y se genera
  // un pedido pendiente de entrega para el ganador. Devuelve cuántas cerró.
  cerrarSubastasVencidas() {
    const productos = this._leerProductos();
    const vencidas = productos.filter(p =>
      p.modalidad === 'subasta' && p.estadoSubasta !== 'cerrada' && this.subastaCerrada(p)
    );
    if (vencidas.length === 0) return 0;

    const pedidos = JSON.parse(localStorage.getItem('jz_pedidos') || '[]');
    vencidas.forEach((producto, indice) => {
      producto.estadoSubasta = 'cerrada';
      const pujas = Array.isArray(producto.pujas) ? producto.pujas : [];
      if (pujas.length === 0) {
        producto.estadoPublicacion = 'cerrada';
        return;
      }
      const ganadora = pujas[pujas.length - 1];
      producto.ganadorCorreo = ganadora.correo;
      producto.ganadorNombre = ganadora.nombre;
      producto.stock = 0;
      producto.estadoPublicacion = 'vendido';
      pedidos.push({
        idPedido: Date.now() + indice,
        idProducto: producto.id,
        tituloProducto: producto.titulo,
        cantidad: 1,
        total: producto.precio,
        puntoEntrega: (producto.puntosEntrega && producto.puntosEntrega[0]) || 'Por acordar',
        horarioEntrega: (producto.horariosEntrega && producto.horariosEntrega[0]) || 'Por acordar',
        compradorCorreo: ganadora.correo,
        vendedorNombre: producto.vendedorNombre,
        vendedorCorreo: producto.vendedorCorreo || '',
        fechaCreacion: new Date().toISOString(),
        estado: 'pendiente',
        origen: 'subasta'
      });
    });

    if (!this._guardarProductos(productos)) return 0;
    localStorage.setItem('jz_pedidos', JSON.stringify(pedidos));
    return vencidas.length;
  },

  // Registra una puja exigiendo sesión activa y respetando las reglas de la subasta
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
    if (this.subastaCerrada(producto)) {
      return { exito: false, mensaje: 'La subasta de este artículo ya cerró.' };
    }

    const correo = String(sesion.correo || '').toLowerCase();
    if (String(producto.vendedorCorreo || '').toLowerCase() === correo) {
      return { exito: false, mensaje: 'No puedes pujar por tu propia publicación.' };
    }

    const pujas = Array.isArray(producto.pujas) ? producto.pujas : [];
    if (pujas.length > 0 && pujas[pujas.length - 1].correo === correo) {
      return { exito: false, mensaje: 'Ya tienes la puja más alta de esta subasta.' };
    }

    const monto = Number(nuevoMonto);
    const pujaMinima = producto.precio + 10;
    if (!Number.isFinite(monto) || monto < pujaMinima) {
      return { exito: false, mensaje: `La puja debe ser de al menos $${pujaMinima}.00 MXN.` };
    }

    pujas.push({ correo, nombre: sesion.nombre || correo, monto, fecha: Date.now() });
    producto.pujas = pujas;
    producto.precio = monto;
    if (!this._guardarProductos(productos)) {
      return { exito: false, mensaje: MENSAJE_SIN_ESPACIO };
    }
    return { exito: true, nuevoPrecio: producto.precio, totalPujas: pujas.length };
  },

  // ¿El usuario de la sesión es el dueño de la publicación?
  _esVendedor(producto, sesion) {
    return Boolean(sesion) &&
      String(producto.vendedorCorreo || '').toLowerCase() === String(sesion.correo || '').toLowerCase();
  },

  // Edita una publicación propia. Los campos que no se pueden cambiar se ignoran.
  actualizarProducto(idProducto, cambios) {
    const sesion = ApiAutenticacion.obtenerSesion();
    if (!sesion) return { exito: false, mensaje: 'Debes iniciar sesión para editar una publicación.' };

    const productos = this.obtenerTodosLosProductos();
    const producto = productos.find(p => p.id === Number(idProducto));
    if (!producto) return { exito: false, mensaje: 'La publicación no existe.' };
    if (!this._esVendedor(producto, sesion)) {
      return { exito: false, mensaje: 'Solo el vendedor puede editar esta publicación.' };
    }
    if (this.subastaCerrada(producto)) {
      return { exito: false, mensaje: 'No se puede editar una subasta cerrada.' };
    }

    const titulo = String(cambios.titulo || '').trim();
    const descripcion = String(cambios.descripcion || '').trim();
    const puntoFisico = String(cambios.puntoFisico || '').trim();
    const horarios = String(cambios.horarios || '').trim();
    if (!titulo || !descripcion) return { exito: false, mensaje: 'El título y la descripción son obligatorios.' };
    if (!puntoFisico || !horarios) return { exito: false, mensaje: 'Indica los puntos de entrega y tus horarios.' };
    if (!Array.isArray(cambios.campus) || cambios.campus.length === 0) {
      return { exito: false, mensaje: 'Selecciona al menos un campus de entrega.' };
    }

    const esSubasta = producto.modalidad === 'subasta';
    const tienePujas = Array.isArray(producto.pujas) && producto.pujas.length > 0;

    if (!esSubasta || !tienePujas) {
      const precio = Number(cambios.precio);
      if (!Number.isFinite(precio) || precio <= 0) {
        return { exito: false, mensaje: 'Ingresa un precio válido mayor a $0.00 MXN.' };
      }
      producto.precio = precio;
    }
    if (!esSubasta) {
      const stock = Number(cambios.stock);
      if (!Number.isInteger(stock) || stock < 1 || stock > 50) {
        return { exito: false, mensaje: 'El stock debe ser un número entero entre 1 y 50 unidades.' };
      }
      producto.stock = stock;
      producto.estadoPublicacion = 'activa';
    }

    producto.titulo = titulo;
    producto.descripcion = descripcion;
    producto.categoria = cambios.categoria;
    producto.categoriaNombre = NOMBRES_CATEGORIAS[cambios.categoria] || 'Otros';
    producto.campus = cambios.campus;
    producto.entregaTexto = puntoFisico;
    producto.puntosEntrega = puntoFisico.split(',').map(x => x.trim()).filter(Boolean);
    producto.horariosEntrega = horarios.split(',').map(x => x.trim()).filter(Boolean);

    // Si el vendedor eligió fotografías nuevas, reemplazan a las anteriores
    if (Array.isArray(cambios.imagenes) && cambios.imagenes.length > 0) {
      producto.imagenes = cambios.imagenes.slice(0, 4);
      producto.imagen = producto.imagenes[0];
    }

    if (!this._guardarProductos(productos)) return { exito: false, mensaje: MENSAJE_SIN_ESPACIO };
    return { exito: true, producto };
  },

  // Da de baja una publicación propia (no si hay pedidos pendientes o pujas en curso)
  eliminarProducto(idProducto) {
    const sesion = ApiAutenticacion.obtenerSesion();
    if (!sesion) return { exito: false, mensaje: 'Debes iniciar sesión para eliminar una publicación.' };

    const productos = this.obtenerTodosLosProductos();
    const producto = productos.find(p => p.id === Number(idProducto));
    if (!producto) return { exito: false, mensaje: 'La publicación no existe.' };
    if (!this._esVendedor(producto, sesion)) {
      return { exito: false, mensaje: 'Solo el vendedor puede eliminar esta publicación.' };
    }

    const pedidos = JSON.parse(localStorage.getItem('jz_pedidos') || '[]');
    if (pedidos.some(p => Number(p.idProducto) === producto.id && p.estado === 'pendiente')) {
      return { exito: false, mensaje: 'Tienes pedidos pendientes de esta publicación. Márcalos como entregados o cancélalos primero.' };
    }
    const tienePujas = Array.isArray(producto.pujas) && producto.pujas.length > 0;
    if (producto.modalidad === 'subasta' && tienePujas && !this.subastaCerrada(producto)) {
      return { exito: false, mensaje: 'La subasta tiene pujas activas y no puede eliminarse antes del cierre.' };
    }

    const restantes = productos.filter(p => p.id !== producto.id);
    if (!this._guardarProductos(restantes)) return { exito: false, mensaje: MENSAJE_SIN_ESPACIO };
    return { exito: true };
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

    const cantidad = Number(cantidadSolicitada);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      return { exito: false, mensaje: 'La cantidad debe ser un número entero mayor que cero.' };
    }
    if (String(producto.vendedorCorreo || '').toLowerCase() === String(sesion.correo || '').toLowerCase()) {
      return { exito: false, mensaje: 'No puedes solicitar la compra de tu propia publicación.' };
    }
    if (producto.modalidad !== 'fijo') {
      return { exito: false, mensaje: 'Este artículo se vende mediante subasta y no admite compra directa.' };
    }
    if (cantidad > Number(producto.stock) || Number(producto.stock) <= 0) {
      return { exito: false, mensaje: 'No hay suficiente stock disponible.' };
    }

    producto.stock -= cantidad;
    if (producto.stock === 0) producto.estadoPublicacion = 'agotado';
    if (!this._guardarProductos(productos)) {
      return { exito: false, mensaje: MENSAJE_SIN_ESPACIO };
    }

    const datosPedidos = localStorage.getItem('jz_pedidos');
    const pedidos = datosPedidos ? JSON.parse(datosPedidos) : [];

    pedidos.push({
      idPedido: new Date().getTime(),
      idProducto: producto.id,
      tituloProducto: producto.titulo,
      cantidad: cantidad,
      total: producto.precio * cantidad,
      puntoEntrega: puntoEntrega,
      horarioEntrega: horarioEntrega,
      compradorCorreo: sesion.correo,
      vendedorNombre: producto.vendedorNombre,
      vendedorCorreo: producto.vendedorCorreo || '',
      fechaCreacion: new Date().toISOString(),
      estado: 'pendiente'
    });

    localStorage.setItem('jz_pedidos', JSON.stringify(pedidos));
    return { exito: true, pedido: pedidos[pedidos.length - 1], stockRestante: producto.stock };
  },

  // Permite al vendedor actualizar el estado de un pedido recibido.
  actualizarEstadoPedido(idPedido, nuevoEstado) {
    const sesion = ApiAutenticacion.obtenerSesion();
    if (!sesion) return { exito: false, mensaje: 'Debes iniciar sesión.' };
    if (!['completado', 'cancelado'].includes(nuevoEstado)) {
      return { exito: false, mensaje: 'El estado solicitado no es válido.' };
    }

    const pedidos = JSON.parse(localStorage.getItem('jz_pedidos') || '[]');
    const indice = pedidos.findIndex(p => String(p.idPedido) === String(idPedido));
    if (indice < 0) return { exito: false, mensaje: 'No se encontró el pedido.' };
    const pedido = pedidos[indice];
    if (String(pedido.vendedorCorreo || '').toLowerCase() !== String(sesion.correo || '').toLowerCase()) {
      return { exito: false, mensaje: 'No tienes permiso para modificar este pedido.' };
    }
    if (pedido.estado !== 'pendiente') {
      return { exito: false, mensaje: 'Solo se pueden modificar pedidos pendientes.' };
    }

    pedido.estado = nuevoEstado;
    pedido.fechaActualizacion = new Date().toISOString();
    if (nuevoEstado === 'cancelado') {
      const productos = this.obtenerTodosLosProductos();
      const producto = productos.find(p => Number(p.id) === Number(pedido.idProducto));
      if (producto) {
        producto.stock = Number(producto.stock || 0) + Number(pedido.cantidad || 0);
        if (producto.stock > 0) producto.estadoPublicacion = producto.modalidad === 'subasta' ? 'cerrada' : 'activa';
        this._guardarProductos(productos);
      }
    }
    localStorage.setItem('jz_pedidos', JSON.stringify(pedidos));
    return { exito: true, pedido };
  },

  // Construye una clave independiente para cada cuenta institucional.
  _claveFavoritos(correo) {
    return `jz_favoritos_${String(correo || '').trim().toLowerCase()}`;
  },

  // Obtiene los IDs favoritos del usuario activo y normaliza IDs antiguos guardados como texto.
  obtenerIdsFavoritos() {
    const sesion = ApiAutenticacion.obtenerSesion();
    if (!sesion || !sesion.correo) return [];

    try {
      const datos = localStorage.getItem(this._claveFavoritos(sesion.correo));
      const ids = datos ? JSON.parse(datos) : [];
      if (!Array.isArray(ids)) return [];
      return [...new Set(ids.map(Number).filter(id => Number.isFinite(id)))];
    } catch (error) {
      console.error('No fue posible leer los favoritos:', error);
      return [];
    }
  },

  esFavorito(idProducto) {
    const id = Number(idProducto);
    if (!Number.isFinite(id)) return false;
    return this.obtenerIdsFavoritos().includes(id);
  },

  // Agrega o elimina un producto de la lista de favoritos del usuario activo.
  // Devuelve true si quedó agregado y false si fue retirado o no hubo sesión.
  alternarFavorito(idProducto) {
    const sesion = ApiAutenticacion.obtenerSesion();
    const id = Number(idProducto);
    if (!sesion || !sesion.correo || !Number.isFinite(id)) return false;

    const productoExiste = this.obtenerTodosLosProductos().some(p => Number(p.id) === id);
    if (!productoExiste) return false;

    const clave = this._claveFavoritos(sesion.correo);
    const ids = this.obtenerIdsFavoritos();
    const agregado = !ids.includes(id);
    const nuevosIds = agregado ? [...ids, id] : ids.filter(item => item !== id);

    try {
      localStorage.setItem(clave, JSON.stringify(nuevosIds));
      return agregado;
    } catch (error) {
      console.error('No fue posible guardar el favorito:', error);
      return false;
    }
  },

  quitarFavorito(idProducto) {
    const sesion = ApiAutenticacion.obtenerSesion();
    const id = Number(idProducto);
    if (!sesion || !sesion.correo || !Number.isFinite(id)) {
      return { exito: false, mensaje: 'Inicia sesión para administrar tus favoritos.' };
    }
    const clave = this._claveFavoritos(sesion.correo);
    const ids = this.obtenerIdsFavoritos().filter(item => item !== id);
    try {
      localStorage.setItem(clave, JSON.stringify(ids));
      return { exito: true };
    } catch (error) {
      return { exito: false, mensaje: 'No fue posible actualizar tus favoritos.' };
    }
  },

  // Devuelve los objetos completos de los productos favoritos que siguen publicados.
  obtenerProductosFavoritos() {
    const idsFavoritos = this.obtenerIdsFavoritos();
    if (!idsFavoritos.length) return [];
    const conjuntoIds = new Set(idsFavoritos);
    return this.obtenerTodosLosProductos().filter(p => conjuntoIds.has(Number(p.id)));
  }
};

ApiProductos.inicializarDefecto();