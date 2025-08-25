const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { startServer } = require('../index');

async function run() {
  const srv = startServer(0);
  const addr = srv.address();
  const port = addr && addr.port ? addr.port : 9000;
  try {
    const filePath = path.join(__dirname, 'sample.png');
    if (!fs.existsSync(filePath)) {
      console.log('Sample file not found, creating placeholder png');
      // create a small transparent png via base64
      const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0Jk1cAAAAASUVORK5CYII=';
      fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
    }

    // Try upload with a few retries to avoid transient ECONNRESET in CI
    let res;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // recreate form for each attempt to avoid reusing consumed stream
        const form = new FormData();
        form.append('files', fs.createReadStream(filePath));
        const headers = form.getHeaders();
        res = await fetch(`http://127.0.0.1:${port}/api/multimedia/upload`, { method: 'POST', body: form, headers });
        if (res && res.ok) break;
      } catch (err) {
        console.warn(`Upload attempt ${attempt} failed: ${err.message}`);
      }
      // exponential backoff
      await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempt - 1)));
    }
    if (!res) throw new Error('Upload failed after retries');
    const json = await res.json();
    console.log('Upload response:', JSON.stringify(json, null, 2));
  } finally {
    await new Promise((resolve) => srv.close(resolve));
  }
}

run().catch(e => { console.error(e); process.exit(1) });
