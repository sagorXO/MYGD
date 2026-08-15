"use client";

import React, { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useLocaleStore } from "@/store/localeStore";
import { useKioskStore } from "@/store/kioskStore";
import { formatEuro, getDictionary } from "@/lib/i18n";
import type { PaymentMethod, CreateOrderResponse } from "@/types";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  Radio,
  QrCode,
  CheckCircle2,
  Lock,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

interface PaymentScreenProps {
  onBackToCart: () => void;
  onPaymentSuccess: (orderResponse: CreateOrderResponse) => void;
}

export function PaymentScreen({
  onBackToCart,
  onPaymentSuccess,
}: PaymentScreenProps) {
  const { items, customerNote, getTotal, clearCart } = useCartStore();
  const { locale } = useLocaleStore();
  const { locationSlug, terminalCode, orderType, recordInteraction } = useKioskStore();
  const dict = getDictionary(locale);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("CARD");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const totalAmount = getTotal();

  const handleMethodSelect = (method: PaymentMethod) => {
    recordInteraction();
    setSelectedMethod(method);
    setErrorMessage(null);
  };

  const handleConfirmPayment = async () => {
    recordInteraction();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        locationSlug,
        terminalCode,
        orderType,
        paymentMethod: selectedMethod,
        locale,
        customerNote: customerNote || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          spiceLevel: item.spiceLevel,
          modifiers: item.modifiers.map((m) => ({ modifierId: m.modifierId })),
          isMealBundle: item.isMealBundle,
          mealDrinkName: item.mealDrinkName,
          mealSideName: item.mealSideName,
          itemNotes: item.itemNotes,
        })),
      };

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to process order");
      }

      if (data.qrDataUrl) {
        setQrDataUrl(data.qrDataUrl);
      }

      setTimeout(() => {
        clearCart();
        onPaymentSuccess(data);
      }, selectedMethod === "QR_CODE" ? 1500 : 800);
    } catch (err: unknown) {
      console.error("Payment submission error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Payment processing failed. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-6 pb-32">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#333336] pb-4">
        <button
          disabled={isSubmitting}
          onClick={() => {
            recordInteraction();
            onBackToCart();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#2B2B2E] hover:bg-[#38383C] text-zinc-300 hover:text-white border border-[#3A3A3E] font-semibold text-sm transition-all disabled:opacity-50"
        >
          <ArrowLeft size={18} />
          <span>{dict.common.back}</span>
        </button>

        <h2 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wider">
          {dict.payment.choosePayment}
        </h2>

        <div className="w-10" />
      </div>

      {/* Total Due Showcase Card in Electric Magenta */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#2B2B2E] to-[#222225] border-2 border-[#E50D7E] text-center shadow-2xl glow-magenta">
        <span className="text-xs uppercase tracking-widest text-[#00FCED] font-black">
          {dict.payment.totalDue}
        </span>
        <span className="font-display font-black text-5xl sm:text-6xl text-[#E50D7E] mt-1 font-mono tracking-tight drop-shadow-md">
          {formatEuro(totalAmount, locale)}
        </span>
        <span className="text-xs text-zinc-400 mt-2 font-medium">
          {items.length} items • Includes 19% Cyprus VAT
        </span>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/80 text-red-200 text-sm font-bold flex items-center justify-between shadow">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 font-bold hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2x2 Payment Method Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CARD */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleMethodSelect("CARD")}
          className={`relative p-5 rounded-3xl border text-left flex flex-col justify-between transition-all min-h-[140px] ${
            selectedMethod === "CARD"
              ? "bg-[#321E2E] border-[#E50D7E] shadow-xl glow-magenta ring-2 ring-[#E50D7E]"
              : "bg-[#2B2B2E] border-[#3A3A3E] hover:border-zinc-500 text-zinc-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                selectedMethod === "CARD"
                  ? "bg-[#E50D7E] text-white"
                  : "bg-[#202022] text-zinc-400"
              }`}
            >
              <CreditCard size={26} />
            </div>
            {selectedMethod === "CARD" && (
              <CheckCircle2 size={24} className="text-[#00FCED]" />
            )}
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-white">
              {dict.payment.card}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {dict.payment.cardSubtitle}
            </p>
          </div>
        </button>

        {/* CONTACTLESS NFC */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleMethodSelect("NFC_WALLET")}
          className={`relative p-5 rounded-3xl border text-left flex flex-col justify-between transition-all min-h-[140px] ${
            selectedMethod === "NFC_WALLET"
              ? "bg-[#321E2E] border-[#E50D7E] shadow-xl glow-magenta ring-2 ring-[#E50D7E]"
              : "bg-[#2B2B2E] border-[#3A3A3E] hover:border-zinc-500 text-zinc-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                selectedMethod === "NFC_WALLET"
                  ? "bg-[#E50D7E] text-white"
                  : "bg-[#202022] text-zinc-400"
              }`}
            >
              <Radio size={26} />
            </div>
            {selectedMethod === "NFC_WALLET" && (
              <CheckCircle2 size={24} className="text-[#00FCED]" />
            )}
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-white">
              {dict.payment.contactless}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {dict.payment.contactlessSubtitle}
            </p>
          </div>
        </button>

        {/* QR CODE */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleMethodSelect("QR_CODE")}
          className={`relative p-5 rounded-3xl border text-left flex flex-col justify-between transition-all min-h-[140px] ${
            selectedMethod === "QR_CODE"
              ? "bg-[#321E2E] border-[#E50D7E] shadow-xl glow-magenta ring-2 ring-[#E50D7E]"
              : "bg-[#2B2B2E] border-[#3A3A3E] hover:border-zinc-500 text-zinc-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                selectedMethod === "QR_CODE"
                  ? "bg-[#E50D7E] text-white"
                  : "bg-[#202022] text-zinc-400"
              }`}
            >
              <QrCode size={26} />
            </div>
            {selectedMethod === "QR_CODE" && (
              <CheckCircle2 size={24} className="text-[#00FCED]" />
            )}
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-white">
              {dict.payment.qrCode}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {dict.payment.qrCodeSubtitle}
            </p>
          </div>
        </button>

        {/* CASH */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleMethodSelect("CASH")}
          className={`relative p-5 rounded-3xl border text-left flex flex-col justify-between transition-all min-h-[140px] ${
            selectedMethod === "CASH"
              ? "bg-[#321E2E] border-[#E50D7E] shadow-xl glow-magenta ring-2 ring-[#E50D7E]"
              : "bg-[#2B2B2E] border-[#3A3A3E] hover:border-zinc-500 text-zinc-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                selectedMethod === "CASH"
                  ? "bg-[#E50D7E] text-white"
                  : "bg-[#202022] text-zinc-400"
              }`}
            >
              <Banknote size={26} />
            </div>
            {selectedMethod === "CASH" && (
              <CheckCircle2 size={24} className="text-[#00FCED]" />
            )}
          </div>
          <div>
            <h3 className="font-display font-black text-lg text-white">
              {dict.payment.cash}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {dict.payment.cashSubtitle}
            </p>
          </div>
        </button>
      </div>

      {/* QR Code Presentation */}
      {selectedMethod === "QR_CODE" && qrDataUrl && (
        <div className="flex flex-col items-center bg-[#2B2B2E] p-6 rounded-3xl border border-[#3A3A3E] text-center space-y-3 shadow-xl">
          <h4 className="font-display font-black text-base text-white">
            {dict.payment.scanQrPrompt}
          </h4>
          <div className="bg-white p-3 rounded-2xl shadow-xl">
            <img src={qrDataUrl} alt="Payment QR Code" className="w-48 h-48" />
          </div>
          <p className="text-xs text-zinc-400 font-mono">
            Amount: {formatEuro(totalAmount, locale)}
          </p>
        </div>
      )}

      {/* Security Indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 pt-2">
        <ShieldCheck size={16} className="text-[#00FCED]" />
        <span>{dict.payment.terminalSecure}</span>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#1F1F21]/95 backdrop-blur-md border-t border-[#333336] p-4 flex justify-center shadow-2xl">
        <div className="max-w-2xl w-full">
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            onClick={handleConfirmPayment}
            className="w-full py-4 px-6 rounded-2xl bg-[#E50D7E] hover:bg-[#C80B6E] text-white font-display font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-2xl glow-magenta-lg transition-all disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <span>{dict.payment.securing}</span>
              </>
            ) : (
              <>
                <Lock size={20} />
                <span>{dict.payment.confirmPayment}</span>
                <span className="font-mono font-black ml-1">
                  ({formatEuro(totalAmount, locale)})
                </span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
