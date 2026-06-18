import { useState, useCallback } from 'react';

/**
 * Minimal toast state manager.
 *
 * Returns { toast, showToast, hideToast }
 *   showToast(message, type?) — 'success' | 'error' | 'info'
 *   hideToast()
 *   toast — pass as spread props to <Toast {...toast} onClose={hideToast} />
 */
export default function useToast() {
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((t) => ({ ...t, message: '' }));
  }, []);

  return { toast, showToast, hideToast };
}
