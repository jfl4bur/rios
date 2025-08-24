import React, { useEffect, useState } from 'react'
import axios from 'axios'
import CreateRuta from './CreateRuta'
import RutasList from './RutasList'

export default function App() {
  const [rios, setRios] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [viewMode, setViewMode] = useState('both') // 'list' | 'map' | 'both'

  const fetchRios = () => {
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:9000';
    axios.get(`${base}/api/rios`).then(r => {
      const data = r && r.data
      if (Array.isArray(data)) setRios(data)
      else if (data && Array.isArray(data.items)) setRios(data.items)
      else setRios([])
    }).catch((err) => { console.error('fetch /api/rios failed', err); setRios([]) })
  }

  useEffect(() => {
    fetchRios()
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Panel Admin — Rutas y Ríos</h1>
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={() => setShowForm(s => !s)}
        >{showForm ? 'Cerrar formulario' : 'Crear nueva ruta'}</button>
      </div>

      {showForm && (
        <div className="mb-6">
          <CreateRuta onCreated={() => { setShowForm(false); fetchRios() }} />
        </div>
      )}

      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <label className="text-sm">Ver:</label>
          <select value={viewMode} onChange={e => setViewMode(e.target.value)} className="border px-2 py-1 rounded">
            <option value="both">Mapa + Lista</option>
            <option value="map">Mapa</option>
            <option value="list">Lista</option>
          </select>
        </div>
        <RutasList items={rios} mode={viewMode} />
      </div>
    </div>
  )
}
