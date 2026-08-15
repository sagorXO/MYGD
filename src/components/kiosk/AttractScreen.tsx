"use client";

import React from "react";
import { useLocaleStore } from "@/store/localeStore";
import { useKioskStore } from "@/store/kioskStore";
import { getDictionary } from "@/lib/i18n";
import type { Locale, OrderType } from "@/types";
import { UtensilsCrossed, ShoppingBag, Sparkles, Flame, ShieldCheck, ChevronRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface AttractScreenProps {
  onStartOrder: (selectedOrderType: OrderType) => void;
}

export function AttractScreen({ onStartOrder }: AttractScreenProps) {
  const { locale, setLocale } = useLocaleStore();
  const { setOrderType, recordInteraction } = useKioskStore();
  const dict = getDictionary(locale);

  const handleStart = (type: OrderType) => {
    recordInteraction();
    setOrderType(type);
    onStartOrder(type);
  };

  return (
    <div
      onClick={() => handleStart("DINE_IN")}
      className="relative w-full min-h-screen bg-[#1F1F21] flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden cursor-pointer kiosk-vignette"
    >
      {/* Background Ambience / Neon Glows (Magenta & Cyan) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#E50D7E]/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#00FCED]/12 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Bar: Brand Badge & Language Selector */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E50D7E] to-[#C80B6E] flex items-center justify-center font-display font-black text-white text-2xl shadow-xl glow-magenta">
            GD
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-[#00FCED] tracking-widest uppercase">
              {dict.brand.est}
            </span>
            <span className="text-[11px] text-zinc-400 block font-medium">
              Pavlides Court, Emba (Paphos)
            </span>
          </div>
        </div>

        {/* Language Selector */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center bg-[#2B2B2E]/90 backdrop-blur-md border border-[#3A3A3E] rounded-full p-1 shadow-lg"
        >
          {(["en", "de", "gr"] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => {
                recordInteraction();
                setLocale(l);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold uppercase transition-all ${
                locale === l
                  ? "bg-[#E50D7E] text-white shadow-md glow-magenta"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {l === "en" ? "🇬🇧 EN" : l === "de" ? "🇩🇪 DE" : "🇬🇷 ΕΛ"}
            </button>
          ))}
        </div>
      </div>

      {/* Center Hero Section */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-8 space-y-6">
        {/* Slogan Pill */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#2B2B2E] border border-[#E50D7E]/40 text-xs sm:text-sm font-black text-[#E50D7E] uppercase tracking-widest shadow glow-magenta"
        >
          <Sparkles size={16} />
          <span>BITE THE HYPE · THE FIRST REAL GERMAN DÖNER IN CYPRUS</span>
        </motion.div>

        {/* Main Headline */}
        <div className="space-y-1">
          <h1 className="font-display font-black text-5xl sm:text-7xl md:text-8xl text-white tracking-tight leading-none uppercase">
            MY GERMAN <span className="text-[#E50D7E] drop-shadow-md">DÖNER</span>
          </h1>

          <p className="font-display font-semibold text-lg sm:text-2xl text-zinc-300 tracking-wider uppercase mt-2">
            FRESH HOMEMADE SAUCES • CRISPY BREAD • AUTHENTIC ROTISSERIE
          </p>
        </div>

        {/* Hero Food Visual */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full overflow-hidden border-4 border-[#3A3A3E] shadow-2xl glow-magenta"
        >
          <img
            src="https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85"
            alt="German Doner Kebab"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Big Animated "TAP TO ORDER" CTA Button in Electric Magenta */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => {
            e.stopPropagation();
            handleStart("DINE_IN");
          }}
          className="group relative px-10 py-5 sm:px-14 sm:py-6 rounded-3xl bg-gradient-to-r from-[#E50D7E] via-[#FF2E93] to-[#E50D7E] bg-[length:200%_auto] hover:bg-right text-white font-display font-black text-xl sm:text-3xl shadow-2xl glow-magenta-lg tracking-wider uppercase flex items-center gap-4 transition-all"
        >
          <span>{dict.attract.tapToOrder}</span>
          <ChevronRight size={28} className="stroke-[3] group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      {/* Bottom Section: Dining Mode Selector & Trust Badges */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#333336]"
      >
        {/* Dining Mode Quick Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleStart("DINE_IN")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#2B2B2E] hover:bg-[#38383C] border border-[#3A3A3E] hover:border-[#E50D7E] text-white font-display font-bold text-sm sm:text-base transition-all shadow-md active:scale-95"
          >
            <UtensilsCrossed size={18} className="text-[#E50D7E]" />
            <span>{dict.attract.dineIn}</span>
          </button>

          <button
            onClick={() => handleStart("TAKE_AWAY")}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#2B2B2E] hover:bg-[#38383C] border border-[#3A3A3E] hover:border-[#E50D7E] text-white font-display font-bold text-sm sm:text-base transition-all shadow-md active:scale-95"
          >
            <ShoppingBag size={18} className="text-[#00FCED]" />
            <span>{dict.attract.takeAway}</span>
          </button>
        </div>

        {/* Location & Payment Helper */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
          <ShieldCheck size={16} className="text-[#4CAF50]" />
          <span>{dict.attract.contactless}</span>
        </div>
      </div>
    </div>
  );
}
