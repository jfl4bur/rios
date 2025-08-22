const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

function waitForPort(port, host = '127.0.0.1', timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      const sock = new net.Socket();
      sock.once('error', () => {
        sock.destroy();
        if (Date.now() - start > timeout) return reject(new Error('timeout'));
        setTimeout(check, 100);
      });
      sock.once('connect', () => {
        sock.end();
        resolve();
      });
      sock.connect(port, host);
    })();
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
