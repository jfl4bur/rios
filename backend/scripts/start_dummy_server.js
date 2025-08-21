const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (req.method === 'POST' && parsed.pathname === '/api/multimedia/upload') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({ ok: true, id: 'local-mock' }));
    });
    return;
  }
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({ ok: true }));
});

const port = process.env.DUMMY_PORT ? Number(process.env.DUMMY_PORT) : 9000;
server.listen(port, '127.0.0.1', () => console.log(`dummy server listening on ${port}`));

module.exports = server;
