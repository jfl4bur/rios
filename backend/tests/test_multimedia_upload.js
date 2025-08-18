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
  const res = await fetch('http://localhost:9000/api/multimedia/upload', { method: 'POST', body: form });
  const json = await res.json();
  console.log('Upload response:', JSON.stringify(json, null, 2));
}

run().catch(e => { console.error(e); process.exit(1) });
