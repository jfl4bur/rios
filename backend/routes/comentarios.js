const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const { dbPath } = require('../db/sqlite');

router.get('/', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.all('SELECT * FROM comentarios ORDER BY creado_en ASC LIMIT 1000', (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    // build nested tree: parent -> children
    const byId = {};
    (rows || []).forEach(r => { r.children = []; byId[r.id] = r });
    const roots = [];
    (rows || []).forEach(r => {
      if (r.parent_id && byId[r.parent_id]) {
        byId[r.parent_id].children.push(r);
      } else {
        roots.push(r);
      }
    });
    res.json(roots);
  });
});

router.post('/', (req, res) => {
  const { rio_id, usuario_id, texto, parent_id } = req.body;
  const id = uuidv4();
  const db = new sqlite3.Database(dbPath);
  db.run('INSERT INTO comentarios (id, rio_id, usuario_id, texto, parent_id) VALUES (?,?,?,?,?)', [id, rio_id, usuario_id, texto, parent_id || null], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id });
  });
});

// PUT /api/comentarios/:id -> update texto (and optionally usuario_id)
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const { texto, usuario_id } = req.body;
  if (!texto) return res.status(400).json({ error: 'texto required' });
  const db = new sqlite3.Database(dbPath);
  db.run('UPDATE comentarios SET texto = ?, usuario_id = ? WHERE id = ?', [texto, usuario_id || null, id], function (err) {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'not found' });
    res.json({ updated: this.changes });
  });
});

// DELETE /api/comentarios/:id -> delete comment and its immediate children
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run('DELETE FROM comentarios WHERE id = ? OR parent_id = ?', [id, id], function (err) {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }
      const deleted = this.changes || 0;
      db.close();
      return res.json({ deleted });
    });
  });
});

module.exports = router;
