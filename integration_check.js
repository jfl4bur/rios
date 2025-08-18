/* integration_check.js
 Simple check that polls backend health and frontend root until they respond (timeout)
 Usage: node integration_check.js --backend http://localhost:9000 --frontend http://localhost:5173
*/
const http = require('http');
const https = require('https');

function fetch(url, timeout=5000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => { req.abort(); reject(new Error('timeout')) });
  });
}

async function waitFor(url, name, retries=20, delay=1000) {
  for (let i=0;i<retries;i++) {
    try {
      const r = await fetch(url, 2000);
      console.log(`${name} OK ${r.statusCode}`);
      return true;
    } catch (e) {
      process.stdout.write('.')
      await new Promise(r => setTimeout(r, delay));
    }
  }
  console.error(`\n${name} did not respond at ${url}`);
  return false;
}

// tiny arg parser: accepts --backend <url> and --frontend <url>
function parseArgs(argv) {
  const res = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--backend' && argv[i+1]) { res.backend = argv[++i]; continue; }
    if (a === '--frontend' && argv[i+1]) { res.frontend = argv[++i]; continue; }
  }
  return res;
}

const args = parseArgs(process.argv.slice(2));
const backend = args.backend || 'http://localhost:9000';
const frontend = args.frontend || 'http://localhost:5173';

(async ()=>{
  console.log('Checking backend:', backend);
  const b = await waitFor(backend+'/', 'Backend', 30, 1000);
  console.log('\nChecking frontend:', frontend);
  const f = await waitFor(frontend, 'Frontend', 30, 1000);
  if (b && f) process.exit(0); else process.exit(2);
})();
