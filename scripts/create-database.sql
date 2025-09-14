-- Script para crear la base de datos MySQL
CREATE DATABASE IF NOT EXISTS debt_tracker;
USE debt_tracker;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  roles JSON NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  totalDebt DECIMAL(10,2) DEFAULT 0,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

-- Tabla de deudas
CREATE TABLE IF NOT EXISTS debts (
  id VARCHAR(255) PRIMARY KEY,
  clientId VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  createdBy VARCHAR(255) NOT NULL,
  createdAt DATETIME NOT NULL,
  isPaid BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(255) PRIMARY KEY,
  clientId VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  receivedBy VARCHAR(255) NOT NULL,
  createdAt DATETIME NOT NULL,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (receivedBy) REFERENCES users(id)
);

-- Insertar usuario administrador por defecto
INSERT IGNORE INTO users (id, name, email, password, phone, roles, createdAt, updatedAt) VALUES 
('1', 'Administrador', 'admin@debttracker.com', 'admin123', '1234567890', '["admin", "superadmin"]', NOW(), NOW());

-- Índices para mejorar rendimiento
CREATE INDEX idx_debts_client ON debts(clientId);
CREATE INDEX idx_payments_client ON payments(clientId);
CREATE INDEX idx_payments_date ON payments(createdAt);
CREATE INDEX idx_debts_date ON debts(createdAt);
