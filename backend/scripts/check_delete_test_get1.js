const sqlite3 = require('sqlite3').verbose();
const dbPath = require('path').join(__dirname, '..', 'data.sqlite');
const db = new sqlite3.Database(dbPath);
db.get('SELECT id FROM rios WHERE id = ?', ['test-get-1'], (err, row) => {
  if (err) { console.error('db err', err); process.exit(2); }
  if (row) {
    console.log('exists');
    db.run('DELETE FROM rios WHERE id = ?', ['test-get-1'], (e) => {
      if (e) { console.error('del err', e); process.exit(3); }
      console.log('deleted');
      db.close();
      process.exit(0);
    });
  } else {
    console.log('notfound');
    db.close();
    process.exit(0);
  }
});
