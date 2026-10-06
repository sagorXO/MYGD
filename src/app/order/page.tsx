"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { formatEuro } from "@/lib/i18n";
import {
  ShoppingBag,
  Clock,
  Car,
  UtensilsCrossed,
  Sparkles,
  MapPin,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Plus,
  Minus,
  AlertOctagon,
} from "lucide-react";
import { motion } from "framer-motion";
import type { CategoryDTO } from "@/types";
import { priceCart } from "@/lib/discounts/engine";
import type { PromotionDef } from "@/lib/menu/mygd-menu";

export default function MobilePreOrderPage() {
  const [orderChannel, setOrderChannel] = useState<"COUNTER_PICKUP" | "DRIVE_THROUGH">("DRIVE_THROUGH");
  const [vehicleInfo, setVehicleInfo] = useState<string>("");
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [promotions, setPromotions] = useState<PromotionDef[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [menuStatus, setMenuStatus] = useState<"loading" | "ready" | "error">("loading");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isOrderPlaced, setIsOrderPlaced] = useState<boolean>(false);

  // Dynamic Wait Calculation based on simulated active KDS queue
  const activeKdsTickets = 4;
  const estimatedPickupMins = 4 + Math.round(activeKdsTickets * 1.2);

  const loadMenu = useCallback(async (signal?: AbortSignal) => {
    setMenuStatus("loading");
    try {
      const res = await fetch("/api/menu?location=EMBA", { signal });
      if (!res.ok) throw new Error(`Menu request failed: ${res.status}`);
      const data = await res.json();
      if (!data.success || !Array.isArray(data.categories)) throw new Error("Menu request unsuccessful");
      setCategories(data.categories);
      setPromotions(Array.isArray(data.promotions) ? data.promotions : []);
      setSelectedCategoryId((prev) => (data.categories.some((c: CategoryDTO) => c.id === prev) ? prev : data.categories[0]?.id ?? ""));
      setMenuStatus("ready");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("[Order] Failed to load menu", err);
      setMenuStatus("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadMenu(controller.signal);
    return () => controller.abort();
  }, [loadMenu]);

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);
  const menuItems = (activeCategory?.products ?? []).filter((p) => p.isAvailable);

  const { cartCount, priced } = useMemo(() => {
    const lines = categories.flatMap((c) =>
      (c.products ?? [])
        .filter((p) => (cart[p.id] ?? 0) > 0)
        .map((p) => ({ sku: p.sku, sectionSlug: c.slug, unitPrice: p.basePrice, quantity: cart[p.id] })),
    );
    return {
      cartCount: lines.reduce((n, l) => n + l.quantity, 0),
      priced: priceCart({ lines, promotions }),
    };
  }, [categories, cart, promotions]);

  const changeQty = (productId: string, delta: number) =>
    setCart((prev) => {
      const next = Math.max(0, (prev[productId] ?? 0) + delta);
      const { [productId]: _removed, ...rest } = prev;
      return next === 0 ? rest : { ...rest, [productId]: next };
    });

  const handlePlaceOrder = () => {
    setIsOrderPlaced(true);
  };

  return (
    <div className="min-h-screen bg-[#121214] text-white flex flex-col font-sans select-none max-w-md mx-auto shadow-2xl border-x border-[#27272A]">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 bg-[#1A1A1E]/95 backdrop-blur-md border-b border-[#27272A] px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E50D7E] flex items-center justify-center font-display font-black text-white text-sm shadow">
            GD
          </div>
          <div>
            <h1 className="font-display font-black text-sm uppercase tracking-wider">
              MY GERMAN DÖNER
            </h1>
            <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
              <MapPin size={10} className="text-[#00FCED]" /> Emba Store (Paphos)
            </span>
          </div>
        </div>

        {/* Dynamic Estimated Wait Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#18241D] border border-[#10B981]/40 text-[#10B981] font-mono font-bold text-xs">
          <Clock size={12} />
          <span>~{estimatedPickupMins} mins</span>
        </div>
      </header>

      {/* Main Flow Content */}
      {!isOrderPlaced ? (
        <main className="flex-1 p-4 space-y-5 pb-28 overflow-y-auto">
          {/* Pickup Mode Toggle (Drive-Through vs In-Store) */}
          <div className="bg-[#1A1A1E] p-1.5 rounded-2xl border border-[#27272A] flex items-center gap-1">
            <button
              onClick={() => setOrderChannel("DRIVE_THROUGH")}
              className={`flex-1 py-2.5 rounded-xl font-display font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all ${
                orderChannel === "DRIVE_THROUGH"
                  ? "bg-[#E50D7E] text-white shadow glow-magenta"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Car size={15} />
              <span>Drive-Through Lane</span>
            </button>

            <button
              onClick={() => setOrderChannel("COUNTER_PICKUP")}
              className={`flex-1 py-2.5 rounded-xl font-display font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all ${
                orderChannel === "COUNTER_PICKUP"
                  ? "bg-[#E50D7E] text-white shadow glow-magenta"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <UtensilsCrossed size={15} />
              <span>Counter Pickup</span>
            </button>
          </div>

          {/* Drive-Through Vehicle Input */}
          {orderChannel === "DRIVE_THROUGH" && (
            <div className="bg-[#1A1A1E] p-3.5 rounded-2xl border border-[#27272A] space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                Vehicle Details (For Lane Delivery)
              </label>
              <input
                type="text"
                value={vehicleInfo}
                onChange={(e) => setVehicleInfo(e.target.value)}
                placeholder="e.g. White Toyota Yaris / Plate 123"
                className="w-full bg-[#121214] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-[#E50D7E] outline-none"
              />
            </div>
          )}

          {/* Offers */}
          {promotions.length > 0 && (
            <div className="rounded-2xl border border-[#E50D7E]/40 bg-[#E50D7E]/10 p-3 text-xs text-white">
              <p className="font-display font-black uppercase tracking-wider text-[#E50D7E] mb-1">Offers</p>
              <ul className="space-y-0.5">
                {promotions.map((p) => (
                  <li key={p.code}>{p.name}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Category Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs min-h-[34px]">
            {menuStatus === "loading"
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-[30px] w-24 shrink-0 rounded-full bg-[#1A1A1E] animate-pulse" />
                ))
              : categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full font-bold uppercase transition-all whitespace-nowrap ${
                      selectedCategoryId === cat.id
                        ? "bg-[#00FCED]/20 text-[#00FCED] border border-[#00FCED]/60"
                        : "bg-[#1A1A1E] text-zinc-400 border border-[#27272A]"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
          </div>

          {/* Menu Items Feed */}
          <div className="space-y-3">
            {menuStatus === "loading" &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[92px] rounded-2xl bg-[#1A1A1E] border border-[#27272A] animate-pulse" />
              ))}

            {menuStatus === "error" && (
              <div className="p-4 rounded-2xl bg-[#1A1A1E] border border-red-900/60 text-center space-y-2">
                <AlertOctagon className="mx-auto text-red-500" size={28} />
                <p className="text-sm text-white font-bold">We couldn&apos;t load the menu.</p>
                <button onClick={() => void loadMenu()} className="px-4 py-2 rounded-xl bg-[#E50D7E] text-white text-xs font-bold uppercase">
                  Try again
                </button>
              </div>
            )}

            {menuStatus === "ready" &&
              menuItems.map((item) => {
                const qty = cart[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#1A1A1E] border border-[#27272A] flex items-center justify-between gap-3 shadow-md min-h-[92px]"
                  >
                    <img
                      src={item.imageUrl ?? ""}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-[#121214]"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-sm text-white truncate">{item.name}</h3>
                      {item.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{item.description}</p>
                      )}
                      <p className="font-display font-black text-sm text-[#E50D7E] mt-1 font-mono">
                        {formatEuro(item.basePrice, "en")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {qty > 0 && (
                        <>
                          <button
                            onClick={() => changeQty(item.id, -1)}
                            aria-label={`Remove one ${item.name}`}
                            className="w-8 h-8 rounded-xl bg-[#252528] text-white flex items-center justify-center active:scale-95"
                          >
                            <Minus size={16} className="stroke-[3]" />
                          </button>
                          <span className="font-mono font-black text-sm text-white w-4 text-center">{qty}</span>
                        </>
                      )}
                      <button
                        onClick={() => changeQty(item.id, 1)}
                        aria-label={`Add ${item.name}`}
                        className="w-8 h-8 rounded-xl bg-[#E50D7E] text-white flex items-center justify-center shadow active:scale-95"
                      >
                        <Plus size={16} className="stroke-[3]" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </main>
      ) : (
        /* Order Confirmed & Real-Time Tracking Screen */
        <main className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-[#18241D] border-2 border-[#10B981] flex items-center justify-center text-[#10B981] glow-magenta">
            <CheckCircle2 size={48} className="stroke-[2.5]" />
          </div>

          <div>
            <h2 className="font-display font-black text-2xl text-white uppercase">
              Pre-Order Confirmed!
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Order ID: <strong className="font-mono text-white">EMBA-20260815-1423-049</strong>
            </p>
          </div>

          {/* Live Dynamic Kitchen Progress Meter */}
          <div className="w-full bg-[#1A1A1E] p-4 rounded-2xl border border-[#27272A] space-y-3 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-bold">Estimated Ready:</span>
              <span className="font-mono font-black text-[#00FCED] text-sm">~{estimatedPickupMins} mins</span>
            </div>

            <div className="w-full bg-[#27272A] h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-[#E50D7E] to-[#00FCED] h-full w-2/3 animate-pulse" />
            </div>

            <p className="text-[11px] text-zinc-400">
              Station: <strong>Grill Slicing (Rotisserie Chicken)</strong>
            </p>
          </div>

          <button
            onClick={() => setIsOrderPlaced(false)}
            className="w-full py-3.5 rounded-xl bg-[#252528] text-white font-display font-bold text-xs uppercase"
          >
            Start New Mobile Order
          </button>
        </main>
      )}

      {/* Floating Bottom Cart Bar */}
      {!isOrderPlaced && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#1A1A1E]/95 backdrop-blur-md border-t border-[#27272A] p-3.5">
          <button
            onClick={handlePlaceOrder}
            disabled={cartCount === 0}
            className="w-full disabled:opacity-50 py-3.5 px-5 rounded-2xl bg-[#E50D7E] hover:bg-[#C80B6E] text-white font-display font-black text-sm uppercase flex items-center justify-between shadow-xl glow-magenta transition-all active:scale-98"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} />
              <span>{cartCount} Items in Order</span>
            </div>
            <span className="flex flex-col items-end leading-tight">
              {priced.discountTotal > 0 && (
                <span className="font-mono text-[10px] font-bold text-white/80">
                  Offers −{formatEuro(priced.discountTotal, "en")}
                </span>
              )}
              <span className="font-mono font-black text-base">{formatEuro(priced.total, "en")}</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
