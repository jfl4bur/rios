const http = require('http');
const fs = require('fs');
// Allow CI or local runs to override the backend URL via TEST_BACKEND env var.
// Expected format: http://hostname:port
const backendUrl = process.env.TEST_BACKEND || 'http://127.0.0.1:9000';
const u = new URL(backendUrl);
const opts = { hostname: u.hostname, port: u.port || 80, path: '/api/usuarios', method: 'GET' };
const req = http.request(opts, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('http_check.out', data);
    console.log('Wrote http_check.out');
  });
});
req.on('error', (e) => {
  fs.writeFileSync('http_check.out', 'ERROR: ' + e.message);
  console.error(e);
});
req.end();
