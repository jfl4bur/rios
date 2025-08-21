const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { dbPath } = require('../db/sqlite');
const sqlite3 = require('sqlite3').verbose();

// GET /api/rios
router.get('/', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.all('SELECT * FROM rios', (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    return res.json(rows);
  });
});

// POST /api/rios
const { optional } = require('../middleware/firebaseAuth');
const { createRiosSchema } = require('../validation/riosSchema');
// use optional auth for route creation so tests and unauthenticated clients can create entries
router.post('/', optional, (req, res) => {
  // Validate body with Joi
  const { error, value } = createRiosSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) {
    return res.status(400).json({ error: 'Validation failed', details: error.details.map(d => ({ path: d.path, message: d.message })) });
  }
  // Replace req.body with validated/normalized value for downstream logic
  req.body = value;
  // Accept multiple aliases from clients (e.g., mobile uses 'title')
  const nombre = req.body.nombre || req.body.title || '';
  const descripcion = req.body.descripcion || req.body.description || '';
  const categoria = req.body.categoria || 'general';
  const dificultad = req.body.dificultad || req.body.dificulty || 'medio';
  const duracion_estimada = req.body.duracion_estimada || req.body.duracion_estimated || null;

  const geometryIn = req.body.geometry;
  const waypoints = req.body.waypoints;
  const MAX_WAYPOINTS = Number(process.env.MAX_WAYPOINTS || 200);
  const multimedia = req.body.multimedia;
  const MAX_MEDIA = Number(process.env.MAX_MEDIA || 20);

  // Reject too many waypoints early
  if (Array.isArray(waypoints) && waypoints.length > MAX_WAYPOINTS) {
    return res.status(422).json({ error: `Too many waypoints (max=${MAX_WAYPOINTS})` });
  }
  // Reject too many multimedia items
  if (Array.isArray(multimedia) && multimedia.length > MAX_MEDIA) {
    return res.status(422).json({ error: `Too many multimedia items (max=${MAX_MEDIA})` });
  }
  const latIn = req.body.lat;
  const lngIn = req.body.lng;

  function isNumberFinite(v) {
    return v !== null && v !== undefined && !Number.isNaN(Number(v)) && Number.isFinite(Number(v));
  }

  // Normalize geometry into valid GeoJSON (Point or LineString) or null
  let normalized = null;
  try {
    if (geometryIn && typeof geometryIn === 'object' && geometryIn.type) {
      // Accept GeoJSON Point and LineString
      if (geometryIn.type === 'Point' && Array.isArray(geometryIn.coordinates) && geometryIn.coordinates.length >= 2) {
        const lon = Number(geometryIn.coordinates[0]);
        const lat = Number(geometryIn.coordinates[1]);
        if (!isNumberFinite(lon) || !isNumberFinite(lat)) return res.status(400).json({ error: 'Invalid geometry coordinates' });
        normalized = { type: 'Point', coordinates: [lon, lat] };
      } else if (geometryIn.type === 'LineString' && Array.isArray(geometryIn.coordinates)) {
        const coords = [];
        for (const c of geometryIn.coordinates) {
          if (!Array.isArray(c) || c.length < 2) return res.status(400).json({ error: 'Invalid LineString coordinates' });
          const lon = Number(c[0]);
          const lat = Number(c[1]);
          if (!isNumberFinite(lon) || !isNumberFinite(lat)) return res.status(400).json({ error: 'Invalid LineString coordinate values' });
          coords.push([lon, lat]);
        }
        normalized = { type: 'LineString', coordinates: coords };
      } else {
        return res.status(400).json({ error: 'Unsupported geometry type. Only Point and LineString are accepted.' });
      }
    } else if (Array.isArray(waypoints) && waypoints.length > 0) {
      // waypoints expected as [{lat:..., lng:...}, ...]
      const coords = [];
      for (const w of waypoints) {
        const lat = Number(w.lat);
        const lon = Number(w.lng);
        if (!isNumberFinite(lon) || !isNumberFinite(lat)) return res.status(400).json({ error: 'Invalid waypoint coordinates' });
        coords.push([lon, lat]);
      }
      if (coords.length === 1) normalized = { type: 'Point', coordinates: coords[0] };
      else normalized = { type: 'LineString', coordinates: coords };
    } else if (isNumberFinite(latIn) && isNumberFinite(lngIn)) {
      // Accept lat/lng top-level values
      normalized = { type: 'Point', coordinates: [Number(lngIn), Number(latIn)] };
    } else {
      // geometry not provided; allow null geometry but warn client
      normalized = null;
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid geometry payload' });
  }

  // Representative lat/lng for quick queries (use first coord for LineString)
  let repLat = null;
  let repLng = null;
  if (normalized && normalized.type === 'Point' && Array.isArray(normalized.coordinates)) {
    repLng = normalized.coordinates[0];
    repLat = normalized.coordinates[1];
  } else if (normalized && normalized.type === 'LineString' && Array.isArray(normalized.coordinates) && normalized.coordinates.length > 0) {
    repLng = normalized.coordinates[0][0];
    repLat = normalized.coordinates[0][1];
  }

  const id = uuidv4();
  const db = new sqlite3.Database(dbPath);
  db.run(
    'INSERT INTO rios (id,nombre,descripcion,categoria,dificultad,duracion_estimada,geometry,lat,lng) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, nombre, descripcion, categoria, dificultad, duracion_estimada, normalized ? JSON.stringify(normalized) : null, repLat, repLng],
    function (err) {
      db.close();
      if (err) return res.status(500).json({ error: err.message });
      return res.status(201).json({ id, geometry: normalized });
    }
  );
});

