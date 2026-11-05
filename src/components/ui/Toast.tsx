"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { makeId } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, { icon: IconName; colorClass: string }> = {
  success: { icon: "checkCircle", colorClass: "text-success" },
  error: { icon: "alertCircle", colorClass: "text-danger" },
  warning: { icon: "alertTriangle", colorClass: "text-warning" },
  info: { icon: "info", colorClass: "text-primary-strong" }
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setMounted(true);
    const timerMap = timers.current;
    return () => {
      timerMap.forEach((timer) => clearTimeout(timer));
      timerMap.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = makeId();
      setToasts((current) => [...current.slice(-3), { id, message, variant }]);
      const timer = setTimeout(() => dismissToast(id), 4000);
      timers.current.set(id, timer);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div
              className="pointer-events-none fixed left-4 right-4 top-[calc(16px+var(--safe-top))] z-[100] flex flex-col gap-2 md:left-auto md:right-6 md:top-6 md:w-[380px]"
              aria-live="polite"
              aria-atomic="false"
            >
              {toasts.map((toast) => {
                const config = variantStyles[toast.variant];
                return (
                  <div
                    key={toast.id}
                    role={toast.variant === "error" ? "alert" : "status"}
                    className="neu-fade-in pointer-events-auto flex items-start gap-3 rounded-lg border border-line bg-raised p-3 shadow-neu-lg"
                  >
                    <span className={`mt-0.5 shrink-0 ${config.colorClass}`}>
                      <Icon name={config.icon} size={20} />
                    </span>
                    <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink">{toast.message}</p>
                    <button
                      type="button"
                      onClick={() => dismissToast(toast.id)}
                      aria-label="Tutup notifikasi"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-bg-sunken hover:text-ink"
                    >
                      <Icon name="x" size={15} />
                    </button>
                  </div>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast harus dipakai di dalam ToastProvider");
  }
  return context;
}
