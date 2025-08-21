const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { startServer } = require('../index');

function postJson(pathname, port, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = { method: 'POST', hostname: '127.0.0.1', port, path: pathname, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
    const req = http.request(opts, (res) => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(pathname, port) {
  return new Promise((resolve, reject) => {
    const opts = { method: 'GET', hostname: '127.0.0.1', port, path: pathname };
    const req = http.request(opts, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

function insertRow(dbPath, row) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.run(
      'INSERT INTO rios (id,nombre,descripcion,categoria,dificultad,duracion_estimada,geometry,lat,lng) VALUES (?,?,?,?,?,?,?,?,?)',
      [row.id, row.nombre, row.descripcion, row.categoria, row.dificultad, row.duracion_estimada, JSON.stringify(row.geometry), row.lat, row.lng],
      function (err) {
        db.close();
        if (err) reject(err); else resolve(this.lastID);
      }
    );
  });
}

test('GET /api/rios paginated returns expected items and total', async () => {
  const server = startServer(0);
  await new Promise((r) => server.once('listening', r));
  const port = server.address().port;
  const dbPath = path.join(__dirname, '..', 'data.sqlite');

  // prepare unique rows
  const baseId = 'paged-' + Date.now() + '-' + Math.floor(Math.random()*10000);
  const rows = [
    { id: baseId + '-1', nombre: 'r1', descripcion: '', categoria: 't', dificultad: 'b', duracion_estimada: null, geometry: { type: 'Point', coordinates: [ -3.0, 40.0 ] }, lat: 40.0, lng: -3.0 },
    { id: baseId + '-2', nombre: 'r2', descripcion: '', categoria: 't', dificultad: 'b', duracion_estimada: null, geometry: { type: 'Point', coordinates: [ -3.1, 40.1 ] }, lat: 40.1, lng: -3.1 },
    { id: baseId + '-3', nombre: 'r3', descripcion: '', categoria: 't', dificultad: 'b', duracion_estimada: null, geometry: { type: 'Point', coordinates: [ -3.2, 40.2 ] }, lat: 40.2, lng: -3.2 }
  ];

  for (const r of rows) await insertRow(dbPath, r);

  const res = await getJson('/api/rios?page=1&limit=2', port);
  assert.strictEqual(res.status, 200);
  const body = JSON.parse(res.body);
  assert.strictEqual(body.page, 1);
  assert.strictEqual(body.limit, 2);
  assert.strictEqual(body.total >= 3, true);
  assert.strictEqual(Array.isArray(body.items), true);
  assert.ok(body.items.length <= 2);

  server.close();
});
