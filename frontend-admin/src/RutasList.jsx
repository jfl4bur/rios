import React, { useEffect, useRef, useState } from 'react'
import ConfirmModal from './components/ConfirmModal'
import CommentsList from './components/CommentsList'
import EditRutaModal from './components/EditRutaModal'

function getApiBase() {
  if (typeof window !== 'undefined' && window.__API_BASE__) return String(window.__API_BASE__).replace(/\/$/, '')
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) {
      return String(import.meta.env.VITE_API_BASE).replace(/\/$/, '')
    }
  } catch (e) { /* ignore */ }
  return 'http://localhost:9000'
}

export default function RutasList({ items, mode = 'both' }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
  if (typeof L === 'undefined' || !mapRef.current) return
    try {
      const list = Array.isArray(items) ? items : (items && Array.isArray(items.items) ? items.items : [])

      let map
      // if we have an existing map instance, ensure its container is still the current ref
      if (mapInstanceRef.current) {
        try {
          const getContainer = mapInstanceRef.current.getContainer
          const existingContainer = typeof getContainer === 'function' ? mapInstanceRef.current.getContainer() : null
          // if the map's container is not the current element, the previous container was removed (e.g. when mode='list')
          if (!existingContainer || existingContainer !== mapRef.current) {
            try { mapInstanceRef.current.remove() } catch (e) { /* ignore */ }
            mapInstanceRef.current = null
          }
        } catch (e) { /* ignore */ }
      }

      if (mapInstanceRef.current) {
        // reuse existing map instance: we'll reconcile markers instead of removing all layers
        map = mapInstanceRef.current
      } else {
        // create map once (or recreate after it was removed)
        mapRef.current.innerHTML = ''
        map = L.map(mapRef.current).setView([40, -3], 6)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(map)
        mapInstanceRef.current = map
      }

      const markersById = {}
      const allLatLngs = []

      list.forEach(it => {
        let geom = it.geometry
        if (geom && typeof geom === 'string') {
          try { geom = JSON.parse(geom) } catch (e) { geom = null }
        }
        try {
          if (geom && geom.type === 'Point') {
            const lat = geom.coordinates[1]
            const lng = geom.coordinates[0]
            const m = L.marker([lat, lng]).addTo(map).bindPopup(it.nombre || 'Ruta')
            markersById[it.id] = { marker: m, shape: m }
            allLatLngs.push([lat, lng])
          } else if (geom && geom.type === 'LineString') {
            const latlngs = geom.coordinates.map(c => [c[1], c[0]])
            const poly = L.polyline(latlngs, { color: 'blue' }).addTo(map)
            const first = latlngs[0]
            let startMarker = null
            if (first) startMarker = L.marker(first).addTo(map).bindPopup(it.nombre || 'Ruta')
            markersById[it.id] = { marker: startMarker, shape: poly }
            latlngs.forEach(p => allLatLngs.push(p))
          } else if (it.lat !== undefined && it.lng !== undefined) {
            const lat = Number(it.lat)
            const lng = Number(it.lng)
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              const m = L.marker([lat, lng]).addTo(map).bindPopup(it.nombre || 'Ruta')
              markersById[it.id] = { marker: m, shape: m }
              allLatLngs.push([lat, lng])
            }
          }
        } catch (err) {
          console.warn('Error adding feature to map for', it && it.id, err)
        }
      })

      // reconcile: remove old entries that are not present anymore
      try {
        const prev = mapInstanceRef.current.markersById || {}
        Object.keys(prev).forEach(k => { if (!markersById[k]) {
          try { if (prev[k].shape && map.removeLayer) map.removeLayer(prev[k].shape) } catch (e) {}
          try { if (prev[k].marker && map.removeLayer) map.removeLayer(prev[k].marker) } catch (e) {}
        } })
      } catch (e) { }

  mapInstanceRef.current.markersById = markersById
  window.__RUTAS_MAP__ = { map: mapInstanceRef.current, markersById }
  // also expose without underscores for easier debugging in console
  try { window.RUTAS_MAP = window.__RUTAS_MAP__ } catch (e) { /* ignore */ }
      if (allLatLngs.length) {
        try { map.fitBounds(allLatLngs) } catch (e) { /* ignore */ }
      }
      // ensure correct sizing after container visibility changes
      setTimeout(() => { try { map.invalidateSize() } catch (e) {} }, 200)
    } catch (e) { console.warn('Leaflet map error', e) }
  }, [items, mode])

  const onClickRuta = (id) => {
    try {
      const ctx = mapInstanceRef.current
      if (!ctx || !ctx.markersById) return
      const entry = ctx.markersById[id]
      if (!entry) return
      const shape = entry.shape
      const marker = entry.marker
      if (marker && marker.getLatLng) {
        const ll = marker.getLatLng()
        ctx.setView([ll.lat, ll.lng], 13)
        marker.openPopup && marker.openPopup()
      } else if (shape && shape.getLatLng) {
        const ll = shape.getLatLng()
        ctx.setView([ll.lat, ll.lng], 13)
        shape.openPopup && shape.openPopup()
      } else if (shape && shape.getBounds) {
        ctx.fitBounds(shape.getBounds())
      }
    } catch (e) { /* noop */ }
  }

  const incoming = Array.isArray(items) ? items : (items && Array.isArray(items.items) ? items.items : [])
  const [localList, setLocalList] = useState(incoming)
  useEffect(() => { setLocalList(incoming) }, [items])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTarget, setModalTarget] = useState(null)
  const [editRutaOpen, setEditRutaOpen] = useState(false)
  const [editRutaTarget, setEditRutaTarget] = useState(null)
  const [commentsCount, setCommentsCount] = useState({})
  const [commentsOpen, setCommentsOpen] = useState({})

  // fetch comments once to compute per-rio counts
  useEffect(() => {
    let cancelled = false
    async function loadCounts() {
      try {
        const API_BASE = getApiBase()
        const res = await fetch(`${API_BASE}/api/comentarios`)
        if (!res.ok) return
        const data = await res.json()
        const all = Array.isArray(data) ? data : (data.items || [])
        // flatten tree
        const flat = []
        function walk(node) {
          flat.push(node)
          if (node.children && node.children.length) node.children.forEach(walk)
        }
        all.forEach(walk)
        const map = {}
        flat.forEach(n => {
          const id = n.rio_id
          if (!id) return
          map[id] = (map[id] || 0) + 1
        })
        if (!cancelled) setCommentsCount(map)
      } catch (e) {
        // ignore
      }
    }
    loadCounts()
    return () => { cancelled = true }
  }, [items])

  useEffect(() => {
    // if map exists and is visible, ensure it resizes when mode toggles
    if (mapInstanceRef.current && mode !== 'list') {
      try { setTimeout(() => mapInstanceRef.current.invalidateSize(), 100) } catch (e) {}
    }
  }, [mode])

  return (
    <div>
      {mode !== 'list' && <div id="map" ref={mapRef} style={{ height: 300, width: '100%' }} />}
      {mode !== 'map' && (
        <ul>
          { localList.map(r => (
            <li key={r.id} className="mb-2 border p-4 rounded bg-white relative">
              <div className="absolute top-2 right-2 flex items-center">
                <button aria-label={`Editar ${r.nombre}`} title="Editar" onClick={(e) => { e.stopPropagation(); try { setEditRutaTarget(JSON.parse(JSON.stringify(r))) } catch (err) { setEditRutaTarget({ ...r }) } setEditRutaOpen(true) }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-blue-600 transition mr-2" style={{ backgroundColor: 'transparent' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ pointerEvents: 'none' }}>
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-9.793 9.793a.5.5 0 0 1-.168.11l-4 1.5a.5.5 0 0 1-.65-.65l1.5-4a.5.5 0 0 1 .11-.168L12.146.146z"/>
                  </svg>
                </button>
                <button aria-label={`Eliminar ${r.nombre}`} title="Eliminar" onClick={(e) => { e.stopPropagation(); setModalTarget(r); setModalOpen(true); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-red-600 transition" style={{ backgroundColor: 'transparent' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ pointerEvents: 'none' }}>
                    <path d="M5.5 5.5A.5.5 0 0 1 6 5h4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5v-7z"/>
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 1 1 0-2h3.11a1 1 0 0 1 .9-.6h2.98a1 1 0 0 1 .9.6H14.5a1 1 0 0 1 1 1zm-3.118-.5a.5.5 0 0 0-.494-.5H5.112a.5.5 0 0 0-.494.5L4.5 3h6l-.118-.5z"/>
                  </svg>
                </button>
              </div>
              <div>
                <div onClick={() => onClickRuta(r.id)} className="cursor-pointer">
                  <strong className="block text-lg">{r.nombre}</strong>
                  <p className="text-sm text-gray-700">{r.descripcion}</p>
                  <div className="text-xs text-gray-500 mt-1">Categoria: {r.categoria || '—'} — Duración: {r.duracion_estimada || '—'}</div>
                </div>
                <div className="mt-2">
                  <button type="button" onClick={() => setCommentsOpen(prev => ({ ...prev, [r.id]: !prev[r.id] }))} className="text-sm text-blue-600">
                    {commentsOpen[r.id] ? 'Contraer' : 'Expandir'} comentarios ({commentsCount[r.id] || 0})
                  </button>
                  {commentsOpen[r.id] && (
                    <div className="mt-2">
                      <CommentsList rioId={r.id} onPosted={(rioId, delta) => setCommentsCount(prev => ({ ...prev, [rioId]: (prev[rioId]||0) + (delta||1) }))} />
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal open={modalOpen} target={modalTarget} onClose={() => { setModalOpen(false); setModalTarget(null) }} onDeleted={(id) => setLocalList(prev => prev.filter(x => x.id !== id))} />
      {editRutaOpen && (
        <EditRutaModal
          open={editRutaOpen}
          target={editRutaTarget}
          onClose={() => { setEditRutaOpen(false); setEditRutaTarget(null) }}
          onSave={async (payload, id) => {
            const targetId = id || (editRutaTarget && (editRutaTarget.id || editRutaTarget._id))
            if (!targetId) { console.warn('[RutasList] no targetId, aborting save'); return }
            const API_BASE = getApiBase()
            // guard: ensure editRutaTarget matches the id we're about to save
            const currentOpenId = editRutaTarget && (editRutaTarget.id || editRutaTarget._id)
            if (currentOpenId && currentOpenId !== targetId) {
        console.warn('[RutasList] detected editRutaTarget mismatch, aborting save')
              // refresh state to the intended target from localList if available
              const intended = localList.find(x => x.id === targetId)
              if (intended) try { setEditRutaTarget(JSON.parse(JSON.stringify(intended))) } catch(e) { setEditRutaTarget(intended) }
              return
            }
            // send full payload to backend
            const res = await fetch(`${API_BASE}/api/rios/${targetId}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
            if (!res.ok) throw new Error('Update failed: ' + res.status)
            // optimistic update: merge provided fields into local item
            setLocalList(prev => {
              const updated = prev.map(x => x.id===targetId ? { ...x, ...payload, // ensure geometry parsed for UI
                geometry: payload.geometry !== undefined ? (typeof payload.geometry === 'string' ? (() => { try { return JSON.parse(payload.geometry) } catch(e){ return payload.geometry } })() : payload.geometry) : x.geometry
              } : x)
              return updated
            })
          }}
          savingLabel={'Guardar'}
        />
      )}
    </div>
  )
}
