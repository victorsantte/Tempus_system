import { useEffect } from 'react';

export default function SlidePanel({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.25)' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl w-full max-w-md flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-7 py-6 border-b border-gray-100">
          <h2 className="text-xl font-serif">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-7 py-6">
          {children}
        </div>
      </div>
    </>
  );
}

export function PanelActions({ onCancel, confirmLabel = 'Salvar', loading = false }) {
  return (
    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
      <button
        type="button"
        onClick={onCancel}
        className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded transition"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 bg-black text-white text-sm font-semibold rounded hover:bg-gray-800 transition disabled:opacity-60"
      >
        {loading ? 'Salvando...' : confirmLabel}
      </button>
    </div>
  );
}
