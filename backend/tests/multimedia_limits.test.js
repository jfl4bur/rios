const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { startServer } = require('../index');

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

test('POST /api/rios accepts multimedia within limits', async (t) => {
  server = startServer(0);
  await new Promise((r) => server.once('listening', r));

  const payload = { title: 'Test media ok', multimedia: ['http://example.com/a.jpg', 'http://example.com/b.jpg'] };
  const res = await postJSON('/api/rios', payload);
  assert.strictEqual(res.status, 201);

  server.close();
});

test('POST /api/rios rejects too many multimedia items', async (t) => {
  server = startServer(0);
  await new Promise((r) => server.once('listening', r));

  const arr = new Array(30).fill(0).map((_, i) => `http://example.com/${i}.jpg`);
  const payload = { title: 'Test media too many', multimedia: arr };
  const res = await postJSON('/api/rios', payload);
  assert.strictEqual(res.status, 422);

  server.close();
});
