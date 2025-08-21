const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { dbPath } = require('../db/sqlite');
const sqlite3 = require('sqlite3').verbose();
const { optional } = require('../middleware/firebaseAuth');
const { createRiosSchema } = require('../validation/riosSchema');

const MAX_MEDIA = process.env.MAX_MEDIA ? Number(process.env.MAX_MEDIA) : 20;
const MAX_WAYPOINTS = process.env.MAX_WAYPOINTS ? Number(process.env.MAX_WAYPOINTS) : 200;

function isNumberFinite(v) { return v !== null && v !== undefined && !Number.isNaN(Number(v)) && Number.isFinite(Number(v)); }

// GET /api/rios
router.get('/', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.all('SELECT * FROM rios', (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/rios
router.post('/', optional, (req, res) => {
  const { error, value } = createRiosSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) return res.status(400).json({ error: 'Validation failed' });
  req.body = value;

  // enforce configured limits and transform waypoints -> LineString
  if (Array.isArray(req.body.multimedia) && req.body.multimedia.length > MAX_MEDIA) {
    return res.status(422).json({ error: `Too many multimedia items (max ${MAX_MEDIA})` });
  }
  if (Array.isArray(req.body.waypoints)) {
    if (req.body.waypoints.length > MAX_WAYPOINTS) {
      return res.status(422).json({ error: `Too many waypoints (max ${MAX_WAYPOINTS})` });
    }
    // convert waypoints to LineString geometry if present
    const coords = [];
    for (const wp of req.body.waypoints) {
      if (wp && isNumberFinite(wp.lat) && isNumberFinite(wp.lng)) {
        coords.push([Number(wp.lng), Number(wp.lat)]);
      }
    }
    if (coords.length > 0) {
      // override/define geometry as LineString
      req.body.geometry = { type: 'LineString', coordinates: coords };
    }
  }

  const nombre = req.body.nombre || req.body.title || '';
  const descripcion = req.body.descripcion || req.body.description || '';
  const categoria = req.body.categoria || 'general';
  const dificultad = req.body.dificultad || req.body.dificulty || 'medio';
  const duracion_estimada = req.body.duracion_estimada || req.body.duracion_estimated || null;

  // prefer explicit lat/lng or point geometry
  let geometry = null, repLat = null, repLng = null;
  if (req.body.geometry && req.body.geometry.type === 'Point' && Array.isArray(req.body.geometry.coordinates)) {
    geometry = req.body.geometry;
    repLng = Number(geometry.coordinates[0]);
    repLat = Number(geometry.coordinates[1]);
  } else if (isNumberFinite(req.body.lat) && isNumberFinite(req.body.lng)) {
    repLat = Number(req.body.lat);
    repLng = Number(req.body.lng);
    geometry = { type: 'Point', coordinates: [repLng, repLat] };
  }

  const id = uuidv4();
  const db = new sqlite3.Database(dbPath);
  db.run(
    'INSERT INTO rios (id,nombre,descripcion,categoria,dificultad,duracion_estimada,geometry,lat,lng) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, nombre, descripcion, categoria, dificultad, duracion_estimada, geometry ? JSON.stringify(geometry) : null, repLat, repLng],
    function (err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id, geometry });
    }
  );
});

// Helper to normalize geometry for GPX export
function normalizeGeometry(g) {
  if (!g || !g.type || !Array.isArray(g.coordinates)) return null;
  const t = g.type;
  if (t === 'Point') return { type: 'Point', coordinates: g.coordinates };
  if (t === 'LineString') return { type: 'LineString', coordinates: g.coordinates };
  if (t === 'Polygon' && Array.isArray(g.coordinates) && Array.isArray(g.coordinates[0])) {
    // take first ring as line
    return { type: 'LineString', coordinates: g.coordinates[0] };
  }
  return null;
}

// GET /api/rios/:id/gpx
router.get('/:id/gpx', (req, res) => {
  const id = req.params.id;
  const db = new sqlite3.Database(dbPath);
  db.get('SELECT * FROM rios WHERE id = ?', [id], (err, row) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    let geom = null;
    try { geom = row.geometry ? JSON.parse(row.geometry) : null; } catch (e) { geom = null; }
    const name = (row.nombre || 'ruta').toString().replace(/[^a-z0-9\-_. ]/ig, '');
    let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
    gpx += '<gpx version="1.1" creator="rios-backend">\n';

    const n = normalizeGeometry(geom);
    if (n && n.type === 'LineString') {
      gpx += '  <trk>\n    <trkseg>\n';
      for (const c of n.coordinates) {
        const lon = c[0] != null ? c[0] : 0;
        const lat = c[1] != null ? c[1] : 0;
        gpx += `      <trkpt lat="${lat}" lon="${lon}"></trkpt>\n`;
      }
      gpx += '    </trkseg>\n  </trk>\n';
    } else if (n && n.type === 'Point') {
      const lon = n.coordinates[0] != null ? n.coordinates[0] : 0;
      const lat = n.coordinates[1] != null ? n.coordinates[1] : 0;
      gpx += `  <wpt lat="${lat}" lon="${lon}"><name>${name}</name></wpt>\n`;
    } else {
      gpx += `  <wpt lat="0" lon="0"><name>${name}</name></wpt>\n`;
    }
    gpx += '</gpx>\n';
    res.setHeader('Content-Type', 'application/gpx+xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${name}.gpx"`);
    res.send(gpx);
  });
});

module.exports = router;
