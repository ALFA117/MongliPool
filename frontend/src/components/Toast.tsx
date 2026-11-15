import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from "react";
import { CheckCircle, X } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
}

interface ToastCtx {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastCtx>({ show: () => {} });

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastBubble key={t.id} message={t.message} onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastBubble({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 bg-pool-card border border-pool-border border-l-4 border-l-pool-green rounded-md pl-4 pr-1 py-1 shadow-hard-sm transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <CheckCircle size={16} className="text-pool-green flex-shrink-0" />
      <span className="text-[15px] text-pool-text py-2">{message}</span>
      <button onClick={onDismiss} aria-label="Cerrar" className="w-11 h-11 flex items-center justify-center text-pool-muted hover:text-pool-text cursor-pointer">
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
