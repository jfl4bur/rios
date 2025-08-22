import React, { useEffect, useState } from 'react'
import axios from 'axios'
import CreateRuta from './CreateRuta'

export default function App() {
  const [rios, setRios] = useState([])
  const [showForm, setShowForm] = useState(false)

  const fetchRios = () => {
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:9000';
    axios.get(`${base}/api/rios`).then(r => setRios(r.data)).catch((err) => { console.error('fetch /api/rios failed', err); setRios([]) })
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

      <ul>
        {rios.map(r => (
          <li key={r.id} className="mb-2 border p-2 rounded">
            <strong className="block text-lg">{r.nombre}</strong>
            <p className="text-sm text-gray-700">{r.descripcion}</p>
            <div className="text-xs text-gray-500 mt-1">Categoria: {r.categoria || '—'} — Duración: {r.duracion_estimada || '—'}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
