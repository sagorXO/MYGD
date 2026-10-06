"use client";

import React, { useMemo, useState } from "react";
import { formatEuro } from "@/lib/i18n";
import { POSCartLine } from "../pos.schema";
import { ProductDTO } from "@/types";
import { X, Check, Minus, Plus, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import {
  extrasTotal,
  initialSelection,
  toggleOption,
  toLineSelections,
  validateSelection,
  visibleGroups,
  type OptionGroup,
} from "../option-selection";

interface ModifierModalProps {
  product: ProductDTO;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customizedLine: POSCartLine) => void;
}

// Ingredients a guest can ask to leave out (all appear in the menu descriptions).
const STANDARD_OMISSIONS = ["Onions", "Lettuce", "Tomatoes", "Cucumber", "Red Cabbage", "Jalapeños"];

export const ModifierModal: React.FC<ModifierModalProps> = ({ product, isOpen, onClose, onConfirm }) => {
  // Option groups come from the database via /api/menu; nothing is hardcoded here.
  const groups: OptionGroup[] = useMemo(
    () =>
      (product.modifierGroups ?? []).map((g) => ({
        slug: g.slug,
        name: g.name,
        minSelected: g.minSelected,
        maxSelected: g.maxSelected,
        isRequired: g.isRequired,
        modifiers: g.modifiers.filter((m) => m.isAvailable).map((m) => ({ slug: m.slug, name: m.name, priceAdjustment: m.priceAdjustment, isDefault: m.isDefault })),
      })),
    [product],
  );

  const [quantity, setQuantity] = useState<number>(1);
  const [selection, setSelection] = useState(() => initialSelection(groups));
  const [selectedOmissions, setSelectedOmissions] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) return null;

  const shown = visibleGroups(groups, selection);
  const missing = validateSelection(groups, selection);
  const unitPrice = Number((product.basePrice + extrasTotal(groups, selection)).toFixed(2));
  const totalPrice = Number((unitPrice * quantity).toFixed(2));

  const toggleOmission = (item: string) =>
    setSelectedOmissions((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));

  const handleConfirm = () => {
    if (missing.length > 0) return;
    const { selectedSauces, selectedAdditions } = toLineSelections(groups, selection);
    onConfirm({
      lineId: `pos-line-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      sku: product.sku,
      name: product.name,
      basePrice: product.basePrice,
      quantity,
      spiceLevel: 1,
      selectedAdditions,
      selectedOmissions,
      selectedSauces,
      notes: notes.trim() || undefined,
      unitPrice,
      totalPrice,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl max-h-[92vh] bg-[#1F1F21] border-2 border-[#3A3A3E] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white font-sans"
      >
        <header className="bg-[#2B2B2E] border-b border-[#3A3A3E] px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-xl text-white uppercase tracking-tight">{product.name}</h2>
              <span className="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-[#1F1F21] border border-[#3A3A3E] text-[#00FCED] font-bold">
                {formatEuro(product.basePrice)}
              </span>
            </div>
            {product.description && <p className="text-xs text-zinc-400 mt-0.5">{product.description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-xl bg-[#1F1F21] border border-[#3A3A3E] flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {shown.map((group, index) => {
            const chosen = selection[group.slug] ?? [];
            const needed = group.isRequired || group.minSelected >= 1 || group.slug === "menu-side" || group.slug === "menu-drink";
            return (
              <div key={group.slug}>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                    {index + 1}. {group.name}
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${needed ? "text-[#E5A93C]" : "text-zinc-500"}`}>
                    {needed ? "REQUIRED" : "OPTIONAL"}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {group.modifiers.map((option) => {
                    const isSelected = chosen.includes(option.slug);
                    return (
                      <button
                        key={option.slug}
                        onClick={() => setSelection((prev) => toggleOption(groups, prev, group.slug, option.slug))}
                        aria-pressed={isSelected}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs font-display font-bold transition-all ${
                          isSelected
                            ? "bg-[#10B981] text-black border-[#10B981] shadow-lg shadow-emerald-950/40"
                            : "bg-[#2B2B2E] text-zinc-300 border-[#3A3A3E] hover:border-[#10B981]/50"
                        }`}
                      >
                        <span className="flex items-center gap-2 text-left leading-tight">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isSelected ? "bg-black text-[#10B981]" : "border border-zinc-500"}`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </span>
                          {option.name}
                        </span>
                        {option.priceAdjustment > 0 && (
                          <span className={`font-mono text-[11px] font-black shrink-0 ml-1.5 ${isSelected ? "text-black" : "text-[#10B981]"}`}>
                            +{formatEuro(option.priceAdjustment)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div>
            <label className="text-xs font-mono font-bold text-[#EF4444] uppercase tracking-wider block mb-2.5">
              Leave out
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {STANDARD_OMISSIONS.map((item) => {
                const isOmitted = selectedOmissions.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleOmission(item)}
                    aria-pressed={isOmitted}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs font-display font-bold transition-all ${
                      isOmitted ? "bg-[#EF4444] text-white border-[#EF4444]" : "bg-[#2B2B2E] text-zinc-400 border-[#3A3A3E] hover:border-[#EF4444]/50"
                    }`}
                  >
                    <span className={isOmitted ? "line-through font-black" : ""}>{item}</span>
                    {isOmitted && <span className="font-mono text-[10px] uppercase font-black bg-white/20 px-1.5 py-0.5 rounded">NO</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Kitchen note</label>
            <input
              type="text"
              placeholder="e.g. cut in half, wrap tight for takeaway…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50D7E]"
            />
          </div>
        </div>

        <footer className="bg-[#2B2B2E] border-t border-[#3A3A3E] px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Fewer" className="w-9 h-9 rounded-xl bg-[#1F1F21] border border-[#3A3A3E] flex items-center justify-center text-zinc-300 hover:text-white">
              <Minus size={16} />
            </button>
            <span className="font-mono font-black text-lg w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)} aria-label="More" className="w-9 h-9 rounded-xl bg-[#1F1F21] border border-[#3A3A3E] flex items-center justify-center text-zinc-300 hover:text-white">
              <Plus size={16} />
            </button>
          </div>

          {missing.length > 0 && (
            <p className="flex items-center gap-1.5 text-[11px] font-mono text-[#E5A93C]">
              <AlertTriangle size={13} /> Choose: {missing.join(", ")}
            </p>
          )}

          <button
            onClick={handleConfirm}
            disabled={missing.length > 0}
            className="px-6 py-3 rounded-xl bg-[#E50D7E] hover:bg-[#d00b72] disabled:opacity-40 disabled:cursor-not-allowed text-white font-display font-black text-sm tracking-wide"
          >
            ADD · {formatEuro(totalPrice)}
          </button>
        </footer>
      </motion.div>
    </div>
  );
};
