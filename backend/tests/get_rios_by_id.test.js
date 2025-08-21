const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { startServer } = require('../index');

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

test('GET /api/rios/:id returns geometry as parsed JSON', async () => {
  const server = startServer(0);
  await new Promise((r) => server.once('listening', r));
  const port = server.address().port;
  const dbPath = path.join(__dirname, '..', 'data.sqlite');

  const id = 'test-get-1';
  const row = {
    id,
    nombre: 'GetById Test',
    descripcion: 'Test descripcion',
    categoria: 'test',
    dificultad: 'baja',
    duracion_estimada: null,
    geometry: { type: 'LineString', coordinates: [[-3.0, 40.0], [-3.1, 40.1]] },
    lat: null,
    lng: null
  };

  await insertRow(dbPath, row);

  const res = await getJson(`/api/rios/${encodeURIComponent(id)}`, port);
  assert.strictEqual(res.status, 200, 'Expected 200 OK');
  const body = JSON.parse(res.body);
  assert.ok(body.geometry, 'geometry should be present');
  assert.strictEqual(body.geometry.type, 'LineString');
  assert.ok(Array.isArray(body.geometry.coordinates));

  server.close();
});
