/*
Remove duplicate thumbnails named thumb-thumb-*.js
Usage:
  node remove_thumb_duplicates.js --dry-run
  node remove_thumb_duplicates.js

This script scans ../uploads for files starting with 'thumb-thumb-' and deletes them (unless --dry-run).
It writes a log in ../logs/thumb-duplicates-<iso>.json with details.
*/

const fs = require('fs');
const path = require('path');

const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const logsDir = path.resolve(__dirname, '..', 'logs');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

if (!fs.existsSync(uploadsDir)) {
  console.error('Uploads dir not found:', uploadsDir);
  process.exit(2);
}
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const files = fs.readdirSync(uploadsDir);
const dupPattern = /^thumb-thumb-/i;
const candidates = files.filter(f => dupPattern.test(f));

const result = { timestamp: new Date().toISOString(), dryRun, candidates: [], removed: [] };

console.log('Found', candidates.length, 'duplicate thumbnails');

for (const f of candidates) {
  const full = path.join(uploadsDir, f);
  const stat = fs.statSync(full);
  result.candidates.push({ name: f, mtime: stat.mtime.toISOString(), size: stat.size });
}

if (dryRun) {
  console.log('Dry-run mode: no files will be deleted.');
} else {
  for (const c of result.candidates) {
    try {
      const p = path.join(uploadsDir, c.name);
      fs.unlinkSync(p);
      console.log('Deleted', c.name);
      result.removed.push({ name: c.name, mtime: c.mtime });
    } catch (e) {
      console.error('Failed to delete', c.name, e && e.message);
    }
  }
}

const logPath = path.join(logsDir, `thumb-duplicates-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
fs.writeFileSync(logPath, JSON.stringify(result, null, 2), 'utf8');
console.log('Log written to', logPath);

process.exit(0);
