"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BIDashboard } from "@/modules/bi/components/BIDashboard";
import { InventoryManager } from "@/modules/inventory/components/InventoryManager";
import { StaffHaccpHub } from "@/modules/haccp/components/StaffHaccpHub";
import { MenuRecipeManager } from "@/modules/menu/components/MenuRecipeManager";
import {
  TrendingUp,
  PackageCheck,
  ShieldCheck,
  Tv,
  ShoppingBag,
  UtensilsCrossed,
  AlertTriangle,
  MessageSquare,
  Phone,
  Mail,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

interface SupplierInfo {
  id: string;
  name: string;
  contactName?: string;
  whatsApp: string;
  email?: string;
}

interface ShortStockItem {
  id: string;
  name: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  isLowStock: boolean;
  isDepleted: boolean;
  supplier?: SupplierInfo | null;
}

export default function BackofficeAdminPage() {
  const [activeTab, setActiveTab] = useState<"BI" | "MENU" | "INVENTORY" | "STAFF">("BI");
  const [shortItems, setShortItems] = useState<ShortStockItem[]>([]);
  const [contactSupplier, setContactSupplier] = useState<SupplierInfo | null>(null);

  const checkLowStock = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/inventory?location=EMBA");
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        const low = data.items.filter((i: ShortStockItem) => i.isLowStock || i.isDepleted);
        setShortItems(low);
      }
    } catch (err) {
      console.error("[AdminPage] Inventory check error:", err);
    }
  }, []);

  useEffect(() => {
    checkLowStock();
  }, [checkLowStock]);

  useRealtimeEvents({
    channel: "admin",
    onEvent: (type) => {
      if (type === "STOCK_CHANGED" || type === "ORDER_CREATED") {
        checkLowStock();
      }
    },
  });

  return (
    <div className="min-h-screen bg-[#121214] text-white font-sans p-6 sm:p-10 space-y-8">
      {/* ⚠️ GLOBAL SYSTEM-WIDE LOW INVENTORY WARNING BANNER */}
      {shortItems.length > 0 && (
        <div className="bg-[#EF4444]/15 border-2 border-[#EF4444] rounded-3xl p-5 shadow-2xl relative overflow-hidden animate-pulse">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#EF4444] flex items-center justify-center text-white shadow-lg shrink-0">
                <AlertTriangle size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#EF4444] text-white font-mono text-[10px] font-black uppercase tracking-wider">
                    SYSTEM ALERT
                  </span>
                  <span className="text-xs font-mono text-[#EF4444] uppercase tracking-widest font-black">
                    {shortItems.length} INGREDIENT(S) SHORT IN STORE 01 INVENTORY
                  </span>
                </div>
                <h3 className="font-display font-black text-xl text-white uppercase tracking-tight mt-0.5">
                  CRITICAL LOW STOCK WARNING:{" "}
                  <span className="text-[#00FCED]">
                    {shortItems.map((i) => i.name).join(", ")}
                  </span>
                </h3>
              </div>
            </div>

            {/* Quick Supplier Contact Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {shortItems.map((item) =>
                item.supplier ? (
                  <button
                    key={item.id}
                    onClick={() => setContactSupplier(item.supplier!)}
                    className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-display font-black text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-lg transition-all hover:scale-105"
                  >
                    <MessageSquare size={13} className="fill-black" />
                    <span>Contact {item.supplier.name}</span>
                  </button>
                ) : null
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-[#3A3A3E] pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E50D7E] flex items-center justify-center font-display font-black text-white text-2xl shadow-xl">
            GD
          </div>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight leading-none">
              MY GERMAN DÖNER · HQ OPERATIONS PORTAL
            </h1>
            <span className="text-xs font-mono font-bold text-[#E5A93C] uppercase tracking-widest mt-1 block">
              MULTI-LOCATION OPERATIONS CONTROL: EMBA (PAPHOS) & LIMASSOL MARINA
            </span>
          </div>
        </div>

        {/* Global Operational Surface Links */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <Link
            href="/pos"
            className="px-3 py-2 rounded-xl bg-[#2B2B2E] hover:bg-[#343438] text-white border border-[#3A3A3E] flex items-center gap-1.5"
          >
            <ShoppingBag size={14} className="text-[#E5A93C]" />
            <span>Counter POS</span>
          </Link>
          <Link
            href="/boards"
            className="px-3 py-2 rounded-xl bg-[#2B2B2E] hover:bg-[#343438] text-white border border-[#3A3A3E] flex items-center gap-1.5"
          >
            <Tv size={14} className="text-[#00FCED]" />
            <span>4K Signage</span>
          </Link>
          <Link
            href="/display"
            className="px-3 py-2 rounded-xl bg-[#2B2B2E] hover:bg-[#343438] text-white border border-[#3A3A3E] flex items-center gap-1.5"
          >
            <Tv size={14} className="text-[#10B981]" />
            <span>CX Wait TV</span>
          </Link>
        </div>
      </header>

      {/* Main Module Switcher (4 Unified Pillars) */}
      <nav className="flex items-center bg-[#1F1F21] p-1.5 rounded-2xl border border-[#3A3A3E] max-w-4xl text-xs font-display font-black flex-wrap sm:flex-nowrap gap-1">
        <button
          onClick={() => setActiveTab("BI")}
          className={`flex-1 py-3 px-2 rounded-xl transition-all flex items-center justify-center gap-2 text-center whitespace-nowrap ${
            activeTab === "BI"
              ? "bg-[#E50D7E] text-white shadow-lg shadow-magenta-950/40"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <TrendingUp size={16} />
          <span>BI & ANALYTICS (M9)</span>
        </button>

        <button
          onClick={() => setActiveTab("MENU")}
          className={`flex-1 py-3 px-2 rounded-xl transition-all flex items-center justify-center gap-2 text-center whitespace-nowrap ${
            activeTab === "MENU"
              ? "bg-[#E50D7E] text-white shadow-lg shadow-magenta-950/40"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <UtensilsCrossed size={16} />
          <span>MENU & RECIPES (M2/M10)</span>
        </button>

        <button
          onClick={() => setActiveTab("INVENTORY")}
          className={`flex-1 py-3 px-2 rounded-xl transition-all flex items-center justify-center gap-2 text-center whitespace-nowrap relative ${
            activeTab === "INVENTORY"
              ? "bg-[#E50D7E] text-white shadow-lg shadow-magenta-950/40"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <PackageCheck size={16} />
          <span>INVENTORY & BOM (M3)</span>
          {shortItems.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping absolute top-2 right-2" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("STAFF")}
          className={`flex-1 py-3 px-2 rounded-xl transition-all flex items-center justify-center gap-2 text-center whitespace-nowrap ${
            activeTab === "STAFF"
              ? "bg-[#E50D7E] text-white shadow-lg shadow-magenta-950/40"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <ShieldCheck size={16} />
          <span>STAFF & HACCP (M1/M7)</span>
        </button>
      </nav>

      {/* Active Tab View */}
      <main>
        {activeTab === "BI" && <BIDashboard />}
        {activeTab === "MENU" && <MenuRecipeManager />}
        {activeTab === "INVENTORY" && <InventoryManager />}
        {activeTab === "STAFF" && <StaffHaccpHub />}
      </main>

      {/* ============================================================ */}
      {/* QUICK SUPPLIER CONTACT MODAL                                 */}
      {/* ============================================================ */}
      {contactSupplier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1F1F21] border-2 border-[#25D366] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setContactSupplier(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#2B2B2E] hover:bg-[#3A3A3E] text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#25D366]/20 border border-[#25D366] flex items-center justify-center text-[#25D366]">
                <MessageSquare size={24} className="fill-[#25D366]" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#25D366] uppercase tracking-widest font-black">
                  OFFICIAL SUPPLIER CONTACT
                </span>
                <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">
                  {contactSupplier.name}
                </h3>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#2B2B2E] p-3 rounded-xl border border-[#3A3A3E] space-y-1">
                <span className="text-zinc-400 text-[11px] block">Contact Representative:</span>
                <span className="text-white font-bold text-sm block">
                  {contactSupplier.contactName || "Commercial Orders Desk"}
                </span>
              </div>

              {/* 1-Tap WhatsApp Button */}
              <a
                href={`https://wa.me/${contactSupplier.whatsApp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${contactSupplier.name}, this is MY GERMAN DÖNER Store 01 (Emba). We have low inventory alerts in our operations system and require an urgent delivery restock. Please confirm availability and ETA.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-display font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02]"
              >
                <MessageSquare size={18} className="fill-black" />
                <span>WhatsApp: {contactSupplier.whatsApp}</span>
              </a>

              {/* Direct Phone Call Button */}
              <a
                href={`tel:${contactSupplier.whatsApp}`}
                className="w-full py-3 px-4 rounded-xl bg-[#2B2B2E] hover:bg-[#38383D] border border-[#3A3A3E] text-white font-display font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
              >
                <Phone size={16} className="text-[#00FCED]" />
                <span>Call Phone: {contactSupplier.whatsApp}</span>
              </a>

              {/* Email Button */}
              {contactSupplier.email && (
                <a
                  href={`mailto:${contactSupplier.email}?subject=${encodeURIComponent(
                    "MY GERMAN DÖNER - Urgent Inventory Restock Purchase Order"
                  )}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#2B2B2E] hover:bg-[#38383D] border border-[#3A3A3E] text-zinc-300 font-mono text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Mail size={14} className="text-zinc-400" />
                  <span>Email: {contactSupplier.email}</span>
                </a>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setContactSupplier(null)}
                className="w-full py-2 rounded-xl bg-[#2B2B2E] hover:bg-[#3A3A3E] text-zinc-400 hover:text-white font-mono text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
