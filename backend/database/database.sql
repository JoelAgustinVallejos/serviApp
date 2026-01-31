-- Cambia 'sistema_turnos' por 'turnos'
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