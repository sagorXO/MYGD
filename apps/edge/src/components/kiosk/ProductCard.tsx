"use client";

import React from "react";
import type { ProductDTO, Locale } from "@/types";
import { useLocaleStore } from "@/store/localeStore";
import { useKioskStore } from "@/store/kioskStore";
import { formatEuro, getDictionary } from "@/lib/i18n";
import { Plus, Sparkles, Leaf, Flame, Award } from "lucide-react";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: ProductDTO;
  onCustomize: (product: ProductDTO) => void;
}

export function ProductCard({ product, onCustomize }: ProductCardProps) {
  const { locale } = useLocaleStore();
  const { recordInteraction } = useKioskStore();
  const dict = getDictionary(locale);

  const getProductName = (p: ProductDTO, loc: Locale) => {
    if (loc === "de" && p.nameDE) return p.nameDE;
    if (loc === "gr" && p.nameGR) return p.nameGR;
    return p.name;
  };

  const getProductDesc = (p: ProductDTO, loc: Locale) => {
    if (loc === "de" && p.descriptionDE) return p.descriptionDE;
    if (loc === "gr" && p.descriptionGR) return p.descriptionGR;
    return p.description;
  };

  const name = getProductName(product, locale);
  const description = getProductDesc(product, locale);

  const getBadgeElement = (badge?: string | null) => {
    if (!badge) return null;
    switch (badge) {
      case "POPULAR":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E5A93C] text-black font-extrabold text-[11px] uppercase tracking-wider shadow-md">
            <Sparkles size={12} /> {dict.menu.popular}
          </span>
        );
      case "VEGGIE":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#4CAF50] text-white font-extrabold text-[11px] uppercase tracking-wider shadow-md">
            <Leaf size={12} /> {dict.menu.veggie}
          </span>
        );
      case "SPICY":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E53935] text-white font-extrabold text-[11px] uppercase tracking-wider shadow-md">
            <Flame size={12} /> {dict.menu.spicy}
          </span>
        );
      case "CHEF_CHOICE":
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#E50D7E] to-[#FF2E93] text-white font-extrabold text-[11px] uppercase tracking-wider shadow-md">
            <Award size={12} /> {dict.menu.chefChoice}
          </span>
        );
      case "NEW":
      default:
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#00FCED] text-black font-black text-[11px] uppercase tracking-wider shadow-md">
            {dict.menu.new}
          </span>
        );
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        recordInteraction();
        onCustomize(product);
      }}
      className="group relative flex flex-col bg-[#2B2B2E] hover:bg-[#343438] border border-[#3A3A3E] hover:border-[#E50D7E]/70 rounded-3xl overflow-hidden shadow-xl transition-all cursor-pointer h-full"
    >
      {/* Product Image Area */}
      <div className="relative w-full h-48 sm:h-52 bg-[#1F1F21] overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#252528] text-zinc-600 font-bold">
            MY GERMAN DÖNER
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2B2B2E] via-transparent to-black/40" />

        {/* Floating Badge (Top Left) */}
        {product.badge && (
          <div className="absolute top-3 left-3 z-10">
            {getBadgeElement(product.badge)}
          </div>
        )}

        {/* Brand Tag (Top Right) */}
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-[#00FCED] text-[10px] font-mono font-bold uppercase tracking-wider border border-[#00FCED]/30">
          MYGD FRESH
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 p-4 sm:p-5 justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-lg sm:text-xl text-white group-hover:text-[#E50D7E] transition-colors line-clamp-1 leading-snug">
            {name}
          </h3>
          {description && (
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="flex items-center justify-between pt-3 border-t border-[#3A3A3E] mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              Price
            </span>
            <span className="font-display font-black text-xl sm:text-2xl text-[#E50D7E] leading-none">
              {formatEuro(product.basePrice, locale)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              recordInteraction();
              onCustomize(product);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E50D7E] group-hover:bg-[#C80B6E] text-white font-display font-bold text-xs sm:text-sm shadow-lg glow-magenta transition-all active:scale-95"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>{dict.menu.customize}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
