"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { ProductDTO, ModifierDTO, SelectedModifier } from "@/types";
import { useLocaleStore } from "@/store/localeStore";
import { useKioskStore } from "@/store/kioskStore";
import { formatEuro, getDictionary } from "@/lib/i18n";
import { X, Check, Flame, Plus, Minus, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CustomizationModalProps {
  product: ProductDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (configuredItem: {
    productId: string;
    sku: string;
    name: string;
    nameDE?: string;
    nameGR?: string;
    imageUrl?: string;
    basePrice: number;
    quantity: number;
    spiceLevel: number;
    modifiers: SelectedModifier[];
    isMealBundle: boolean;
    mealDrinkName?: string;
    mealSideName?: string;
    mealPriceAddon: number;
    itemNotes?: string;
  }) => void;
}

export function CustomizationModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: CustomizationModalProps) {
  const { locale } = useLocaleStore();
  const { recordInteraction } = useKioskStore();
  const dict = getDictionary(locale);

  // Selected State
  const [selectedModifierMap, setSelectedModifierMap] = useState<Record<string, ModifierDTO[]>>({});
  const [spiceLevel, setSpiceLevel] = useState<number>(3); // Default Level 3 (Berlin Hot)
  const [isMealBundle, setIsMealBundle] = useState<boolean>(false);
  const [mealDrink, setMealDrink] = useState<string>("Traditional Ayran (250ml)");
  const [mealSide, setMealSide] = useState<string>("Crispy Berlin Fries");
  const [quantity, setQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState<string>("");

  // Sync state whenever product changes
  useEffect(() => {
    if (!product) return;
    const initialMap: Record<string, ModifierDTO[]> = {};
    if (product.modifierGroups) {
      for (const group of product.modifierGroups) {
        const defaultMod =
          group.modifiers.find((m) => m.isDefault && m.isAvailable) || group.modifiers[0];
        if (defaultMod && group.isRequired) {
          initialMap[group.id] = [defaultMod];
        } else {
          initialMap[group.id] = [];
        }
      }
    }
    setSelectedModifierMap(initialMap);
    setSpiceLevel(3);
    setIsMealBundle(false);
    setQuantity(1);
    setItemNotes("");
  }, [product]);

  // Price Calculation
  const { unitPrice, totalPrice, flatModifiers } = useMemo(() => {
    if (!product) {
      return { unitPrice: 0, totalPrice: 0, flatModifiers: [] };
    }

    let modsSum = 0;
    const flatMods: SelectedModifier[] = [];

    Object.entries(selectedModifierMap).forEach(([groupId, mods]) => {
      const groupObj = product.modifierGroups?.find((g) => g.id === groupId);
      mods.forEach((m) => {
        modsSum += m.priceAdjustment || 0;
        flatMods.push({
          modifierId: m.id,
          groupId,
          groupName: groupObj?.name || "Modifier",
          name: m.name,
          nameDE: m.nameDE,
          nameGR: m.nameGR,
          priceAdjustment: m.priceAdjustment,
        });
      });
    });

    const mealAddon = isMealBundle ? 3.5 : 0.0;
    const singleUnitPrice = Number((product.basePrice + modsSum + mealAddon).toFixed(2));
    const total = Number((singleUnitPrice * quantity).toFixed(2));

    return {
      unitPrice: singleUnitPrice,
      totalPrice: total,
      flatModifiers: flatMods,
    };
  }, [product, selectedModifierMap, isMealBundle, quantity]);

  // Handle Radio Modifier Toggle
  const handleSingleSelect = (groupId: string, modifier: ModifierDTO) => {
    recordInteraction();
    setSelectedModifierMap((prev) => ({
      ...prev,
      [groupId]: [modifier],
    }));
  };

  // Handle Multi-Select Modifier Toggle (e.g. up to 3 sauces or toppings)
  const handleMultiSelect = (
    groupId: string,
    modifier: ModifierDTO,
    maxSelected: number
  ) => {
    recordInteraction();
    setSelectedModifierMap((prev) => {
      const currentList = prev[groupId] || [];
      const exists = currentList.some((m) => m.id === modifier.id);

      if (exists) {
        return {
          ...prev,
          [groupId]: currentList.filter((m) => m.id !== modifier.id),
        };
      } else {
        if (currentList.length >= maxSelected) {
          const trimmed = currentList.slice(1);
          return {
            ...prev,
            [groupId]: [...trimmed, modifier],
          };
        }
        return {
          ...prev,
          [groupId]: [...currentList, modifier],
        };
      }
    });
  };

  const handleConfirmAdd = () => {
    if (!product) return;
    recordInteraction();
    onAddToCart({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      nameDE: product.nameDE,
      nameGR: product.nameGR,
      imageUrl: product.imageUrl || undefined,
      basePrice: product.basePrice,
      quantity,
      spiceLevel,
      modifiers: flatModifiers,
      isMealBundle,
      mealDrinkName: isMealBundle ? mealDrink : undefined,
      mealSideName: isMealBundle ? mealSide : undefined,
      mealPriceAddon: isMealBundle ? 3.5 : 0.0,
      itemNotes: itemNotes.trim() || undefined,
    });
    onClose();
  };

  const getSpiceLabel = (lvl: number) => {
    switch (lvl) {
      case 1:
        return dict.customization.spiceMild;
      case 2:
        return dict.customization.spiceMedium;
      case 3:
        return dict.customization.spiceScharf;
      case 4:
        return dict.customization.spiceExtra;
      case 5:
        return dict.customization.spiceHolle;
      default:
        return "";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              recordInteraction();
              onClose();
            }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-[#1F1F21] border-t-2 border-x border-[#3A3A3E] rounded-t-[32px] overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Header Drag Handle / Close Row */}
            <div className="relative w-full px-6 pt-4 pb-3 flex items-center justify-between border-b border-[#2E2E32] bg-[#252528]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-1 bg-[#444448] rounded-full mx-auto" />
                <h2 className="font-display font-black text-lg sm:text-xl text-white uppercase">
                  {dict.customization.title}
                </h2>
              </div>
              <button
                onClick={() => {
                  recordInteraction();
                  onClose();
                }}
                className="w-9 h-9 rounded-full bg-[#343438] border border-[#444448] flex items-center justify-center text-zinc-300 hover:text-white hover:bg-[#3E3E42] transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Customization Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Product Hero Info */}
              <div className="flex gap-4 items-center bg-[#2B2B2E] p-4 rounded-3xl border border-[#3A3A3E]">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-24 h-24 rounded-2xl object-cover border border-[#444448]"
                  />
                )}
                <div>
                  <h3 className="font-display font-black text-xl text-white">
                    {product.name}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                    {product.description}
                  </p>
                  <p className="font-display font-black text-lg text-[#E50D7E] mt-1.5 font-mono">
                    {formatEuro(product.basePrice, locale)}
                  </p>
                </div>
              </div>

              {/* Dynamic Modifier Groups */}
              {product.modifierGroups?.map((group) => {
                const isSingle = group.maxSelected === 1;
                const selectedList = selectedModifierMap[group.id] || [];

                return (
                  <div key={group.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-black text-base text-white uppercase tracking-wider">
                        {group.name}
                      </h4>
                      <span
                        className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          group.isRequired
                            ? "bg-[#E50D7E]/20 text-[#E50D7E] border border-[#E50D7E]/40"
                            : "bg-[#2B2B2E] text-zinc-400"
                        }`}
                      >
                        {group.isRequired
                          ? dict.customization.required
                          : `${dict.customization.optional} (${selectedList.length}/${group.maxSelected})`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {group.modifiers.map((modifier) => {
                        const isSelected = selectedList.some((m) => m.id === modifier.id);

                        return (
                          <button
                            key={modifier.id}
                            type="button"
                            onClick={() => {
                              if (isSingle) {
                                handleSingleSelect(group.id, modifier);
                              } else {
                                handleMultiSelect(group.id, modifier, group.maxSelected);
                              }
                            }}
                            className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all active:scale-98 ${
                              isSelected
                                ? "bg-[#E50D7E] text-white border-[#FF2E93] shadow-lg glow-magenta"
                                : "bg-[#2B2B2E] text-zinc-300 hover:text-white border-[#3A3A3E] hover:border-zinc-500"
                            }`}
                          >
                            <span className="font-display font-bold text-xs sm:text-sm">
                              {modifier.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {modifier.priceAdjustment > 0 && (
                                <span
                                  className={`text-xs font-mono font-black ${
                                    isSelected ? "text-white" : "text-[#00FCED]"
                                  }`}
                                >
                                  +{formatEuro(modifier.priceAdjustment, locale)}
                                </span>
                              )}
                              {isSelected && <Check size={16} className="stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Spice Level Selector (5 Flame Meter) */}
              <div className="space-y-3 bg-[#2B2B2E] p-4 sm:p-5 rounded-3xl border border-[#3A3A3E]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="text-[#E50D7E]" size={20} />
                    <h4 className="font-display font-black text-sm sm:text-base text-white uppercase">
                      {dict.customization.spiceLevel}
                    </h4>
                  </div>
                  <span className="font-display font-extrabold text-sm text-[#E50D7E]">
                    {getSpiceLabel(spiceLevel)}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        recordInteraction();
                        setSpiceLevel(lvl);
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                        spiceLevel >= lvl
                          ? "bg-gradient-to-t from-[#E50D7E] to-[#C80B6E] text-white border-[#FF2E93] shadow-md"
                          : "bg-[#222225] text-zinc-600 border-[#3A3A3E]"
                      }`}
                    >
                      <Flame
                        size={22}
                        className={spiceLevel >= lvl ? "fill-white" : "fill-none"}
                      />
                      <span className="text-[11px] font-black mt-1 font-mono">{lvl}</span>
                    </button>
                  ))}
                </div>

                {spiceLevel === 5 && (
                  <div className="flex items-center gap-2 text-xs text-[#E53935] font-bold bg-red-950/40 p-2 rounded-xl border border-red-800">
                    <AlertCircle size={14} />
                    <span>Warning: Level 5 Hölle is extremely spicy with raw crushed chili peppers!</span>
                  </div>
                )}
              </div>

              {/* Make It a Meal Upgrade (+€3.50) */}
              {product.allowMealUpgrade && (
                <div
                  onClick={() => {
                    recordInteraction();
                    setIsMealBundle(!isMealBundle);
                  }}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer ${
                    isMealBundle
                      ? "bg-gradient-to-r from-[#321C2B] to-[#2B2B2E] border-[#E50D7E] shadow-xl glow-magenta"
                      : "bg-[#2B2B2E] border-[#3A3A3E]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center border ${
                          isMealBundle
                            ? "bg-[#E50D7E] border-[#E50D7E] text-white"
                            : "border-zinc-500"
                        }`}
                      >
                        {isMealBundle && <Check size={18} className="stroke-[3]" />}
                      </div>
                      <div>
                        <h4 className="font-display font-black text-base text-white flex items-center gap-2">
                          {dict.customization.makeItMeal}
                          <span className="px-2.5 py-0.5 rounded-full bg-[#00FCED] text-black text-[10px] font-black uppercase">
                            SAVE €1.70
                          </span>
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {dict.customization.mealDescription}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Meal Options Dropdown */}
                  {isMealBundle && (
                    <div className="mt-4 pt-4 border-t border-[#3A3A3E] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-zinc-400 block mb-1 font-bold uppercase tracking-wider">
                          {dict.customization.selectDrink}
                        </label>
                        <select
                          value={mealDrink}
                          onChange={(e) => {
                            recordInteraction();
                            setMealDrink(e.target.value);
                          }}
                          className="w-full bg-[#1F1F21] border border-[#444448] rounded-xl p-2.5 text-white font-medium focus:border-[#E50D7E] outline-none"
                        >
                          <option value="Traditional Ayran (250ml)">Traditional Ayran (250ml)</option>
                          <option value="Uludağ Gazoz (330ml)">Uludağ Gazoz (330ml)</option>
                          <option value="Coca-Cola (330ml)">Coca-Cola (330ml)</option>
                          <option value="Coca-Cola Zero (330ml)">Coca-Cola Zero (330ml)</option>
                          <option value="Mineral Water (500ml)">Mineral Water (500ml)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-zinc-400 block mb-1 font-bold uppercase tracking-wider">
                          {dict.customization.selectSide}
                        </label>
                        <select
                          value={mealSide}
                          onChange={(e) => {
                            recordInteraction();
                            setMealSide(e.target.value);
                          }}
                          className="w-full bg-[#1F1F21] border border-[#444448] rounded-xl p-2.5 text-white font-medium focus:border-[#E50D7E] outline-none"
                        >
                          <option value="Crispy Berlin Fries">Crispy Berlin Fries</option>
                          <option value="Chili-Cheese Loaded Fries (+€1.50)">Chili-Cheese Loaded Fries (+€1.50)</option>
                          <option value="Falafel Bites (2 pcs)">Falafel Bites (2 pcs)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Special Instructions Note */}
              <div>
                <input
                  type="text"
                  placeholder={dict.customization.specialNotes}
                  value={itemNotes}
                  onChange={(e) => {
                    recordInteraction();
                    setItemNotes(e.target.value);
                  }}
                  maxLength={150}
                  className="w-full bg-[#2B2B2E] border border-[#3A3A3E] rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-[#E50D7E] outline-none"
                />
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 z-20 w-full bg-[#1F1F21] border-t border-[#333336] p-4 sm:p-6 flex items-center gap-4">
              {/* Quantity Stepper */}
              <div className="flex items-center bg-[#2B2B2E] border border-[#3A3A3E] rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => {
                    recordInteraction();
                    setQuantity((q) => Math.max(1, q - 1));
                  }}
                  className="w-10 h-10 rounded-xl bg-[#222225] flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all"
                >
                  <Minus size={18} />
                </button>
                <span className="w-10 text-center font-mono font-black text-base text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    recordInteraction();
                    setQuantity((q) => Math.min(20, q + 1));
                  }}
                  className="w-10 h-10 rounded-xl bg-[#222225] flex items-center justify-center text-zinc-300 hover:text-white active:scale-95 transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Add to Cart CTA */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleConfirmAdd}
                className="flex-1 py-4 px-6 rounded-2xl bg-[#E50D7E] hover:bg-[#C80B6E] text-white font-display font-black text-base sm:text-lg flex items-center justify-between shadow-2xl glow-magenta transition-all"
              >
                <span>{dict.customization.addToCart}</span>
                <span className="font-mono font-black text-lg">
                  {formatEuro(totalPrice, locale)}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
