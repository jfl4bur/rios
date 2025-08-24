import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function EditModal({ open, title, initialText, onClose, onSave, savingLabel = 'Guardar' }) {
  const [text, setText] = useState(initialText || '')
  useEffect(() => { setText(initialText || '') }, [initialText])

  // lock background scroll while modal is open
  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  const modal = (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" style={{ zIndex: 99999 }} role="dialog" aria-modal="true">
      <div className="bg-white p-4 rounded shadow max-w-md w-full" style={{ zIndex: 100000 }}>
        <h3 className="font-semibold mb-2">{title || 'Editar'}</h3>
        <textarea className="w-full border rounded p-2" rows={4} value={text} onChange={e => setText(e.target.value)} />
        <div className="flex justify-end gap-2 mt-3">
          <button className="px-3 py-1 border rounded" onClick={onClose}>Cancelar</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => onSave(text)}>{savingLabel}</button>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modal, document.body)
  }

  return modal
}
