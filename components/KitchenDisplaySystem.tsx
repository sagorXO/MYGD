"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Clock,
  CheckCircle2,
  RotateCcw,
  Volume2,
  VolumeX,
  Filter,
  Utensils,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  Layers,
  ChefHat
} from "lucide-react";

export type OrderType = "DINE IN" | "TAKE AWAY" | "DELIVERY";
export type StationType = "ALL" | "GRILL / MEAT" | "ASSEMBLY / SAUCES" | "FRYER / SIDES";
export type TicketStatus = "urgent" | "in_prep" | "new" | "ready";

export interface OrderItemModifier {
  category: "meat" | "sauce" | "spice" | "side" | "extra";
  text: string;
  level?: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  station: "GRILL / MEAT" | "ASSEMBLY / SAUCES" | "FRYER / SIDES" | "ALL";
  modifiers: OrderItemModifier[];
  completed?: boolean;
}

export interface KitchenTicket {
  id: string;
  orderNumber: string; // e.g. EMBA-045
  orderType: OrderType;
  station: StationType;
  placedAt: number; // timestamp in seconds elapsed or epoch
  initialSeconds: number; // starting timer count
  items: OrderItem[];
  status: TicketStatus;
  tableNumber?: string;
}

const INITIAL_TICKETS: KitchenTicket[] = [
  {
    id: "ticket-1",
    orderNumber: "EMBA-045",
    orderType: "DINE IN",
    station: "ALL",
    placedAt: Date.now() - 564000,
    initialSeconds: 564, // 09:24
    status: "urgent",
    tableNumber: "T-04",
    items: [
      {
        id: "item-1-1",
        name: "Classic Döner",
        quantity: 2,
        station: "GRILL / MEAT",
        modifiers: [
          { category: "meat", text: "Chicken" },
          { category: "sauce", text: "Kräuter + Knoblauch" },
          { category: "spice", text: "SCHARF Level 4", level: 4 }
        ]
      },
      {
        id: "item-1-2",
        name: "Pommes Spezial",
        quantity: 1,
        station: "FRYER / SIDES",
        modifiers: [
          { category: "sauce", text: "Curry Ketchup & Mayo" },
          { category: "extra", text: "Fresh Diced Onions" }
        ]
      }
    ]
  },
  {
    id: "ticket-2",
    orderNumber: "EMBA-046",
    orderType: "TAKE AWAY",
    station: "ALL",
    placedAt: Date.now() - 318000,
    initialSeconds: 318, // 05:18
    status: "in_prep",
    items: [
      {
        id: "item-2-1",
        name: "Döner Box",
        quantity: 1,
        station: "GRILL / MEAT",
        modifiers: [
          { category: "meat", text: "Beef / Lamb" },
          { category: "sauce", text: "Knoblauch" },
          { category: "side", text: "Crispy Fries Base" }
        ]
      },
      {
        id: "item-2-2",
        name: "Veggie Döner",
        quantity: 1,
        station: "ASSEMBLY / SAUCES",
        modifiers: [
          { category: "meat", text: "Falafel (3 pcs)" },
          { category: "sauce", text: "Hummus + Kräuter" },
          { category: "spice", text: "Mild", level: 1 }
        ]
      }
    ]
  },
  {
    id: "ticket-3",
    orderNumber: "EMBA-047",
    orderType: "DINE IN",
    station: "ALL",
    placedAt: Date.now() - 105000,
    initialSeconds: 105, // 01:45
    status: "new",
    tableNumber: "T-12",
    items: [
      {
        id: "item-3-1",
        name: "Döner Spezial",
        quantity: 1,
        station: "GRILL / MEAT",
        modifiers: [
          { category: "extra", text: "Extra Beef (+100g)" },
          { category: "sauce", text: "Knoblauch & Scharf" },
          { category: "spice", text: "Scharf Level 5 Hölle!", level: 5 }
        ]
      }
    ]
  },
  {
    id: "ticket-4",
    orderNumber: "EMBA-044",
    orderType: "DELIVERY",
    station: "ALL",
    placedAt: Date.now() - 720000,
    initialSeconds: 720,
    status: "ready",
    items: [
      {
        id: "item-4-1",
        name: "2x Jumbo Dürüm Döner",
        quantity: 2,
        station: "GRILL / MEAT",
        modifiers: [
          { category: "meat", text: "Mixed Meat" },
          { category: "sauce", text: "Tzatziki + Chili" }
        ],
        completed: true
      },
      {
        id: "item-4-2",
        name: "1x Halloumi Box & Cola",
        quantity: 1,
        station: "FRYER / SIDES",
        modifiers: [{ category: "side", text: "0.33L Chilled" }],
        completed: true
      }
    ]
  }
];

