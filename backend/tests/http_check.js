const http = require('http');
const fs = require('fs');
const opts = { hostname: '127.0.0.1', port: 9000, path: '/api/usuarios', method: 'GET' };
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
