const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { startServer } = require('../index');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const port = 0; // let OS pick an available port
let server;
let urlBase;

function postJSON(pathName, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const opts = {
      method: 'POST',
      hostname: '127.0.0.1',
      port: server.address().port,
      path: pathName,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        // Bypass firebaseAuth.required by not sending Authorization header; tests run with optional middleware
      }
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function queryDb(sql, params = []) {
  const dbPath = path.join(__dirname, '..', 'data.sqlite');
  const db = new sqlite3.Database(dbPath);
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) reject(err); else resolve(rows);
    });
  });
}

test('POST /api/rios accepts Point geometry', async (t) => {
  server = startServer(0);
  await new Promise((r) => server.once('listening', r));

  const payload = {
    title: 'Test Point',
    description: 'Point geometry test',
    geometry: { type: 'Point', coordinates: [-3.0, 40.0] }
  };

  const res = await postJSON('/api/rios', payload);
  assert.strictEqual(res.status, 201, 'Expected 201 Created');

  const rows = await queryDb('SELECT * FROM rios WHERE nombre = ?', ['Test Point']);
  assert.ok(rows.length >= 1, 'Row should be inserted');
  const geom = rows[0].geometry ? JSON.parse(rows[0].geometry) : null;
  assert.strictEqual(geom.type, 'Point');

  server.close();
});

test('POST /api/rios accepts LineString via waypoints', async (t) => {
  server = startServer(0);
  await new Promise((r) => server.once('listening', r));

  const payload = {
    title: 'Test Line',
    waypoints: [{ lat: 40.0, lng: -3.0 }, { lat: 40.1, lng: -3.1 }]
  };

  const res = await postJSON('/api/rios', payload);
  assert.strictEqual(res.status, 201);

  const rows = await queryDb('SELECT * FROM rios WHERE nombre = ?', ['Test Line']);
  assert.ok(rows.length >= 1);
  const geom = rows[0].geometry ? JSON.parse(rows[0].geometry) : null;
  assert.strictEqual(geom.type, 'LineString');
  assert.ok(Array.isArray(geom.coordinates) && geom.coordinates.length === 2);

  server.close();
});

test('POST /api/rios rejects invalid geometry', async (t) => {
  server = startServer(0);
  await new Promise((r) => server.once('listening', r));

  const payload = {
    title: 'Bad Geo',
    geometry: { type: 'Polygon', coordinates: [] }
  };

  const res = await postJSON('/api/rios', payload);
  assert.strictEqual(res.status, 400);

  server.close();
});

test('POST /api/rios rejects too many waypoints', async (t) => {
  server = startServer(0);
  await new Promise((r) => server.once('listening', r));

  const many = [];
  for (let i = 0; i < 300; i++) many.push({ lat: 40 + i * 0.0001, lng: -3 - i * 0.0001 });
  const payload = { title: 'Too many', waypoints: many };
  const res = await postJSON('/api/rios', payload);
  // default MAX_WAYPOINTS is 200
  assert.strictEqual(res.status, 422);

  server.close();
});
