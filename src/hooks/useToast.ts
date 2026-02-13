import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: ToastAction;
  duration: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type: Toast['type'], opts?: { action?: ToastAction; duration?: number }) => string;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  showToast: () => '',
  dismissToast: () => {},
});

export function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: Toast['type'], opts?: { action?: ToastAction; duration?: number }): string => {
      const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const duration = opts?.duration ?? 3000;
      const toast: Toast = { id, message, type, action: opts?.action, duration };

      setToasts((prev) => {
        const next = [...prev, toast];
        // max 5 simultaneous
        if (next.length > 5) next.shift();
        return next;
      });

      const timer = setTimeout(() => {
        dismissToast(id);
      }, duration);
      timersRef.current.set(id, timer);

      return id;
    },
    [dismissToast],
  );

  return { toasts, showToast, dismissToast };
}

export function useToast() {
  return useContext(ToastContext);
}
