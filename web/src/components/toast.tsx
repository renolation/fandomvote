import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { errorMessage } from '@/lib/error-messages';

type ToastKind = 'info' | 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}
interface ToastApi {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (err: unknown) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let seq = 0;

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const show = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = Date.now() + seq++;
      setToasts((t) => [...t, { id, message, kind }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (err) => show(errorMessage(err), 'error'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="neu-toasts">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`neu-toast ${t.kind === 'error' ? 'neu-toast--error' : t.kind === 'success' ? 'neu-toast--success' : ''}`}
            onClick={() => remove(t.id)}
          >
            <span style={{ fontSize: 17 }}>
              {t.kind === 'error' ? '✕' : t.kind === 'success' ? '✓' : 'ℹ'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
