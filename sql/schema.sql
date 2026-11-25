
-- =====================================================================
-- JaguarZon · Esquema completo de base de datos
-- MySQL 5.7+/8 · MariaDB 10.4+
-- Motor InnoDB · utf8mb4
--
-- El script se puede ejecutar varias veces: borra y recrea todo.
-- Contraseña de las 3 cuentas demo: demo1234
-- =====================================================================

CREATE DATABASE IF NOT EXISTS jaguarzon
 CHARACTER SET utf8mb4
 COLLATE utf8mb4_unicode_ci;

USE jaguarzon;
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Limpieza (orden seguro para re-ejecutar el script)
-- ---------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;
DROP VIEW IF EXISTS vw_catalogo_productos;
DROP PROCEDURE IF EXISTS sp_registrar_pedido;
DROP TABLE IF EXISTS mensajes;
DROP TABLE IF EXISTS conversaciones;
DROP TABLE IF EXISTS resenas;
DROP TABLE IF EXISTS favoritos;
DROP TABLE IF EXISTS pujas;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS producto_imagenes;
DROP TABLE IF EXISTS producto_campus;
DROP TABLE IF EXISTS bitacora_productos;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS campus;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Catálogos de apoyo
-- ---------------------------------------------------------------------
CREATE TABLE campus (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  clave VARCHAR(20) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_campus_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categorias (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  clave VARCHAR(20) NOT NULL,
  nombre VARCHAR(60) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  campus_id INT UNSIGNED NOT NULL,
  facultad VARCHAR(100) NOT NULL DEFAULT '',
  descripcion VARCHAR(350) NOT NULL DEFAULT '',
  foto_ruta VARCHAR(255) NULL DEFAULT NULL,
  puntos_frecuentes VARCHAR(180) NOT NULL DEFAULT '',
  horarios_habituales VARCHAR(150) NOT NULL DEFAULT '',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_correo (correo),
  KEY idx_usuarios_campus (campus_id),
  CONSTRAINT fk_usuarios_campus FOREIGN KEY (campus_id)
    REFERENCES campus (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Catálogo principal: productos
-- ---------------------------------------------------------------------
CREATE TABLE productos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  vendedor_id INT UNSIGNED NOT NULL,
  categoria_id INT UNSIGNED NOT NULL,
  titulo VARCHAR(90) NOT NULL,
  descripcion TEXT NOT NULL,
  modalidad ENUM('fijo','subasta') NOT NULL DEFAULT 'fijo',
  precio DECIMAL(10,2) NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 1,
  cierre_subasta DATETIME NULL DEFAULT NULL,
  estado ENUM('activa','agotado','vendido','cerrada') NOT NULL DEFAULT 'activa',
  punto_entrega VARCHAR(255) NOT NULL DEFAULT '',
  horarios_entrega VARCHAR(255) NOT NULL DEFAULT '',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_productos_vendedor (vendedor_id),
  KEY idx_productos_categoria (categoria_id),
  KEY idx_productos_estado (estado),
  KEY idx_productos_titulo (titulo),
  CONSTRAINT fk_productos_vendedor FOREIGN KEY (vendedor_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id)
    REFERENCES categorias (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Campus de entrega de cada producto
CREATE TABLE producto_campus (
  producto_id INT UNSIGNED NOT NULL,
  campus_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (producto_id, campus_id),
  KEY idx_pc_campus (campus_id),
  CONSTRAINT fk_pc_producto FOREIGN KEY (producto_id)
    REFERENCES productos (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pc_campus FOREIGN KEY (campus_id)
    REFERENCES campus (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Imágenes de productos
CREATE TABLE producto_imagenes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id INT UNSIGNED NOT NULL,
  ruta VARCHAR(255) NOT NULL,
  mime VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
  tamano INT UNSIGNED NOT NULL DEFAULT 0,
  orden TINYINT UNSIGNED NOT NULL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pi_producto (producto_id),
  CONSTRAINT fk_pi_producto FOREIGN KEY (producto_id)
    REFERENCES productos (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Pedidos, pujas, favoritos, reseñas y mensajería
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id INT UNSIGNED NOT NULL,
  comprador_id INT UNSIGNED NOT NULL,
  vendedor_id INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL DEFAULT 1,
  total DECIMAL(10,2) NOT NULL,
  punto_entrega VARCHAR(255) NOT NULL DEFAULT 'Por acordar',
  horario_entrega VARCHAR(255) NOT NULL DEFAULT 'Por acordar',
  estado ENUM('pendiente','completado','cancelado') NOT NULL DEFAULT 'pendiente',
  origen ENUM('compra','subasta') NOT NULL DEFAULT 'compra',
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pedidos_producto (producto_id),
  KEY idx_pedidos_comprador (comprador_id),
  KEY idx_pedidos_vendedor (vendedor_id),
  CONSTRAINT fk_pedidos_producto FOREIGN KEY (producto_id)
    REFERENCES productos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_pedidos_comprador FOREIGN KEY (comprador_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_pedidos_vendedor FOREIGN KEY (vendedor_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pujas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pujas_producto (producto_id),
  KEY idx_pujas_usuario (usuario_id),
  CONSTRAINT fk_pujas_producto FOREIGN KEY (producto_id)
    REFERENCES productos (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_pujas_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE favoritos (
  usuario_id INT UNSIGNED NOT NULL,
  producto_id INT UNSIGNED NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (usuario_id, producto_id),
  KEY idx_fav_producto (producto_id),
  CONSTRAINT fk_fav_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_fav_producto FOREIGN KEY (producto_id)
    REFERENCES productos (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE resenas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pedido_id INT UNSIGNED NOT NULL,
  vendedor_id INT UNSIGNED NOT NULL,
  comprador_id INT UNSIGNED NOT NULL,
  estrellas TINYINT UNSIGNED NOT NULL,
  comentario VARCHAR(500) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_resenas_pedido (pedido_id),
  KEY idx_resenas_vendedor (vendedor_id),
  KEY idx_resenas_comprador (comprador_id),
  CONSTRAINT fk_resenas_pedido FOREIGN KEY (pedido_id)
    REFERENCES pedidos (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_resenas_vendedor FOREIGN KEY (vendedor_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_resenas_comprador FOREIGN KEY (comprador_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE conversaciones (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id INT UNSIGNED NOT NULL,
  comprador_id INT UNSIGNED NOT NULL,
  vendedor_id INT UNSIGNED NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_conv_producto_comprador (producto_id, comprador_id),
  KEY idx_conv_comprador (comprador_id),
  KEY idx_conv_vendedor (vendedor_id),
  CONSTRAINT fk_conv_producto FOREIGN KEY (producto_id)
    REFERENCES productos (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_conv_comprador FOREIGN KEY (comprador_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_conv_vendedor FOREIGN KEY (vendedor_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE mensajes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  conversacion_id INT UNSIGNED NOT NULL,
  emisor_id INT UNSIGNED NOT NULL,
  texto VARCHAR(500) NOT NULL,
  leido TINYINT(1) NOT NULL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_msg_conversacion (conversacion_id),
  KEY idx_msg_emisor (emisor_id),
  CONSTRAINT fk_msg_conversacion FOREIGN KEY (conversacion_id)
    REFERENCES conversaciones (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_msg_emisor FOREIGN KEY (emisor_id)
    REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Bitácora de cambios de productos
-- ---------------------------------------------------------------------
CREATE TABLE bitacora_productos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id INT UNSIGNED NOT NULL,
  accion ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  titulo VARCHAR(90) NOT NULL,
  precio_anterior DECIMAL(10,2) NULL DEFAULT NULL,
  precio_nuevo DECIMAL(10,2) NULL DEFAULT NULL,
  stock_anterior INT UNSIGNED NULL DEFAULT NULL,
  stock_nuevo INT UNSIGNED NULL DEFAULT NULL,
  estado_anterior VARCHAR(20) NULL DEFAULT NULL,
  estado_nuevo VARCHAR(20) NULL DEFAULT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bitacora_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Vista: catálogo consolidado
-- ---------------------------------------------------------------------
CREATE VIEW vw_catalogo_productos AS
SELECT
  p.id,
  p.titulo,
  p.descripcion,
  p.modalidad,
  p.precio,
  p.stock,
  p.cierre_subasta,
  p.estado,
  p.punto_entrega,
  p.horarios_entrega,
  p.creado_en,
  c.id AS categoria_id,
  c.clave AS categoria_clave,
  c.nombre AS categoria_nombre,
  u.id AS vendedor_id,
  u.nombre AS vendedor_nombre,
  u.correo AS vendedor_correo,
  u.facultad AS vendedor_facultad,
  (SELECT GROUP_CONCAT(cp.clave ORDER BY cp.clave SEPARATOR ',')
     FROM producto_campus pc
     JOIN campus cp ON cp.id = pc.campus_id
    WHERE pc.producto_id = p.id) AS campus_claves,
  (SELECT GROUP_CONCAT(cp.nombre ORDER BY cp.nombre SEPARATOR ', ')
     FROM producto_campus pc
     JOIN campus cp ON cp.id = pc.campus_id
    WHERE pc.producto_id = p.id) AS campus_nombres,
  (SELECT pi.ruta
     FROM producto_imagenes pi
    WHERE pi.producto_id = p.id
    ORDER BY pi.orden, pi.id
    LIMIT 1) AS imagen_principal,
  (SELECT ROUND(AVG(r.estrellas), 2)
     FROM resenas r
    WHERE r.vendedor_id = u.id) AS vendedor_promedio,
  (SELECT COUNT(*)
     FROM resenas r
    WHERE r.vendedor_id = u.id) AS vendedor_total_resenas
FROM productos p
JOIN categorias c ON c.id = p.categoria_id
JOIN usuarios u ON u.id = p.vendedor_id;

-- ---------------------------------------------------------------------
-- Procedimiento almacenado: registrar pedido de compra directa
-- ---------------------------------------------------------------------
DELIMITER $$

CREATE PROCEDURE sp_registrar_pedido(
  IN p_producto_id INT UNSIGNED,
  IN p_comprador_id INT UNSIGNED,
  IN p_cantidad INT UNSIGNED,
  IN p_punto VARCHAR(255),
  IN p_horario VARCHAR(255),
  OUT p_pedido_id INT UNSIGNED
)
BEGIN
  DECLARE v_stock INT DEFAULT NULL;
  DECLARE v_precio DECIMAL(10,2) DEFAULT NULL;
  DECLARE v_vendedor INT UNSIGNED DEFAULT NULL;
  DECLARE v_modalidad VARCHAR(10) DEFAULT NULL;
  DECLARE v_estado VARCHAR(20) DEFAULT NULL;
  DECLARE v_nuevo_stock INT DEFAULT 0;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SET p_pedido_id = NULL;

  START TRANSACTION;

  SELECT stock, precio, vendedor_id, modalidad, estado
    INTO v_stock, v_precio, v_vendedor, v_modalidad, v_estado
    FROM productos
   WHERE id = p_producto_id
   FOR UPDATE;

  IF v_vendedor IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El artículo no existe.';
  END IF;

  IF v_vendedor = p_comprador_id THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No puedes comprar tu propia publicación.';
  END IF;

  IF v_modalidad <> 'fijo' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este artículo se vende por subasta y no admite compra directa.';
  END IF;

  IF v_estado <> 'activa' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La publicación ya no está disponible.';
  END IF;

  IF p_cantidad < 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cantidad debe ser mayor que cero.';
  END IF;

  IF p_cantidad > v_stock THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No hay suficiente stock disponible.';
  END IF;

  SET v_nuevo_stock = v_stock - p_cantidad;

  UPDATE productos
     SET stock = v_nuevo_stock,
         estado = IF(v_nuevo_stock = 0, 'agotado', estado)
   WHERE id = p_producto_id;

  INSERT INTO pedidos
    (producto_id, comprador_id, vendedor_id, cantidad, total,
     punto_entrega, horario_entrega, estado, origen)
  VALUES
    (p_producto_id, p_comprador_id, v_vendedor, p_cantidad,
     v_precio * p_cantidad,
     IF(p_punto = '' OR p_punto IS NULL, 'Por acordar', p_punto),
     IF(p_horario = '' OR p_horario IS NULL, 'Por acordar', p_horario),
     'pendiente', 'compra');

  SET p_pedido_id = LAST_INSERT_ID();

  COMMIT;
END$$

-- ---------------------------------------------------------------------
-- Triggers: bitácora y devolución de stock
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_productos_ai AFTER INSERT ON productos
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_productos
    (producto_id, accion, titulo, precio_nuevo, stock_nuevo, estado_nuevo)
  VALUES
    (NEW.id, 'INSERT', NEW.titulo, NEW.precio, NEW.stock, NEW.estado);
END$$

CREATE TRIGGER trg_productos_au AFTER UPDATE ON productos
FOR EACH ROW
BEGIN
  IF NOT (OLD.precio <=> NEW.precio AND OLD.stock <=> NEW.stock
          AND OLD.estado <=> NEW.estado AND OLD.titulo <=> NEW.titulo) THEN
    INSERT INTO bitacora_productos
      (producto_id, accion, titulo, precio_anterior, precio_nuevo,
       stock_anterior, stock_nuevo, estado_anterior, estado_nuevo)
    VALUES
      (NEW.id, 'UPDATE', NEW.titulo, OLD.precio, NEW.precio,
       OLD.stock, NEW.stock, OLD.estado, NEW.estado);
  END IF;
END$$

CREATE TRIGGER trg_productos_ad AFTER DELETE ON productos
FOR EACH ROW
BEGIN
  INSERT INTO bitacora_productos
    (producto_id, accion, titulo, precio_anterior, stock_anterior, estado_anterior)
  VALUES
    (OLD.id, 'DELETE', OLD.titulo, OLD.precio, OLD.stock, OLD.estado);
END$$

CREATE TRIGGER trg_pedidos_au_cancelacion AFTER UPDATE ON pedidos
FOR EACH ROW
BEGIN
  IF OLD.estado = 'pendiente' AND NEW.estado = 'cancelado' AND NEW.origen = 'compra' THEN
    UPDATE productos
       SET stock = stock + OLD.cantidad,
           estado = IF(estado = 'agotado', 'activa', estado)
     WHERE id = NEW.producto_id;
  END IF;
END$$

DELIMITER ;

-- ---------------------------------------------------------------------
-- Datos iniciales
-- ---------------------------------------------------------------------
INSERT INTO campus (id, clave, nombre) VALUES
  (1, 'exactas', 'Campus de Ciencias Exactas e Ingenierías'),
  (2, 'salud', 'Campus de Ciencias de la Salud'),
  (3, 'sociales', 'Campus de Ciencias Sociales y Humanidades'),
  (4, 'biologicas', 'Campus de Ciencias Biológicas y Agropecuarias'),
  (5, 'arquitectura', 'Campus de Arquitectura, Hábitat y Arte');

INSERT INTO categorias (id, clave, nombre) VALUES
  (1, 'libros', 'Libros'),
  (2, 'laboratorio', 'Material de laboratorio'),
  (3, 'electronica', 'Electrónica'),
  (4, 'papeleria', 'Papelería'),
  (5, 'uniformes', 'Uniformes'),
  (6, 'otros', 'Otros');

-- Contraseña de las cuentas demo: demo1234
INSERT INTO usuarios
  (id, nombre, correo, password_hash, campus_id, facultad, descripcion)
VALUES
  (1, 'Ana Sofía Martínez', 'a21000001@alumnos.uady.mx',
   '$2y$10$D/TZd6qFyYJ2p1eljpxl..kGt.dt3xdpf1GA1MStX4zz/HZbckOZi',
   1, 'Facultad de Ingeniería (FIUADY)', 'Cuenta de demostración de JaguarZon.'),
  (2, 'Luis Fernando R.', 'a21000002@alumnos.uady.mx',
   '$2y$10$D/TZd6qFyYJ2p1eljpxl..kGt.dt3xdpf1GA1MStX4zz/HZbckOZi',
   1, 'Facultad de Matemáticas (FMAT)', 'Cuenta de demostración de JaguarZon.'),
  (3, 'Valeria C.', 'a21000003@alumnos.uady.mx',
   '$2y$10$D/TZd6qFyYJ2p1eljpxl..kGt.dt3xdpf1GA1MStX4zz/HZbckOZi',
   2, 'Facultad de Química', 'Cuenta de demostración de JaguarZon.');

INSERT INTO productos
  (id, vendedor_id, categoria_id, titulo, descripcion, modalidad,
   precio, stock, cierre_subasta, estado, punto_entrega, horarios_entrega)
VALUES
  (101, 1, 1, 'Cálculo de una Variable - James Stewart (8ª Ed.)',
   'Libro en excelente estado, sin páginas subrayadas ni roturas. Ideal para Cálculo Diferencial e Integral en FIUADY o FMAT.',
   'fijo', 350.00, 2, NULL, 'activa',
   'Campus Exactas — Cafetería FIUADY, Campus Exactas — Entrada Biblioteca Central, Campus Exactas — Explanada FMAT',
   'Lunes y Miércoles: 11:00 AM – 12:00 PM, Martes y Jueves: 2:00 PM – 3:00 PM'),

  (102, 2, 3, 'Kit Arduino Uno R3 + Protoboard y Sensores',
   'Kit completo usado un solo semestre. Incluye placa Uno R3, cable USB, protoboard, jumpers y sensor ultrasónico.',
   'subasta', 280.00, 1, DATE_ADD(NOW(), INTERVAL 7 DAY), 'activa',
   'Campus Exactas — Cafetería FIUADY, Campus Salud — Biblioteca',
   'Viernes: 12:00 PM – 2:00 PM'),

  (103, 3, 2, 'Bata de Laboratorio 100% Algodón Talla M',
   'Bata reglamentaria de algodón grueso, sin manchas de reactivos. Talla mediana.',
   'fijo', 220.00, 1, NULL, 'activa',
   'Campus Salud — Explanada Medicina, Campus Salud — Cafetería Química',
   'Lunes a Jueves: 1:00 PM – 2:30 PM');

INSERT INTO producto_campus (producto_id, campus_id) VALUES
  (101, 1), (102, 1), (102, 2), (103, 2);

INSERT INTO producto_imagenes (producto_id, ruta, mime, tamano, orden) VALUES
  (101, 'assets/images/image-placeholder.jpg', 'image/jpeg', 0, 0),
  (102, 'assets/images/image-placeholder.jpg', 'image/jpeg', 0, 0),
  (103, 'assets/images/image-placeholder.jpg', 'image/jpeg', 0, 0);

-- Un pedido completado con reseña
INSERT INTO pedidos
  (id, producto_id, comprador_id, vendedor_id, cantidad, total,
   punto_entrega, horario_entrega, estado, origen)
VALUES
  (1, 101, 2, 1, 1, 350.00,
   'Campus Exactas — Cafetería FIUADY',
   'Lunes y Miércoles: 11:00 AM – 12:00 PM',
   'completado', 'compra');

INSERT INTO resenas
  (pedido_id, vendedor_id, comprador_id, estrellas, comentario)
VALUES
  (1, 1, 2, 5, 'Excelente vendedora, el libro estaba tal como lo describió.');