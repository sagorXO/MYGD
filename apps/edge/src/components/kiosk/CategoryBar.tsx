"use client";

import React, { useRef } from "react";
import type { CategoryDTO, Locale } from "@/types";
import { useLocaleStore } from "@/store/localeStore";
import { useKioskStore } from "@/store/kioskStore";
import { Sandwich, Box, Scroll, Utensils, CupSoda, Sparkles, Leaf, Flame } from "lucide-react";

interface CategoryBarProps {
  categories: CategoryDTO[];
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  activeDietFilter?: string;
  onSelectDietFilter?: (filter: string) => void;
}

const getCategoryIcon = (iconKey?: string | null) => {
  switch (iconKey) {
    case "sandwich":
      return <Sandwich size={18} />;
    case "box":
      return <Box size={18} />;
    case "scroll":
      return <Scroll size={18} />;
    case "cup":
      return <CupSoda size={18} />;
    case "french-fries":
    default:
      return <Utensils size={18} />;
  }
};

export function CategoryBar({
  categories,
  activeCategoryId,
  onSelectCategory,
  activeDietFilter = "ALL",
  onSelectDietFilter,
}: CategoryBarProps) {
  const { locale } = useLocaleStore();
  const { recordInteraction } = useKioskStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const getCategoryName = (cat: CategoryDTO, loc: Locale) => {
    if (loc === "de" && cat.nameDE) return cat.nameDE;
    if (loc === "gr" && cat.nameGR) return cat.nameGR;
    return cat.name;
  };

  return (
    <div className="w-full bg-[#1F1F21] border-b border-[#333336] py-3 px-4 sm:px-6 space-y-2.5">
      {/* Row 1: Primary Category Pills (Döner, Wraps, Bowls, Pizza, Sides, Drinks) */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-0.5"
      >
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          const name = getCategoryName(cat, locale);

          return (
            <button
              key={cat.id}
              onClick={() => {
                recordInteraction();
                onSelectCategory(cat.id);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-display font-bold text-sm sm:text-base whitespace-nowrap transition-all touch-manipulation active:scale-95 ${
                isActive
                  ? "bg-[#E50D7E] text-white shadow-lg glow-magenta border border-[#FF2E93]"
                  : "bg-[#2B2B2E] text-zinc-300 hover:text-white hover:bg-[#38383C] border border-[#3A3A3E]"
              }`}
            >
              <span className={isActive ? "text-white" : "text-[#E50D7E]"}>
                {getCategoryIcon(cat.iconSvg)}
              </span>
              <span>{name}</span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Curated Dietary Quick Filters (All, Veggie, Spicy, Popular) */}
      {onSelectDietFilter && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 text-xs">
          {[
            { id: "ALL", label: "All Items", icon: null },
            { id: "POPULAR", label: "🔥 Top Sellers", icon: <Sparkles size={12} className="text-[#E5A93C]" /> },
            { id: "VEGGIE", label: "🌱 Vegetarian / Falafel", icon: <Leaf size={12} className="text-[#4CAF50]" /> },
            { id: "SPICY", label: "🌶️ Spicy Kick", icon: <Flame size={12} className="text-[#E53935]" /> },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                recordInteraction();
                onSelectDietFilter(filter.id);
              }}
              className={`px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 transition-all ${
                activeDietFilter === filter.id
                  ? "bg-[#00FCED]/20 text-[#00FCED] border border-[#00FCED]/60 glow-cyan"
                  : "bg-[#252528] text-zinc-400 hover:text-white border border-[#333336]"
              }`}
            >
              {filter.icon}
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
