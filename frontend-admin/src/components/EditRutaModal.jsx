import React, { useEffect, useState, useRef } from 'react'

// Basic GeoJSON validator used by tests and UI
export function validateGeoJSON(g) {
  try {
    if (!g) return { valid: true }
    const parsed = typeof g === 'string' ? JSON.parse(g) : g
    if (!parsed || !parsed.type) return { valid: false }
    const isNumber = (v) => typeof v === 'number' && Number.isFinite(v)
    if (parsed.type === 'Point' && Array.isArray(parsed.coordinates) && parsed.coordinates.length === 2 && isNumber(parsed.coordinates[0]) && isNumber(parsed.coordinates[1])) return { valid: true }
    if (parsed.type === 'LineString' && Array.isArray(parsed.coordinates) && parsed.coordinates.length >= 2) {
      if (parsed.coordinates.every(c => Array.isArray(c) && c.length === 2 && isNumber(c[0]) && isNumber(c[1]))) return { valid: true }
      return { valid: false }
    }
    if (parsed.type === 'Feature' && parsed.geometry) return validateGeoJSON(parsed.geometry)
    if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) return { valid: true }
    return { valid: true }
  } catch (e) { return { valid: false, error: e.message } }
}

export default function EditRutaModal({ open, target, onClose, onSave, savingLabel = 'Guardar' }) {
  const [form, setForm] = useState(target || {})
  const [saving, setSaving] = useState(false)
  const [geometryText, setGeometryText] = useState('')
  const [geometryValid, setGeometryValid] = useState(true)
  const firstInputRef = useRef(null)

  // Map/editor refs
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const drawnLayerRef = useRef({ markers: [], polyline: null, pointMarker: null })
  const renderSeqRef = useRef(0)
  const editingModeRef = useRef('none') // 'none' | 'point' | 'linestring'
  const suppressMapClickRef = useRef(false)

  // initialize form/geometry when modal opens
  useEffect(() => {
    if (open) {
      // initialize form from a deep-cloned target to avoid accidental shared mutations
      try { setForm(target ? JSON.parse(JSON.stringify(target)) : {}) } catch (e) { setForm(target || {}) }
      const geom = target && target.geometry ? target.geometry : (target && target.geometry === '' ? '' : null)
      setGeometryText(geom ? (typeof geom === 'string' ? geom : JSON.stringify(geom, null, 2)) : '')
      setGeometryValid(true)
    }
  }, [open, target])

  // also ensure form resets whenever the target id changes while modal is open
  useEffect(() => {
    if (!open) return
    const targetId = target && (target.id || target._id)
    // if targetId is falsy we still allow previous behavior
    try {
      if (targetId) {
  try { setForm(target ? JSON.parse(JSON.stringify(target)) : {}) } catch (e) { setForm(target || {}) }
  const geom = target && target.geometry ? target.geometry : (target && target.geometry === '' ? '' : null)
  setGeometryText(geom ? (typeof geom === 'string' ? geom : JSON.stringify(geom, null, 2)) : '')
  setGeometryValid(true)
      }
    } catch (e) { /* ignore */ }
  }, [open, (target && (target.id || target._id))])

  // Map initialization and cleanup
  useEffect(() => {
    if (!open) return
    const L = typeof window !== 'undefined' ? window.L : null
    if (!L || !mapContainerRef.current) return

    // create map inside modal (scoped)
    try {
      if (mapRef.current) {
        try { if (mapRef.current.remove) mapRef.current.remove() } catch (e) { /* ignore */ }
        mapRef.current = null
      }
      // ensure container is empty before creating a new map instance
      try { mapContainerRef.current.innerHTML = '' } catch (e) {}
      // reset drawn layer state
      drawnLayerRef.current = { markers: [], polyline: null, pointMarker: null }
      const map = L.map(mapContainerRef.current, { scrollWheelZoom: false }).setView([40, -3], 6)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map)
      mapRef.current = map

  // render initial geometry using the authoritative `target.geometry` when available
  const initialGeom = (() => {
        try {
          if (target && target.geometry) return (typeof target.geometry === 'string' ? JSON.parse(target.geometry) : target.geometry)
          if (geometryText && geometryText.trim()) return (typeof geometryText === 'string' ? JSON.parse(geometryText) : geometryText)
          return null
        } catch (e) { return null }
      })()
  
  // increment render sequence and render
  try { renderSeqRef.current = (renderSeqRef.current || 0) + 1 } catch (e) {}
  renderGeoOnMap(initialGeom)

      // Map click behavior depends on editing mode
      function onMapClick(e) {
        if (suppressMapClickRef.current) return
        const mode = editingModeRef.current
        if (mode === 'point') {
          // replace point
          const lat = e.latlng.lat; const lng = e.latlng.lng
          clearDrawn()
          const m = L.marker([lat, lng], { draggable: true }).addTo(map)
          m.on('dragstart', () => { suppressMapClickRef.current = true })
          m.on('dragend', () => { suppressMapClickRef.current = false; syncFromMap() })
          drawnLayerRef.current.pointMarker = m
          syncFromMap()
        } else if (mode === 'linestring') {
          const lat = e.latlng.lat; const lng = e.latlng.lng
          addVertex([lng, lat])
        }
      }

      map.on('click', onMapClick)

      // expose small helper to adjust size when modal visible
      setTimeout(() => { try { map.invalidateSize() } catch (e) {} }, 200)

      return () => {
        try { map.off('click', onMapClick) } catch (e) {}
        try { map.remove() } catch (e) {}
        mapRef.current = null
        drawnLayerRef.current = { markers: [], polyline: null, pointMarker: null }
      }
    } catch (e) {
      console.warn('Error initializing edit map', e)
    }
  }, [open])

  // If the `target` changes while modal is open (open editing another route), re-render its geometry
  useEffect(() => {
    if (!open) return
    try {
      const geom = target && target.geometry ? (typeof target.geometry === 'string' ? JSON.parse(target.geometry) : target.geometry) : null
      if (mapRef.current) renderGeoOnMap(geom)
    } catch (e) {
      // ignore parse errors here
    }
  }, [target, open])

  // helpers: clear drawn overlays
  function clearDrawn() {
    const L = typeof window !== 'undefined' ? window.L : null
    const s = drawnLayerRef.current
    try {
      if (s.pointMarker && mapRef.current) { mapRef.current.removeLayer(s.pointMarker) }
    } catch (e) {}
    try {
      if (s.polyline && mapRef.current) { mapRef.current.removeLayer(s.polyline) }
    } catch (e) {}
    try { s.markers.forEach(m => { if (mapRef.current && m) mapRef.current.removeLayer(m) }) } catch (e) {}
  drawnLayerRef.current = { markers: [], polyline: null, pointMarker: null }
  
  }

  // add a vertex for linestring mode
  function addVertex(coord, seq) {
    const L = typeof window !== 'undefined' ? window.L : null
    if (!L || !mapRef.current) return
    const s = drawnLayerRef.current
    // if a render sequence is provided, ensure this call belongs to the latest render
    if (seq !== undefined && typeof s._renderSeq !== 'undefined' && s._renderSeq !== seq) {
      // stale render, ignore
      // console.log('[EditRutaModal] addVertex ignored stale seq', seq, 'current', s._renderSeq)
      return
    }
    // if no polyline yet, create
    if (!s.polyline) {
      s.polyline = L.polyline([], { color: 'blue' }).addTo(mapRef.current)
      s.markers = []
    }
  
  // add marker for vertex
    const latlng = [coord[1], coord[0]]
    const m = L.marker(latlng, { draggable: true }).addTo(mapRef.current)
    const idx = s.markers.length
    m.on('dragstart', () => { suppressMapClickRef.current = true })
    m.on('dragend', () => {
      // update polyline after drag completes
      try {
        suppressMapClickRef.current = false
        const latlngs = s.markers.map(mm => mm.getLatLng())
        s.polyline.setLatLngs(latlngs)
        syncFromMap()
      } catch (e) {}
    })
  m.on('dblclick', () => {
      // remove this vertex
      try {
        const i = s.markers.indexOf(m)
        if (i !== -1) {
          mapRef.current.removeLayer(m)
          s.markers.splice(i, 1)
          s.polyline.setLatLngs(s.markers.map(mm => mm.getLatLng()))
          syncFromMap()
        }
      } catch (e) {}
    })
    s.markers.push(m)
    s.polyline.setLatLngs(s.markers.map(mm => mm.getLatLng()))
    syncFromMap()
  }

  // derive geojson from current map layers
  function getGeometryFromMap() {
    const s = drawnLayerRef.current
    if (s.pointMarker) {
      const ll = s.pointMarker.getLatLng()
      return { type: 'Point', coordinates: [ll.lng, ll.lat] }
    }
    if (s.polyline && s.markers && s.markers.length) {
      const coords = s.markers.map(m => {
        const ll = m.getLatLng()
        return [ll.lng, ll.lat]
      })
      return { type: 'LineString', coordinates: coords }
    }
    return null
  }

  // sync map -> geometryText
  function syncFromMap() {
    try {
      const g = getGeometryFromMap()
      if (!g) { setGeometryText(''); setGeometryValid(true); return }
      setGeometryText(JSON.stringify(g, null, 2))
      const v = validateGeoJSON(g)
      setGeometryValid(!!(v && v.valid))
    } catch (e) { /* ignore */ }
  }

  // render GeoJSON object/string onto map (replace existing)
  function renderGeoOnMap(geo) {
    const L = typeof window !== 'undefined' ? window.L : null
    if (!L || !mapRef.current) return
    clearDrawn()
    if (!geo) return
    let g = geo
    try { if (typeof geo === 'string') g = JSON.parse(geo) } catch (e) { return }
  
    if (!g) return
  if (g.type === 'Feature' && g.geometry) g = g.geometry
    if (g.type === 'Point' && Array.isArray(g.coordinates)) {
      const lat = g.coordinates[1]; const lng = g.coordinates[0]
      const m = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current)
      m.on('drag', syncFromMap)
      drawnLayerRef.current.pointMarker = m
      try { mapRef.current.setView([lat, lng], 13) } catch (e) {}
    } else if (g.type === 'LineString' && Array.isArray(g.coordinates)) {
  // set a render sequence marker so any interleaved renders won't mix vertices
  const seq = (renderSeqRef.current = (renderSeqRef.current || 0) + 1)
  drawnLayerRef.current._renderSeq = seq
  g.coordinates.forEach(c => addVertex(c, seq))
      try { if (drawnLayerRef.current.polyline) mapRef.current.fitBounds(drawnLayerRef.current.polyline.getBounds()) } catch (e) {}
    }
  }

  // when geometryText changed by user, try parse and render on map
  useEffect(() => {
    if (!open) return
    const txt = geometryText
    if (!txt || !txt.trim()) {
      setGeometryValid(true)
      clearDrawn()
      return
    }
    try {
      const parsed = typeof txt === 'string' ? JSON.parse(txt) : txt
      const v = validateGeoJSON(parsed)
      setGeometryValid(!!(v && v.valid))
      if (v && v.valid) renderGeoOnMap(parsed)
    } catch (e) {
      setGeometryValid(false)
    }
  }, [geometryText, open])

  async function _save() {
    setSaving(true)
    try {
      const payload = { ...form }
      if (geometryText && geometryText.trim()) {
        try { payload.geometry = JSON.parse(geometryText) } catch { payload.geometry = geometryText }
      } else {
        payload.geometry = undefined
      }
  // pass the id of the target being edited to onSave to avoid relying on parent state that may change
  const id = (form && (form.id || form._id)) || (target && (target.id || target._id))
  await onSave(payload, id)
      onClose && onClose()
    } catch (e) { alert('Error: ' + String(e)) } finally { setSaving(false) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" style={{ zIndex: 99999 }}>
      <div className="bg-white p-4 rounded shadow max-w-4xl w-full">
        <h3 className="text-lg font-semibold mb-2">Editar ruta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input ref={firstInputRef} className="border p-2 rounded w-full mb-2" value={form.nombre || ''} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre" />
            <textarea className="border p-2 rounded w-full mb-2" value={form.descripcion || ''} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Descripcion" rows={3} />

            <label className="text-sm text-gray-600">Geometry (GeoJSON)</label>
            <textarea id="geometry-editor" aria-label="Editor GeoJSON" className={`border p-2 rounded font-mono text-xs w-full ${geometryValid ? '' : 'ring-2 ring-red-400'}`} value={geometryText} onChange={e => setGeometryText(e.target.value)} rows={8} />
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => { editingModeRef.current = 'point' }} className="px-2 py-1 border rounded">Punto</button>
              <button type="button" onClick={() => { editingModeRef.current = 'linestring' }} className="px-2 py-1 border rounded">Trazo</button>
              <button type="button" onClick={() => { editingModeRef.current = 'none' }} className="px-2 py-1 border rounded">Bloquear edición</button>
              <button type="button" onClick={() => { clearDrawn(); setGeometryText(''); setGeometryValid(true) }} className="px-2 py-1 border rounded text-red-600">Limpiar</button>
            </div>
          </div>

          <div>
            <div ref={mapContainerRef} style={{ height: 320, width: '100%' }} className="border" />
            <div className="text-xs text-gray-500 mt-2">Haz click en el mapa según el modo seleccionado; en 'Trazo' haz doble click sobre un vértice para eliminarlo.</div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <button onClick={() => onClose && onClose()} className="px-3 py-1 border rounded">Cancelar</button>
          <button onClick={_save} disabled={saving} className="px-3 py-1 bg-blue-600 text-white rounded">{saving ? 'Guardando...' : savingLabel}</button>
        </div>
      </div>
    </div>
  )
}

