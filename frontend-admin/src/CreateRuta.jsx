import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'

export default function CreateRuta({ onCreated }) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [duracion, setDuracion] = useState('')
  const [waypointsText, setWaypointsText] = useState('')
  const [routePoints, setRoutePoints] = useState([]) // [[lng,lat],...]
  const [waypointsError, setWaypointsError] = useState(null)
  const mapBoxRef = useRef(null)
  const mapInstRef = useRef(null)
  const polyRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (typeof L === 'undefined' || !mapBoxRef.current) return
    // init map once
    if (!mapInstRef.current) {
      mapInstRef.current = L.map(mapBoxRef.current).setView([40, -3], 6)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OSM' }).addTo(mapInstRef.current)
      mapInstRef.current.on('click', (e) => {
        const lat = e.latlng.lat
        const lng = e.latlng.lng
        // store as [lng,lat]
        setRoutePoints(prev => {
          const next = prev.concat([[Number(lng), Number(lat)]])
          return next
        })
      })
    }

    return () => {
      try { if (mapInstRef.current) { mapInstRef.current.off(); mapInstRef.current.remove(); mapInstRef.current = null } } catch (e) {}
    }
  }, [])

  // update polyline when routePoints change
  useEffect(() => {
    const map = mapInstRef.current
    if (!map) return
    // remove existing poly
    try { if (polyRef.current) { map.removeLayer(polyRef.current); polyRef.current = null } } catch (e) {}
    // remove previous markers
    try { markersRef.current.forEach(m => { if (m && map.hasLayer && map.hasLayer(m)) map.removeLayer(m) }) } catch (e) {}
    markersRef.current = []

    if (routePoints && routePoints.length) {
      const latlngs = routePoints.map(p => [p[1], p[0]])
      polyRef.current = L.polyline(latlngs, { color: 'red' }).addTo(map)
      // create draggable markers for each point
      routePoints.forEach((p, i) => {
        const lat = p[1]
        const lng = p[0]
        const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
        // when dragged, update the corresponding point
        marker.on('drag', (ev) => {
          const pos = ev.target.getLatLng()
          setRoutePoints(prev => {
            const next = prev.slice()
            next[i] = [Number(pos.lng), Number(pos.lat)]
            return next
          })
        })
        // click marker to remove point
        marker.on('click', () => {
          setRoutePoints(prev => prev.filter((_, j) => j !== i))
        })
        markersRef.current.push(marker)
      })

      try { map.fitBounds(latlngs) } catch (e) {}
    }
  }, [routePoints])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const base = import.meta.env.VITE_API_BASE || 'http://localhost:9000';

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const parseDurationToMinutes = (d) => {
        if (d === null || d === undefined) return null
        const s = String(d).trim()
        if (!s) return null
        // support formats like "2h 30m" or "150" (minutes)
        const hMatch = s.match(/(\d+)\s*h/i)
        const mMatch = s.match(/(\d+)\s*m/i)
        if (hMatch || mMatch) {
          const hours = hMatch ? Number(hMatch[1]) : 0
          const mins = mMatch ? Number(mMatch[1]) : 0
          const total = (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(mins) ? mins : 0)
          return Number.isFinite(total) ? total : null
        }
        // plain number -> treat as minutes
        const n = Number(s)
        if (!Number.isNaN(n)) return Math.floor(n)
        // fallback: extract first number
        const anyNum = s.match(/(\d+)/)
        return anyNum ? Number(anyNum[1]) : null
      }

      const payload = {
        nombre,
        descripcion,
        categoria,
        duracion_estimada: parseDurationToMinutes(duracion)
      }

      // prefer interactive routePoints if present
      if (routePoints && routePoints.length) {
        payload.geometry = { type: 'LineString', coordinates: routePoints }
        const first = routePoints[0]
        if (Array.isArray(first) && first.length >= 2) {
          payload.lng = Number(first[0])
          payload.lat = Number(first[1])
        }
      } else if (waypointsText && waypointsText.trim()) {
        // fallback to JSON waypoints textarea
        try {
          const arr = JSON.parse(waypointsText)
          if (Array.isArray(arr) && arr.length) {
            payload.geometry = { type: 'LineString', coordinates: arr }
            const first = arr[0]
            if (Array.isArray(first) && first.length >= 2) {
              payload.lng = Number(first[0])
              payload.lat = Number(first[1])
            }
          }
        } catch (e) {
          // ignore parse errors; backend will validate
        }
      }
      await axios.post(`${base}/api/rios`, payload)
      setNombre('')
      setDescripcion('')
      setCategoria('')
      setDuracion('')
  setWaypointsText('')
  setRoutePoints([])
      if (onCreated) onCreated()
    } catch (err) {
      setError(err?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-white p-4 rounded shadow">
      <div className="mb-2">
        <label className="block text-sm font-medium">Nombre</label>
        <input className="border w-full p-2 rounded" value={nombre} onChange={e => setNombre(e.target.value)} required />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Descripción</label>
        <textarea className="border w-full p-2 rounded" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium">Categoría</label>
          <input className="border w-full p-2 rounded" value={categoria} onChange={e => setCategoria(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium">Duración estimada</label>
          <input className="border w-full p-2 rounded" value={duracion} onChange={e => setDuracion(e.target.value)} placeholder="ej: 150 (min) o 2h 30m" />
        </div>
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium">Waypoints (JSON array of [lng,lat])</label>
        <textarea className="border w-full p-2 rounded" value={waypointsText} onChange={e => {
          const v = e.target.value
          setWaypointsText(v)
          if (!v || !v.trim()) { setWaypointsError(null); return }
          try {
            const parsed = JSON.parse(v)
            if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Debe ser un array de coordenadas')
            for (const p of parsed) {
              if (!Array.isArray(p) || p.length < 2 || isNaN(Number(p[0])) || isNaN(Number(p[1]))) throw new Error('Cada punto debe ser [lng,lat]')
            }
            setWaypointsError(null)
          } catch (err) {
            setWaypointsError(err.message || 'JSON inválido')
          }
        }} placeholder='Ej: [[-3.7,40.4],[-3.68,40.42]]' />
        {waypointsError && <div className="text-red-600 text-sm mt-1">{waypointsError}</div>}
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium">Dibujar en mapa (haz clic para añadir puntos)</label>
        <div ref={mapBoxRef} style={{ height: 240, width: '100%', border: '1px solid #ddd' }} />
        <div className="flex gap-2 mt-2">
          <button type="button" className="px-2 py-1 border rounded text-sm" onClick={() => {
            // remove last point
            setRoutePoints(prev => {
              const next = prev.slice(0, -1)
              return next
            })
          }}>Deshacer punto</button>
          <button type="button" className="px-2 py-1 border rounded text-sm" onClick={() => setRoutePoints([])}>Limpiar puntos</button>
          <div className="text-xs text-gray-500 mt-1">Puntos: {routePoints.length}</div>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}

      <div className="flex items-center gap-2">
  <button className="bg-green-600 text-white px-3 py-1 rounded" disabled={loading || !!waypointsError} type="submit">{loading ? 'Creando...' : 'Crear'}</button>
        <button type="button" className="text-sm text-gray-600" onClick={() => { if (onCreated) onCreated() }}>Cancelar</button>
      </div>
    </form>
  )
}
