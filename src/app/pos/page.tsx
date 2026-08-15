"use client";

import React, { useState, useEffect } from "react";
import type { CategoryDTO, ProductDTO } from "@/types";
import { formatEuro } from "@/lib/i18n";
import {
  Utensils,
  CreditCard,
  Banknote,
  Trash2,
  Plus,
  Minus,
  Percent,
  Search,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Flame,
  Split,
} from "lucide-react";
import { motion } from "framer-motion";

interface POSCartLine {
  id: string;
  product: ProductDTO;
  quantity: number;
  selectedModifiers: string[];
  unitPrice: number;
  totalPrice: number;
}

export default function CounterPOSPage() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [cartLines, setCartLines] = useState<POSCartLine[]>([]);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKE_AWAY">("DINE_IN");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isChargedSuccess, setIsChargedSuccess] = useState<boolean>(false);

  // Fetch Menu
  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch("/api/menu?location=EMBA");
        const data = await res.json();
        if (data.success && data.categories.length > 0) {
          setCategories(data.categories);
          setActiveCategoryId(data.categories[0].id);
        }
      } catch (err) {
        console.error("Failed to load POS catalog:", err);
      }
    }
    loadMenu();
  }, []);

  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const filteredProducts = (activeCategory?.products || []).filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleQuickAddProduct = (product: ProductDTO) => {
    setCartLines((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.id === existing.id
            ? {
                ...line,
                quantity: line.quantity + 1,
                totalPrice: Number(((line.quantity + 1) * line.unitPrice).toFixed(2)),
              }
            : line
        );
      } else {
        return [
          ...prev,
          {
            id: `line-${Date.now()}-${Math.random()}`,
            product,
            quantity: 1,
            selectedModifiers: ["Standard Berlin Style"],
            unitPrice: product.basePrice,
            totalPrice: product.basePrice,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (lineId: string, newQty: number) => {
    if (newQty <= 0) {
      setCartLines((prev) => prev.filter((l) => l.id !== lineId));
    } else {
      setCartLines((prev) =>
        prev.map((l) =>
          l.id === lineId
            ? {
                ...l,
                quantity: newQty,
                totalPrice: Number((newQty * l.unitPrice).toFixed(2)),
              }
            : l
        )
      );
    }
  };

  // Calculations
  const grossSubtotal = Number(
    cartLines.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)
  );
  const discountAmount = Number(
    ((grossSubtotal * discountPercent) / 100).toFixed(2)
  );
  const netTotal = Number((grossSubtotal - discountAmount).toFixed(2));
  const vatAmount = Number((netTotal - netTotal / 1.19).toFixed(2));

  const handleCharge = () => {
    if (cartLines.length === 0) return;
    setIsChargedSuccess(true);
    setTimeout(() => {
      setCartLines([]);
      setDiscountPercent(0);
      setIsChargedSuccess(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Header Bar */}
      <header className="bg-[#1C1C1C] border-b border-[#2E2E2E] px-6 py-3 flex items-center justify-between shadow">
        {/* Left: Store & Cashier */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#FF5722] flex items-center justify-center font-display font-black text-white text-lg">
            GD
          </div>
          <div>
            <h1 className="font-display font-black text-base text-white uppercase leading-none">
              COUNTER POS · TILL #1
            </h1>
            <span className="text-xs font-mono text-[#E5A93C] font-semibold">
              Cashier: Alex M. • Store: EMBA (CYPRUS)
            </span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="relative w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Quick search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#242424] border border-[#3A3A3A] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#FF5722] outline-none"
          />
        </div>

        {/* Right: Order Type Selector */}
        <div className="flex items-center bg-[#242424] p-1 rounded-xl border border-[#3A3A3A] text-xs font-display font-bold">
          <button
            onClick={() => setOrderType("DINE_IN")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              orderType === "DINE_IN"
                ? "bg-[#FF5722] text-white shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            DINE IN
          </button>
          <button
            onClick={() => setOrderType("TAKE_AWAY")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              orderType === "TAKE_AWAY"
                ? "bg-[#FF5722] text-white shadow"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            TAKE AWAY
          </button>
        </div>
      </header>

      {/* Main Split Layout: Category Tabs + Product Grid + Register Ticket */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Vertical Category Nav (180px) */}
        <nav className="w-48 bg-[#1A1A1A] border-r border-[#2E2E2E] p-3 space-y-2 overflow-y-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`w-full p-3 rounded-xl font-display font-bold text-xs uppercase text-left transition-all flex items-center justify-between ${
                activeCategoryId === cat.id
                  ? "bg-[#FF5722] text-white shadow glow-orange"
                  : "bg-[#242424] text-zinc-300 hover:bg-[#2A2A2A] border border-[#333333]"
              }`}
            >
              <span className="line-clamp-1">{cat.name}</span>
              <span className="text-[10px] opacity-75 font-mono">
                ({cat.products?.length || 0})
              </span>
            </button>
          ))}
        </nav>

        {/* Center Main Product Grid */}
        <main className="flex-1 p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5 auto-rows-max">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              onClick={() => handleQuickAddProduct(prod)}
              className="bg-[#222222] hover:bg-[#282828] border border-[#333333] hover:border-[#FF5722] rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all active:scale-95 shadow-md min-h-[140px]"
            >
              <div>
                <span className="font-display font-bold text-sm text-white block line-clamp-2">
                  {prod.name}
                </span>
                <span className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                  {prod.description}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#333333] mt-2">
                <span className="font-display font-extrabold text-base text-[#FF5722] font-mono">
                  {formatEuro(prod.basePrice)}
                </span>
                <span className="w-7 h-7 rounded-lg bg-[#FF5722] text-white flex items-center justify-center font-black text-sm">
                  +
                </span>
              </div>
            </div>
          ))}
        </main>

        {/* Right Register Order Ticket (380px) */}
        <aside className="w-96 bg-[#1A1A1A] border-l border-[#2E2E2E] flex flex-col justify-between p-4 shadow-2xl">
          {/* Ticket Header */}
          <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
            <div>
              <h2 className="font-display font-black text-base text-white">
                CURRENT TICKET
              </h2>
              <span className="text-[11px] font-mono text-zinc-400">
                {cartLines.length} Items • {orderType.replace("_", " ")}
              </span>
            </div>
            <button
              onClick={() => setCartLines([])}
              className="text-xs text-[#E53935] hover:underline font-bold flex items-center gap-1"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>

          {/* Line Items List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {cartLines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-12">
                <Utensils size={32} className="mb-2 opacity-50" />
                <p className="text-xs font-semibold">No items on ticket</p>
                <p className="text-[11px] text-zinc-600">Tap items on the left to add</p>
              </div>
            ) : (
              cartLines.map((line) => (
                <div
                  key={line.id}
                  className="bg-[#242424] border border-[#333333] rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex-1 pr-2">
                    <span className="font-display font-bold text-white block">
                      {line.product.name}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {formatEuro(line.unitPrice)} each
                    </span>
                  </div>

                  {/* Qty Stepper */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQty(line.id, line.quantity - 1)}
                      className="w-6 h-6 rounded bg-[#1C1C1C] flex items-center justify-center text-zinc-400 hover:text-white"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="font-mono font-bold text-white w-4 text-center">
                      {line.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(line.id, line.quantity + 1)}
                      className="w-6 h-6 rounded bg-[#1C1C1C] flex items-center justify-center text-zinc-400 hover:text-white"
                    >
                      <Plus size={12} />
                    </button>

                    <span className="font-mono font-black text-sm text-[#FF5722] ml-2 w-14 text-right">
                      {formatEuro(line.totalPrice)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Action Keys */}
          <div className="grid grid-cols-3 gap-2 py-2 border-t border-[#2E2E2E]">
            <button
              onClick={() => setDiscountPercent((d) => (d === 10 ? 0 : 10))}
              className={`py-2 rounded-lg text-[11px] font-bold border transition-all ${
                discountPercent === 10
                  ? "bg-[#E5A93C] text-black border-[#E5A93C]"
                  : "bg-[#242424] text-zinc-300 border-[#333333]"
              }`}
            >
              10% DISC
            </button>
            <button
              onClick={() => setDiscountPercent((d) => (d === 20 ? 0 : 20))}
              className={`py-2 rounded-lg text-[11px] font-bold border transition-all ${
                discountPercent === 20
                  ? "bg-[#E5A93C] text-black border-[#E5A93C]"
                  : "bg-[#242424] text-zinc-300 border-[#333333]"
              }`}
            >
              20% STAFF
            </button>
            <button className="py-2 rounded-lg text-[11px] font-bold bg-[#242424] text-zinc-300 border border-[#333333] hover:text-white">
              SPLIT BILL
            </button>
          </div>

          {/* Totals & Charge CTA */}
          <div className="bg-[#222222] p-3.5 rounded-2xl border border-[#333333] space-y-2 mt-2">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Subtotal:</span>
              <span className="font-mono">{formatEuro(grossSubtotal)}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-xs text-[#E5A93C]">
                <span>Discount ({discountPercent}%):</span>
                <span className="font-mono">-{formatEuro(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Cyprus VAT (19%):</span>
              <span className="font-mono">{formatEuro(vatAmount)}</span>
            </div>

            <div className="pt-2 border-t border-[#333333] flex justify-between items-baseline">
              <span className="font-display font-black text-sm text-white">
                TOTAL DUE:
              </span>
              <span className="font-display font-black text-2xl text-[#FF5722] font-mono">
                {formatEuro(netTotal)}
              </span>
            </div>

            {/* Charge Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCharge}
              disabled={cartLines.length === 0}
              className={`w-full py-3.5 rounded-xl font-display font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all ${
                isChargedSuccess
                  ? "bg-[#4CAF50] text-white"
                  : cartLines.length > 0
                  ? "bg-[#FF5722] hover:bg-[#E64A19] text-white glow-orange"
                  : "bg-[#2F2F2F] text-zinc-500 cursor-not-allowed"
              }`}
            >
              {isChargedSuccess ? (
                <>
                  <CheckCircle2 size={20} />
                  <span>PAID & RECEIPT PRINTED</span>
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  <span>CHARGE {formatEuro(netTotal)}</span>
                </>
              )}
            </motion.button>
          </div>
        </aside>
      </div>
    </div>
  );
}
