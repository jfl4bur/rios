const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbFile = path.resolve(__dirname, '..', 'data.sqlite');

// Ensure directory exists
try { fs.mkdirSync(path.dirname(dbFile), { recursive: true }); } catch (e) { }

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) return console.error('Failed to open DB:', err.message);
  console.log('Opened DB:', dbFile);
});

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS usuarios (id TEXT PRIMARY KEY, nombre TEXT, email TEXT)", (err) => {
    if (err) console.error('usuarios table error:', err.message);
  });
  db.run("CREATE TABLE IF NOT EXISTS rios (id TEXT PRIMARY KEY, nombre TEXT, descripcion TEXT, categoria TEXT, dificultad TEXT, duracion_estimada INTEGER, geometry TEXT, multimedia TEXT, lat REAL, lng REAL)", (err) => {
    if (err) console.error('rios table error:', err.message);
  });
});

db.close(() => console.log('DB initialized'));
