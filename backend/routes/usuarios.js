const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const { dbPath } = require('../db/sqlite');

// GET /api/usuarios
router.get('/', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.all('SELECT id, nombre, email FROM usuarios', (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/usuarios/:id
router.get('/:id', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.get('SELECT id, nombre, email FROM usuarios WHERE id = ?', [req.params.id], (err, row) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(row);
  });
});

// POST /api/usuarios (crea usuario simple)
router.post('/', (req, res) => {
  const { nombre, email } = req.body;
  const id = uuidv4();
  const db = new sqlite3.Database(dbPath);
  db.run('INSERT INTO usuarios (id, nombre, email) VALUES (?,?,?)', [id, nombre, email], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id });
  });
});

module.exports = router;
