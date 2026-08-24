"use client";

import React, { useEffect } from "react";

/**
 * Visual Feedback Loop: Dev helper allowing Option+Click or Alt+Click
 * to inspect components directly in development mode.
 */
export function ClickToComponent() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey) {
        document.body.classList.add("agy-inspector-active");
      }
    };

    const handleKeyUp = () => {
      document.body.classList.remove("agy-inspector-active");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return null;
}
