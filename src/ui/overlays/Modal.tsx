"use client";

import { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "@/ui/actions/IconButton";
import { useDialog } from "./useDialog";

const SIZE = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" } as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: keyof typeof SIZE;
  footer?: ReactNode;
  children: ReactNode;
}

export function Modal({ open, onClose, title, size = "md", footer, children }: ModalProps) {
  const titleId = useId();
  const panel = useDialog(open, onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div aria-hidden className="absolute inset-0 bg-[var(--brand-black)] opacity-50" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn("animate-in relative flex max-h-[90vh] w-full flex-col rounded-lg bg-surface-raised text-text shadow-3 focus:outline-none", SIZE[size])}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <IconButton icon={X} label="Close" size="sm" onClick={onClose} />
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
