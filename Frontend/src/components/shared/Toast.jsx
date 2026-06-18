import { useEffect } from 'react';

const CONFIG = {
  success: { icon: '✓', bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-800' },
  error:   { icon: '✕', bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-800'   },
  info:    { icon: 'ℹ', bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800'  },
};

/**
 * Toast notification.
 *
 * Usage:
 *   const { toast, showToast, hideToast } = useToast();
 *   <Toast {...toast} onClose={hideToast} />
 *
 * Props:
 *   message  — string to display (empty string = hidden)
 *   type     — 'success' | 'error' | 'info'
 *   onClose  — () => void
 *   duration — auto-dismiss ms (default 4000)
 */
export default function Toast({ message = '', type = 'info', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [message, onClose, duration]);

  if (!message) return null;

  const c = CONFIG[type] ?? CONFIG.info;

  return (
    <div
      role="alert"
      className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 ${c.bg} ${c.border} border rounded-xl shadow-lg px-4 py-3 max-w-sm`}
      style={{ animation: 'toast-in 0.2s ease' }}
    >
      <span className={`text-base font-bold ${c.text} shrink-0`}>{c.icon}</span>
      <p className={`text-sm font-medium ${c.text} leading-snug`}>{message}</p>
      <button
        onClick={onClose}
        className={`ml-1 ${c.text} opacity-60 hover:opacity-100 shrink-0 transition`}
        aria-label="Fechar"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Inline keyframe — avoids extra CSS file dependency */}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}
