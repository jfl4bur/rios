const express = require('express');
const router = express.Router();
// Rutas de ejemplo para login (delegado a Firebase en producción)

router.get('/status', (req, res) => {
  res.json({ ok: true, message: 'Auth endpoint activo (usa Firebase en producción)' });
});

module.exports = router;
