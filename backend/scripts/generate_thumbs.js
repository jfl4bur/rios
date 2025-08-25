const fs = require('fs');
const path = require('path');
const imageProcessor = require('../lib/imageProcessor');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  console.error('uploads dir missing:', uploadDir);
  process.exit(1);
}

function isImageBuffer(buf) {
  if (!buf || buf.length < 4) return false;
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true; // PNG
  if (buf[0] === 0xFF && buf[1] === 0xD8) return true; // JPEG
  const head6 = buf.slice(0, 6).toString('ascii');
  if (head6.startsWith('GIF87') || head6.startsWith('GIF89')) return true;
  if (buf.length >= 12 && buf.slice(0,4).toString('ascii') === 'RIFF' && buf.slice(8,12).toString('ascii') === 'WEBP') return true;
  return false;
}

(async ()=>{
  const files = fs.readdirSync(uploadDir);
  console.log('Found', files.length, 'files in uploads');
  for (const f of files) {
    try {
  // Ignorar archivos que ya son thumbs para evitar crear thumb-thumb-*
  if (f.startsWith('thumb-')) continue;
  const fullPath = path.join(uploadDir, f);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) continue;
      const buf = fs.readFileSync(fullPath);
      if (!isImageBuffer(buf)) continue;
      const thumbName = 'thumb-' + f.replace(/\.[^.]+$/, '.jpg');
      const thumbPath = path.join(uploadDir, thumbName);
      if (fs.existsSync(thumbPath)) {
        console.log('Thumb exists, skipping:', thumbName);
        continue;
      }
      if (!imageProcessor.isAvailable()) {
        console.log('Skipping thumbnail generation for', f, '- imageProcessor (sharp) not available');
        continue;
      }
      await imageProcessor.generateThumbnail(fullPath, thumbPath, 300);
      const tstat = fs.statSync(thumbPath);
      console.log('Created thumb for', f, '->', thumbName, 'size', tstat.size);
    } catch (e) {
      console.warn('Failed for', f, e && e.message ? e.message : e);
    }
  }
  console.log('Done');
})();
