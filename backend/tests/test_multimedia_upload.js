const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function run() {
  const filePath = path.join(__dirname, 'sample.png');
  if (!fs.existsSync(filePath)) {
    console.log('Sample file not found, creating placeholder png');
    // create a small transparent png via base64
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO0Jk1cAAAAASUVORK5CYII=';
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
  }
  const form = new FormData();
  form.append('files', fs.createReadStream(filePath));
  // Try upload with a few retries to avoid transient ECONNRESET in CI
  let res;
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      res = await fetch('http://localhost:9000/api/multimedia/upload', { method: 'POST', body: form });
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
}

run().catch(e => { console.error(e); process.exit(1) });
