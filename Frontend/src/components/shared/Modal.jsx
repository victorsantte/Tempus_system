import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl w-full ${widths[size]} p-8`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="text-xl font-serif mb-6">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

export function ModalActions({ onCancel, onConfirm, confirmLabel = 'Salvar', loading = false }) {
  return (
    <div className="flex justify-end gap-3 mt-8">
      <button
        type="button"
        onClick={onCancel}
        className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition"
      >
        Cancelar
      </button>
      <button
        type="submit"
        onClick={onConfirm}
        disabled={loading}
        className="px-6 py-2.5 bg-black text-white text-sm font-semibold rounded hover:bg-gray-800 transition disabled:opacity-60"
      >
        {loading ? 'Salvando...' : confirmLabel}
      </button>
    </div>
  );
}
