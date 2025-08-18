import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function App() {
  const [rios, setRios] = useState([])
  useEffect(() => {
    // Vite exposes env vars via import.meta.env when prefixed with VITE_
    const base = import.meta.env.VITE_API_BASE || 'http://localhost:9000';
    axios.get(`${base}/api/rios`).then(r => setRios(r.data)).catch((err) => { console.error('fetch /api/rios failed', err); setRios([]) })
  }, [])
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Panel Admin — Rutas y Ríos</h1>
      <ul>
        {rios.map(r => (
          <li key={r.id} className="mb-2 border p-2 rounded">
            <strong>{r.nombre}</strong>
            <p>{r.descripcion}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
