import React, { useState } from 'react'
import axios from 'axios'

export default function CreateRuta({ onCreated }) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [duracion, setDuracion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const base = import.meta.env.VITE_API_BASE || 'http://localhost:9000';

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = {
        nombre,
        descripcion,
        categoria,
        duracion_estimada: duracion
      }
      await axios.post(`${base}/api/rios`, payload)
      setNombre('')
      setDescripcion('')
      setCategoria('')
      setDuracion('')
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
          <input className="border w-full p-2 rounded" value={duracion} onChange={e => setDuracion(e.target.value)} placeholder="2h 30m" />
        </div>
      </div>

      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}

      <div className="flex items-center gap-2">
        <button className="bg-green-600 text-white px-3 py-1 rounded" disabled={loading} type="submit">{loading ? 'Creando...' : 'Crear'}</button>
        <button type="button" className="text-sm text-gray-600" onClick={() => { if (onCreated) onCreated() }}>Cancelar</button>
      </div>
    </form>
  )
}
