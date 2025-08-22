const url = process.env.DATABASE_URL;
if (url) {
  // Use pg
  const { Client } = require('pg');
  const client = new Client({ connectionString: url });
  client.connect().catch(err => console.error('PG connect error', err));

  module.exports = {
    query: (text, params) => client.query(text, params),
    close: () => client.end()
  };
} else {
  // Fallback to sqlite3
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = process.env.SQLITE_DB_PATH || path.resolve(__dirname, '..', 'data.sqlite');
  const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) console.error('SQLite open error', err);
  });

  const runAsync = (sql, params=[]) => new Promise((resolve, reject) => db.run(sql, params, function(err) {
    if (err) return reject(err); resolve({ lastID: this.lastID, changes: this.changes });
  }));
  const allAsync = (sql, params=[]) => new Promise((resolve, reject) => db.all(sql, params, (err, rows) => {
    if (err) return reject(err); resolve(rows);
  }));

  module.exports = {
    query: (text, params=[]) => {
      // Simple mapping: SELECT -> allAsync, others -> runAsync
      const t = text.trim().toUpperCase();
      if (t.startsWith('SELECT')) return allAsync(text, params);
      return runAsync(text, params);
    },
    close: () => db.close()
  };
}
