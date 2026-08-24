"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Clock, CheckCircle2, Flame, BellRing } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomerDisplayPage() {
  const [preparingOrders, setPreparingOrders] = useState<string[]>([
    "047",
    "048",
    "049",
    "050",
    "051",
    "052",
    "053",
  ]);

  const [readyOrders, setReadyOrders] = useState<{ number: string; counter: number }[]>([
    { number: "044", counter: 1 },
    { number: "045", counter: 1 },
    { number: "046", counter: 2 },
  ]);

  const [time, setTime] = useState<string>("");

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

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col justify-between select-none overflow-hidden p-6 sm:p-10 font-sans">
      {/* Top Header Banner */}
      <header className="flex items-center justify-between border-b-2 border-[#2A2A2A] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5722] to-[#E64A19] flex items-center justify-center font-display font-black text-white text-2xl shadow-xl glow-orange">
            GD
          </div>
          <div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight leading-none">
              MY GERMAN <span className="text-[#FF5722]">DÖNER</span>
            </h1>
            <span className="text-xs font-mono font-bold text-[#E5A93C] uppercase tracking-widest mt-1 block">
              ORDER STATUS BOARD · EMBA STORE #01
            </span>
          </div>
        </div>

        {/* Live Clock & Badge */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-[#222222] border border-[#333333] px-5 py-2.5 rounded-2xl">
            <Clock size={22} className="text-[#FF5722]" />
            <span className="font-mono font-black text-2xl text-white tracking-widest">
              {time || "14:23:45"}
            </span>
          </div>
        </div>
      </header>

      {/* Main 2-Column Split Showcase */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
        {/* Left Column: PREPARING / IN ARBEIT */}
        <div className="flex flex-col bg-[#1A1A1A] border-2 border-[#333333] rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-[#E5A93C] animate-pulse" />
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
                PREPARING <span className="text-[#E5A93C] text-lg font-semibold ml-2">/ IN ARBEIT</span>
              </h2>
            </div>
            <span className="text-sm font-mono text-zinc-400 font-bold">
              {preparingOrders.length} In Line
            </span>
          </div>

          {/* Grid of Preparing Order Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 auto-rows-max overflow-y-auto">
            {preparingOrders.map((num) => (
              <div
                key={num}
                className="bg-[#242424] border border-[#3A3A3A] rounded-2xl py-6 px-4 flex flex-col items-center justify-center text-center shadow"
              >
                <span className="text-[11px] font-mono text-zinc-500 font-bold uppercase">
                  ORDER
                </span>
                <span className="font-mono font-black text-4xl text-white tracking-wider mt-0.5">
                  {num}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: READY FOR PICKUP / ABHOLBEREIT */}
        <div className="flex flex-col bg-gradient-to-b from-[#241F18] to-[#1A1A1A] border-2 border-[#FF5722] rounded-3xl p-6 sm:p-8 shadow-2xl glow-orange">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#FF5722]/50 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-[#4CAF50] glow-green" />
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
                READY FOR PICKUP <span className="text-[#4CAF50] text-lg font-semibold ml-2">/ ABHOLBEREIT</span>
              </h2>
            </div>
            <span className="flex items-center gap-1.5 text-sm font-mono text-[#FF5722] font-black uppercase">
              <BellRing size={16} className="animate-bounce" /> Pick up now
            </span>
          </div>

          {/* Big Glowing Ready Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 auto-rows-max overflow-y-auto">
            {readyOrders.map((order) => (
              <motion.div
                key={order.number}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#2A2A2A] border-2 border-[#4CAF50] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-xl glow-green relative overflow-hidden"
              >
                {/* Glow bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#4CAF50]" />

                <div className="flex items-center gap-1.5 text-[#4CAF50] font-bold text-xs uppercase tracking-wider mb-1">
                  <CheckCircle2 size={16} />
                  <span>READY AT COUNTER {order.counter}</span>
                </div>

                <span className="font-mono font-black text-6xl sm:text-7xl text-[#FF5722] tracking-wider my-1 drop-shadow-md">
                  {order.number}
                </span>

                <span className="text-xs text-zinc-300 font-semibold mt-1">
                  Please show your receipt
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Widescreen Announcement Ticker */}
      <footer className="bg-[#1A1A1A] border-t-2 border-[#2A2A2A] pt-4 flex items-center justify-between text-zinc-400 text-sm font-medium">
        <div className="flex items-center gap-2 text-[#E5A93C] font-display font-bold">
          <Sparkles size={18} />
          <span>ORIGINAL BERLIN ROTISSERIE · 100% HOMEMADE SAUCES</span>
        </div>
        <div className="font-mono text-xs text-zinc-500">
          CYPRUS LOCATIONS: EMBA (PAPHOS) • LIMASSOL MARINA
        </div>
      </footer>
    </div>
  );
}
