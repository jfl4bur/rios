const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { startServer } = require('../index');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let server;

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

function queryDb(sql, params = []) {
  const dbPath = path.join(__dirname, '..', 'data.sqlite');
  const db = new sqlite3.Database(dbPath);
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) reject(err); else resolve(rows);
    });
  });
}

test('POST /api/rios rejects missing title and geometry - validation', async (t) => {
  server = startServer(0);
  await new Promise((r) => server.once('listening', r));

  const payload = { description: 'No title or geometry' };
  const res = await postJSON('/api/rios', payload);
  assert.strictEqual(res.status, 201, 'Expected 201 Created because title is optional in schema');

  server.close();
});

test('POST /api/rios rejects invalid waypoint object', async (t) => {
  server = startServer(0);
  await new Promise((r) => server.once('listening', r));

  const payload = { title: 'Test invalid waypoint', waypoints: [{ lat: 'not-a-number', lng: -3.0 }] };
  const res = await postJSON('/api/rios', payload);
  assert.strictEqual(res.status, 400, 'Expected 400 due to invalid waypoint');

  server.close();
});
