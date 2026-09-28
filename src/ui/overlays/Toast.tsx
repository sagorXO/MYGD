"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "info" | "success" | "warning" | "critical";

interface ToastInput {
  tone?: ToastTone;
  message: string;
  durationMs?: number;
}

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const TONE: Record<ToastTone, string> = {
  info: "border-l-info",
  success: "border-l-success",
  warning: "border-l-warning",
  critical: "border-l-danger",
};

const MAX_VISIBLE = 3;
const ToastContext = createContext<{ show: (t: ToastInput) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems((all) => all.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    ({ tone = "info", message, durationMs = 5000 }: ToastInput) => {
      const id = nextId.current++;
      setItems((all) => [...all.slice(-(MAX_VISIBLE - 1)), { id, tone, message }]);
      if (durationMs > 0) timers.current.set(id, setTimeout(() => dismiss(id), durationMs));
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((timer) => clearTimeout(timer));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === "critical" ? "alert" : "status"}
            className={cn("animate-in pointer-events-auto flex items-start gap-3 rounded-md border-l-4 bg-surface-raised px-4 py-3 text-sm text-text shadow-3", TONE[t.tone])}
          >
            <p className="flex-1">{t.message}</p>
            <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="text-text-subtle hover:text-text">
              <X aria-hidden width={16} height={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
