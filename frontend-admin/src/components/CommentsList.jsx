import React, { useEffect, useState } from 'react'
import EditModal from './EditModal'

function getApiBase() {
  if (typeof window !== 'undefined' && window.__API_BASE__) return String(window.__API_BASE__).replace(/\/$/, '')
  try { if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) return String(import.meta.env.VITE_API_BASE).replace(/\/$/, '') } catch (e) {}
  return 'http://localhost:9000'
}

function Comment({ c, onReply }) {
  return (
    <div className="border rounded p-2 mb-2">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-800">{c.texto}</div>
          <div className="text-xs text-gray-500">{c.usuario_id} · {c.creado_en}</div>
        </div>
        <div className="flex gap-2">
          <button className="text-xs text-blue-600" onClick={() => onReply(c.id)}>Responder</button>
          <button className="text-xs text-gray-600" onClick={() => c._onEdit && c._onEdit(c)}>Editar</button>
          <button className="text-xs text-red-600" onClick={() => c._onDelete && c._onDelete(c.id)}>Borrar</button>
        </div>
      </div>
      {c.children && c.children.length > 0 && (
        <div className="ml-4 mt-2">
          {c.children.map(child => <Comment key={child.id} c={child} onReply={onReply} />)}
        </div>
      )}
    </div>
  )
}

export default function CommentsList({ rioId, onPosted }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const API_BASE = getApiBase()

  async function load() {
    setErrorMsg(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/comentarios`)
      if (!res.ok) throw new Error(`Error cargando comentarios: ${res.status}`)
      const data = await res.json()
      const all = Array.isArray(data) ? data : (data.items || [])
      const filtered = all.filter(c => c.rio_id === rioId || (c.children && c.children.some(ch => ch.rio_id === rioId)))
      const withHandlers = filtered.map(c => ({ ...c }))
      function attachHandlers(node) {
        if (!node) return
        node._onEdit = (item) => { setEditTarget(item); setEditOpen(true) }
        node._onDelete = (id) => { setDeleteTargetId(id); setDeleteOpen(true) }
        if (Array.isArray(node.children)) node.children.forEach(ch => attachHandlers(ch))
      }
      withHandlers.forEach(n => attachHandlers(n))
      setComments(withHandlers)
    } catch (e) {
      console.error('Load comments err', e)
      setErrorMsg(String(e))
      setComments([])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [rioId])

  async function submitReply(e) {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    if (!text.trim()) { setErrorMsg('El comentario está vacío'); return }
    setSubmitting(true)
    try {
      const body = { rio_id: rioId, usuario_id: 'web-user', texto: text.trim(), parent_id: replyTo }
      const r = await fetch(`${API_BASE}/api/comentarios`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(body) })
      const j = await r.json().catch(()=>null)
      if (!r.ok) throw new Error((j && j.error) ? j.error : `status ${r.status}`)
      setText('')
      setReplyTo(null)
      setSuccessMsg('Comentario enviado')
      setTimeout(() => setSuccessMsg(null), 3000)
      try { if (typeof onPosted === 'function') onPosted(rioId, 1) } catch (e) { /* ignore */ }
      await load()
    } catch (err) {
      console.error(err)
      setErrorMsg(String(err))
    } finally { setSubmitting(false) }
  }

  // modal state for edit/delete
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)



  async function handleSaveEdit(text) {
    if (!editTarget) return
    await fetch(`${API_BASE}/api/comentarios/${editTarget.id}`, { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ texto: text }) })
    await load()
  }

  async function handleDeleteConfirm() {
    if (!deleteTargetId) return
    await fetch(`${API_BASE}/api/comentarios/${deleteTargetId}`, { method: 'DELETE' })
    setSuccessMsg('Comentario borrado')
    setTimeout(()=>setSuccessMsg(null),2000)
    setDeleteOpen(false)
    await load()
  }

  return (
    <div className="mt-2">
      <div className="text-sm font-medium mb-2">Comentarios</div>
  {loading && (
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <svg className="animate-spin mr-2" width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="4" stroke="#999" strokeDasharray="60" fill="none"/></svg>
          Cargando comentarios...
        </div>
      )}

  {errorMsg && <div className="text-xs text-red-600 mb-2">{errorMsg}</div>}
  {successMsg && <div className="text-xs text-green-600 mb-2">{successMsg}</div>}

      {!loading && comments.length === 0 && !errorMsg && <div className="text-xs text-gray-500">No hay comentarios</div>}

      <div>
  {comments.map(c => <Comment key={c.id} c={{...c, _onEdit: (item) => { setEditTarget(item); setEditOpen(true) }, _onDelete: (id) => { setDeleteTargetId(id); setDeleteOpen(true) }}} onReply={(id) => { setReplyTo(id); window.scrollTo && window.scrollTo({ top: 0, behavior: 'smooth' }) }} />)}
      </div>

      <form onSubmit={submitReply} className="mt-2">
        {replyTo && <div className="text-xs text-gray-600 mb-1">Respondiendo a {replyTo} <button type="button" className="ml-2 text-red-500" onClick={() => setReplyTo(null)}>Cancelar</button></div>}
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={replyTo ? 'Escribe tu respuesta...' : 'Escribe un comentario...'} className="w-full border rounded p-2 text-sm" rows={3} />
        <div className="flex justify-end mt-2">
          <button type="submit" disabled={submitting} className={`px-3 py-1 bg-blue-600 text-white rounded text-sm ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}>
            {submitting ? (
              <span className="flex items-center"><svg className="animate-spin mr-2" width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="3" stroke="#fff" strokeDasharray="60" fill="none"/></svg>Enviando...</span>
            ) : 'Enviar'}
          </button>
        </div>
      </form>

        {/* Edit modal */}
        <EditModal open={editOpen} title="Editar comentario" initialText={(editTarget && editTarget.texto) || ''} onClose={() => setEditOpen(false)} onSave={handleSaveEdit} savingLabel={'Guardar'} />

        {/* Delete confirm modal (simple) */}
        {deleteOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40" style={{ zIndex: 99998 }}>
            <div className="bg-white p-4 rounded shadow max-w-md w-full">
              <h4 className="font-semibold mb-2">Confirmar borrado</h4>
              <p className="text-sm text-gray-700 mb-4">¿Borrar este comentario?</p>
              <div className="flex justify-end gap-2">
                <button className="px-3 py-1 border rounded" onClick={() => setDeleteOpen(false)}>Cancelar</button>
                <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={handleDeleteConfirm}>Borrar</button>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
