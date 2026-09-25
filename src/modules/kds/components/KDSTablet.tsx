"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  ChefHat,
  Check,
  RotateCcw,
  Flame,
  Radio,
  Printer,
  Zap,
  RefreshCw,
  Bell,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { KDSTicket, KDSStation, KDSTicketStatus } from "../kds.schema";
import Link from "next/link";

interface KDSTabletProps {
  initialStation?: KDSStation;
}

export const KDSTablet: React.FC<KDSTabletProps> = ({ initialStation = "ALL" }) => {
  const [tickets, setTickets] = useState<KDSTicket[]>([]);
  const [activeStation, setActiveStation] = useState<KDSStation>(initialStation);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rushTickets, setRushTickets] = useState<Set<string>>(new Set());

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/kds?location=EMBA&station=${activeStation}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error("[KDSTablet] Failed to fetch tickets:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeStation]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Real-time Event Subscription
  const { isConnected, connectionTier } = useRealtimeEvents({
    channel: "kds",
    onEvent: (eventType) => {
      if (eventType === "ORDER_CREATED" || eventType === "TICKET_UPDATED") {
        fetchTickets();
      }
    },
  });

  // 1-Second Timer Tick for ticket age
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedSeconds = (createdAt: string) => {
    return Math.max(0, Math.floor((currentTime - new Date(createdAt).getTime()) / 1000));
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getTimerSeverity = (seconds: number) => {
    if (seconds >= 480) return "URGENT"; // > 8 mins (Red Alert)
    if (seconds >= 240) return "MEDIUM"; // 4 to 8 mins (Amber)
    return "NORMAL"; // < 4 mins (Green)
  };

  // Bump Ticket Progression (QUEUED/NEW -> PREPARING -> READY -> COMPLETED)
  const handleBumpTicket = async (ticket: KDSTicket) => {
    let nextStatus: KDSTicketStatus = "PREPARING";
    if (ticket.status === "QUEUED" || ticket.status === "NEW") nextStatus = "PREPARING";
    else if (ticket.status === "PREPARING" || ticket.status === "IN_PREPARATION") nextStatus = "READY";
    else if (ticket.status === "READY") nextStatus = "COMPLETED";

    // Optimistic UI update
    setTickets((prev) =>
      nextStatus === "COMPLETED"
        ? prev.filter((t) => t.id !== ticket.id)
        : prev.map((t) => (t.id === ticket.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await fetch("/api/kds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          status: nextStatus,
          claimedBy: rushTickets.has(ticket.id) ? "Kitchen Cook [RUSH]" : "Kitchen Cook",
        }),
      });
    } catch (err) {
      console.error("[KDSTablet] Bump error:", err);
      fetchTickets();
    }
  };

  // Toggle Rush Priority
  const handleToggleRush = (ticketId: string) => {
    setRushTickets((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId);
      else next.add(ticketId);
      return next;
    });
  };

  // Silent TCP Reprint
  const handleReprint = async (ticketId: string) => {
    try {
      await fetch("/api/terminal/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, station: "BOTH" }),
      });
      alert("Chit sent to TCP Port 9100 printer.");
    } catch (err) {
      console.error("[KDSTablet] Reprint error:", err);
    }
  };

  // Sort: Rush tickets first, then by createdAt asc
  const sortedTickets = [...tickets].sort((a, b) => {
    const aRush = rushTickets.has(a.id);
    const bRush = rushTickets.has(b.id);
    if (aRush && !bRush) return -1;
    if (!aRush && bRush) return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className="h-screen w-screen bg-[#121214] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Bar */}
      <header className="bg-[#1F1F21] border-b border-[#3A3A3E] px-4 py-2.5 flex items-center justify-between shadow-lg">
        {/* Left: Station Title & Active Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E50D7E] flex items-center justify-center text-white shadow">
            <ChefHat size={20} />
          </div>
          <div>
            <h1 className="font-display font-black text-sm text-white uppercase tracking-tight">
              MY GERMAN DÖNER · KDS COOK TABLET
            </h1>
            <span className="text-[10px] font-mono text-[#E5A93C] font-semibold">
              Location: EMBA (PAPHOS) • Station: {activeStation}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-4 text-xs font-mono font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-[#2B2B2E] border border-[#3A3A3E] text-white">
              {tickets.length} ACTIVE
            </span>
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] ${
                isConnected
                  ? "bg-green-950/60 border-green-700 text-green-400"
                  : "bg-amber-950/60 border-amber-700 text-amber-400"
              }`}
            >
              <Radio size={12} className={isConnected ? "animate-pulse" : ""} />
              <span>{connectionTier === "EDGE" ? "LAN EDGE 0ms" : isConnected ? "ONLINE" : "OFFLINE"}</span>
            </div>
          </div>
        </div>

        {/* Center: Station Switcher Tabs */}
        <div className="flex items-center bg-[#2B2B2E] p-1 rounded-xl border border-[#3A3A3E] text-xs font-display font-bold">
          {(["ALL", "GRILL", "ASSEMBLY", "FRYER"] as const).map((station) => (
            <button
              key={station}
              onClick={() => setActiveStation(station)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeStation === station
                  ? "bg-[#E50D7E] text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {station}
            </button>
          ))}
        </div>

        {/* Right: Dedicated TV Views & Refresh */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/display"
            target="_blank"
            className="px-2.5 py-1.5 rounded-lg bg-[#2B2B2E] hover:bg-[#343438] text-xs font-mono text-zinc-300 border border-[#3A3A3E]"
          >
            CX Wait TV
          </Link>
          <button
            onClick={fetchTickets}
            className="p-2 rounded-xl bg-[#2B2B2E] border border-[#3A3A3E] text-zinc-300 hover:text-white transition-all"
            title="Refresh Tickets"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* Main Ticket Grid */}
      <main className="flex-1 p-3 overflow-x-auto overflow-y-hidden">
        {sortedTickets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 font-mono text-xs">
            <CheckCircle2 size={40} className="mb-2 text-[#10B981] opacity-40" />
            <span className="text-sm font-bold">All tickets cleared! Kitchen line ready.</span>
          </div>
        ) : (
          <div className="h-full flex gap-3 pb-2">
            {sortedTickets.map((ticket) => {
              const elapsed = getElapsedSeconds(ticket.createdAt);
              const severity = getTimerSeverity(elapsed);
              const isRush = rushTickets.has(ticket.id);

              return (
                <div
                  key={ticket.id}
                  className={`w-[320px] shrink-0 h-full flex flex-col bg-[#1F1F21] rounded-2xl border-2 shadow-2xl overflow-hidden transition-all ${
                    isRush
                      ? "border-[#E50D7E] shadow-magenta-950/60 ring-2 ring-[#E50D7E]"
                      : severity === "URGENT"
                      ? "border-[#EF4444] shadow-red-950/50 animate-pulse"
                      : severity === "MEDIUM"
                      ? "border-[#E5A93C]"
                      : "border-[#3A3A3E]"
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-3 flex items-center justify-between text-xs font-bold border-b ${
                      isRush
                        ? "bg-[#E50D7E] text-white border-transparent"
                        : severity === "URGENT"
                        ? "bg-[#EF4444] text-white border-transparent"
                        : "bg-[#2B2B2E] text-zinc-200 border-[#3A3A3E]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-base font-black">
                          #{ticket.orderNumber.split("-").pop() || ticket.orderNumber}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-1 py-0.5 rounded bg-black/20">
                          {ticket.orderType}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-80 block font-mono">
                        {ticket.orderNumber}
                      </span>
                    </div>

                    {/* Timer & Rush Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRush(ticket.id)}
                        className={`p-1.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 ${
                          isRush
                            ? "bg-white text-[#E50D7E]"
                            : "bg-[#1F1F21] text-zinc-300 border border-[#3A3A3E] hover:text-white"
                        }`}
                        title="Toggle Rush Status"
                      >
                        <Zap size={12} />
                        <span>RUSH</span>
                      </button>

                      <div className="flex items-center gap-1 font-mono text-sm font-black bg-black/20 px-2 py-1 rounded-lg">
                        <Clock size={12} />
                        <span>{formatTimer(elapsed)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
                    {ticket.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl p-2.5 space-y-1"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-display font-black text-white text-xs leading-tight">
                            {item.quantity}x {item.name.toUpperCase()}
                          </span>
                          {item.spiceLevel > 1 && (
                            <span className="text-[10px] font-mono text-[#FF5722] font-black">
                              {"🔥".repeat(item.spiceLevel)} Lvl {item.spiceLevel}
                            </span>
                          )}
                        </div>

                        {item.breadType && (
                          <span className="text-[10px] font-mono text-zinc-400 block">
                            Bread: {item.breadType}
                          </span>
                        )}

                        {/* Additions (Bold Green) */}
                        {item.additions && item.additions.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.additions.map((add, aIdx) => (
                              <span
                                key={aIdx}
                                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-[#10B981] border border-emerald-800/40"
                              >
                                [+] {add}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Omissions (Bold Red) */}
                        {item.omissions && item.omissions.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.omissions.map((omit, oIdx) => (
                              <span
                                key={oIdx}
                                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-950/60 text-[#EF4444] border border-red-800/40 line-through"
                              >
                                [-] NO {omit}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <span className="text-[10px] text-[#E5A93C] font-mono block italic">
                            * {item.notes}
                          </span>
                        )}
                      </div>
                    ))}

                    {ticket.customerNote && (
                      <div className="bg-[#1F1F21] border border-amber-900/50 rounded-xl p-2 text-[10px] text-[#E5A93C] font-mono">
                        NOTE: {ticket.customerNote}
                      </div>
                    )}
                  </div>

                  {/* Bump Actions Footer */}
                  <div className="bg-[#2B2B2E] border-t border-[#3A3A3E] p-2 flex items-center gap-2">
                    <button
                      onClick={() => handleReprint(ticket.id)}
                      className="p-2.5 rounded-xl bg-[#1F1F21] border border-[#3A3A3E] text-zinc-400 hover:text-white"
                      title="Silent TCP Reprint"
                    >
                      <Printer size={14} />
                    </button>

                    <button
                      onClick={() => handleBumpTicket(ticket)}
                      className={`flex-1 py-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow transition-all ${
                        ticket.status === "QUEUED" || ticket.status === "NEW"
                          ? "bg-[#00FCED] text-black hover:bg-[#00e2d5]"
                          : ticket.status === "PREPARING"
                          ? "bg-[#10B981] text-black hover:bg-[#0ea372]"
                          : "bg-[#E50D7E] text-white hover:bg-[#d00b72]"
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                      <span>
                        {ticket.status === "QUEUED" || ticket.status === "NEW"
                          ? "START COOKING"
                          : ticket.status === "PREPARING"
                          ? "MARK READY"
                          : "COMPLETE"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
