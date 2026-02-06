CREATE DATABASE IF NOT EXISTS turnos;
USE turnos;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  rol ENUM('admin', 'user') DEFAULT 'user',
  activo BOOLEAN DEFAULT TRUE
);

-- Tabla de Turnos
CREATE TABLE IF NOT EXISTS turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  fecha DATE,
  hora TIME,
  estado ENUM('pendiente', 'confirmado', 'cancelado') DEFAULT 'pendiente',
  usuario_id INT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de Configuración
CREATE TABLE IF NOT EXISTS configuracion (
    id INT PRIMARY KEY DEFAULT 1,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    dias_laborales TEXT,
    CONSTRAINT unica_fila CHECK (id = 1)
);

-- Tabla de Servicios (Sincronizada con el Frontend)
CREATE TABLE IF NOT EXISTS servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL
);

-- Tabla de Días Especiales (Faltaba en tu archivo SQL)
CREATE TABLE IF NOT EXISTS dias_especiales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    descripcion VARCHAR(255)
);

-- DATOS INICIALES PARA EL REPOSITORIO
INSERT INTO usuarios (nombre, email, password, rol) 
VALUES ('Admin Principal', 'admin@admin.com', '$2b$10$eC9mzko7OtnmWf742Jwzl.Fl0zcJsRJGBkY4YRzL1bakTIU8ij75K', 'admin')
ON DUPLICATE KEY UPDATE email=email;

INSERT INTO configuracion (id, hora_inicio, hora_fin, dias_laborales) 
VALUES (1, '09:00:00', '18:00:00', '[1,2,3,4,5]')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO servicios (nombre, precio) VALUES ('Corte Clásico', 1500.00), ('Barba', 800.00);
ALTER TABLE turnos ADD COLUMN servicio_id INT NULL;.