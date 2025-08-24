const { spawn } = require('child_process');
const net = require('net');
const http = require('http');
const path = require('path');

function waitForPort(port, host = '127.0.0.1', timeout = 5000) {
  // Wait until the TCP port is open and the HTTP endpoint responds.
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function checkTcp() {
      const sock = new net.Socket();
      let settled = false;
      sock.setTimeout(1000);
      sock.once('error', () => {
        sock.destroy();
        settled = true;
        retryOrTimeout();
      });
      sock.once('timeout', () => {
        sock.destroy();
        settled = true;
        retryOrTimeout();
      });
      sock.once('connect', () => {
        sock.end();
        if (!settled) settled = true;
        // TCP open, now validate HTTP responds
        checkHttp();
      });
      sock.connect(port, host);
    }

    function checkHttp() {
      const req = http.request({ method: 'GET', host, port, path: '/', timeout: 2000 }, (res) => {
        // consider any 2xx or 3xx a good sign the server is ready
        if (res.statusCode >= 200 && res.statusCode < 400) return resolve();
        // otherwise retry
        retryOrTimeout();
      });
      req.on('timeout', () => { req.destroy(); retryOrTimeout(); });
      req.on('error', () => { retryOrTimeout(); });
      req.end();
    }

    function retryOrTimeout() {
      if (Date.now() - start > timeout) return reject(new Error('timeout'));
      setTimeout(checkTcp, 150);
    }

    checkTcp();
  });
}

async function main() {
  // Start dummy server
  const serverProcess = spawn(process.execPath, [path.join(__dirname, 'start_dummy_server.js')], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  // Ensure we shut it down on exit
  const cleanup = () => {
    try { serverProcess.kill(); } catch (e) {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => process.exit(1));

  try {
    await waitForPort(9000, '127.0.0.1', 5000);
  } catch (err) {
    console.error('Dummy server did not start in time:', err.message);
    cleanup();
    process.exit(2);
  }

  // Run tests (npm test will run node --test ./tests/index.test.js)
  const test = spawn(process.execPath, ['--test', './tests/index.test.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
  });

  test.on('close', (code) => {
    cleanup();
    process.exit(code);
  });
}

main();
