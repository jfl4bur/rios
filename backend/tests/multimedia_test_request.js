const http = require('http');
const fs = require('fs');
const opts = { hostname: '127.0.0.1', port: 9000, path: '/api/multimedia/test', method: 'GET' };
const req = http.request(opts, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('multimedia_test.out', data);
    console.log('Wrote multimedia_test.out');
  });
});
req.on('error', (e) => {
  fs.writeFileSync('multimedia_test.out', 'ERROR: ' + e.message);
  console.error(e);
});
req.end();
