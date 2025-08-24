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
// GET /api/rios (paginated)
router.get('/', (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.get('SELECT COUNT(*) AS cnt FROM rios', (err, countRow) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: err.message });
      }
      const total = countRow ? Number(countRow.cnt) : 0;
      db.all('SELECT * FROM rios LIMIT ? OFFSET ?', [limit, offset], (err2, rows) => {
        db.close();
        if (err2) return res.status(500).json({ error: err2.message });
        // parse geometry field for each row
        const items = rows.map(r => {
          try { r.geometry = r.geometry ? JSON.parse(r.geometry) : null; } catch(e) { r.geometry = null; }
          return r;
        });
        res.json({ items, total, page, limit });
      });
    });
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

  // prefer explicit lat/lng or point/linestring geometry
  let geometry = null, repLat = null, repLng = null;
  let endLat = null, endLng = null;
  if (req.body.geometry && Array.isArray(req.body.geometry.coordinates)) {
    if (req.body.geometry.type === 'Point') {
      geometry = req.body.geometry;
      repLng = Number(geometry.coordinates[0]);
      repLat = Number(geometry.coordinates[1]);
      endLng = repLng; endLat = repLat;
    } else if (req.body.geometry.type === 'LineString') {
      // keep linestring geometry as-is
      geometry = req.body.geometry;
      // set representative end coordinates from first and last points
      if (Array.isArray(geometry.coordinates) && geometry.coordinates.length) {
        const first = geometry.coordinates[0]
        const last = geometry.coordinates[geometry.coordinates.length - 1]
        if (Array.isArray(first) && first.length >= 2) { repLng = Number(first[0]); repLat = Number(first[1]) }
        if (Array.isArray(last) && last.length >= 2) { endLng = Number(last[0]); endLat = Number(last[1]) }
      }
    }
  } else if (isNumberFinite(req.body.lat) && isNumberFinite(req.body.lng)) {
    repLat = Number(req.body.lat);
    repLng = Number(req.body.lng);
    geometry = { type: 'Point', coordinates: [repLng, repLat] };
  }

  const id = uuidv4();
  const db = new sqlite3.Database(dbPath);
  db.run(
  'INSERT INTO rios (id,nombre,descripcion,categoria,dificultad,duracion_estimada,geometry,lat,lng,end_lat,end_lng) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
  [id, nombre, descripcion, categoria, dificultad, duracion_estimada, geometry ? JSON.stringify(geometry) : null, repLat, repLng, endLat, endLng],
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

// GET /api/rios/:id  -> return JSON record
router.get('/:id', (req, res) => {
  const id = req.params.id;
  const db = new sqlite3.Database(dbPath);
  db.get('SELECT * FROM rios WHERE id = ?', [id], (err, row) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    // try to parse geometry JSON if present
    try { row.geometry = row.geometry ? JSON.parse(row.geometry) : null; } catch (e) { row.geometry = null; }
    res.json(row);
  });
});

