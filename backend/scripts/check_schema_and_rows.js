const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.sqlite');

db.serialize(() => {
  db.all("PRAGMA table_info('rios')", (e, r) => {
    if (e) {
      console.error('PRAGMA error', e);
      process.exit(1);
    }
    console.log('SCHEMA:', JSON.stringify(r, null, 2));
    db.all("SELECT id, nombre, lat, lng, geometry FROM rios LIMIT 5", (err, rows) => {
      if (err) {
        console.error('SELECT error', err);
        process.exit(1);
      }
      console.log('ROWS:', JSON.stringify(rows, null, 2));
      db.close();
    });
  });
});