// GET /api/rios/:id/gpx  -> export simple GPX for a route
router.get('/:id/gpx', (req, res) => {
  const id = req.params.id;
  const db = new sqlite3.Database(dbPath);
  db.get('SELECT * FROM rios WHERE id = ?', [id], (err, row) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });

    let geom = null;
    try {
      geom = row.geometry ? JSON.parse(row.geometry) : null;
    } catch (e) {
      geom = null;
    }

    function esc(s) {
      if (!s && s !== 0) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }

    const name = esc(row.nombre || 'ruta');
    const desc = esc(row.descripcion || '');

    let gpx = '<?xml version="1.0" encoding="UTF-8"?>\\n';
    gpx += '<gpx version="1.1" creator="rios-backend" xmlns="http://www.topografix.com/GPX/1/1">\\n';
    gpx += `  <metadata><name>${name}</name><desc>${desc}</desc></metadata>\\n`;

    if (geom && geom.type === 'LineString' && Array.isArray(geom.coordinates)) {
      gpx += '  <trk>\\n';
      gpx += `    <name>${name}</name>\\n`;
      gpx += '    <trkseg>\\n';
      for (const c of geom.coordinates) {
        const lon = c[0];
        const lat = c[1];
        gpx += `      <trkpt lat=\"${lat}\" lon=\"${lon}\"></trkpt>\\n`;
      }
      gpx += '    </trkseg>\\n';
      gpx += '  </trk>\\n';
    } else if (geom && geom.type === 'Point' && Array.isArray(geom.coordinates)) {
      const lon = geom.coordinates[0];
      const lat = geom.coordinates[1];
      gpx += `  <wpt lat=\"${lat}\" lon=\"${lon}\"><name>${name}</name></wpt>\\n`;
    } else {
      // fallback: no geometry, return minimal gpx with name only
      gpx += `  <wpt lat=\"0\" lon=\"0\"><name>${name}</name><desc>No geometry available</desc></wpt>\\n`;
    }

    gpx += '</gpx>\\n';

    res.setHeader('Content-Type', 'application/gpx+xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=\"${name}.gpx\"`);
    return res.send(gpx);
  });
});

module.exports = router;
          if (coords.length === 1) normalized = { type: 'Point', coordinates: coords[0] };
