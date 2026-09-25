"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatEuro } from "@/lib/i18n";
import {
  Sparkles,
  Flame,
  Clock,
  Tv,
  Radio,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertOctagon,
  Layers,
  ChefHat,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { CANONICAL_4K_SCREENS } from "../signage.engine";
import { SignageScreenConfig } from "../signage.schema";

export const MenuBoard4K: React.FC = () => {
  const [selectedScreenNumber, setSelectedScreenNumber] = useState<number>(2); // Default Screen 2 (Core Döner)
  const [configs, setConfigs] = useState<Record<number, SignageScreenConfig>>(CANONICAL_4K_SCREENS);
  const [is4KFullscreen, setIs4KFullscreen] = useState<boolean>(false);
  const [time, setTime] = useState<string>("");

  const activeConfig = configs[selectedScreenNumber] || configs[2];

  // Real-time synchronization
  const { isConnected, connectionTier } = useRealtimeEvents({
    channel: "boards",
    onEvent: (type, data: any) => {
      if (type === "STOCK_CHANGED" && data?.productId) {
        setConfigs((prev) => {
          const next = { ...prev };
          for (const sNum in next) {
            next[sNum].items = next[sNum].items.map((item) =>
              item.id === data.productId ? { ...item, isAvailable: data.isAvailable } : item
            );
          }
          return next;
        });
      }
    },
  });

  // Live Clock
  useEffect(() => {
    const updateClock = () => {
      setTime(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIs4KFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIs4KFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#121214] text-white flex flex-col justify-between font-sans select-none overflow-hidden p-6 sm:p-8">
      {/* Top Header Signage Bar */}
      <header className="flex items-center justify-between border-b-2 border-[#3A3A3E] pb-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E50D7E] flex items-center justify-center font-display font-black text-white text-xl shadow-xl">
            GD
          </div>
          <div>
            <h1 className="font-display font-black text-3xl text-white uppercase tracking-tight leading-none">
              MY GERMAN <span className="text-[#E50D7E]">DÖNER</span>
            </h1>
            <span className="text-xs font-mono font-bold text-[#E5A93C] uppercase tracking-widest mt-1 block">
              {activeConfig.title} · {activeConfig.subtitle}
            </span>
          </div>
        </div>

        {/* Center: Screen Switcher (Visible on desktop/manager, hidden in kiosk fullscreen) */}
        {!is4KFullscreen && (
          <div className="flex items-center bg-[#1F1F21] p-1 rounded-xl border border-[#3A3A3E] text-xs font-display font-bold">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => setSelectedScreenNumber(num)}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  selectedScreenNumber === num
                    ? "bg-[#E50D7E] text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Screen {num}
              </button>
            ))}
          </div>
        )}

        {/* Right: Real-time Telemetry & Fullscreen */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs font-bold ${
              isConnected
                ? "bg-green-950/60 border-green-700 text-green-400"
                : "bg-amber-950/60 border-amber-700 text-amber-400"
            }`}
          >
            <Radio size={14} className={isConnected ? "animate-pulse" : ""} />
            <span>{connectionTier === "EDGE" ? "LAN EDGE 0ms" : isConnected ? "CMS CONNECTED 12ms" : "OFFLINE"}</span>
          </div>

          <div className="flex items-center gap-2 bg-[#1F1F21] border border-[#3A3A3E] px-4 py-1.5 rounded-xl">
            <Clock size={16} className="text-[#00FCED]" />
            <span className="font-mono font-black text-lg text-white tracking-widest">
              {time || "12:00:00"}
            </span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">EEST</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-[#1F1F21] border border-[#3A3A3E] text-zinc-400 hover:text-white"
            title="Toggle 4K Fullscreen"
          >
            {is4KFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* Main Menu Grid Layout */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 my-6 items-stretch">
        {activeConfig.items.map((item) => (
          <div
            key={item.id}
            className={`bg-[#1F1F21] border-2 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden transition-all ${
              item.isAvailable
                ? "border-[#3A3A3E] hover:border-[#E50D7E]/50"
                : "border-red-900/60 opacity-60"
            }`}
          >
            {/* Top Badge & SKU */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                {item.badge ? (
                  <span className="px-2.5 py-1 rounded-xl bg-[#2B2B2E] border border-[#3A3A3E] text-[#E5A93C] font-mono font-bold text-xs uppercase flex items-center gap-1">
                    {item.badge === "TOP_SELLER" && <Sparkles size={12} />}
                    {item.badge === "SPICY_KICK" && <Flame size={12} className="text-[#FF5722]" />}
                    <span>{item.badge.replace("_", " ")}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-zinc-500">{item.sku}</span>
                )}

                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-black text-3xl sm:text-4xl text-[#E50D7E]">
                    {formatEuro(item.priceEUR)}
                  </span>
                  {item.largePriceEUR && (
                    <span className="font-mono text-xs text-zinc-400">
                      / Lrg {formatEuro(item.largePriceEUR)}
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight leading-tight">
                {item.name}
              </h3>
              {item.nameDE && (
                <span className="text-xs text-zinc-400 font-medium block mt-0.5 italic">
                  {item.nameDE}
                </span>
              )}

              {item.description && (
                <p className="text-sm text-zinc-300 font-sans mt-3 leading-relaxed">
                  {item.description}
                </p>
              )}

              {/* Modifiers Pill Display */}
              {item.modifiers && item.modifiers.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#2B2B2E] flex flex-wrap gap-1.5">
                  {item.modifiers.map((mod, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#2B2B2E] border border-[#3A3A3E] text-[11px] font-mono font-bold text-[#00FCED]"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Instant "Sold Out" Overlay (Triggered by Mobile Owner CMS or Zero Stock) */}
            {!item.isAvailable && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                <AlertOctagon size={44} className="text-[#EF4444] mb-2 animate-bounce" />
                <span className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wider">
                  SOLD OUT / AUSVERKAUFT
                </span>
                <span className="text-xs font-mono text-zinc-400 mt-1">
                  Ingredient restock in progress
                </span>
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Bottom One-Tap Combo Upsell Bar */}
      <footer className="bg-[#1F1F21] border-2 border-[#3A3A3E] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00FCED]/10 border border-[#00FCED]/40 flex items-center justify-center text-[#00FCED]">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="font-display font-black text-base uppercase text-white leading-none">
              MAKE IT A COMBO (+€3.50)
            </h4>
            <span className="text-xs text-zinc-400 font-sans">
              Crispy Berlin Fries + Any 330ml Drink or Authentic Turkish Ayran
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <span className="hidden md:inline">4K DIGITAL SIGNAGE · CLS = 0</span>
          <span className="text-[#E5A93C] font-bold">EMBA & LIMASSOL MARINA</span>
        </div>
      </footer>
    </div>
  );
};
