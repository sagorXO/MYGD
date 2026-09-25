"use client";

import React, { useState } from "react";
import { formatEuro } from "@/lib/i18n";
import { POSModifierSelection, POSCartLine } from "../pos.schema";
import { ProductDTO } from "@/types";
import { X, Flame, Plus, Check, Minus, AlertTriangle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModifierModalProps {
  product: ProductDTO;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customizedLine: POSCartLine) => void;
}

const AVAILABLE_ADDITIONS: POSModifierSelection[] = [
  { id: "mod-halloumi", name: "Grilled Halloumi", type: "ADDITION", priceAdjustment: 1.0, category: "CHEESE" },
  { id: "mod-feta", name: "Greek Feta", type: "ADDITION", priceAdjustment: 1.0, category: "CHEESE" },
  { id: "mod-extra-meat", name: "Extra Spit Meat (+100g)", type: "ADDITION", priceAdjustment: 2.5, category: "MEAT" },
  { id: "mod-garlic-sauce", name: "Knoblauch Garlic Sauce", type: "ADDITION", priceAdjustment: 0.0, category: "SAUCE" },
  { id: "mod-kraeuter-sauce", name: "Kräuter Herb Sauce", type: "ADDITION", priceAdjustment: 0.0, category: "SAUCE" },
  { id: "mod-scharf-sauce", name: "Scharf Chili Sauce", type: "ADDITION", priceAdjustment: 0.0, category: "SAUCE" },
  { id: "mod-fries-inside", name: "Crispy Fries Inside", type: "ADDITION", priceAdjustment: 1.0, category: "EXTRA" },
];

const STANDARD_OMISSIONS = [
  "Onions (Zwiebeln)",
  "Red Cabbage (Rotkohl)",
  "White Cabbage (Weißkohl)",
  "Tomatoes (Tomaten)",
  "Cucumbers (Gurken)",
  "Jalapeños",
  "Sumac Herbs",
];

const BREAD_OPTIONS = [
  "Fresh Baked Fladenbrot",
  "Sesame Flatbread",
  "Toasted Dürüm Lavash",
  "Döner Box Container",
];

