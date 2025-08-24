import React from 'react';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded shadow max-w-sm">
        <h3 className="font-bold">{title || 'Confirmar'}</h3>
        <p className="my-2">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1" onClick={onCancel}>Cancelar</button>
          <button className="px-3 py-1 bg-red-500 text-white" onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}
