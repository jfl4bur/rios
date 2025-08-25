const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false, dbPath: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run' || a === '-n') { opts.dryRun = true; }
    else if ((a === '--db' || a === '-d') && args[i+1]) { opts.dbPath = args[i+1]; i++; }
  }
  return opts;
}

const opts = parseArgs();
const projectRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(projectRoot, 'migrations');
const defaultDb = path.join(projectRoot, '..', 'data.sqlite');
const dbPath = opts.dbPath ? path.resolve(opts.dbPath) : defaultDb;

function listSqlFiles() {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
}

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
  const files = listSqlFiles();
  if (files.length === 0) {
    console.log('No migration files found in', migrationsDir);
    return;
  }

  console.log('DB path:', dbPath);
  console.log('Found', files.length, 'migration(s):');
  files.forEach(f => console.log(' -', f));

  if (opts.dryRun) {
    console.log('Dry-run mode: no migrations will be applied');
    return;
  }

  if (!fs.existsSync(dbPath)) {
    console.log('DB file does not exist, creating:', dbPath);
  }

  const db = new sqlite3.Database(dbPath);
  try {
    for (const f of files) {
      console.log('Applying', f);
      // Example of conditional skip for a known migration
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
