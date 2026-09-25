"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatEuro } from "@/lib/i18n";
import {
  PackageCheck,
  AlertTriangle,
  Flame,
  Plus,
  RefreshCw,
  TrendingDown,
  Layers,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCw,
  Phone,
  Mail,
  MessageSquare,
  ExternalLink,
  X,
} from "lucide-react";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { spitTrackerService } from "../spit-tracker.service";
import { SpitMountLog } from "../inventory.schema";

interface InventoryRow {
  id: string;
  ingredientId?: string;
  sku: string;
  name: string;
  unit: string;
  currentStock: number;
  minThreshold: number;
  reorderBatchSize?: number;
  costPerUnit?: number;
  isLowStock: boolean;
  isDepleted: boolean;
  supplier?: {
    id: string;
    name: string;
    contactName?: string;
    whatsApp: string;
    email?: string;
  } | null;
}

export const InventoryManager: React.FC = () => {
  const [locationSlug, setLocationSlug] = useState<"EMBA" | "LIMASSOL">("EMBA");
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [spit, setSpit] = useState<SpitMountLog>(spitTrackerService.getActiveSpit(locationSlug));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [intakeItem, setIntakeItem] = useState<InventoryRow | null>(null);
  const [intakeAmount, setIntakeAmount] = useState<number>(50);
  const [contactSupplierItem, setContactSupplierItem] = useState<InventoryRow | null>(null);

  const fetchStock = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/inventory?location=${locationSlug}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      }
      setSpit(spitTrackerService.getActiveSpit(locationSlug));
    } catch (err) {
      console.error("[InventoryManager] Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [locationSlug]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  useRealtimeEvents({
    channel: "admin",
    onEvent: (type) => {
      if (type === "STOCK_CHANGED" || type === "ORDER_CREATED") {
        fetchStock();
      }
    },
  });

  const handleMountSpit = (kg: number) => {
    const updated = spitTrackerService.mountNewSpit(locationSlug, kg, "BEEF_VEAL", "1234");
    setSpit(updated);
    alert(`Mounted new ${kg}kg rotisserie spit for ${locationSlug}!`);
  };

  const handleApplyIntake = async () => {
    if (!intakeItem) return;
    try {
      const res = await fetch("/api/admin/inventory/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationSlug,
          ingredientId: intakeItem.ingredientId || intakeItem.id,
          addedUnits: intakeAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIntakeItem(null);
        fetchStock();
      } else {
        alert(data.error || "Restock failed.");
      }
    } catch (err) {
      console.error("[InventoryManager] Restock intake error:", err);
    }
  };

  const lowStockItems = items.filter((i) => i.isLowStock || i.isDepleted);
  const spitPercentRemaining = Math.max(
    0,
    Math.min(100, Math.round((spit.remainingWeightKg / spit.initialWeightKg) * 100))
  );

  return (
    <div className="space-y-6 font-sans text-white">
      {/* ⚠️ CRITICAL LOW STOCK WARNING BANNER */}
      {lowStockItems.length > 0 && (
        <div className="bg-[#EF4444]/15 border-2 border-[#EF4444] rounded-3xl p-5 shadow-2xl relative overflow-hidden animate-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/30 border border-[#EF4444] flex items-center justify-center text-[#EF4444] shadow-lg">
                <AlertTriangle size={26} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#EF4444] text-white font-mono text-[10px] font-black uppercase tracking-wider">
                    CRITICAL WARNING
                  </span>
                  <span className="text-xs font-mono text-[#EF4444] uppercase tracking-widest font-black">
                    {lowStockItems.length} INGREDIENT(S) SHORT IN INVENTORY!
                  </span>
                </div>
                <h3 className="font-display font-black text-xl text-white uppercase tracking-tight mt-0.5">
                  LOW STOCK DETECTED — REPLENISH TO PREVENT MENU DISRUPTIONS
                </h3>
              </div>
            </div>
          </div>

          {/* Quick-Action Alert Cards for Short Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#1F1F21] border border-[#EF4444]/60 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-display font-black text-white text-base block">
                      {item.name}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
                      Current Stock:{" "}
                      <strong className="text-[#EF4444] font-black text-sm">
                        {item.currentStock.toLocaleString()} {item.unit}
                      </strong>{" "}
                      (Min: {item.minThreshold.toLocaleString()} {item.unit})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-red-950 border border-red-700 text-red-300 font-mono text-[10px] font-black uppercase">
                    {item.isDepleted ? "DEPLETED" : "SHORT"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-[#3A3A3E]">
                  <div className="text-[11px] font-mono text-zinc-300 truncate max-w-[140px]">
                    <span className="text-[10px] text-zinc-500 block uppercase">Supplier:</span>
                    <span className="font-bold">{item.supplier?.name || "Unassigned"}</span>
                  </div>
                  {item.supplier ? (
                    <button
                      onClick={() => setContactSupplierItem(item)}
                      className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-display font-black text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all hover:scale-105"
                    >
                      <MessageSquare size={14} className="fill-black" />
                      <span>Contact Supplier</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500 italic">No Supplier</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Banner: Store Toggle & Spit Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#1F1F21] border border-[#3A3A3E] p-4 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck size={20} className="text-[#00FCED]" />
            <h2 className="font-display font-black text-lg text-white uppercase tracking-tight">
              RECIPE INVENTORY & BOM CORE (M3)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gram-precision recipe deduction • Spit meat balance • Supplier contact triggers
          </p>
        </div>

        {/* Store Toggle */}
        <div className="flex items-center bg-[#2B2B2E] p-1 rounded-xl border border-[#3A3A3E] text-xs font-mono font-bold">
          <button
            onClick={() => setLocationSlug("EMBA")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              locationSlug === "EMBA" ? "bg-[#E50D7E] text-white shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            STORE 01 (EMBA)
          </button>
          <button
            onClick={() => setLocationSlug("LIMASSOL")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              locationSlug === "LIMASSOL" ? "bg-[#E50D7E] text-white shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            STORE 02 (LIMASSOL)
          </button>
        </div>
      </div>

      {/* Spit-Mount Rotisserie Counter Widget */}
      <div className="bg-[#1F1F21] border-2 border-[#3A3A3E] rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E5A93C]/10 border border-[#E5A93C]/30 flex items-center justify-center text-[#E5A93C]">
              <Flame size={24} className="text-[#FF5722]" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                Outdoor Charcoal Rotisserie Spit Counter
              </span>
              <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">
                ACTIVE SPIT:{" "}
                <span className={spit.remainingWeightKg <= 3 ? "text-[#EF4444]" : "text-[#E5A93C]"}>
                  {spit.remainingWeightKg} KG REMAINING
                </span>
                <span className="text-sm font-mono text-zinc-400 ml-2">
                  (Initial {spit.initialWeightKg}kg • {spit.carvedGrams}g carved)
                </span>
              </h3>
            </div>
          </div>

          {/* Quick Mount Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 font-bold hidden lg:inline">Mount New Spit:</span>
            {[20, 25, 30].map((kg) => (
              <button
                key={kg}
                onClick={() => handleMountSpit(kg)}
                className="px-3 py-1.5 rounded-xl bg-[#2B2B2E] hover:bg-[#38383C] border border-[#3A3A3E] text-xs font-mono font-bold text-white transition-all"
              >
                +{kg}KG
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#2B2B2E] rounded-full h-3 mt-4 overflow-hidden border border-[#3A3A3E]">
          <div
            className={`h-full transition-all duration-500 ${
              spitPercentRemaining <= 15
                ? "bg-[#EF4444]"
                : spitPercentRemaining <= 35
                ? "bg-[#E5A93C]"
                : "bg-gradient-to-r from-[#10B981] to-[#00FCED]"
            }`}
            style={{ width: `${spitPercentRemaining}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 mt-1.5">
          <span>Mounted: {new Date(spit.mountedAt).toLocaleTimeString("en-GB")}</span>
          <span>{spitPercentRemaining}% Spit Volume Remaining</span>
        </div>
      </div>

      {/* Stock Inventory Table with Supplier & Contact Button */}
      <div className="bg-[#1F1F21] border border-[#3A3A3E] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#3A3A3E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-black text-sm uppercase text-white tracking-wide">
              Core Ingredients, Spits & Packaging Inventory
            </h4>
            <span className="px-2 py-0.5 rounded bg-[#2B2B2E] text-zinc-400 text-[10px] font-mono">
              {items.length} Tracked Units
            </span>
          </div>
          <button
            onClick={fetchStock}
            className="p-1.5 rounded-lg bg-[#2B2B2E] border border-[#3A3A3E] text-zinc-400 hover:text-white"
            title="Refresh Stock Levels"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#2B2B2E] text-zinc-400 uppercase text-[10px] border-b border-[#3A3A3E]">
              <tr>
                <th className="py-3 px-4">Ingredient / SKU</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Min Threshold</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Supplier & Direct Contact</th>
                <th className="py-3 px-4 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2E]">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-[#2B2B2E]/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-display font-bold text-white block text-sm">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-zinc-500">{item.sku}</span>
                  </td>
                  <td className="py-3 px-4 font-black text-sm">
                    <span className={item.currentStock <= item.minThreshold ? "text-[#EF4444]" : "text-white"}>
                      {item.currentStock.toLocaleString()} {item.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-400">
                    {item.minThreshold.toLocaleString()} {item.unit}
                  </td>
                  <td className="py-3 px-4">
                    {item.isDepleted ? (
                      <span className="px-2 py-0.5 rounded bg-red-950/70 border border-red-800 text-red-400 font-bold text-[10px]">
                        DEPLETED
                      </span>
                    ) : item.isLowStock ? (
                      <span className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-amber-400 font-bold text-[10px]">
                        LOW STOCK
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-400 font-bold text-[10px]">
                        HEALTHY
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {item.supplier ? (
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="font-bold text-white block text-xs truncate max-w-[130px]">
                            {item.supplier.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 block font-mono">
                            {item.supplier.whatsApp}
                          </span>
                        </div>
                        <button
                          onClick={() => setContactSupplierItem(item)}
                          className="px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-black font-display font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow transition-all whitespace-nowrap"
                          title={`Contact ${item.supplier.name} for ${item.name}`}
                        >
                          <MessageSquare size={12} className="fill-black" />
                          <span>Contact</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-[10px] italic">No supplier linked</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setIntakeItem(item)}
                      className="px-2.5 py-1 rounded-lg bg-[#2B2B2E] hover:bg-[#343438] text-white border border-[#3A3A3E] text-xs font-bold transition-all"
                    >
                      + Intake
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📞 CONTACT SUPPLIER MODAL */}
      {contactSupplierItem && contactSupplierItem.supplier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#1F1F21] border-2 border-[#3A3A3E] rounded-3xl p-6 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#3A3A3E] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-[#25D366]" />
                <h3 className="font-display font-black text-lg uppercase text-white">
                  Contact Supplier for Reorder
                </h3>
              </div>
              <button
                onClick={() => setContactSupplierItem(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-[#2B2B2E]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Item & Stock Context */}
            <div className="bg-[#2B2B2E] border border-[#3A3A3E] rounded-2xl p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Target Ingredient:</span>
                <span className="font-bold text-white text-sm">{contactSupplierItem.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Current Stock:</span>
                <span className="text-[#EF4444] font-black">
                  {contactSupplierItem.currentStock.toLocaleString()} {contactSupplierItem.unit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Minimum Safe Level:</span>
                <span className="text-white">
                  {contactSupplierItem.minThreshold.toLocaleString()} {contactSupplierItem.unit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Standard Reorder Batch:</span>
                <span className="text-[#00FCED] font-bold">
                  {contactSupplierItem.reorderBatchSize || 50} {contactSupplierItem.unit}
                </span>
              </div>
            </div>

            {/* Supplier Details */}
            <div className="border border-[#3A3A3E] rounded-2xl p-4 space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold block">
                Authorized Supplier
              </span>
              <h4 className="font-display font-black text-base text-white">
                {contactSupplierItem.supplier.name}
              </h4>
              <p className="text-xs text-zinc-400">
                Contact: {contactSupplierItem.supplier.contactName || "Fulfillment Desk"} •{" "}
                <span className="font-mono text-emerald-400">{contactSupplierItem.supplier.whatsApp}</span>
              </p>
            </div>

            {/* Communication Action Channels */}
            <div className="space-y-2.5">
              {/* WhatsApp Click-to-Chat Button */}
              <a
                href={`https://wa.me/${contactSupplierItem.supplier.whatsApp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${contactSupplierItem.supplier.name}, MY GERMAN DÖNER (${locationSlug} Flagship) is running low on ${contactSupplierItem.name}. Current stock: ${contactSupplierItem.currentStock} ${contactSupplierItem.unit} (Min Threshold: ${contactSupplierItem.minThreshold} ${contactSupplierItem.unit}). Please confirm urgent dispatch of a reorder batch (${contactSupplierItem.reorderBatchSize || 50} ${contactSupplierItem.unit}). Thank you!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <MessageSquare size={18} className="fill-black" />
                <span>Open in WhatsApp (Auto-Composed Reorder)</span>
                <ExternalLink size={14} />
              </a>

              {/* Direct Phone Call Button */}
              <a
                href={`tel:${contactSupplierItem.supplier.whatsApp}`}
                className="w-full py-3 px-4 rounded-xl bg-[#2B2B2E] hover:bg-[#343438] border border-[#3A3A3E] text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <Phone size={14} className="text-[#00FCED]" />
                <span>Call Supplier Directly ({contactSupplierItem.supplier.whatsApp})</span>
              </a>

              {/* Direct Email Button */}
              {contactSupplierItem.supplier.email && (
                <a
                  href={`mailto:${contactSupplierItem.supplier.email}?subject=${encodeURIComponent(
                    `URGENT REORDER: ${contactSupplierItem.name} — MY GERMAN DÖNER ${locationSlug}`
                  )}&body=${encodeURIComponent(
                    `Dear ${contactSupplierItem.supplier.name} Team,\n\nPlease process an urgent restock order for MY GERMAN DÖNER (${locationSlug} Flagship):\n\nItem: ${contactSupplierItem.name} (${contactSupplierItem.sku})\nQuantity Requested: ${contactSupplierItem.reorderBatchSize || 50} ${contactSupplierItem.unit}\nCurrent Remaining Stock: ${contactSupplierItem.currentStock} ${contactSupplierItem.unit}\n\nPlease confirm expected delivery time at your earliest convenience.\n\nBest regards,\nMY GERMAN DÖNER Store Operations`
                  )}`}
                  className="w-full py-3 px-4 rounded-xl bg-[#2B2B2E] hover:bg-[#343438] border border-[#3A3A3E] text-white font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  <Mail size={14} className="text-[#E5A93C]" />
                  <span>Send Formal Purchase Order via Email</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Intake Modal */}
      {intakeItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1F1F21] border-2 border-[#3A3A3E] rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3A3A3E] pb-3">
              <div className="flex items-center gap-2">
                <Truck size={18} className="text-[#00FCED]" />
                <h3 className="font-display font-black text-base uppercase">
                  Delivery Stock Intake
                </h3>
              </div>
              <button
                onClick={() => setIntakeItem(null)}
                className="text-zinc-400 hover:text-white text-xs font-mono"
              >
                Close
              </button>
            </div>

            <div>
              <span className="text-xs text-zinc-400 block">Ingredient:</span>
              <span className="font-display font-black text-lg text-white">
                {intakeItem.name} ({intakeItem.sku})
              </span>
              <span className="text-xs text-zinc-400 block font-mono mt-1">
                Current Stock: {intakeItem.currentStock.toLocaleString()} {intakeItem.unit}
              </span>
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-300 block mb-1">
                Received Units ({intakeItem.unit}):
              </label>
              <input
                type="number"
                value={intakeAmount}
                onChange={(e) => setIntakeAmount(Number(e.target.value))}
                className="w-full bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl px-4 py-2.5 text-white font-mono text-base font-bold focus:border-[#00FCED] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIntakeItem(null)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyIntake}
                className="px-5 py-2.5 rounded-xl bg-[#00FCED] text-black font-display font-black text-xs uppercase tracking-wider hover:bg-cyan-300 transition-all"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
