const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { dbPath } = require('../db/sqlite');

const migrationsDir = path.join(__dirname, '..', 'migrations');

function runMigrationFile(db, file) {
  const sql = fs.readFileSync(file, 'utf8');
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function run() {
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  const db = new sqlite3.Database(dbPath);
  try {
    for (const f of files) {
      console.log('Applying', f);
      // If the migration is the one that adds lat/lng, skip it when columns already exist
      if (f === '002_add_lat_lng.sql') {
        const hasLat = await new Promise((resolve, reject) => {
          db.all("PRAGMA table_info('rios')", (err, rows) => {
            if (err) return reject(err);
            resolve(Array.isArray(rows) && rows.some(c => c && c.name === 'lat'));
          });
        });
        if (hasLat) {
          console.log(`Skipping ${f}: 'lat' column already present`);
          continue;
        }
      }
      await runMigrationFile(db, path.join(migrationsDir, f));
    }
    console.log('Migrations applied');
  } catch (e) {
    console.error('Migration failed:', e && e.message ? e.message : e);
    process.exit(1);
  } finally {
    db.close();
  }
}

run();
