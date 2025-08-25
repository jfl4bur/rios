const http = require('http')

const sample = [
  {
    nombre: 'Torres del Paine - Circuito',
    descripcion: 'Circuito clásico en Torres del Paine',
    categoria: 'montaña',
    dificultad: 'alto',
    duracion_estimada: 120,
    geometry: { type: 'LineString', coordinates: [[-72.965, -50.942], [-72.985, -50.954], [-72.995, -50.96]] }
  },
  {
    nombre: 'Machu Picchu - Camino Inca',
    descripcion: 'Camino Inca hacia Machu Picchu',
    categoria: 'historia',
    dificultad: 'medio',
    duracion_estimada: 48,
    geometry: { type: 'LineString', coordinates: [[-72.533, -13.163], [-72.544, -13.166], [-72.552, -13.168]] }
  },
  {
    nombre: 'Ernesto',
    descripcion: 'Punto de prueba Ernesto',
    categoria: 'punto',
    dificultad: 'bajo',
    duracion_estimada: 1,
    geometry: { type: 'Point', coordinates: [-3.7038, 40.4168] }
  }
]

function post(item, cb) {
  const data = JSON.stringify(item)
  const options = {
    hostname: 'localhost',
    port: 9000,
    path: '/api/rios',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }
  const req = http.request(options, (res) => {
    let body = ''
    res.on('data', (chunk) => body += chunk)
    res.on('end', () => {
      cb(null, res.statusCode, body)
    })
  })
  req.on('error', (e) => cb(e))
  req.write(data)
  req.end()
}

;(async () => {
  for (const s of sample) {
    // ensure lat/lng and end_lat/end_lng are present
    const s2 = JSON.parse(JSON.stringify(s))
    try {
      if (s2.geometry && s2.geometry.type === 'LineString' && Array.isArray(s2.geometry.coordinates) && s2.geometry.coordinates.length) {
        const first = s2.geometry.coordinates[0]
        const last = s2.geometry.coordinates[s2.geometry.coordinates.length - 1]
        // coordinates are [lng, lat]
        s2.lng = first[0]; s2.lat = first[1]
        s2.end_lng = last[0]; s2.end_lat = last[1]
      } else if (s2.geometry && s2.geometry.type === 'Point' && Array.isArray(s2.geometry.coordinates)) {
        s2.lng = s2.geometry.coordinates[0]; s2.lat = s2.geometry.coordinates[1]
      }
    } catch (e) { /* ignore */ }

    await new Promise((resolve) => {
      post(s2, (err, status, body) => {
        if (err) {
          console.error('ERR', err)
        } else {
          console.log('POSTED', s2.nombre, status)
          if (!status || status < 200 || status >= 300) {
            console.log('RESPONSE BODY:', body)
          }
        }
        setTimeout(resolve, 200)
      })
    })
  }
  console.log('done')
})()
