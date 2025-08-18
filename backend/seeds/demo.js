const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '..', 'data.sqlite');

function seed() {
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    // Usuarios demo
    const usuarios = [
      { id: 'u1', nombre: 'Demo User 1', email: 'demo1@example.com' },
      { id: 'u2', nombre: 'Demo User 2', email: 'demo2@example.com' }
    ];
    const stmtU = db.prepare('INSERT OR REPLACE INTO usuarios (id, nombre, email) VALUES (?,?,?)');
    usuarios.forEach(u => stmtU.run(u.id, u.nombre, u.email));
    stmtU.finalize();

    // Rutas demo
    const rutas = [
      { id: 'r1', nombre: 'Caminito del Rey', descripcion: 'Ruta icónica en Málaga', categoria: 'senderismo', dificultad: 'media', duracion: 180, geometry: { type: 'LineString', coordinates: [[-4.8, 36.9], [-4.7, 36.9]] } },
      { id: 'r2', nombre: 'Torres del Paine - Circuito', descripcion: 'Circuito clásico', categoria: 'senderismo', dificultad: 'alta', duracion: 360, geometry: { type: 'LineString', coordinates: [[-72.9, -50.9], [-72.8, -50.8]] } },
      { id: 'r3', nombre: 'Machu Picchu - Camino Inca', descripcion: 'Camino Inca tradicional', categoria: 'senderismo', dificultad: 'alta', duracion: 480, geometry: { type: 'LineString', coordinates: [[-72.5, -13.2], [-72.4, -13.1]] } }
    ];
    const stmtR = db.prepare('INSERT OR REPLACE INTO rios (id, nombre, descripcion, categoria, dificultad, duracion_estimada, geometry) VALUES (?,?,?,?,?,?,?)');
    rutas.forEach(r => stmtR.run(r.id, r.nombre, r.descripcion, r.categoria, r.dificultad, r.duracion, JSON.stringify(r.geometry)));
    stmtR.finalize();

    // Comentarios demo
    const comentarios = [
      { id: 'c1', rio_id: 'r1', usuario_id: 'u1', texto: 'Increíble ruta, vistas espectaculares.' },
      { id: 'c2', rio_id: 'r2', usuario_id: 'u2', texto: 'Preparar equipo adecuado, mucho viento.' }
    ];
    const stmtC = db.prepare('INSERT OR REPLACE INTO comentarios (id, rio_id, usuario_id, texto) VALUES (?,?,?,?)');
    comentarios.forEach(c => stmtC.run(c.id, c.rio_id, c.usuario_id, c.texto));
    stmtC.finalize();

    console.log('Seed demo completado');
  });
  db.close();
}

seed();
