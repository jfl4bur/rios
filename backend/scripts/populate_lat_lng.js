const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'data.sqlite');

function representativeLatLngFromGeometry(geometry) {
  if (!geometry) return null;
  try {
    const g = typeof geometry === 'string' ? JSON.parse(geometry) : geometry;
    if (!g || !g.type || !g.coordinates) return null;
    if (g.type === 'Point') {
      const [lng, lat] = g.coordinates;
      return { lat, lng };
    }
    if (g.type === 'LineString') {
      // take midpoint between first and last coordinates
      const first = g.coordinates[0];
      const last = g.coordinates[g.coordinates.length - 1];
      const lat = (first[1] + last[1]) / 2;
      const lng = (first[0] + last[0]) / 2;
      return { lat, lng };
    }
    // fallback: if MultiPoint or others, take first coordinate
    if (Array.isArray(g.coordinates) && g.coordinates.length) {
      const c = g.coordinates[0];
      if (Array.isArray(c)) {
        const lat = c[1];
        const lng = c[0];
        return { lat, lng };
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.all("SELECT id, geometry, multimedia FROM rios", async (err, rows) => {
    if (err) {
      console.error('Error selecting rios:', err);
      process.exit(1);
    }
    console.log('Found', rows.length, 'rows to inspect');
    let updates = 0;
    for (const r of rows) {
      const geom = r.geometry;
      const rep = representativeLatLngFromGeometry(geom);
      if (rep) {
        await new Promise((resolve, reject) => {
          db.run("UPDATE rios SET lat = ?, lng = ? WHERE id = ?", [rep.lat, rep.lng, r.id], function (e) {
            if (e) return reject(e);
            updates += 1;
            resolve();
          });
        });
      }
    }
    console.log('Updated rows with lat/lng:', updates);
    db.close();
  });
});
