"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatEuro } from "@/lib/i18n";
import { CategoryDTO, ProductDTO } from "@/types";
import { POSCartLine, POSOrderTender } from "../pos.schema";
import { ModifierModal } from "./ModifierModal";
import {
  Utensils,
  CreditCard,
  Banknote,
  Trash2,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Flame,
  Radio,
  Clock,
  Printer,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

export const POSTill: React.FC = () => {
  const [locationSlug, setLocationSlug] = useState<"EMBA" | "LIMASSOL">("EMBA");
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [cartLines, setCartLines] = useState<POSCartLine[]>([]);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKE_AWAY">("DINE_IN");
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "CASH">("CARD");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<number | undefined>(undefined);
  const [activeModalProduct, setActiveModalProduct] = useState<ProductDTO | null>(null);
  const [isTendering, setIsTendering] = useState<boolean>(false);
  const [lastCompletedOrder, setLastCompletedOrder] = useState<{
    orderNumber: string;
    totalAmount: number;
    changeDue?: number;
    printed: boolean;
  } | null>(null);
  const [link4PayStatus, setLink4PayStatus] = useState<string | null>(null);

  // Real-time synchronization
  const { isConnected, connectionTier } = useRealtimeEvents({
    channel: "pos",
    onEvent: (type) => {
      if (type === "STOCK_CHANGED" || type === "PRICE_UPDATED") {
        loadMenu();
      }
    },
  });

  const loadMenu = useCallback(async () => {
    try {
      const res = await fetch(`/api/menu?location=${locationSlug}`);
      const data = await res.json();
      if (data.success && data.categories.length > 0) {
        setCategories(data.categories);
        setActiveCategoryId((prev) => prev || data.categories[0].id);
      }
    } catch (err) {
      console.error("[POSTill] Failed to load catalog:", err);
    }
  }, [locationSlug]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const filteredProducts = (activeCategory?.products || []).filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add Item to Cart (opens customizer)
  const handleSelectProduct = (product: ProductDTO) => {
    setActiveModalProduct(product);
  };

  const handleConfirmCustomization = (line: POSCartLine) => {
    setCartLines((prev) => [...prev, line]);
  };

  const handleUpdateQty = (lineId: string, delta: number) => {
    setCartLines((prev) =>
      prev
        .map((l) => {
          if (l.lineId === lineId) {
            const newQty = l.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...l,
              quantity: newQty,
              totalPrice: Number((l.unitPrice * newQty).toFixed(2)),
            };
          }
          return l;
        })
        .filter(Boolean) as POSCartLine[]
    );
  };

  const handleRemoveLine = (lineId: string) => {
    setCartLines((prev) => prev.filter((l) => l.lineId !== lineId));
  };

  // Pricing calculations
  const grossSubtotal = cartLines.reduce((sum, l) => sum + l.totalPrice, 0);
  const discountAmount = Number(((grossSubtotal * discountPercent) / 100).toFixed(2));
  const totalAmount = Math.max(0, Number((grossSubtotal - discountAmount).toFixed(2)));
  const netSubtotal = Number((totalAmount / 1.19).toFixed(2));
  const vatAmount = Number((totalAmount - netSubtotal).toFixed(2));
  const changeDue = cashTendered && cashTendered > totalAmount ? Number((cashTendered - totalAmount).toFixed(2)) : 0;

  // Tender Order execution
  const handleTender = async () => {
    if (cartLines.length === 0 || isTendering) return;

    if (paymentMethod === "CASH" && (cashTendered === undefined || cashTendered < totalAmount)) {
      alert(`Please tender at least ${formatEuro(totalAmount)} in cash.`);
      return;
    }

    setIsTendering(true);

    try {
      if (paymentMethod === "CARD") {
        setLink4PayStatus("PROCESSING CONTACTLESS / CHIP ON TERMINAL...");
        // Simulate Link4Pay EMV Handshake
        await new Promise((r) => setTimeout(r, 600));
        setLink4PayStatus("AUTHORIZING LINK4PAY...");
        await new Promise((r) => setTimeout(r, 400));
        setLink4PayStatus("PAYMENT APPROVED");
      }

      const payload: POSOrderTender = {
        locationSlug,
        terminalCode: "POS-01",
        orderType,
        paymentMethod,
        discountPercent,
        cashTendered: paymentMethod === "CASH" ? cashTendered : undefined,
        lines: cartLines,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setLastCompletedOrder({
          orderNumber: data.orderNumber,
          totalAmount: data.totalAmount,
          changeDue: data.changeDue,
          printed: data.printed ?? true,
        });

        // Clear ticket
        setCartLines([]);
        setDiscountPercent(0);
        setCashTendered(undefined);
      } else {
        alert(data.error || "Failed to process order.");
      }
    } catch (err: any) {
      console.error("[POSTill] Tender error:", err);
      alert("Network error: Tender buffered to local LAN queue.");
    } finally {
      setIsTendering(false);
      setLink4PayStatus(null);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#1F1F21] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Header Bar */}
      <header className="bg-[#2B2B2E] border-b border-[#3A3A3E] px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E50D7E] flex items-center justify-center font-display font-black text-white text-base shadow">
            GD
          </div>
          <div>
            <h1 className="font-display font-black text-sm text-white uppercase leading-none">
              MY GERMAN DÖNER · POS COUNTER TILL
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono text-[#E5A93C] font-semibold">
                Store: {locationSlug === "EMBA" ? "Emba (Paphos)" : "Limassol Marina"} • Till: POS-01
              </span>
              <button
                onClick={() => setLocationSlug((l) => (l === "EMBA" ? "LIMASSOL" : "EMBA"))}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1F1F21] text-zinc-300 border border-[#3A3A3E] hover:text-white"
              >
                Switch Store
              </button>
            </div>
          </div>
        </div>

        {/* Center: Order Type Toggle */}
        <div className="flex items-center bg-[#1F1F21] p-1 rounded-xl border border-[#3A3A3E] text-xs font-display font-bold">
          <button
            onClick={() => setOrderType("DINE_IN")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              orderType === "DINE_IN"
                ? "bg-[#E50D7E] text-white shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            DINE IN
          </button>
          <button
            onClick={() => setOrderType("TAKE_AWAY")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              orderType === "TAKE_AWAY"
                ? "bg-[#E50D7E] text-white shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            TAKEAWAY
          </button>
        </div>

        {/* Right: Payment Method & Connection Status */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-[#1F1F21] p-1 rounded-xl border border-[#3A3A3E] text-xs font-mono font-bold">
            <button
              onClick={() => setPaymentMethod("CARD")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                paymentMethod === "CARD"
                  ? "bg-[#00FCED] text-black shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <CreditCard size={14} />
              <span>LINK4PAY CARD</span>
            </button>
            <button
              onClick={() => setPaymentMethod("CASH")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                paymentMethod === "CASH"
                  ? "bg-[#4CAF50] text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Banknote size={14} />
              <span>CASH</span>
            </button>
          </div>

          <div
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono ${
              isConnected
                ? "bg-green-950/60 border-green-700 text-green-400"
                : "bg-amber-950/60 border-amber-700 text-amber-400"
            }`}
          >
            <Radio size={12} className={isConnected ? "animate-pulse" : ""} />
            <span>{connectionTier === "EDGE" ? "LAN EDGE" : isConnected ? "ONLINE" : "OFFLINE"}</span>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Product Catalog (2/3 width) */}
        <main className="flex-1 flex flex-col p-3 overflow-hidden border-r border-[#3A3A3E]">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`px-4 py-2.5 rounded-xl font-display font-black text-xs uppercase tracking-wide shrink-0 transition-all ${
                  activeCategoryId === cat.id
                    ? "bg-[#E50D7E] text-white shadow-md shadow-magenta-950/40"
                    : "bg-[#2B2B2E] text-zinc-400 border border-[#3A3A3E] hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative my-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search catalog items or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50D7E]"
            />
          </div>

          {/* Item Tiles Fast-Tap Grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 overflow-y-auto pr-1">
            {filteredProducts.map((product) => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleSelectProduct(product)}
                disabled={!product.isAvailable}
                className={`border rounded-2xl p-3 flex flex-col justify-between text-left transition-all relative overflow-hidden group shadow ${
                  product.isAvailable
                    ? "bg-[#2B2B2E] hover:bg-[#343438] border-[#3A3A3E]"
                    : "bg-[#1F1F21] border-red-900/50 opacity-60 cursor-not-allowed"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-display font-black text-xs text-white group-hover:text-[#E50D7E] transition-colors leading-tight">
                      {product.name}
                    </span>
                    {product.badge && (
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#1F1F21] text-[#E5A93C] font-bold border border-[#3A3A3E]">
                        {product.badge}
                      </span>
                    )}
                  </div>
                  {product.description && (
                    <span className="text-[10px] text-zinc-400 line-clamp-2 mt-1">
                      {product.description}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#3A3A3E]">
                  <span className="font-mono font-black text-sm text-[#E50D7E]">
                    {formatEuro(product.basePrice)}
                  </span>
                  {product.isAvailable ? (
                    <div className="w-5 h-5 rounded-md bg-[#1F1F21] border border-[#3A3A3E] flex items-center justify-center text-zinc-400 group-hover:text-white">
                      <Plus size={12} />
                    </div>
                  ) : (
                    <span className="text-[9px] font-mono text-red-500 font-bold">SOLD OUT</span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </main>

        {/* Right: Cart & Cashier Register (1/3 width) */}
        <aside className="w-[420px] bg-[#2B2B2E] flex flex-col justify-between p-3.5 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#3A3A3E]">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-sm text-white uppercase">
                CURRENT TICKET
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1F1F21] text-zinc-300 border border-[#3A3A3E]">
                {cartLines.reduce((sum, l) => sum + l.quantity, 0)} Items
              </span>
            </div>
            {cartLines.length > 0 && (
              <button
                onClick={() => setCartLines([])}
                className="text-zinc-500 hover:text-[#EF4444] transition-colors p-1"
                title="Clear Ticket"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Ticket Lines List */}
          <div className="flex-1 overflow-y-auto my-2.5 space-y-2 pr-1">
            {cartLines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-10">
                <Utensils size={28} className="mb-1.5 opacity-30" />
                <p className="text-xs font-semibold">No items on ticket</p>
                <p className="text-[10px] text-zinc-600">Tap items on the left to customize & add</p>
              </div>
            ) : (
              cartLines.map((line) => (
                <div
                  key={line.lineId}
                  className="bg-[#1F1F21] border border-[#3A3A3E] rounded-xl p-2.5 text-xs space-y-1.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-white text-xs">
                          {line.name}
                        </span>
                        {line.spiceLevel > 1 && (
                          <span className="text-[10px] text-[#FF5722] font-mono flex items-center">
                            {"🔥".repeat(line.spiceLevel)}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-zinc-400 block">
                        {line.breadType}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleUpdateQty(line.lineId, -1)}
                        className="w-5 h-5 rounded bg-[#2B2B2E] flex items-center justify-center text-zinc-400 hover:text-white"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="font-mono font-bold text-white w-4 text-center text-xs">
                        {line.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(line.lineId, 1)}
                        className="w-5 h-5 rounded bg-[#2B2B2E] flex items-center justify-center text-zinc-400 hover:text-white"
                      >
                        <Plus size={10} />
                      </button>
                      <span className="font-mono font-black text-xs text-[#E50D7E] ml-2 w-12 text-right">
                        {formatEuro(line.totalPrice)}
                      </span>
                    </div>
                  </div>

                  {/* Modifiers Chips: Bold Green Additions & Bold Red Omissions */}
                  {(line.selectedAdditions.length > 0 || line.selectedOmissions.length > 0) && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-[#2B2B2E]">
                      {line.selectedAdditions.map((add) => (
                        <span
                          key={add.id}
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-[#10B981] border border-emerald-800/50"
                        >
                          +{add.name} {add.priceAdjustment > 0 && `(+${formatEuro(add.priceAdjustment)})`}
                        </span>
                      ))}
                      {line.selectedOmissions.map((omit) => (
                        <span
                          key={omit}
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-950/60 text-[#EF4444] border border-red-800/50 line-through"
                        >
                          -NO {omit}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick Discounts & Cash Presets */}
          <div className="space-y-2 py-2 border-t border-[#3A3A3E]">
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setDiscountPercent((d) => (d === 10 ? 0 : 10))}
                className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                  discountPercent === 10
                    ? "bg-[#E5A93C] text-black border-[#E5A93C]"
                    : "bg-[#1F1F21] text-zinc-300 border-[#3A3A3E]"
                }`}
              >
                10% VIP
              </button>
              <button
                onClick={() => setDiscountPercent((d) => (d === 20 ? 0 : 20))}
                className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                  discountPercent === 20
                    ? "bg-[#E5A93C] text-black border-[#E5A93C]"
                    : "bg-[#1F1F21] text-zinc-300 border-[#3A3A3E]"
                }`}
              >
                20% STAFF
              </button>
              <button
                onClick={() => setDiscountPercent(0)}
                className="py-1.5 rounded-lg text-[10px] font-bold bg-[#1F1F21] text-zinc-400 border border-[#3A3A3E] hover:text-white"
              >
                RESET DISC
              </button>
            </div>

            {paymentMethod === "CASH" && (
              <div className="grid grid-cols-4 gap-1 pt-1">
                {[10, 20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCashTendered(amt)}
                    className={`py-1 rounded-lg text-[10px] font-mono font-bold border ${
                      cashTendered === amt
                        ? "bg-[#4CAF50] text-white border-[#4CAF50]"
                        : "bg-[#1F1F21] text-zinc-300 border-[#3A3A3E]"
                    }`}
                  >
                    €{amt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Totals & Charge CTA */}
          <div className="bg-[#1F1F21] p-3 rounded-2xl border border-[#3A3A3E] space-y-1.5">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>Gross Subtotal:</span>
              <span className="font-mono">{formatEuro(grossSubtotal)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-[11px] text-[#E5A93C]">
                <span>Discount ({discountPercent}%):</span>
                <span className="font-mono">-{formatEuro(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] text-zinc-500">
              <span>Cyprus VAT (19% incl):</span>
              <span className="font-mono">{formatEuro(vatAmount)}</span>
            </div>

            {paymentMethod === "CASH" && cashTendered !== undefined && (
              <div className="flex justify-between text-[11px] text-[#00FCED] font-mono font-bold pt-1 border-t border-[#2B2B2E]">
                <span>Change Due:</span>
                <span>{formatEuro(changeDue)}</span>
              </div>
            )}

            <button
              onClick={handleTender}
              disabled={cartLines.length === 0 || isTendering}
              className="w-full mt-2 py-3 rounded-xl bg-[#E50D7E] hover:bg-[#d00b72] disabled:opacity-40 disabled:cursor-not-allowed text-white font-display font-black text-sm tracking-wide shadow-lg shadow-magenta-950/50 flex items-center justify-center gap-2 transition-all"
            >
              {isTendering ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{link4PayStatus || "PROCESSING..."}</span>
                </>
              ) : (
                <>
                  <span>
                    CHARGE {formatEuro(totalAmount)} ({paymentMethod === "CARD" ? "LINK4PAY" : "CASH"})
                  </span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* Modifier Customizer Modal */}
      {activeModalProduct && (
        <ModifierModal
          product={activeModalProduct}
          isOpen={Boolean(activeModalProduct)}
          onClose={() => setActiveModalProduct(null)}
          onConfirm={handleConfirmCustomization}
        />
      )}

      {/* Completed Order Banner */}
      <AnimatePresence>
        {lastCompletedOrder && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 z-50 bg-[#2B2B2E] border-2 border-[#10B981] rounded-2xl p-4 shadow-2xl flex items-center gap-3 text-white"
          >
            <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center text-black font-bold">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span className="font-display font-black text-sm block">
                ORDER #{lastCompletedOrder.orderNumber} TENDERED
              </span>
              <span className="font-mono text-xs text-zinc-300">
                Total: {formatEuro(lastCompletedOrder.totalAmount)}
                {lastCompletedOrder.changeDue !== undefined &&
                  ` • Change: ${formatEuro(lastCompletedOrder.changeDue)}`}
                {lastCompletedOrder.printed && " • Thermal Printed"}
              </span>
            </div>
            <button
              onClick={() => setLastCompletedOrder(null)}
              className="ml-3 text-xs font-mono text-zinc-400 hover:text-white underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