export const KitchenDisplaySystem: React.FC = () => {
  const [tickets, setTickets] = useState<KitchenTicket[]>(INITIAL_TICKETS);
  const [activeStation, setActiveStation] = useState<StationType>("ALL");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Live Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live Timer increment
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTickets((prev) =>
        prev.map((ticket) => {
          if (ticket.status === "ready") return ticket;
          const newSeconds = ticket.initialSeconds + 1;
          let newStatus: TicketStatus = "new";
          if (newSeconds >= 480) {
            newStatus = "urgent";
          } else if (newSeconds >= 240) {
            newStatus = "in_prep";
          }
          return {
            ...ticket,
            initialSeconds: newSeconds,
            status: newStatus
          };
        })
      );
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleBump = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: "ready", items: t.items.map((i) => ({ ...i, completed: true })) }
          : t
      )
    );
  };

  const handleRecall = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: t.initialSeconds >= 480 ? "urgent" : "in_prep", items: t.items.map((i) => ({ ...i, completed: false })) }
          : t
      )
    );
  };

  const toggleItemComplete = (ticketId: string, itemId: string) => {
    setTickets((prev) =>
      prev.map((ticket) => {
        if (ticket.id !== ticketId) return ticket;
        const updatedItems = ticket.items.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        const allDone = updatedItems.every((i) => i.completed);
        return {
          ...ticket,
          items: updatedItems,
          status: allDone ? "ready" : ticket.initialSeconds >= 480 ? "urgent" : ticket.initialSeconds >= 240 ? "in_prep" : "new"
        };
      })
    );
  };

  // Filter tickets by station
  const filteredTickets = tickets.filter((ticket) => {
    if (activeStation === "ALL") return true;
    return ticket.items.some((item) => item.station === activeStation);
  });

  const pendingCount = tickets.filter((t) => t.status === "urgent").length;
  const inPrepCount = tickets.filter((t) => t.status === "in_prep" || t.status === "new").length;
  const readyCount = tickets.filter((t) => t.status === "ready").length;

  const stations: StationType[] = ["ALL", "GRILL / MEAT", "ASSEMBLY / SAUCES", "FRYER / SIDES"];

  return (
    <div className="flex flex-col w-full h-screen bg-[#141414] text-white font-sans overflow-hidden select-none">
      {/* 1. TOP BAR (60px) */}
      <header className="h-[64px] bg-[#1E1E1E] border-b border-[#2C2C2C] px-5 flex items-center justify-between shadow-md shrink-0 z-20">
        {/* Brand & KDS Tag */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF5722] flex items-center justify-center font-black text-white text-sm shadow-sm">
              GD
            </div>
            <div className="leading-tight">
              <span className="font-extrabold tracking-wider text-sm font-['Space_Grotesk'] text-white">
                MY GERMAN DÖNER
              </span>
              <span className="ml-2 px-1.5 py-0.5 rounded bg-[#2A2A2A] text-[#FF5722] text-[11px] font-mono font-bold tracking-widest border border-[#FF5722]/30">
                KDS v2.4
              </span>
            </div>
          </div>

          {/* Station Filters */}
          <nav className="flex items-center bg-[#141414] p-1 rounded-xl border border-[#2E2E2E] ml-4">
            {stations.map((st) => (
              <button
                key={st}
                onClick={() => setActiveStation(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all tracking-wider ${
                  activeStation === st
                    ? "bg-[#FF5722] text-white shadow-md shadow-orange-950/40"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-[#222]"
                }`}
              >
                {st}
              </button>
            ))}
          </nav>
        </div>

        {/* Center: Live Order Status Pills */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E53935]/15 border border-[#E53935]/40 text-[#FF5252] text-xs font-bold font-mono shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#FF5252] animate-ping"></span>
            <span>{pendingCount} URGENT</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFB300]/15 border border-[#FFB300]/40 text-[#FFC107] text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-[#FFC107]"></span>
            <span>{inPrepCount} IN PREP</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#43A047]/15 border border-[#43A047]/40 text-[#66BB6A] text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-[#66BB6A]"></span>
            <span>{readyCount} READY</span>
          </div>
        </div>

        {/* Right Info: Avg Time, Clock & Toggles */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#252525] px-3 py-1.5 rounded-xl border border-[#333]">
            <Clock className="w-4 h-4 text-neutral-400" />
            <div className="text-xs text-neutral-400">
              Avg Prep: <span className="font-mono font-bold text-white">4:12 min</span>
            </div>
          </div>

          <div className="text-base font-mono font-bold text-neutral-200 bg-[#121212] px-3 py-1 rounded-lg border border-[#2B2B2B] tracking-wider">
            {currentTime || "12:00:00"}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="w-9 h-9 rounded-lg bg-[#252525] hover:bg-[#333] flex items-center justify-center text-neutral-300 transition-colors border border-[#333]"
            title={soundEnabled ? "Mute Audio" : "Unmute Audio"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#FF5722]" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>
        </div>
      </header>

      {/* 2. MAIN 4-COLUMN TICKET BOARD */}
      <main className="flex-1 grid grid-cols-4 gap-4 p-4 overflow-hidden bg-[#141414]">
        <AnimatePresence>
          {filteredTickets.map((ticket, index) => {
            const isUrgent = ticket.status === "urgent";
            const isInPrep = ticket.status === "in_prep";
            const isNew = ticket.status === "new";
            const isReady = ticket.status === "ready";

            // Border color styles
            let cardBorder = "border-[#333333]";
            let glowClass = "";
            let timerColor = "text-neutral-400";
            let timerBg = "bg-neutral-800/60";

            if (isUrgent) {
              cardBorder = "border-[#FF3B30] border-2 shadow-[0_0_20px_rgba(255,59,48,0.35)]";
              timerColor = "text-[#FF3B30]";
              timerBg = "bg-[#FF3B30]/15 border border-[#FF3B30]/40";
            } else if (isInPrep) {
              cardBorder = "border-[#FF9500] border-2 shadow-[0_0_15px_rgba(255,149,0,0.25)]";
              timerColor = "text-[#FF9500]";
              timerBg = "bg-[#FF9500]/15 border border-[#FF9500]/40";
            } else if (isNew) {
              cardBorder = "border-[#34C759] border-2 shadow-[0_0_15px_rgba(52,199,89,0.25)]";
              timerColor = "text-[#34C759]";
              timerBg = "bg-[#34C759]/15 border border-[#34C759]/40";
            } else if (isReady) {
              cardBorder = "border-[#3A3A3A] opacity-70";
              timerColor = "text-neutral-500";
              timerBg = "bg-neutral-800/40";
            }

            return (
              <motion.div
                key={ticket.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className={`flex flex-col bg-[#1E1E1E] rounded-2xl ${cardBorder} ${glowClass} overflow-hidden h-full shadow-2xl`}
              >
                {/* Ticket Header */}
                <div className="p-3.5 bg-[#252525] border-b border-[#303030] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Ticket {index + 1}
                    </span>
                    <span className="text-xl font-black font-mono tracking-tight text-white">
                      {ticket.orderNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Order Type Badge */}
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        ticket.orderType === "DINE IN"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                          : ticket.orderType === "TAKE AWAY"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          : "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                      }`}
                    >
                      {ticket.orderType}
                    </span>

                    {/* Live Timer / Ready Status */}
                    {isReady ? (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        READY
                      </span>
                    ) : (
                      <div className={`px-2.5 py-1 rounded-md ${timerBg} ${timerColor} font-mono font-black text-sm tracking-wider flex items-center gap-1`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTimer(ticket.initialSeconds)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticket Body: Items List */}
                <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 custom-scrollbar">
                  {ticket.items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleItemComplete(ticket.id, item.id)}
                      className={`p-3 rounded-xl transition-all cursor-pointer border ${
                        item.completed
                          ? "bg-[#181818] border-neutral-800 opacity-40 line-through"
                          : "bg-[#282828] border-[#383838] hover:border-neutral-500 shadow-sm"
                      }`}
                    >
                      {/* Item Title & Qty */}
                      <div className="flex items-center justify-between text-base font-extrabold text-white">
                        <span className="font-['Space_Grotesk'] text-lg">
                          {item.quantity}x {item.name}
                        </span>
                        {item.completed && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />}
                      </div>

                      {/* Modifiers List */}
                      {item.modifiers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.modifiers.map((mod, mIdx) => {
                            let modBg = "bg-[#333333] text-neutral-200 border-neutral-600";

                            if (mod.category === "meat") {
                              modBg = "bg-[#FF5722]/20 text-[#FF8A65] border-[#FF5722]/50 font-bold";
                            } else if (mod.category === "sauce") {
                              modBg = "bg-emerald-950/60 text-emerald-300 border-emerald-500/40";
                            } else if (mod.category === "spice") {
                              modBg = "bg-red-950/70 text-red-400 border-red-500/60 font-black animate-pulse";
                            } else if (mod.category === "extra") {
                              modBg = "bg-amber-950/60 text-amber-300 border-amber-500/50 font-bold";
                            }

                            return (
                              <span
                                key={mIdx}
                                className={`text-[12px] px-2 py-0.5 rounded-md border ${modBg} tracking-wide flex items-center gap-1`}
                              >
                                {mod.category === "spice" && <Flame className="w-3 h-3 text-red-500 inline" />}
                                {mod.text}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Ticket Footer Action Button (BUMP or RECALL) */}
                <div className="p-3 bg-[#242424] border-t border-[#303030]">
                  {isReady ? (
                    <button
                      onClick={() => handleRecall(ticket.id)}
                      className="w-full py-3.5 rounded-xl bg-[#3A3A3A] hover:bg-[#4A4A4A] active:scale-[0.98] text-neutral-200 font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-neutral-600 transition-all shadow-md"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>RECALL TICKET</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBump(ticket.id)}
                      className="w-full py-4 rounded-xl bg-[#2E7D32] hover:bg-[#388E3C] active:scale-[0.98] text-white font-black text-lg uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-400 shadow-lg shadow-green-950/50 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>BUMP</span>
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
};

export default KitchenDisplaySystem;
