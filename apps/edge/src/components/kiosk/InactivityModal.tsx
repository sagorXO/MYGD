"use client";

import React, { useEffect } from "react";
import { useKioskStore } from "@/store/kioskStore";
import { useCartStore } from "@/store/cartStore";
import { Clock, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InactivityModalProps {
  onSessionReset: () => void;
}

const INACTIVITY_TIMEOUT_MS = 60 * 1000; // 60 seconds idle before warning

export function InactivityModal({ onSessionReset }: InactivityModalProps) {
  const {
    isIdleWarningOpen,
    idleTimeRemaining,
    lastInteractionTime,
    setIdleWarning,
    recordInteraction,
    resetKioskSession,
  } = useKioskStore();
  const { clearCart } = useCartStore();

  // Watch for inactivity
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastInteractionTime;

      if (elapsed > INACTIVITY_TIMEOUT_MS && !isIdleWarningOpen) {
        setIdleWarning(true, 15);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [lastInteractionTime, isIdleWarningOpen, setIdleWarning]);

  // Countdown when modal is active
  useEffect(() => {
    if (!isIdleWarningOpen) return;

    const timer = setInterval(() => {
      if (idleTimeRemaining <= 1) {
        clearInterval(timer);
        clearCart();
        resetKioskSession();
        onSessionReset();
      } else {
        setIdleWarning(true, idleTimeRemaining - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isIdleWarningOpen, idleTimeRemaining, clearCart, resetKioskSession, onSessionReset, setIdleWarning]);

  const handleContinueOrder = () => {
    recordInteraction();
  };

  return (
    <AnimatePresence>
      {isIdleWarningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-10 w-full max-w-md bg-[#242424] border-2 border-[#FF5722] rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl glow-orange"
          >
            <div className="w-16 h-16 rounded-full bg-[#FF5722]/20 border border-[#FF5722] flex items-center justify-center text-[#FF5722] mx-auto">
              <Clock size={32} />
            </div>

            <div>
              <h3 className="font-display font-black text-2xl text-white">
                Are you still ordering?
              </h3>
              <p className="text-zinc-400 text-sm mt-2">
                Your session will reset in{" "}
                <span className="text-[#FF5722] font-mono font-bold text-lg">
                  {idleTimeRemaining}s
                </span>{" "}
                to protect your order.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleContinueOrder}
                className="w-full py-4 px-6 rounded-2xl bg-[#FF5722] hover:bg-[#E64A19] text-white font-display font-black text-base shadow-xl glow-orange transition-all active:scale-95"
              >
                I&apos;M STILL HERE — CONTINUE
              </button>

              <button
                onClick={() => {
                  clearCart();
                  resetKioskSession();
                  onSessionReset();
                }}
                className="w-full py-2.5 text-xs text-zinc-400 hover:text-white font-semibold flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} />
                <span>Cancel & Start Over</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