// DEV: cleanup all rios (protected by x-dev-secret header)
router.post('/cleanup', (req, res) => {
  try {
    const secret = process.env.DEV_CLEANUP_SECRET || 'dev-secret'
    const provided = req.headers['x-dev-secret'] || req.query && req.query.secret
    if (String(provided) !== String(secret)) {
      return res.status(403).json({ error: 'forbidden' })
    }
    const db = new sqlite3.Database(dbPath)
    db.serialize(() => {
      db.run('DELETE FROM rios', function (err) {
        if (err) {
          db.close()
          return res.status(500).json({ error: err.message })
        }
        const deleted = this.changes || 0
        // reset sqlite sequence for autos increment if present
        db.run('DELETE FROM sqlite_sequence WHERE name = ?', ['rios'], () => {
          db.close()
          return res.json({ deleted })
        })
      })
    })
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
})

// DEV: delete a single rio by id (protected by x-dev-secret header)
router.delete('/:id', (req, res) => {
  try {
    const secret = process.env.DEV_CLEANUP_SECRET || 'dev-secret'
    const provided = req.headers['x-dev-secret'] || req.query && req.query.secret
    if (String(provided) !== String(secret)) {
      return res.status(403).json({ error: 'forbidden' })
    }
    const id = req.params.id
    const db = new sqlite3.Database(dbPath)
    db.run('DELETE FROM rios WHERE id = ?', [id], function (err) {
      if (err) {
        db.close()
        return res.status(500).json({ error: err.message })
      }
      const deleted = this.changes || 0
      db.close()
      return res.json({ deleted })
    })
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
})

// PUT /api/rios/:id -> update editable fields (nombre, descripcion, categoria, duracion_estimada, dificultad, geometry, multimedia, lat/lng, end_lat/end_lng)
router.put('/:id', (req, res) => {
  try {
    const id = req.params.id
    const nombre = req.body.nombre || null
    const descripcion = req.body.descripcion || null
    const categoria = req.body.categoria || null
    const duracion_estimada = req.body.duracion_estimada !== undefined ? req.body.duracion_estimada : null
    const dificultad = req.body.dificultad || null
    // multimedia may be an array/object; store as JSON string when provided
    const multimedia = req.body.multimedia ? (typeof req.body.multimedia === 'string' ? req.body.multimedia : JSON.stringify(req.body.multimedia)) : null

    // geometry handling: accept object or string; attempt to compute representative lat/lng and end lat/lng for LineString
    let geometry = null
    let repLat = null, repLng = null, endLat = null, endLng = null
    if (req.body.geometry) {
      if (typeof req.body.geometry === 'string') {
        try { const parsed = JSON.parse(req.body.geometry); geometry = JSON.stringify(parsed) } catch (e) { geometry = req.body.geometry }
      } else {
        geometry = JSON.stringify(req.body.geometry)
      }
      try {
        const g = typeof req.body.geometry === 'string' ? JSON.parse(req.body.geometry) : req.body.geometry
        if (g && Array.isArray(g.coordinates)) {
          if (g.type === 'Point') {
            repLng = Number(g.coordinates[0])
            repLat = Number(g.coordinates[1])
          } else if (g.type === 'LineString' && g.coordinates.length) {
            const first = g.coordinates[0]
            const last = g.coordinates[g.coordinates.length - 1]
            if (first && Array.isArray(first)) { repLng = Number(first[0]); repLat = Number(first[1]) }
            if (last && Array.isArray(last)) { endLng = Number(last[0]); endLat = Number(last[1]) }
          }
        }
      } catch (e) { /* ignore geometry parse errors */ }
    }

    // allow explicit lat/lng overrides
    const lat = req.body.lat !== undefined ? req.body.lat : repLat
    const lng = req.body.lng !== undefined ? req.body.lng : repLng
    const _end_lat = req.body.end_lat !== undefined ? req.body.end_lat : endLat
    const _end_lng = req.body.end_lng !== undefined ? req.body.end_lng : endLng

    const db = new sqlite3.Database(dbPath)
    const sql = `UPDATE rios SET nombre = COALESCE(?, nombre), descripcion = COALESCE(?, descripcion), categoria = COALESCE(?, categoria), duracion_estimada = COALESCE(?, duracion_estimada), dificultad = COALESCE(?, dificultad), geometry = COALESCE(?, geometry), lat = COALESCE(?, lat), lng = COALESCE(?, lng), end_lat = COALESCE(?, end_lat), end_lng = COALESCE(?, end_lng), multimedia = COALESCE(?, multimedia) WHERE id = ?`
    const params = [nombre, descripcion, categoria, duracion_estimada, dificultad, geometry, lat, lng, _end_lat, _end_lng, multimedia, id]
    db.run(sql, params, function (err) {
      db.close()
      if (err) return res.status(500).json({ error: err.message })
      if (this.changes === 0) return res.status(404).json({ error: 'not found' })
      return res.json({ updated: this.changes })
    })
  } catch (e) {
    return res.status(500).json({ error: String(e) })
  }
})

module.exports = router;
