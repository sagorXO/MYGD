"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Clock, CheckCircle2, Flame, BellRing, Radio, Sparkles, ChefHat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { calculateKitchenWaitTime } from "../wait-estimator.engine";
import { QueueTicketItem, KitchenLoadDiagnostics } from "../cx-wait.schema";

export const WaitDisplayBoard: React.FC = () => {
  const [locationSlug] = useState<string>("EMBA");
  const [preparingOrders, setPreparingOrders] = useState<QueueTicketItem[]>([]);
  const [readyOrders, setReadyOrders] = useState<QueueTicketItem[]>([]);
  const [time, setTime] = useState<string>("");
  const [diagnostics, setDiagnostics] = useState<KitchenLoadDiagnostics>(
    calculateKitchenWaitTime({ activeTicketsCount: 4, charcoalGrillCount: 3, activeLineCooks: 2 })
  );

  const fetchDisplayQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/kds?location=${locationSlug}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        const prep: QueueTicketItem[] = [];
        const ready: QueueTicketItem[] = [];

        data.tickets.forEach((t: any) => {
          const shortNum = t.orderNumber.split("-").pop() || t.orderNumber;
          const item: QueueTicketItem = {
            id: t.id,
            orderNumber: t.orderNumber,
            shortNumber: shortNum,
            status: t.status,
            createdAt: t.createdAt,
            elapsedSeconds: t.elapsedSeconds ?? Math.max(0, Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 1000)),
            counterNumber: t.station === "GRILL" ? 2 : 1,
            itemsSummary: t.itemsSummary,
          };

          if (t.status === "READY") {
            ready.push(item);
          } else if (t.status === "NEW" || t.status === "PREPARING") {
            prep.push(item);
          }
        });

        setPreparingOrders(prep);
        setReadyOrders(ready);

        // Recalculate dynamic kitchen wait time
        const newDiag = calculateKitchenWaitTime({
          activeTicketsCount: prep.length,
          charcoalGrillCount: prep.length > 0 ? Math.ceil(prep.length * 0.7) : 0,
          activeLineCooks: 2,
        });
        setDiagnostics(newDiag);
      }
    } catch (err) {
      console.error("[WaitDisplayBoard] Failed to fetch queue:", err);
    }
  }, [locationSlug]);

  useEffect(() => {
    fetchDisplayQueue();
  }, [fetchDisplayQueue]);

  // Real-time Event Subscription
  const { isConnected, connectionTier } = useRealtimeEvents({
    channel: "display",
    onEvent: (eventType) => {
      if (eventType === "TICKET_UPDATED" || eventType === "ORDER_CREATED") {
        fetchDisplayQueue();
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

  return (
    <div className="min-h-screen w-screen bg-[#121214] text-white flex flex-col justify-between select-none overflow-hidden p-6 sm:p-8 font-sans">
      {/* Top Header Banner */}
      <header className="flex items-center justify-between border-b-2 border-[#3A3A3E] pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E50D7E] flex items-center justify-center font-display font-black text-white text-xl shadow-xl">
            GD
          </div>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight leading-none">
              MY GERMAN <span className="text-[#E50D7E]">DÖNER</span>
            </h1>
            <span className="text-[11px] font-mono font-bold text-[#E5A93C] uppercase tracking-widest mt-1 block">
              ORDER STATUS BOARD · EMBA STORE #01 (CYPRUS)
            </span>
          </div>
        </div>

        {/* Live Clock & Connection Badge */}
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-mono text-xs font-bold ${
              isConnected
                ? "bg-green-950/60 border-green-700 text-green-400"
                : "bg-amber-950/60 border-amber-700 text-amber-400"
            }`}
          >
            <Radio size={14} className={isConnected ? "animate-pulse" : ""} />
            <span>{connectionTier === "EDGE" ? "LAN EDGE 0ms" : isConnected ? "LIVE SYNC 12ms" : "OFFLINE SYNC"}</span>
          </div>

          <div className="flex items-center gap-2 bg-[#1F1F21] border border-[#3A3A3E] px-4 py-2 rounded-xl">
            <Clock size={18} className="text-[#00FCED]" />
            <span className="font-mono font-black text-xl text-white tracking-widest">
              {time || "12:00:00"}
            </span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">EEST</span>
          </div>
        </div>
      </header>

      {/* Hero Dynamic Wait Time Estimator Card */}
      <section className="my-4 bg-[#1F1F21] border-2 border-[#3A3A3E] rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#E50D7E] via-[#00FCED] to-[#E5A93C]" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00FCED]/10 border border-[#00FCED]/30 flex items-center justify-center text-[#00FCED]">
              <Clock size={24} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                Dynamic Prep Time Calculation
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight">
                CURRENT ESTIMATED WAIT:{" "}
                <span className="text-[#00FCED]">
                  ~{diagnostics.estimatedWaitMinutesMin}–{diagnostics.estimatedWaitMinutesMax} MINS
                </span>
              </h2>
            </div>
          </div>

          {/* Kitchen Load Diagnostic Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
            <div className="px-3 py-1.5 rounded-xl bg-[#2B2B2E] border border-[#3A3A3E] text-zinc-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00FCED]" />
              <span>Active Tickets: {diagnostics.activeTicketsCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#2B2B2E] border border-[#3A3A3E] text-[#E5A93C] flex items-center gap-1.5">
              <Flame size={14} className="text-[#FF5722]" />
              <span>Spit: Active Carving</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#2B2B2E] border border-[#3A3A3E] text-[#10B981] flex items-center gap-1.5">
              <ChefHat size={14} />
              <span>Speed: {diagnostics.speedCategory} ({diagnostics.activeLineCooks} Cooks)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Split Showcase */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 my-2 overflow-hidden">
        {/* Left: PREPARING / IN ARBEIT */}
        <div className="flex flex-col bg-[#1F1F21] border-2 border-[#3A3A3E] rounded-3xl p-5 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#3A3A3E] pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full bg-[#E5A93C] animate-pulse" />
              <h2 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wide">
                PREPARING <span className="text-[#E5A93C] text-sm font-semibold ml-2">/ IN ARBEIT</span>
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-400 font-bold bg-[#2B2B2E] px-2.5 py-1 rounded-lg border border-[#3A3A3E]">
              {preparingOrders.length} In Line
            </span>
          </div>

          {preparingOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 font-mono text-xs">
              <ChefHat size={32} className="mb-2 opacity-30" />
              <span>No orders currently in kitchen queue</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1">
              {preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#2B2B2E] border border-[#3A3A3E] rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow"
                >
                  <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
                    ORDER
                  </span>
                  <span className="font-mono font-black text-3xl sm:text-4xl text-white tracking-wider mt-0.5">
                    {order.shortNumber}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: READY FOR PICKUP / ABHOLBEREIT */}
        <div className="flex flex-col bg-[#1F1F21] border-2 border-[#10B981] rounded-3xl p-5 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#10B981]/40 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full bg-[#10B981] shadow" />
              <h2 className="font-display font-black text-xl sm:text-2xl text-white uppercase tracking-wide">
                READY FOR PICKUP <span className="text-[#10B981] text-sm font-semibold ml-2">/ ABHOLBEREIT</span>
              </h2>
            </div>
            <span className="flex items-center gap-1 text-xs font-mono text-[#10B981] font-black uppercase">
              <BellRing size={14} className="animate-bounce" /> COLLECT NOW
            </span>
          </div>

          {readyOrders.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 font-mono text-xs">
              <CheckCircle2 size={32} className="mb-2 opacity-30 text-[#10B981]" />
              <span>All completed orders have been collected</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto pr-1">
              <AnimatePresence>
                {readyOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[#2B2B2E] border-2 border-[#10B981] rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#10B981]" />

                    <div className="flex items-center gap-1 text-[#10B981] font-bold text-xs uppercase tracking-wider mb-0.5">
                      <CheckCircle2 size={14} />
                      <span>COLLECT AT COUNTER {order.counterNumber}</span>
                    </div>

                    <span className="font-mono font-black text-5xl sm:text-6xl text-[#E50D7E] tracking-wider my-1 drop-shadow-md">
                      {order.shortNumber}
                    </span>

                    <span className="text-[11px] text-zinc-300 font-semibold">
                      Please show your receipt
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Marquee Broadcast Ticker */}
      <footer className="bg-[#1F1F21] border-t-2 border-[#3A3A3E] pt-3 flex items-center justify-between text-zinc-400 text-xs font-medium">
        <div className="flex items-center gap-2 text-[#E5A93C] font-display font-bold">
          <Sparkles size={16} />
          <span>BITE THE HYPE · THE FIRST REAL GERMAN DÖNER IN CYPRUS · FRESH BAKED DAILY</span>
        </div>
        <div className="font-mono text-[11px] text-zinc-500">
          LOCATIONS: EMBA (PAPHOS) • LIMASSOL MARINA
        </div>
      </footer>
    </div>
  );
};
