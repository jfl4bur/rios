const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const { dbPath } = require('../db/sqlite');

router.get('/', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.all('SELECT * FROM comentarios ORDER BY creado_en DESC LIMIT 100', (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { rio_id, usuario_id, texto } = req.body;
  const id = uuidv4();
  const db = new sqlite3.Database(dbPath);
  db.run('INSERT INTO comentarios (id, rio_id, usuario_id, texto) VALUES (?,?,?,?)', [id, rio_id, usuario_id, texto], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id });
  });
});

module.exports = router;
