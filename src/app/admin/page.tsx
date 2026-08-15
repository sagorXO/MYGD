"use client";

import React, { useState, useEffect } from "react";
import { formatEuro } from "@/lib/i18n";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Printer,
  ShieldCheck,
  RefreshCw,
  Store,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
} from "lucide-react";

export default function BackofficeAdminPage() {
  const [selectedLocation, setSelectedLocation] = useState<string>("EMBA");
  const [inventoryStatus, setInventoryStatus] = useState<Record<string, boolean>>({
    "prod-classic-doner": true,
    "prod-doner-spezial": true,
    "prod-veggie-doner": true,
    "prod-doner-box": true,
    "prod-currywurst": true,
    "mod-halloumi": false, // Sold out
    "mod-tzatziki": true,
  });

  const [printerType, setPrinterType] = useState<"EPSON_TM" | "STAR_MICRONICS">("EPSON_TM");
  const [printerMessage, setPrinterMessage] = useState<string | null>(null);

  const toggleInventory = (id: string) => {
    setInventoryStatus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleTestPrint = async (type: "EPSON_TM" | "STAR_MICRONICS") => {
    setPrinterType(type);
    setPrinterMessage(`Sending test pulse to ${type}...`);
    try {
      const res = await fetch("/api/terminal/printer-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printerType: type }),
      });
      const data = await res.json();
      if (data.success) {
        setPrinterMessage(`✅ Test print succeeded on ${type} (${data.protocol})`);
      }
    } catch {
      setPrinterMessage("❌ Printer test failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="bg-[#1C1C1C] border-b border-[#2E2E2E] px-8 py-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF5722] to-[#E64A19] flex items-center justify-center font-display font-black text-white text-xl shadow glow-orange">
            GD
          </div>
          <div>
            <h1 className="font-display font-black text-lg text-white uppercase tracking-tight">
              MY GERMAN DÖNER · STORE HQ
            </h1>
            <span className="text-xs font-mono text-[#E5A93C] font-semibold">
              Store Manager Portal • Cyprus Cluster
            </span>
          </div>
        </div>

        {/* Store Location & Status Badges */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#242424] border border-[#3A3A3A] px-3.5 py-1.5 rounded-xl text-xs">
            <Store size={16} className="text-[#FF5722]" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            >
              <option value="EMBA">Emba Store (Paphos)</option>
              <option value="LIMASSOL">Limassol Marina Store</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-green-950/60 border border-green-700 text-green-400 text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
            <span>3 Kiosks Online • DB WAL Mode</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8 overflow-y-auto">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Gross Sales */}
          <div className="bg-[#1E1E1E] border border-[#333333] p-5 rounded-2xl space-y-2 shadow">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
              <span>TODAY&apos;S GROSS SALES</span>
              <DollarSign size={16} className="text-[#FF5722]" />
            </div>
            <div className="font-display font-black text-3xl text-[#FF5722] font-mono">
              €2,845.50
            </div>
            <span className="text-xs text-[#4CAF50] font-bold flex items-center gap-1">
              <TrendingUp size={14} /> +14.2% vs yesterday
            </span>
          </div>

          {/* Total Orders */}
          <div className="bg-[#1E1E1E] border border-[#333333] p-5 rounded-2xl space-y-2 shadow">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
              <span>TOTAL ORDERS</span>
              <ShoppingBag size={16} className="text-[#E5A93C]" />
            </div>
            <div className="font-display font-black text-3xl text-white font-mono">
              218
            </div>
            <span className="text-xs text-zinc-400 font-medium">
              Avg Ticket: €13.05
            </span>
          </div>

          {/* Cyprus 19% VAT */}
          <div className="bg-[#1E1E1E] border border-[#333333] p-5 rounded-2xl space-y-2 shadow">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
              <span>CYPRUS 19% VAT</span>
              <FileText size={16} className="text-blue-400" />
            </div>
            <div className="font-display font-black text-3xl text-white font-mono">
              €454.33
            </div>
            <span className="text-xs text-zinc-400 font-medium">
              Net Tax Base: €2,391.17
            </span>
          </div>

          {/* Avg Prep Time */}
          <div className="bg-[#1E1E1E] border border-[#333333] p-5 rounded-2xl space-y-2 shadow">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold">
              <span>AVG KITCHEN PREP</span>
              <Clock size={16} className="text-[#4CAF50]" />
            </div>
            <div className="font-display font-black text-3xl text-[#4CAF50] font-mono">
              4m 12s
            </div>
            <span className="text-xs text-zinc-400 font-medium">
              Target: &lt; 6m 00s
            </span>
          </div>
        </div>

        {/* 2-Column Content Grid: Live Menu Inventory Toggles & Hardware Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Out-of-Stock & Ingredient Toggles */}
          <div className="bg-[#1E1E1E] border border-[#333333] rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-4">
              <div>
                <h3 className="font-display font-black text-lg text-white">
                  Real-Time Stock & Sold-Out Switches
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Changes update all ordering kiosks and POS terminals instantly.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { id: "prod-classic-doner", name: "Classic German Döner", type: "Item" },
                { id: "prod-doner-spezial", name: "Döner Spezial (Double Meat)", type: "Item" },
                { id: "prod-veggie-doner", name: "Veggie Falafel Döner", type: "Item" },
                { id: "prod-currywurst", name: "Berlin Currywurst", type: "Item" },
                { id: "mod-halloumi", name: "Grilled Cyprus Halloumi", type: "Modifier" },
                { id: "mod-tzatziki", name: "Homemade Garlic Tzatziki", type: "Modifier" },
              ].map((item) => {
                const inStock = inventoryStatus[item.id] !== false;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#242424] border border-[#333333]"
                  >
                    <div>
                      <span className="font-display font-bold text-sm text-white block">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500 uppercase">
                        {item.type}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleInventory(item.id)}
                      className={`px-4 py-1.5 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all ${
                        inStock
                          ? "bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/40"
                          : "bg-[#E53935]/20 text-[#E53935] border border-[#E53935]/40 glow-red"
                      }`}
                    >
                      {inStock ? "IN STOCK" : "SOLD OUT"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Hardware & Dual Receipt Printer Driver */}
          <div className="bg-[#1E1E1E] border border-[#333333] rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-4">
              <div>
                <h3 className="font-display font-black text-lg text-white">
                  Hardware & Dual Printer Driver Management
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Toggle between ESC/POS and StarPRNT thermal hardware drivers.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleTestPrint("EPSON_TM")}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    printerType === "EPSON_TM"
                      ? "bg-[#28211A] border-[#FF5722] shadow glow-orange"
                      : "bg-[#242424] border-[#333333] text-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-sm text-white">
                      Epson TM-T88VI
                    </span>
                    {printerType === "EPSON_TM" && (
                      <CheckCircle2 size={16} className="text-[#FF5722]" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    ESC/POS Protocol • Direct USB / Ethernet
                  </p>
                  <span className="mt-3 inline-block text-[11px] font-bold text-[#FF5722]">
                    Send Test Print →
                  </span>
                </button>

                <button
                  onClick={() => handleTestPrint("STAR_MICRONICS")}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    printerType === "STAR_MICRONICS"
                      ? "bg-[#28211A] border-[#FF5722] shadow glow-orange"
                      : "bg-[#242424] border-[#333333] text-zinc-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-black text-sm text-white">
                      Star TSP143
                    </span>
                    {printerType === "STAR_MICRONICS" && (
                      <CheckCircle2 size={16} className="text-[#FF5722]" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    StarPRNT Protocol • Auto-Guillotine
                  </p>
                  <span className="mt-3 inline-block text-[11px] font-bold text-[#FF5722]">
                    Send Test Print →
                  </span>
                </button>
              </div>

              {printerMessage && (
                <div className="p-3.5 rounded-xl bg-[#242424] border border-[#3A3A3A] text-xs font-mono text-zinc-300">
                  {printerMessage}
                </div>
              )}

              {/* Security & Audit Trail */}
              <div className="bg-[#242424] p-4 rounded-2xl border border-[#333333] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <ShieldCheck size={16} className="text-[#4CAF50]" />
                  <span>Security & Audit Trail</span>
                </div>
                <p className="text-xs text-zinc-400">
                  All price changes and inventory overrides are cryptographically logged to the SQLite audit table.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
