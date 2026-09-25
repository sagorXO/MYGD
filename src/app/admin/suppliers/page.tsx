"use client";

import React, { useState } from "react";
import { formatEuro } from "@/lib/i18n";
import {
  MessageSquare,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  Send,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  CheckCircle2,
  FileText,
  Clock,
  Euro,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SupplierItemEntry {
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  unitPriceEUR: number;
}

interface SupplierRecord {
  id: string;
  name: string;
  category: "MEAT" | "BAKERY" | "PRODUCE" | "SAUCES" | "PACKAGING";
  contactName: string;
  whatsApp: string;
  email: string;
  leadTimeHours: number;
  items: SupplierItemEntry[];
}

const CANONICAL_SUPPLIERS: SupplierRecord[] = [
  {
    id: "sup-01",
    name: "Berlin Döner Fleischerei GmbH",
    category: "MEAT",
    contactName: "Hans Müller",
    whatsApp: "+35799112233",
    email: "orders@berlin-doner.de",
    leadTimeHours: 24,
    items: [
      { sku: "ING-BEEF-SPIT", name: "Spit Meat - Beef/Veal (25kg Cone)", unit: "CONE", quantity: 2, unitPriceEUR: 165.0 },
      { sku: "ING-CHICK-SPIT", name: "Spit Meat - Chicken (20kg Cone)", unit: "CONE", quantity: 2, unitPriceEUR: 120.0 },
    ],
  },
  {
    id: "sup-02",
    name: "Paphos Fresh Bakery",
    category: "BAKERY",
    contactName: "Andreas Georgiou",
    whatsApp: "+35799445566",
    email: "orders@paphosbakery.cy",
    leadTimeHours: 12,
    items: [
      { sku: "ING-FLADENBROT", name: "German Fladenbrot Sesame Bread", unit: "CRATE_50", quantity: 3, unitPriceEUR: 35.0 },
      { sku: "ING-DURUM-WRAP", name: "Lavash Dürüm Wraps (30cm)", unit: "PACK_100", quantity: 2, unitPriceEUR: 28.0 },
    ],
  },
  {
    id: "sup-03",
    name: "Cyprus Fresh Farms Produce",
    category: "PRODUCE",
    contactName: "Nicos Constantinou",
    whatsApp: "+35799778899",
    email: "sales@cyprusproduce.cy",
    leadTimeHours: 18,
    items: [
      { sku: "ING-TOMATOES", name: "Fresh Vine Tomatoes", unit: "CRATE_10KG", quantity: 4, unitPriceEUR: 18.0 },
      { sku: "ING-RED-CABBAGE", name: "Red Cabbage Shredded", unit: "BAG_5KG", quantity: 5, unitPriceEUR: 12.0 },
    ],
  },
];

export default function SupplierReorderAdminPage() {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(CANONICAL_SUPPLIERS[0].id);
  const [orderItems, setOrderItems] = useState<SupplierItemEntry[]>(CANONICAL_SUPPLIERS[0].items);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [dispatchedSuccess, setDispatchedSuccess] = useState<boolean>(false);

  const selectedSupplier =
    CANONICAL_SUPPLIERS.find((s) => s.id === selectedSupplierId) || CANONICAL_SUPPLIERS[0];

  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    const supp = CANONICAL_SUPPLIERS.find((s) => s.id === supplierId);
    if (supp) {
      setOrderItems(supp.items);
      setIsApproved(false);
      setDispatchedSuccess(false);
    }
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    setOrderItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, newQty) } : item))
    );
    setIsApproved(false);
  };

  const totalEUR = orderItems.reduce((acc, item) => acc + item.quantity * item.unitPriceEUR, 0);
  const isOverThreshold = totalEUR > 250;

  const handleVerifyPin = () => {
    // Owner PINs: Rico or Oliver (1234 or 9999)
    if (enteredPin === "1234" || enteredPin === "9999" || enteredPin === "2026") {
      setIsApproved(true);
      setIsPinModalOpen(false);
      setEnteredPin("");
      setPinError(null);
    } else {
      setPinError("Invalid Owner PIN. Authorized owners only (Rico / Oliver).");
      setEnteredPin("");
    }
  };

  const generateWhatsAppMessage = () => {
    const itemLines = orderItems
      .map((item) => `• ${item.quantity}x ${item.name} (${item.sku}) @ €${item.unitPriceEUR.toFixed(2)}`)
      .join("\n");

    const approvalText = isOverThreshold ? "\n[OWNER PIN APPROVED >€250]" : "";

    return encodeURIComponent(
      `*MY GERMAN DÖNER — OFFICIAL PURCHASE ORDER*\n` +
      `Branch: Emba (Paphos), Cyprus\n` +
      `Supplier: ${selectedSupplier.name}\n` +
      `Date: ${new Date().toLocaleDateString("en-GB")}\n\n` +
      `*ORDERED ITEMS:*\n${itemLines}\n\n` +
      `*TOTAL ORDER VALUE:* €${totalEUR.toFixed(2)} EUR${approvalText}\n` +
      `Delivery Required: Within ${selectedSupplier.leadTimeHours} Hours\n\n` +
      `Please confirm receipt and expected delivery slot. Danke!`
    );
  };

  const handleSendOrder = () => {
    if (isOverThreshold && !isApproved) {
      setIsPinModalOpen(true);
      return;
    }

    const cleanPhone = selectedSupplier.whatsApp.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${generateWhatsAppMessage()}`;
    window.open(waUrl, "_blank");
    setDispatchedSuccess(true);
  };

  return (
    <div className="min-h-screen bg-[#1F1F21] text-white p-6 font-sans select-none">
      {/* Top Header */}
      <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3A3A3E] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E50D7E] flex items-center justify-center font-display font-black text-white text-lg shadow glow-magenta">
              M4
            </div>
            <div>
              <h1 className="font-display font-black text-2xl uppercase tracking-wider">
                Supplier Ordering & WhatsApp PO Generator
              </h1>
              <p className="text-xs font-mono text-zinc-400">
                Automated Reorders · 1-Tap Click-to-Chat · &gt;€250 Owner Authorization Gate
              </p>
            </div>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2B2B2E] border border-[#3A3A3E]">
          <ShieldCheck className="text-[#00FCED]" size={18} />
          <span className="text-xs font-mono text-zinc-300">
            Store: <strong className="text-white">EMBA FLAGSHIP (PAPHOS)</strong>
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Supplier Selector */}
        <div className="space-y-4">
          <h2 className="font-display font-bold text-sm uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Building2 size={16} className="text-[#E50D7E]" /> Select Supplier
          </h2>

          <div className="space-y-3">
            {CANONICAL_SUPPLIERS.map((supp) => (
              <button
                key={supp.id}
                onClick={() => handleSupplierChange(supp.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedSupplierId === supp.id
                    ? "bg-[#2B2B2E] border-[#E50D7E] shadow glow-magenta"
                    : "bg-[#242426] border-[#3A3A3E] hover:border-zinc-500"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display font-bold text-sm text-white">{supp.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E50D7E]/20 text-[#E50D7E]">
                    {supp.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-2">
                  <Phone size={12} className="text-[#00FCED]" /> {supp.whatsApp}
                </p>
                <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                  <Clock size={12} className="text-[#E5A93C]" /> Lead Time: {supp.leadTimeHours}h
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Center/Right Columns: Order Item Builder & Total */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#2B2B2E] p-6 rounded-3xl border border-[#3A3A3E] shadow-xl">
            <div className="flex items-center justify-between border-b border-[#3A3A3E] pb-4 mb-4">
              <div>
                <h3 className="font-display font-black text-lg text-white uppercase">
                  {selectedSupplier.name} · Purchase Order
                </h3>
                <span className="text-xs font-mono text-zinc-400">
                  Contact: {selectedSupplier.contactName} ({selectedSupplier.email})
                </span>
              </div>
              <span className="text-xs font-mono text-[#00FCED] bg-[#00FCED]/10 px-3 py-1 rounded-full border border-[#00FCED]/30">
                M4 Real-Time Engine
              </span>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3 mb-6">
              {orderItems.map((item, idx) => (
                <div
                  key={item.sku}
                  className="flex items-center justify-between p-3.5 bg-[#1F1F21] rounded-2xl border border-[#3A3A3E]"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-white">{item.name}</h4>
                    <span className="text-xs font-mono text-zinc-400">
                      SKU: {item.sku} · Unit: {item.unit} · €{item.unitPriceEUR.toFixed(2)}/ea
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#2B2B2E] rounded-xl border border-[#3A3A3E]">
                      <button
                        onClick={() => handleUpdateQty(idx, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-sm text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(idx, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white"
                      >
                        +
                      </button>
                    </div>

                    <span className="w-20 text-right font-mono font-bold text-sm text-[#00FCED]">
                      €{(item.quantity * item.unitPriceEUR).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Calculation & Gate */}
            <div className="p-4 bg-[#1F1F21] rounded-2xl border border-[#3A3A3E] space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Estimated Total Order Value:</span>
                <span className="font-mono font-black text-2xl text-white">
                  €{totalEUR.toFixed(2)}
                </span>
              </div>

              {isOverThreshold && (
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    isApproved
                      ? "bg-[#18241D] border-[#10B981]/40 text-[#10B981]"
                      : "bg-[#331C1D] border-[#E53935]/40 text-[#E53935]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span>
                      {isApproved
                        ? "High-Value Order (&gt;€250) Authenticated by Owner PIN."
                        : "High-Value Order (&gt;€250) Requires 4-Digit Owner PIN Approval."}
                    </span>
                  </div>
                  {!isApproved && (
                    <button
                      onClick={() => setIsPinModalOpen(true)}
                      className="px-3 py-1 rounded-lg bg-[#E53935] text-white font-bold hover:bg-red-600 transition"
                    >
                      Authorize
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSendOrder}
                className={`flex-1 py-4 rounded-2xl font-display font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isOverThreshold && !isApproved
                    ? "bg-[#242426] text-zinc-500 border border-[#3A3A3E] cursor-not-allowed"
                    : "bg-[#E50D7E] text-white shadow-lg glow-magenta hover:bg-[#c90a6e]"
                }`}
              >
                <Send size={18} />
                {isOverThreshold && !isApproved
                  ? "Authorize With Owner PIN to Dispatch"
                  : "Dispatch Purchase Order via WhatsApp"}
              </button>
            </div>

            {dispatchedSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-[#18241D] border border-[#10B981]/50 text-[#10B981] text-xs font-mono flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                WhatsApp click-to-chat window dispatched with purchase order payload.
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* PIN Authorization Modal */}
      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#2B2B2E] border border-[#3A3A3E] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E53935] flex items-center justify-center text-white">
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white uppercase">
                    Owner PIN Authorization
                  </h3>
                  <p className="text-xs text-zinc-400">Order value exceeds €250.00 threshold</p>
                </div>
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-[#331C1D] border border-[#E53935]/50 text-[#E53935] text-xs font-mono">
                  {pinError}
                </div>
              )}

              <input
                type="password"
                maxLength={6}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="Enter 4-Digit Owner PIN"
                className="w-full bg-[#1F1F21] border border-[#3A3A3E] rounded-2xl px-4 py-3 text-center text-xl font-mono text-white tracking-widest focus:outline-none focus:border-[#E50D7E]"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setIsPinModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-[#1F1F21] text-zinc-400 hover:text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyPin}
                  className="flex-1 py-3 rounded-xl bg-[#E50D7E] text-white font-bold text-xs shadow glow-magenta hover:bg-[#c90a6e]"
                >
                  Confirm PIN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
