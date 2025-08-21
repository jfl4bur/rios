const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const cwd = path.resolve(__dirname, '..');
const dummyScript = path.join(cwd, 'scripts', 'start_dummy_server.js');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, Object.assign({ cwd, stdio: 'inherit' }, opts));
    p.on('close', (code) => code === 0 ? resolve() : reject(new Error('Exit '+code)));
  });
}

(async () => {
  try {
    // ensure DB
    console.log('Ensuring test DB...');
    await run('node', ['scripts/create_test_db.js']);

    // try to start dummy server in background
    console.log('Starting dummy server...');
    const dummy = spawn('node', [dummyScript], { cwd, detached: true, stdio: 'ignore' });
    dummy.unref();

    // wait a bit for server to be ready
    await new Promise(r => setTimeout(r, 800));

    // run tests
    console.log('Running tests...');
    await run('node', ['--test', './tests/index.test.js']);

    console.log('Tests finished');
    process.exit(0);
  } catch (err) {
    console.error('test_local_all failed:', err);
    process.exit(1);
  }
})();
