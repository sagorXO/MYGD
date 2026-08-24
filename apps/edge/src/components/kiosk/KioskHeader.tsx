"use client";

import React from "react";
import { useLocaleStore } from "@/store/localeStore";
import { useKioskStore } from "@/store/kioskStore";
import { useCartStore } from "@/store/cartStore";
import { getDictionary } from "@/lib/i18n";
import type { Locale } from "@/types";
import { ShoppingBag, Lock, Sparkles, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface KioskHeaderProps {
  currentScreen: "ATTRACT" | "MENU" | "CART" | "PAYMENT" | "CONFIRMATION";
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onNavigateHome: () => void;
}

export function KioskHeader({
  currentScreen,
  onOpenCart,
  onOpenAdmin,
  onNavigateHome,
}: KioskHeaderProps) {
  const { locale, setLocale } = useLocaleStore();
  const { orderType, locationSlug, recordInteraction } = useKioskStore();
  const { getItemCount } = useCartStore();
  const dict = getDictionary(locale);

  const cartCount = getItemCount();

  if (currentScreen === "ATTRACT") return null;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#1F1F21]/95 backdrop-blur-md border-b border-[#333336] px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-lg">
      {/* Left: Brand Identity & Home Trigger */}
      <div
        onClick={() => {
          recordInteraction();
          onNavigateHome();
        }}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50D7E] to-[#C80B6E] flex items-center justify-center font-display font-black text-white text-lg shadow-md glow-magenta group-hover:scale-105 transition-transform">
          GD
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-lg sm:text-xl text-white tracking-wider uppercase leading-none">
              MY GERMAN <span className="text-[#E50D7E]">DÖNER</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#E50D7E]/20 text-[#E50D7E] border border-[#E50D7E]/30">
              <Sparkles size={10} /> BITE THE HYPE
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 font-semibold flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="text-[#00FCED]" />
            {locationSlug === "EMBA" ? "Emba Store (Paphos)" : "Limassol Marina"} •{" "}
            {orderType === "DINE_IN" ? dict.attract.dineIn : dict.attract.takeAway}
          </span>
        </div>
      </div>

      {/* Center/Right: Language Switcher, Cart Trigger & Staff Lock */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Multilingual Selector */}
        <div className="flex items-center bg-[#2B2B2E] border border-[#3A3A3E] rounded-full p-1 shadow-inner">
          {(["en", "de", "gr"] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                recordInteraction();
                setLocale(l);
              }}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold uppercase transition-all ${
                locale === l
                  ? "bg-[#E50D7E] text-white shadow-md glow-magenta"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {l === "en" ? "🇬🇧 EN" : l === "de" ? "🇩🇪 DE" : "🇬🇷 ΕΛ"}
            </button>
          ))}
        </div>

        {/* Floating Cart Button (if on Menu Screen) */}
        {currentScreen === "MENU" && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              recordInteraction();
              onOpenCart();
            }}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2B2B2E] hover:bg-[#38383C] text-white border border-[#3A3A3E] font-display font-bold text-sm shadow-md transition-all"
          >
            <ShoppingBag size={18} className="text-[#E50D7E]" />
            <span className="hidden sm:inline">{dict.cart.yourOrder}</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#E50D7E] text-white text-[11px] font-black flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </motion.button>
        )}

        {/* Staff / Manager PIN Modal Trigger */}
        <button
          onClick={() => {
            recordInteraction();
            onOpenAdmin();
          }}
          className="w-9 h-9 rounded-xl bg-[#2B2B2E] hover:bg-[#38383C] border border-[#3A3A3E] flex items-center justify-center text-zinc-500 hover:text-white transition-all"
          title="Staff Controls"
        >
          <Lock size={15} />
        </button>
      </div>
    </header>
  );
}
