import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const show = useCallback(
    (message, { type = 'success', action, duration } = {}) => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-2), { id, message, type, action }]);
      setTimeout(() => dismiss(id), duration ?? (action ? 6000 : 3500));
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m, o) => show(m, { ...o, type: 'success' }),
      error: (m, o) => show(m, { ...o, type: 'error' }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        // Top of the screen: never covers bottom sheets, the save bar or the bottom navigation.
        className="pointer-events-none fixed inset-x-0 top-[calc(10px+env(safe-area-inset-top))] z-[60] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className="animate-sheet pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl bg-[#17201a] px-4 py-3 text-[15px] text-white shadow-lg"
          >
            {t.type === 'error' ? (
              <AlertCircle className="size-5 shrink-0 text-[#ff9a8f]" />
            ) : (
              <CheckCircle2 className="size-5 shrink-0 text-[#7fd19c]" />
            )}
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action.onClick();
                  dismiss(t.id);
                }}
                className="rounded-md px-2 py-1 font-semibold text-[#7fd19c] hover:bg-white/10"
              >
                {t.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-mr-1 rounded-md p-1 opacity-70 hover:opacity-100"
              aria-label="બંધ કરો"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
