-- Migration 001: initial schema for Rios

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT,
  email TEXT
);

CREATE TABLE IF NOT EXISTS rios (
  id TEXT PRIMARY KEY,
  nombre TEXT,
  descripcion TEXT,
  categoria TEXT,
  dificultad TEXT,
  duracion_estimada INTEGER,
  geometry TEXT,
  multimedia TEXT
);

CREATE TABLE IF NOT EXISTS comentarios (
  id TEXT PRIMARY KEY,
  rio_id TEXT,
  usuario_id TEXT,
  texto TEXT,
  parent_id TEXT,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rios_categoria ON rios(categoria);
CREATE INDEX IF NOT EXISTS idx_comentarios_rio ON comentarios(rio_id);
