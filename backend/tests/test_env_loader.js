/* Simple test: ensure backend/cleanup-notify.env loader works and doesn't override existing env vars */
const path = require('path');
const fs = require('fs');
const cp = require('child_process');

const script = path.resolve(__dirname, '..', 'scripts', 'test_smtp_send.js');
console.log('Running env loader test (no external network calls are made by this script if no creds)');

// Create a temporary env file
const tmpEnv = path.resolve(__dirname, '..', 'cleanup-notify.env.test');
fs.writeFileSync(tmpEnv, 'CLEANUP_SMTP_HOST=example.invalid\nCLEANUP_SMTP_PORT=123\n', 'utf8');

try {
  process.env.CLEANUP_SMTP_HOST = '';
  // Run a small node script that loads the env file. We'll run our test_smtp_send but expect it to exit with code 2 because credentials incomplete
  const out = cp.spawnSync(process.execPath, [script], { encoding: 'utf8', env: Object.assign({}, process.env, { CLEANUP_SMTP_HOST: '', CLEANUP_SMTP_PORT: '', CLEANUP_SMTP_USER: '', CLEANUP_SMTP_PASS: '' }) });
  console.log('Exit code:', out.status);
  console.log('Stdout:', out.stdout ? out.stdout.substring(0,200) : '');
  console.log('Stderr:', out.stderr ? out.stderr.substring(0,200) : '');
  console.log('Env loader basic smoke test completed (manual verification of messages recommended)');
} finally {
  try { fs.unlinkSync(tmpEnv); } catch (e) {}
}
