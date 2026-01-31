CREATE DATABASE IF NOT EXISTS turnos;
USE turnos;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  rol ENUM('admin', 'user') DEFAULT 'user',
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  fecha DATE,
  hora TIME,
  estado ENUM('pendiente', 'confirmado', 'cancelado') DEFAULT 'pendiente',
  usuario_id INT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS configuracion (
    id INT PRIMARY KEY DEFAULT 1,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    CONSTRAINT unica_fila CHECK (id = 1)
);

-- INSERT del Admin con el hash que TU sistema reconoce (Email: admin@amdin.com | Password original: admin123)
INSERT INTO usuarios (nombre, email, password, rol) 
VALUES ('Admin', 'admin@admin.com', '$2b$10$eC9mzko7OtnmWf742Jwzl.Fl0zcJsRJGBkY4YRzL1bakTIU8ij75K', 'admin')
ON DUPLICATE KEY UPDATE password = VALUES(password), rol = VALUES(rol);

INSERT INTO configuracion (id, hora_inicio, hora_fin) 
VALUES (1, '09:00:00', '19:00:00')
ON DUPLICATE KEY UPDATE id=id;

-- Usuario de prueba (Email: user@test.com | Password original: user123)
INSERT INTO usuarios (nombre, email, password, rol) 
VALUES ('Juan Perez', 'user@test.com', '$2b$10$tQh.dKC7wTjhB4ANdyAEDe8K/8kkJVepPnFQkrGrOxmbOPMBiaOfm', 'user')
ON DUPLICATE KEY UPDATE id=id;