export const ModifierModal: React.FC<ModifierModalProps> = ({
  product,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [breadType, setBreadType] = useState<string>(
    product.name.toLowerCase().includes("wrap") || product.name.toLowerCase().includes("dürüm")
      ? "Toasted Dürüm Lavash"
      : product.name.toLowerCase().includes("box")
      ? "Döner Box Container"
      : "Fresh Baked Fladenbrot"
  );
  const [spiceLevel, setSpiceLevel] = useState<number>(product.isSpicy ? 3 : 1);
  const [selectedAdditions, setSelectedAdditions] = useState<POSModifierSelection[]>([]);
  const [selectedOmissions, setSelectedOmissions] = useState<string[]>([]);
  const [selectedSauces, setSelectedSauces] = useState<string[]>([
    "Kräuter Herb Sauce",
    "Knoblauch Garlic Sauce",
  ]);
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) return null;

  // Additions total
  const additionsTotal = selectedAdditions.reduce((acc, a) => acc + a.priceAdjustment, 0);
  const unitPrice = Number((product.basePrice + additionsTotal).toFixed(2));
  const totalPrice = Number((unitPrice * quantity).toFixed(2));

  const toggleAddition = (mod: POSModifierSelection) => {
    setSelectedAdditions((prev) => {
      const exists = prev.some((p) => p.id === mod.id);
      if (exists) {
        return prev.filter((p) => p.id !== mod.id);
      } else {
        return [...prev, mod];
      }
    });
  };

  const toggleOmission = (item: string) => {
    setSelectedOmissions((prev) => {
      if (prev.includes(item)) {
        return prev.filter((i) => i !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleConfirm = () => {
    const line: POSCartLine = {
      lineId: `pos-line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      basePrice: product.basePrice,
      quantity,
      spiceLevel,
      breadType,
      selectedAdditions,
      selectedOmissions,
      selectedSauces,
      notes: notes.trim() || undefined,
      unitPrice,
      totalPrice,
    };
    onConfirm(line);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[92vh] bg-[#1F1F21] border-2 border-[#3A3A3E] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white font-sans"
      >
        {/* Header */}
        <header className="bg-[#2B2B2E] border-b border-[#3A3A3E] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E50D7E] flex items-center justify-center font-display font-black text-white text-lg">
              GD
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl text-white uppercase tracking-tight">
                  {product.name}
                </h2>
                <span className="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-[#1F1F21] border border-[#3A3A3E] text-[#00FCED] font-bold">
                  Base {formatEuro(product.basePrice)}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">Customize toppings, additions, and spice</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-[#1F1F21] border border-[#3A3A3E] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Bread Choice */}
          <div>
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-2.5">
              1. Bread / Serving Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {BREAD_OPTIONS.map((bread) => (
                <button
                  key={bread}
                  onClick={() => setBreadType(bread)}
                  className={`p-3 rounded-xl border text-xs font-display font-bold text-left transition-all ${
                    breadType === bread
                      ? "bg-[#E50D7E] text-white border-[#E50D7E] shadow-md"
                      : "bg-[#2B2B2E] text-zinc-300 border-[#3A3A3E] hover:border-zinc-500"
                  }`}
                >
                  {bread}
                </button>
              ))}
            </div>
          </div>

          {/* 5-Flame Spice Meter */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame size={14} className="text-[#FF5722]" />
                <span>2. 5-Flame Spice Scale</span>
              </label>
              <span className="font-mono text-xs font-bold text-[#E5A93C]">
                {spiceLevel === 1 && "Level 1: Mild"}
                {spiceLevel === 2 && "Level 2: Medium Kick"}
                {spiceLevel === 3 && "Level 3: Scharf! 🔥"}
                {spiceLevel === 4 && "Level 4: Extra Scharf! 🔥🔥"}
                {spiceLevel === 5 && "Level 5: Hölle! 💀"}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((level) => {
                const isActive = spiceLevel === level;
                return (
                  <button
                    key={level}
                    onClick={() => setSpiceLevel(level)}
                    className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      isActive
                        ? level >= 4
                          ? "bg-[#EF4444] text-white border-[#EF4444] shadow-lg shadow-red-950/50"
                          : "bg-[#E50D7E] text-white border-[#E50D7E] shadow-md"
                        : "bg-[#2B2B2E] text-zinc-400 border-[#3A3A3E] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center">
                      {Array.from({ length: level }).map((_, i) => (
                        <Flame key={i} size={14} className={isActive ? "fill-white" : "fill-zinc-500"} />
                      ))}
                    </div>
                    <span className="font-mono text-[11px] font-bold">Lvl {level}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color-Coded Modifiers: BOLD NEON GREEN ADDITIONS */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-mono font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-1.5">
                <Plus size={14} className="text-[#10B981]" />
                <span>3. Paid & Free Additions (Bold Green)</span>
              </label>
              <span className="text-[11px] font-mono text-zinc-400">
                {selectedAdditions.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AVAILABLE_ADDITIONS.map((mod) => {
                const isSelected = selectedAdditions.some((s) => s.id === mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => toggleAddition(mod)}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-display font-bold transition-all ${
                      isSelected
                        ? "bg-[#10B981] text-black border-[#10B981] shadow-lg shadow-emerald-950/40"
                        : "bg-[#2B2B2E] text-zinc-300 border-[#3A3A3E] hover:border-[#10B981]/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          isSelected ? "bg-black text-[#10B981]" : "border border-zinc-500"
                        }`}
                      >
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span className="text-left leading-tight">{mod.name}</span>
                    </div>

                    <span
                      className={`font-mono text-[11px] font-black shrink-0 ml-1.5 ${
                        isSelected ? "text-black" : "text-[#10B981]"
                      }`}
                    >
                      {mod.priceAdjustment > 0 ? `+${formatEuro(mod.priceAdjustment)}` : "FREE"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color-Coded Modifiers: BOLD NEON RED OMISSIONS */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-mono font-bold text-[#EF4444] uppercase tracking-wider flex items-center gap-1.5">
                <Minus size={14} className="text-[#EF4444]" />
                <span>4. Ingredient Omissions (Bold Red Strikethrough)</span>
              </label>
              <span className="text-[11px] font-mono text-zinc-400">
                {selectedOmissions.length} omitted
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {STANDARD_OMISSIONS.map((item) => {
                const isOmitted = selectedOmissions.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleOmission(item)}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-display font-bold transition-all ${
                      isOmitted
                        ? "bg-[#EF4444] text-white border-[#EF4444] shadow-lg shadow-red-950/50"
                        : "bg-[#2B2B2E] text-zinc-400 border-[#3A3A3E] hover:border-[#EF4444]/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center ${
                          isOmitted ? "bg-white text-[#EF4444]" : "border border-zinc-600"
                        }`}
                      >
                        {isOmitted && <X size={12} strokeWidth={3} />}
                      </div>
                      <span className={`text-left leading-tight ${isOmitted ? "line-through font-black" : ""}`}>
                        {item}
                      </span>
                    </div>

                    {isOmitted && (
                      <span className="font-mono text-[10px] uppercase font-black tracking-wider bg-white/20 px-1.5 py-0.5 rounded">
                        NO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kitchen Note */}
          <div>
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
              5. Special Kitchen Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Extra toasted bread, wrap tight for takeaway..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50D7E]"
            />
          </div>
        </div>

        {/* Footer Bar */}
        <footer className="bg-[#2B2B2E] border-t border-[#3A3A3E] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Quantity Stepper */}
            <div className="flex items-center bg-[#1F1F21] border border-[#3A3A3E] rounded-xl p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-[#2B2B2E] flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <Minus size={14} />
              </button>
              <span className="font-mono font-black text-white w-8 text-center text-sm">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg bg-[#2B2B2E] flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <Plus size={14} />
              </button>
            </div>

            <div>
              <span className="text-[11px] font-mono text-zinc-400 block">Calculated Total</span>
              <span className="font-mono font-black text-2xl text-[#E50D7E] leading-none">
                {formatEuro(totalPrice)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-[#3A3A3E] text-zinc-400 hover:text-white font-display font-bold text-xs"
            >
              CANCEL
            </button>
            <button
              onClick={handleConfirm}
              className="px-8 py-3 rounded-xl bg-[#E50D7E] hover:bg-[#d00b72] text-white font-display font-black text-sm tracking-wide shadow-lg shadow-magenta-950/50 flex items-center gap-2"
            >
              <span>ADD TO TICKET</span>
              <span className="font-mono text-xs bg-black/20 px-2 py-0.5 rounded">
                {formatEuro(totalPrice)}
              </span>
            </button>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};
