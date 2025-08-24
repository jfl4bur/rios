const test = require('node:test')
const assert = require('node:assert/strict')
const { startServer } = require('../index')

test('GET / returns OK JSON from backend', async () => {
  const srv = startServer(0)
  const addr = srv.address()
  const port = addr && addr.port ? addr.port : 3090

  // fetch is global in Node 18+. Use it to query the server.
  const res = await fetch(`http://127.0.0.1:${port}/`)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.ok, true)

  await new Promise((resolve) => srv.close(resolve))
})
const fs = require('fs');
const path = require('path');

const dir = __dirname;

// Require all .js test files in this folder except this index file so node --test runs them
fs.readdirSync(dir)
  .filter(f => f.endsWith('.js') && f !== 'index.test.js')
  .forEach(f => {
    require(path.join(dir, f));
  });

// If you want to exclude certain files, add logic above.
