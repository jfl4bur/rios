const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'data.sqlite');

function initDb() {
  const db = new sqlite3.Database(dbPath);
  // Crear tablas básicas si no existen
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT,
      email TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS rios (
      id TEXT PRIMARY KEY,
      nombre TEXT,
      descripcion TEXT,
      categoria TEXT,
      dificultad TEXT,
      duracion_estimada INTEGER,
      geometry TEXT,
      multimedia TEXT,
      lat REAL,
      lng REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS comentarios (
      id TEXT PRIMARY KEY,
      rio_id TEXT,
      usuario_id TEXT,
      texto TEXT,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });
  db.close();
}

module.exports = { initDb, dbPath };
