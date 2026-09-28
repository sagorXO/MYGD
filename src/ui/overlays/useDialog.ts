"use client";

import { useEffect, useRef, type RefObject } from "react";
import { lockScroll, popDialog, pushDialog, shouldHandleKey, unlockScroll } from "./dialogStack";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function useDialog(open: boolean, onClose: () => void): RefObject<HTMLDivElement | null> {
  const panel = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const id = Symbol("dialog");
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    pushDialog(id);
    lockScroll(document.body.style);
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (!shouldHandleKey(e, id)) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const head = items[0];
      const tail = items[items.length - 1];
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      popDialog(id);
      unlockScroll(document.body.style);
      previous?.focus();
    };
  }, [open]);

  return panel;
}
