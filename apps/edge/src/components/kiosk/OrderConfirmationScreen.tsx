"use client";

import React, { useEffect, useState } from "react";
import type { CreateOrderResponse } from "@/types";
import { useLocaleStore } from "@/store/localeStore";
import { useKioskStore } from "@/store/kioskStore";
import { formatEuro, getDictionary } from "@/lib/i18n";
import { CheckCircle2, Printer, Clock, Camera, RotateCcw, QrCode, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

interface OrderConfirmationScreenProps {
  orderResponse: CreateOrderResponse;
  onStartNewOrder: () => void;
}

export function OrderConfirmationScreen({
  orderResponse,
  onStartNewOrder,
}: OrderConfirmationScreenProps) {
  const { locale } = useLocaleStore();
  const { printerType, recordInteraction } = useKioskStore();
  const dict = getDictionary(locale);

  const [countdown, setCountdown] = useState<number>(15);
  const [isPrinting, setIsPrinting] = useState<boolean>(true);
  const [printSuccess, setPrintSuccess] = useState<boolean>(false);

  // Trigger Confetti on Mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#E50D7E", "#00FCED", "#FFA000", "#FFFFFF"],
      });
    } catch {
      // ignore
    }

    const printerTimer = setTimeout(() => {
      setIsPrinting(false);
      setPrintSuccess(true);
    }, 2200);

    return () => clearTimeout(printerTimer);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onStartNewOrder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onStartNewOrder]);

  const handleManualReprint = async () => {
    recordInteraction();
    setIsPrinting(true);
    try {
      await fetch("/api/terminal/printer-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printerType }),
      });
      setTimeout(() => {
        setIsPrinting(false);
      }, 1500);
    } catch {
      setIsPrinting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full p-4 sm:p-6 text-center space-y-6">
      {/* Animated Success Badge */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-24 h-24 rounded-full bg-[#E50D7E]/20 border-2 border-[#E50D7E] flex items-center justify-center text-[#E50D7E] glow-magenta"
      >
        <CheckCircle2 size={56} className="stroke-[2.5]" />
      </motion.div>

      {/* Confirmation Title */}
      <div>
        <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight uppercase">
          {dict.confirmation.orderConfirmed}
        </h2>
        <p className="text-sm text-zinc-300 mt-1 font-medium">
          {dict.confirmation.thankYou}
        </p>
      </div>

      {/* Order Ticket Card in Electric Magenta Theme */}
      <div className="w-full bg-[#2B2B2E] border-2 border-[#E50D7E] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl glow-magenta">
        <span className="text-xs uppercase tracking-widest text-[#00FCED] font-black">
          {dict.confirmation.orderNumber}
        </span>

        {/* Giant Monospace Order Number */}
        <div className="font-mono font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-wider bg-[#1F1F21] py-4 px-3 rounded-2xl border border-[#3A3A3E] select-all">
          {orderResponse.orderNumber}
        </div>

        {/* Dynamic Estimated Wait Time & Total Paid */}
        <div className="flex items-center justify-around pt-3 text-sm border-t border-[#38383C]">
          <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
            <Clock size={16} className="text-[#00FCED]" />
            <span>~6-8 mins (Emba Grill)</span>
          </div>
          <div className="text-zinc-300 font-bold">
            Total Paid:{" "}
            <span className="text-[#E50D7E] font-mono font-black text-base ml-1">
              {formatEuro(orderResponse.totalAmount, locale)}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Photo Reminder */}
      <div className="flex items-center gap-2 text-xs text-[#00FCED] bg-[#2B2B2E] px-4 py-2.5 rounded-full border border-[#3A3A3E] font-semibold shadow">
        <Camera size={16} />
        <span>{dict.confirmation.takePhotoPrompt}</span>
      </div>

      {/* Receipt Status & Digital e-Receipt */}
      <div className="flex items-center justify-between w-full bg-[#252528] px-4 py-3 rounded-2xl border border-[#3A3A3E] text-xs">
        <div className="flex items-center gap-2 text-zinc-400">
          <Printer size={16} className={isPrinting ? "animate-pulse text-[#E50D7E]" : "text-zinc-400"} />
          <span>
            {isPrinting
              ? dict.confirmation.receiptPrinting
              : printSuccess
              ? `Printed via ${printerType}`
              : "Receipt ready"}
          </span>
        </div>

        <button
          onClick={handleManualReprint}
          disabled={isPrinting}
          className="text-xs text-[#E50D7E] hover:underline font-bold"
        >
          {dict.confirmation.receiptReprint}
        </button>
      </div>

      {/* Start New Order CTA */}
      <div className="w-full space-y-3 pt-2">
        <button
          onClick={() => {
            recordInteraction();
            onStartNewOrder();
          }}
          className="w-full py-4 px-6 rounded-2xl bg-[#E50D7E] hover:bg-[#C80B6E] text-white font-display font-black text-lg shadow-2xl glow-magenta transition-all active:scale-98 flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} />
          <span>{dict.confirmation.startNewOrder}</span>
          <span className="font-mono text-sm opacity-80">({countdown}s)</span>
        </button>
      </div>
    </div>
  );
}
