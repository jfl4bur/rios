const http = require('http')

function httpGet(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: 9000, path: pathname, method: 'GET' }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(body) }) } catch(e) { resolve({ status: res.statusCode, body: body }) } });
    });
    req.on('error', e => reject(e)); req.end();
  })
}

function httpPost(pathname, data, headers) {
  return new Promise((resolve, reject) => {
    const s = JSON.stringify(data)
    const hdrs = Object.assign({ 'Content-Type':'application/json', 'Content-Length': Buffer.byteLength(s) }, headers || {})
    const req = http.request({ hostname: 'localhost', port: 9000, path: pathname, method: 'POST', headers: hdrs }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(body) }) } catch(e) { resolve({ status: res.statusCode, body: body }) } });
    });
    req.on('error', e => reject(e)); req.write(s); req.end();
  })
}

function httpDelete(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: 9000, path: pathname, method: 'DELETE' }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(body) }) } catch(e) { resolve({ status: res.statusCode, body: body }) } });
    });
    req.on('error', e => reject(e)); req.end();
  })
}

const samples = [
  // Spain - mountain 1
  {
    nombre: 'Pico Almanzor - Circo de Gredos',
    descripcion: 'Ruta de alta montaña en la Sierra de Gredos, ascenso clásico al Pico Almanzor.',
    categoria: 'monta\u00f1a',
    dificultad: 'dificil',
    duracion_estimada: 10,
    geometry: { type: 'LineString', coordinates: [[-5.01,40.07],[-5.03,40.08],[-5.04,40.09]] }
  },
  // Spain - mountain 2
  {
    nombre: 'Picos de Europa - Cares',
    descripcion: 'Ruta del desfiladero del r\u00edo Cares, paso entre monta\u00f1as con vistas espectaculares.',
    categoria: 'monta\u00f1a',
    dificultad: 'medio',
    duracion_estimada: 8,
    geometry: { type: 'LineString', coordinates: [[-4.85,43.18],[-4.86,43.19],[-4.87,43.20]] }
  },
  // America - mountain 1
  {
    nombre: 'Aconcagua - Ruta Normal',
    descripcion: 'Ascenso por la ruta normal del Aconcagua, alta monta\u00f1a en Mendoza, Argentina.',
    categoria: 'monta\u00f1a',
    dificultad: 'dificil',
    duracion_estimada: 14,
    geometry: { type: 'LineString', coordinates: [[-69.96,-32.65],[-69.97,-32.66],[-69.98,-32.67]] }
  },
  // America - mountain 2
  {
    nombre: 'Cordillera Blanca - Santa Cruz',
    descripcion: 'Trekking de varios d\u00edas por el valle de Santa Cruz en la Cordillera Blanca, Per\u00fa.',
    categoria: 'monta\u00f1a',
    dificultad: 'medio',
    duracion_estimada: 5,
    geometry: { type: 'LineString', coordinates: [[-77.60,-8.92],[-77.62,-8.93],[-77.64,-8.95]] }
  }
]

async function main() {
  try {
    console.log('Fetching existing rutas...')
    const list = await httpGet('/api/rios')
    let items = []
    if (list && list.body) {
      if (Array.isArray(list.body)) items = list.body
      else if (Array.isArray(list.body.items)) items = list.body.items
    }
    console.log('Existing count=', items.length)

    console.log('Attempting cleanup via /api/rios/cleanup (x-dev-secret=dev-secret)')
    try {
      const cleanup = await httpPost('/api/rios/cleanup', {}, { 'x-dev-secret': process.env.DEV_CLEANUP_SECRET || 'dev-secret' })
      console.log('Cleanup response', cleanup.status, JSON.stringify(cleanup.body))
    } catch (e) { console.error('Cleanup failed', e && e.message ? e.message : e) }

    console.log('Creating new sample rutas...')
    const created = []
    for (const s of samples) {
      const payload = JSON.parse(JSON.stringify(s))
      // add lat/lng from first coord
      try {
        if (payload.geometry && payload.geometry.coordinates && payload.geometry.coordinates.length) {
          const first = payload.geometry.coordinates[0]
          payload.lng = first[0]; payload.lat = first[1]
          const last = payload.geometry.coordinates[payload.geometry.coordinates.length-1]
          payload.end_lng = last[0]; payload.end_lat = last[1]
        }
      } catch(e) {}
      // keep geometry as object (backend returns objects in GET)
      payload.geometry = payload.geometry
  // do not include multimedia (null would fail validation)
      const res = await httpPost('/api/rios', payload)
      console.log('Created', payload.nombre, 'status=', res.status, 'body=', JSON.stringify(res.body))
      if (res && res.body) created.push(res.body && res.body.id ? res.body.id : (res.body && res.body.insertId ? res.body.insertId : null))
    }

    console.log('Creating comments for each route...')
    for (const id of created) {
      if (!id) continue
      // two top-level comments
      const c1 = { rio_id: id, usuario_id: 'user_ana', texto: 'Incre\u00edble ruta, condiciones muy cambiantes en verano.' }
      const r1 = await httpPost('/api/comentarios', c1)
      console.log('Comment1', id, r1.status, JSON.stringify(r1.body))
      const c2 = { rio_id: id, usuario_id: 'user_pedro', texto: 'Gran trazado, recomiendo llevar crampones en invierno.' }
      const r2 = await httpPost('/api/comentarios', c2)
      console.log('Comment2', id, r2.status, JSON.stringify(r2.body))
      // add 2 replies to each
      if (r1 && r1.body && (r1.body.id || r1.body.insertId)) {
        const parent = r1.body.id || r1.body.insertId
        await httpPost('/api/comentarios', { rio_id: id, usuario_id: 'user_marta', texto: 'Totalmente de acuerdo, gracias por el aviso.', parent_id: parent })
        await httpPost('/api/comentarios', { rio_id: id, usuario_id: 'user_luis', texto: '\u00bfEn qu\u00e9 mes fuiste? Estoy planeando la ruta.', parent_id: parent })
      }
      if (r2 && r2.body && (r2.body.id || r2.body.insertId)) {
        const parent = r2.body.id || r2.body.insertId
        await httpPost('/api/comentarios', { rio_id: id, usuario_id: 'user_maria', texto: 'Buena recomendaci\u00f3n, a\u00f1adir\u00e9 crampones al equipo.', parent_id: parent })
        await httpPost('/api/comentarios', { rio_id: id, usuario_id: 'user_juan', texto: 'Yo fui en septiembre y la nieve estaba alta.', parent_id: parent })
      }
    }

    console.log('Seeding complete')
  } catch (e) {
    console.error('ERR', e && e.stack ? e.stack : e)
  }
}

main()
