"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatEuro } from "@/lib/i18n";
import {
  Sparkles,
  Flame,
  Clock,
  Radio,
  Maximize2,
  Minimize2,
  AlertOctagon,
  Image as ImageIcon,
  Grid,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Leaf,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { CANONICAL_4K_SCREENS } from "../signage.engine";
import { LivePriceBoard } from "./LivePriceBoard";
import { toSignageItem } from "@/lib/menu/boards";
import { MYGD_MODIFIER_GROUPS } from "@/lib/menu/mygd-menu";
import { SignageScreenConfig } from "../signage.schema";
import { generateVectorPlaceholder } from "@/lib/menu-assets";

const MENU_PRICES = (MYGD_MODIFIER_GROUPS.find((g) => g.slug === "make-it-a-menu")?.options ?? [])
  .map((o) => `${o.name.replace(" Menu", "")} +€${o.price.toFixed(2)}`)
  .join(" · ");

export const MenuBoard4K: React.FC = () => {
  const [selectedScreenNumber, setSelectedScreenNumber] = useState<number>(1);
  // Starts from the offline fallback (derived from the menu source) and is replaced by the
  // database screens from GET /api/menuboards as soon as they load; SSE keeps it live afterwards.
  const [configs, setConfigs] = useState<Record<number, SignageScreenConfig>>(CANONICAL_4K_SCREENS);
  const [viewMode, setViewMode] = useState<"GRAPHIC" | "GRID">("GRAPHIC");
  const [isAutoCycle, setIsAutoCycle] = useState<boolean>(false);
  const [is4KFullscreen, setIs4KFullscreen] = useState<boolean>(false);
  const [time, setTime] = useState<string>("");

  const activeConfig = configs[selectedScreenNumber] || configs[1];

  const applyRemoteScreen = useCallback((raw: any) => {
    const screenNumber = Number(raw?.screenNumber);
    if (!Number.isInteger(screenNumber) || !Array.isArray(raw?.items)) return;
    setConfigs((prev) => ({
      ...prev,
      [screenNumber]: {
        ...(prev[screenNumber] ?? CANONICAL_4K_SCREENS[screenNumber]),
        screenNumber,
        title: raw.title ?? prev[screenNumber]?.title ?? `SCREEN ${screenNumber}`,
        layoutType: raw.layoutType ?? prev[screenNumber]?.layoutType ?? "PRICE_MATRIX",
        updatedAt: new Date().toISOString(),
        items: raw.items.map(toSignageItem),
      },
    }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/menuboards", { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        for (const screen of data.configs ?? []) applyRemoteScreen(screen);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.warn("[MenuBoard4K] Could not load screens from the database; showing the offline copy.", err);
        }
      }
    })();
    return () => controller.abort();
  }, [applyRemoteScreen]);

  // Auto-cycle through the 5 screens every 12 seconds when enabled
  useEffect(() => {
    if (!isAutoCycle) return;
    const interval = setInterval(() => {
      setSelectedScreenNumber((prev) => (prev % 5) + 1);
    }, 12000);
    return () => clearInterval(interval);
  }, [isAutoCycle]);

  // Real-time synchronization for stock changes
  const { isConnected, connectionTier } = useRealtimeEvents({
    channel: "boards",
    onEvent: (type, data: any) => {
      if (type === "MENU_BOARD_UPDATED" && data?.config) {
        applyRemoteScreen(data.config);
      } else if (type === "STOCK_CHANGED" && data?.productId) {
        setConfigs((prev) => {
          const next = { ...prev };
          for (const sNum in next) {
            next[sNum].items = next[sNum].items.map((item) =>
              item.id === data.productId || item.sku === data.sku
                ? { ...item, isAvailable: data.isAvailable }
                : item
            );
          }
          return next;
        });
      }
    },
  });

  // Live Digital Clock
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

  // Keyboard navigation: Arrow keys to switch screen, F for fullscreen, V to toggle view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setSelectedScreenNumber((prev) => (prev % 5) + 1);
      } else if (e.key === "ArrowLeft") {
        setSelectedScreenNumber((prev) => (prev === 1 ? 5 : prev - 1));
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "v" || e.key === "V") {
        setViewMode((m) => (m === "GRAPHIC" ? "GRID" : "GRAPHIC"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  const soldOutCount = activeConfig.items.filter((i) => !i.isAvailable).length;

  return (
    <div className="min-h-screen w-screen bg-[#0B0B0C] text-white flex flex-col justify-between font-sans select-none overflow-hidden p-4 sm:p-6">
      {/* Top Header Signage Bar */}
      <header className="flex items-center justify-between border-b border-[#2B2B2E] pb-3 mb-3">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E50D7E] flex items-center justify-center font-display font-black text-white text-lg shadow-xl shadow-pink-950/40">
            GD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-2xl text-white uppercase tracking-tight leading-none">
                MY GERMAN <span className="text-[#E50D7E]">DÖNER</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F1F21] border border-[#3A3A3E] text-[#00FCED] font-bold">
                4K UHD SIGNAGE
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#E5A93C] uppercase tracking-widest mt-0.5 block">
              SCREEN {activeConfig.screenNumber}: {activeConfig.title}
            </span>
          </div>
        </div>

        {/* Center: Screen Switcher & View Mode Toggle */}
        <div className="flex items-center gap-2">
          {/* Screen Selection Buttons (1 to 5) */}
          <div className="flex items-center bg-[#1F1F21] p-1 rounded-xl border border-[#3A3A3E] text-xs font-display font-bold">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => setSelectedScreenNumber(num)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedScreenNumber === num
                    ? "bg-[#E50D7E] text-white shadow-lg shadow-pink-950/40"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Screen {num}
              </button>
            ))}
          </div>

          {/* View Mode Switcher: Graphic Visual Board vs Digital Grid */}
          <div className="flex items-center bg-[#1F1F21] p-1 rounded-xl border border-[#3A3A3E] text-xs font-mono">
            <button
              onClick={() => setViewMode("GRAPHIC")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "GRAPHIC"
                  ? "bg-[#00FCED] text-black font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Official Graphic 4K Visual Board"
            >
              <ImageIcon size={13} />
              <span>Official Board</span>
            </button>
            <button
              onClick={() => setViewMode("GRID")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "GRID"
                  ? "bg-[#00FCED] text-black font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Interactive Card Grid View"
            >
              <Grid size={13} />
              <span>Digital Grid</span>
            </button>
          </div>

          {/* Auto-cycle toggle */}
          <button
            onClick={() => setIsAutoCycle((c) => !c)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all ${
              isAutoCycle
                ? "bg-emerald-950/60 border-emerald-700 text-emerald-400"
                : "bg-[#1F1F21] border-[#3A3A3E] text-zinc-400 hover:text-white"
            }`}
            title="Auto-Cycle Screens Every 12s"
          >
            {isAutoCycle ? <Pause size={12} /> : <Play size={12} />}
            <span>Auto</span>
          </button>
        </div>

        {/* Right: Telemetry, Clock & Fullscreen */}
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-mono text-xs font-bold ${
              isConnected
                ? "bg-green-950/60 border-green-700 text-green-400"
                : "bg-amber-950/60 border-amber-700 text-amber-400"
            }`}
          >
            <Radio size={13} className={isConnected ? "animate-pulse" : ""} />
            <span>{connectionTier === "EDGE" ? "LAN EDGE" : isConnected ? "CMS LIVE" : "OFFLINE"}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#1F1F21] border border-[#3A3A3E] px-3 py-1.5 rounded-xl">
            <Clock size={14} className="text-[#00FCED]" />
            <span className="font-mono font-black text-sm text-white tracking-wider">
              {time || "12:00:00"}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-[#1F1F21] border border-[#3A3A3E] text-zinc-400 hover:text-white transition-all"
            title="Toggle 4K Fullscreen (F)"
          >
            {is4KFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center relative overflow-hidden my-1">
        <AnimatePresence mode="wait">
          {viewMode === "GRAPHIC" ? (
            /* ============================================================ */
            /* VIEW MODE A: OFFICIAL 4K VISUAL GRAPHIC BOARD                */
            /* ============================================================ */
            <motion.div
              key={`graphic-${selectedScreenNumber}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-[78vh] flex items-center justify-center rounded-3xl overflow-hidden border-2 border-[#2B2B2E] shadow-2xl bg-black"
            >
              <LivePriceBoard items={activeConfig.items} banner={activeConfig.bannerMessage} />

              {/* Dynamic Sold Out Floating Indicator if items are unavailable */}
              {soldOutCount > 0 && (
                <div className="absolute top-4 right-4 bg-red-950/90 border-2 border-red-600 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-pulse">
                  <AlertOctagon size={20} className="text-red-500" />
                  <div className="font-mono text-xs text-left">
                    <span className="font-black text-red-300 block uppercase">
                      {soldOutCount} Item(s) Out of Stock
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Restock in progress
                    </span>
                  </div>
                </div>
              )}

              {/* Prev / Next Screen Floaters */}
              <button
                onClick={() => setSelectedScreenNumber((prev) => (prev === 1 ? 5 : prev - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-[#E50D7E] text-white border border-white/20 backdrop-blur-md transition-all shadow-xl"
                title="Previous Screen"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={() => setSelectedScreenNumber((prev) => (prev % 5) + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-[#E50D7E] text-white border border-white/20 backdrop-blur-md transition-all shadow-xl"
                title="Next Screen"
              >
                <ChevronRight size={22} />
              </button>
            </motion.div>
          ) : (
            /* ============================================================ */
            /* VIEW MODE B: INTERACTIVE DIGITAL CARDS GRID WITH FOOD PHOTOS */
            /* ============================================================ */
            <motion.div
              key={`grid-${selectedScreenNumber}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch overflow-y-auto pr-1"
            >
              {activeConfig.items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-[#18181A] border-2 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between relative transition-all group ${
                    item.isAvailable
                      ? "border-[#2B2B2E] hover:border-[#E50D7E]/70"
                      : "border-red-900/60 opacity-60"
                  }`}
                >
                  {/* Food Photography Area */}
                  <div className="relative h-44 w-full bg-zinc-900 overflow-hidden">
                    <img
                      src={item.imageUrl || generateVectorPlaceholder(item.name, "MYGD MENU")}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = generateVectorPlaceholder(item.name, "MYGD MENU");
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#18181A] via-transparent to-black/40" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {item.badge && (
                        <span className="px-2.5 py-1 rounded-xl bg-[#E50D7E] text-white font-mono text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Sparkles size={11} />
                          <span>{item.badge.replace("_", " ")}</span>
                        </span>
                      )}
                    </div>

                    {/* Price Tag (Top Right) */}
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-[#00FCED] font-mono font-black text-lg shadow-xl">
                      {formatEuro(item.priceEUR)}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono text-zinc-500">{item.sku}</span>
                        {item.largePriceEUR && (
                          <span className="text-[11px] font-mono text-zinc-400">
                            Lrg: <strong className="text-[#00FCED]">{formatEuro(item.largePriceEUR)}</strong>
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-black text-xl text-white uppercase tracking-tight mt-1 leading-tight">
                        {item.name}
                      </h3>
                      {item.nameDE && (
                        <span className="text-xs text-zinc-400 italic block mt-0.5">{item.nameDE}</span>
                      )}

                      {item.description && (
                        <p className="text-xs text-zinc-300 mt-2 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {item.modifiers && item.modifiers.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#2B2B2E] flex flex-wrap gap-1">
                        {item.modifiers.map((mod, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-[#2B2B2E] text-[10px] font-mono font-semibold text-[#00FCED]"
                          >
                            {mod}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sold Out Overlay */}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
                      <AlertOctagon size={40} className="text-[#EF4444] mb-2 animate-bounce" />
                      <span className="font-display font-black text-xl text-white uppercase tracking-wider">
                        SOLD OUT / AUSVERKAUFT
                      </span>
                      <span className="text-[11px] font-mono text-zinc-400 mt-1">
                        Ingredient restock in progress
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom One-Tap Combo Upsell Bar */}
      <footer className="bg-[#18181A] border border-[#2B2B2E] rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xl mt-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00FCED]/10 border border-[#00FCED]/40 flex items-center justify-center text-[#00FCED]">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="font-display font-black text-sm uppercase text-white leading-none">
              MAKE IT A MENU ({MENU_PRICES})
            </h4>
            <span className="text-[11px] text-zinc-400 font-sans">
              Choose fries or white rice + a 0.4L drink
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <span className="hidden md:inline">Hotkeys: [←/→] Switch Screen • [V] Toggle Graphic/Grid • [F] Fullscreen</span>
          <span className="text-[#E5A93C] font-bold">STORE 01 EMBA & STORE 02 LIMASSOL</span>
        </div>
      </footer>
    </div>
  );
};
