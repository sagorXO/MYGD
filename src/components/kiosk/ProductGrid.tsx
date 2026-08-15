"use client";

import React from "react";
import type { ProductDTO } from "@/types";
import { ProductCard } from "./ProductCard";
import { Utensils } from "lucide-react";

interface ProductGridProps {
  products: ProductDTO[];
  onCustomize: (product: ProductDTO) => void;
  isLoading?: boolean;
}

export function ProductGrid({
  products,
  onCustomize,
  isLoading = false,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="h-80 rounded-2xl bg-[#242424] animate-pulse border border-[#333333]"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[#242424] border border-[#333333] flex items-center justify-center text-zinc-500 mb-4">
          <Utensils size={32} />
        </div>
        <h3 className="font-display font-bold text-lg text-zinc-300">
          No items found in this category
        </h3>
        <p className="text-sm text-zinc-500 max-w-xs mt-1">
          Please check another category or speak with a team member at the counter.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 p-4 sm:p-6 pb-28">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onCustomize={onCustomize}
        />
      ))}
    </div>
  );
}
