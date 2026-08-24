"use client";

import React, { useState, useEffect } from "react";
import { Clock, ChefHat, Check, RotateCcw, Flame, Utensils, AlertTriangle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface KDSTicket {
  id: string;
  orderNumber: string;
  orderType: "DINE_IN" | "TAKE_AWAY" | "DELIVERY";
  status: "NEW" | "PREPARING" | "READY" | "COMPLETED";
  createdAt: string;
  customerNote?: string;
  items: {
    name: string;
    quantity: number;
    spiceLevel: number;
    modifiers: string[];
    isMeal: boolean;
    mealDetails?: string;
  }[];
}

const INITIAL_MOCK_TICKETS: KDSTicket[] = [
  {
    id: "kds-1",
    orderNumber: "EMBA-20260815-1423-045",
    orderType: "DINE_IN",
    status: "PREPARING",
    createdAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(), // 9 mins ago (Urgent)
    customerNote: "Extra crispy bread please",
    items: [
      {
        name: "Classic German Döner",
        quantity: 2,
        spiceLevel: 4,
        modifiers: ["Chicken", "Fladenbrot", "Kräuter-Knoblauch Sauce", "Extra Feta"],
        isMeal: true,
        mealDetails: "Crispy Berlin Fries + Coca-Cola",
      },
      {
        name: "Berlin Currywurst",
        quantity: 1,
        spiceLevel: 3,
        modifiers: ["Traditional Pork Bratwurst", "Homemade Curry Sauce", "Pommes"],
        isMeal: false,
      },
    ],
  },
  {
    id: "kds-2",
    orderNumber: "EMBA-20260815-1427-046",
    orderType: "TAKE_AWAY",
    status: "PREPARING",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago (Medium)
    items: [
      {
        name: "Döner Box Spezial",
        quantity: 1,
        spiceLevel: 2,
        modifiers: ["Beef & Lamb", "Knoblauch Sauce", "Crispy Fries"],
        isMeal: false,
      },
      {
        name: "Veggie Falafel Döner",
        quantity: 1,
        spiceLevel: 1,
        modifiers: ["Organic Chickpea Falafel", "Sesame Tahini", "Pickled Red Cabbage"],
        isMeal: true,
        mealDetails: "Side Salad + Ayran",
      },
    ],
  },
  {
    id: "kds-3",
    orderNumber: "EMBA-20260815-1431-047",
    orderType: "DINE_IN",
    status: "NEW",
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 mins ago (Fresh)
    items: [
      {
        name: "Döner Spezial (Double Meat)",
        quantity: 1,
        spiceLevel: 5,
        modifiers: ["Mixed Meat (Double)", "Fladenbrot", "Scharf Chili Sauce (Hölle!)", "Grilled Onions"],
        isMeal: true,
        mealDetails: "Berlin Fries + Fanta",
      },
    ],
  },
];

export default function KDSPage() {
  const [tickets, setTickets] = useState<KDSTicket[]>(INITIAL_MOCK_TICKETS);
  const [activeStation, setActiveStation] = useState<"ALL" | "GRILL" | "ASSEMBLY" | "FRYER">("ALL");
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Timer Tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedSeconds = (createdAt: string) => {
    return Math.floor((currentTime - new Date(createdAt).getTime()) / 1000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getTimerSeverity = (seconds: number) => {
    if (seconds > 480) return "URGENT"; // > 8 mins (Red)
    if (seconds > 240) return "WARNING"; // > 4 mins (Amber)
    return "NORMAL"; // < 4 mins (Green)
  };

  const handleBumpTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: "READY" } : t))
    );
  };

  const handleRecallTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: "PREPARING" } : t))
    );
  };

  const activeTickets = tickets.filter((t) => t.status !== "COMPLETED");

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans select-none overflow-x-hidden">
      {/* KDS Top Bar */}
      <header className="bg-[#1A1A1A] border-b border-[#2E2E2E] px-6 py-3 flex items-center justify-between shadow-lg">
        {/* Left: Station & Active Count */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF5722] flex items-center justify-center text-white shadow glow-orange">
              <ChefHat size={22} />
            </div>
            <div>
              <h1 className="font-display font-black text-lg text-white uppercase tracking-tight">
                MY GERMAN DÖNER · KDS
              </h1>
              <span className="text-[11px] font-mono text-[#E5A93C] font-semibold">
                Kitchen Prep Line #1 • Station: EMBA
              </span>
            </div>
          </div>

          {/* Active Orders Counters */}
          <div className="hidden sm:flex items-center gap-2 ml-6 text-xs font-bold font-mono">
            <span className="px-3 py-1.5 rounded-lg bg-[#242424] border border-[#333333] text-white">
              {activeTickets.length} ACTIVE
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-green-950/60 border border-green-700 text-green-400">
              Avg: 4m 12s
            </span>
          </div>
        </div>

        {/* Center: Station Filter Tabs */}
        <div className="flex items-center bg-[#242424] p-1 rounded-xl border border-[#333333] text-xs font-display font-bold">
          {(["ALL", "GRILL", "ASSEMBLY", "FRYER"] as const).map((station) => (
            <button
              key={station}
              onClick={() => setActiveStation(station)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeStation === station
                  ? "bg-[#FF5722] text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {station}
            </button>
          ))}
        </div>

        {/* Right: Live Clock */}
        <div className="font-mono font-bold text-sm text-zinc-300 flex items-center gap-2 bg-[#242424] px-3.5 py-1.5 rounded-xl border border-[#333333]">
          <Clock size={16} className="text-[#FF5722]" />
          <span>{new Date(currentTime).toLocaleTimeString("en-GB")}</span>
        </div>
      </header>

      {/* Main KDS Grid (Landscape 4-Column Ticket Cards) */}
      <main className="flex-1 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 auto-rows-max overflow-y-auto">
        <AnimatePresence>
          {activeTickets.map((ticket) => {
            const elapsed = getElapsedSeconds(ticket.createdAt);
            const severity = getTimerSeverity(elapsed);
            const isReady = ticket.status === "READY";

            return (
              <motion.div
                key={ticket.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`flex flex-col rounded-2xl overflow-hidden border-2 shadow-2xl transition-all ${
                  isReady
                    ? "bg-[#1E1E1E] border-green-600/70 opacity-75"
                    : severity === "URGENT"
                    ? "bg-[#221818] border-[#E53935] shadow-red-950/50 animate-pulse"
                    : severity === "WARNING"
                    ? "bg-[#241F18] border-[#E5A93C]"
                    : "bg-[#1E1E1E] border-[#3A3A3A]"
                }`}
              >
                {/* Ticket Header */}
                <div
                  className={`p-3.5 flex items-center justify-between border-b ${
                    severity === "URGENT"
                      ? "bg-[#E53935] text-white"
                      : severity === "WARNING"
                      ? "bg-[#E5A93C] text-black"
                      : "bg-[#2A2A2A] text-white border-[#3A3A3A]"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-mono font-black text-base sm:text-lg tracking-wider">
                      {ticket.orderNumber.split("-").slice(-2).join("-")}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-90">
                      {ticket.orderType.replace("_", " ")}
                    </span>
                  </div>

                  {/* Big Kitchen Elapsed Timer */}
                  <div className="flex items-center gap-1.5 font-mono font-black text-lg sm:text-xl">
                    <Clock size={18} className="stroke-[2.5]" />
                    <span>{formatTimer(elapsed)}</span>
                  </div>
                </div>

                {/* Customer Special Note (if any) */}
                {ticket.customerNote && (
                  <div className="bg-[#2E2416] text-[#E5A93C] px-3.5 py-1.5 text-xs font-bold border-b border-[#3A3A3A] flex items-center gap-1.5">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span className="line-clamp-1">NOTE: &quot;{ticket.customerNote}&quot;</span>
                  </div>
                )}

                {/* Ticket Line Items */}
                <div className="flex-1 p-3.5 space-y-3 overflow-y-auto max-h-80">
                  {ticket.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="pb-2.5 border-b border-[#2E2E2E] last:border-0 last:pb-0"
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="font-display font-black text-base text-white">
                          <span className="text-[#FF5722] font-mono mr-1.5 text-lg">
                            {item.quantity}x
                          </span>
                          {item.name}
                        </span>

                        {item.spiceLevel > 1 && (
                          <span className="flex items-center gap-0.5 text-[#FF5722] font-extrabold text-xs">
                            <Flame size={14} /> L{item.spiceLevel}
                          </span>
                        )}
                      </div>

                      {/* Modifiers List */}
                      <ul className="mt-1 pl-5 space-y-0.5 list-disc text-xs text-zinc-300 font-medium">
                        {item.modifiers.map((mod, mIdx) => (
                          <li key={mIdx}>{mod}</li>
                        ))}
                      </ul>

                      {/* Meal Combo Info */}
                      {item.isMeal && (
                        <div className="mt-1 px-2 py-0.5 rounded bg-[#2A2418] border border-[#E5A93C]/40 text-[11px] text-[#E5A93C] font-bold">
                          COMBO: {item.mealDetails}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom Bump / Complete Action */}
                <div className="p-3 bg-[#1A1A1A] border-t border-[#2E2E2E]">
                  {!isReady ? (
                    <button
                      onClick={() => handleBumpTicket(ticket.id)}
                      className="w-full py-3 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] text-white font-display font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-green active:scale-98 transition-all"
                    >
                      <Check size={20} className="stroke-[3]" />
                      <span>BUMP TICKET (READY)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRecallTicket(ticket.id)}
                      className="w-full py-2.5 rounded-xl bg-[#2E2E2E] hover:bg-[#3A3A3A] text-zinc-300 font-display font-bold text-xs uppercase flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw size={14} />
                      <span>RECALL TO PREP</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </main>
    </div>
  );
}
