"use client";

import React, { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useLocaleStore } from "@/store/localeStore";
import { useKioskStore } from "@/store/kioskStore";
import { formatEuro, getDictionary } from "@/lib/i18n";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Flame,
  ShoppingBag,
  Ticket,
  CheckCircle2,
  X,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";

interface CartReviewScreenProps {
  onBackToMenu: () => void;
  onProceedToPayment: () => void;
}

export function CartReviewScreen({
  onBackToMenu,
  onProceedToPayment,
}: CartReviewScreenProps) {
  const {
    items,
    updateQuantity,
    removeItem,
    customerNote,
    setCustomerNote,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
    getGrossBeforeDiscount,
    getDiscountAmount,
    getSubtotal,
    getVatAmount,
    getTotal,
    clearCart,
  } = useCartStore();

  const { locale } = useLocaleStore();
  const { recordInteraction } = useKioskStore();
  const dict = getDictionary(locale);

  const [voucherInput, setVoucherInput] = useState<string>("");
  const [voucherFeedback, setVoucherFeedback] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const grossBeforeDiscount = getGrossBeforeDiscount();
  const discountAmount = getDiscountAmount();
  const subtotal = getSubtotal();
  const vatAmount = getVatAmount();
  const total = getTotal();

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    recordInteraction();
    if (!voucherInput.trim()) return;

    const res = applyVoucher(voucherInput);
    setVoucherFeedback(res);
    if (res.success) {
      setVoucherInput("");
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#2B2B2E] border border-[#3A3A3E] flex items-center justify-center text-zinc-500 mb-4 glow-magenta">
          <ShoppingBag size={36} className="text-[#E50D7E]" />
        </div>
        <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase">
          {dict.menu.emptyCart}
        </h2>
        <p className="text-zinc-400 max-w-sm mt-2 text-sm">
          {dict.menu.emptyPrompt}
        </p>
        <button
          onClick={() => {
            recordInteraction();
            onBackToMenu();
          }}
          className="mt-6 px-8 py-3.5 rounded-2xl bg-[#E50D7E] hover:bg-[#C80B6E] text-white font-display font-black text-base shadow-xl glow-magenta transition-all"
        >
          {dict.menu.allCategories}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full p-4 sm:p-6 space-y-6 pb-36">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-[#333336] pb-4">
        <button
          onClick={() => {
            recordInteraction();
            onBackToMenu();
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#2B2B2E] hover:bg-[#38383C] text-zinc-300 hover:text-white border border-[#3A3A3E] font-semibold text-sm transition-all"
        >
          <ArrowLeft size={18} />
          <span>{dict.common.back}</span>
        </button>

        <h2 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wider">
          {dict.cart.yourOrder}
        </h2>

        <button
          onClick={() => {
            recordInteraction();
            clearCart();
          }}
          className="flex items-center gap-1.5 text-xs text-[#E53935] hover:text-red-400 font-bold"
        >
          <Trash2 size={14} />
          <span>{dict.cart.clearCart}</span>
        </button>
      </div>

      {/* Cart Items List */}
      <div className="space-y-3.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 p-4 rounded-3xl bg-[#2B2B2E] border border-[#3A3A3E] shadow-lg relative"
          >
            {/* Thumbnail */}
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-20 h-20 rounded-2xl object-cover border border-[#444448] shrink-0"
              />
            )}

            {/* Item Details */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-display font-black text-base sm:text-lg text-white">
                    {item.name}
                  </h3>
                  <span className="font-display font-black text-base sm:text-lg text-[#E50D7E] font-mono">
                    {formatEuro(item.totalPrice, locale)}
                  </span>
                </div>

                {/* Modifiers List */}
                <div className="text-xs text-zinc-400 mt-1 space-y-0.5">
                  {item.modifiers.length > 0 && (
                    <p className="line-clamp-2">
                      {item.modifiers.map((m) => m.name).join(" • ")}
                    </p>
                  )}
                  {item.spiceLevel > 1 && (
                    <p className="flex items-center gap-1 text-[#E50D7E] font-bold">
                      <Flame size={12} />
                      <span>Spice Level {item.spiceLevel}</span>
                    </p>
                  )}
                  {item.isMealBundle && (
                    <p className="text-[#00FCED] font-bold">
                      Meal Combo: {item.mealSideName} + {item.mealDrinkName}
                    </p>
                  )}
                  {item.itemNotes && (
                    <p className="text-zinc-500 italic">
                      Note: &quot;{item.itemNotes}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity Stepper & Remove */}
              <div className="flex items-center justify-between pt-2.5 border-t border-[#38383C] mt-2">
                <div className="flex items-center bg-[#202022] border border-[#3A3A3E] rounded-xl p-0.5">
                  <button
                    onClick={() => {
                      recordInteraction();
                      updateQuantity(item.id, item.quantity - 1);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white active:scale-95"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-sm text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => {
                      recordInteraction();
                      updateQuantity(item.id, item.quantity + 1);
                    }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white active:scale-95"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    recordInteraction();
                    removeItem(item.id);
                  }}
                  className="text-zinc-500 hover:text-[#E53935] p-1.5 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add More Items Button */}
      <button
        onClick={() => {
          recordInteraction();
          onBackToMenu();
        }}
        className="w-full py-3.5 rounded-2xl bg-[#2B2B2E] hover:bg-[#38383C] border border-dashed border-[#444448] text-[#00FCED] font-display font-black text-sm flex items-center justify-center gap-2 transition-all shadow"
      >
        <Plus size={16} />
        <span>{dict.cart.addMoreItems}</span>
      </button>

      {/* DÖNER CLUB VOUCHER / PROMO CODE ENGINE */}
      <div className="bg-[#2B2B2E] p-4 sm:p-5 rounded-3xl border border-[#3A3A3E] space-y-3">
        <label className="flex items-center gap-2 font-display font-black text-xs uppercase tracking-wider text-zinc-300">
          <Ticket size={16} className="text-[#E50D7E]" />
          <span>DÖNER CLUB VOUCHER & PROMO CODE</span>
        </label>

        {!appliedVoucher ? (
          <form onSubmit={handleApplyVoucher} className="flex gap-2">
            <input
              type="text"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value)}
              placeholder="e.g. BITETHEHYPE or MYGD20"
              className="flex-1 bg-[#1F1F21] border border-[#3A3A3E] rounded-2xl px-4 py-2.5 text-sm text-white uppercase placeholder-zinc-500 focus:border-[#E50D7E] outline-none font-mono font-bold"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-[#E50D7E] hover:bg-[#C80B6E] text-white font-display font-black text-xs uppercase tracking-wider shadow glow-magenta transition-all"
            >
              Apply
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#351E2E] border border-[#E50D7E]/50 text-xs">
            <div className="flex items-center gap-2 text-white">
              <CheckCircle2 size={16} className="text-[#00FCED]" />
              <span className="font-bold">{appliedVoucher.description}</span>
            </div>
            <button
              onClick={removeVoucher}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {voucherFeedback && !appliedVoucher && (
          <p
            className={`text-xs font-bold ${
              voucherFeedback.success ? "text-[#00FCED]" : "text-[#E53935]"
            }`}
          >
            {voucherFeedback.message}
          </p>
        )}
      </div>

      {/* Kitchen Notes */}
      <div className="bg-[#2B2B2E] p-4 sm:p-5 rounded-3xl border border-[#3A3A3E] space-y-2">
        <label className="flex items-center gap-2 font-display font-black text-xs uppercase tracking-wider text-zinc-400">
          <MessageSquare size={14} />
          {dict.cart.specialInstructions}
        </label>
        <input
          type="text"
          value={customerNote}
          onChange={(e) => {
            recordInteraction();
            setCustomerNote(e.target.value);
          }}
          placeholder="e.g. extra crispy bread, separate sauce, allergies..."
          maxLength={200}
          className="w-full bg-[#1F1F21] border border-[#3A3A3E] rounded-2xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-[#E50D7E] outline-none"
        />
      </div>

      {/* Financial Summary Breakdown */}
      <div className="bg-[#2B2B2E] p-5 rounded-3xl border border-[#3A3A3E] space-y-3 shadow-xl">
        <div className="flex justify-between text-sm text-zinc-400">
          <span>{dict.cart.subtotal}</span>
          <span className="font-mono">{formatEuro(grossBeforeDiscount, locale)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-[#00FCED] font-bold">
            <span>Döner Club Discount ({appliedVoucher?.code})</span>
            <span className="font-mono">-{formatEuro(discountAmount, locale)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm text-zinc-400">
          <span>{dict.cart.vat}</span>
          <span className="font-mono">{formatEuro(vatAmount, locale)}</span>
        </div>

        <div className="pt-3 border-t border-[#3A3A3E] flex justify-between items-baseline">
          <span className="font-display font-black text-lg text-white">
            {dict.cart.total}
          </span>
          <span className="font-display font-black text-3xl text-[#E50D7E] font-mono tracking-tight">
            {formatEuro(total, locale)}
          </span>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#1F1F21]/95 backdrop-blur-md border-t border-[#333336] p-4 flex justify-center shadow-2xl">
        <div className="max-w-3xl w-full">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              recordInteraction();
              onProceedToPayment();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-[#E50D7E] hover:bg-[#C80B6E] text-white font-display font-black text-lg sm:text-xl flex items-center justify-between shadow-2xl glow-magenta-lg transition-all"
          >
            <span>{dict.cart.proceedToPayment}</span>
            <span className="font-mono font-black text-2xl">
              {formatEuro(total, locale)}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
