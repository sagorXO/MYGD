"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";

export default function MobilePreOrderPage() {
  const [orderChannel, setOrderChannel] = useState<"COUNTER_PICKUP" | "DRIVE_THROUGH">("DRIVE_THROUGH");
  const [vehicleInfo, setVehicleInfo] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("DOENER");
  const [cartCount, setCartCount] = useState<number>(2);
  const [isOrderPlaced, setIsOrderPlaced] = useState<boolean>(false);

  // Dynamic Wait Calculation based on simulated active KDS queue
  const activeKdsTickets = 4;
  const estimatedPickupMins = 4 + Math.round(activeKdsTickets * 1.2);

  const menuItems = [
    {
      id: "ord-1",
      name: "Hamburg Doener",
      desc: "Rotisserie beef, salad, tomato, cucumber, onions, red cabbage (Ketchup, Mayo, Mustard)",
      price: 6.90,
      badge: "POPULAR",
      category: "DOENER",
      imageUrl: "/assets/menu/products/hamburg-doener.jpg",
      allowMealUpgrade: true,
    },
    {
      id: "ord-2",
      name: "Chicken Doener",
      desc: "Juicy chicken doener, salad, tomato, cucumber, onions, red cabbage (Ketchup, Mayo)",
      price: 6.90,
      badge: "BESTSELLER",
      category: "DOENER",
      imageUrl: "/assets/menu/products/chicken-doener.webp",
      allowMealUpgrade: true,
    },
    {
      id: "ord-3",
      name: "Beef Wrap",
      desc: "Toasted lavash flatbread, beef doener, fresh salad, cocktail sauce",
      price: 9.90,
      badge: "TOP_SELLER",
      category: "WRAPS",
      imageUrl: "/assets/menu/products/beef-wrap.jpg",
      allowMealUpgrade: true,
    },
    {
      id: "ord-4",
      name: "Big B (Original Berlin Flatbread)",
      desc: "Massive triangular flatbread packed with extra beef doener, salad & cocktail sauce",
      price: 11.90,
      badge: "CHEF PICK",
      category: "DOENER",
      imageUrl: "/assets/menu/products/big-b-doener.jpg",
      allowMealUpgrade: true,
    },
    {
      id: "ord-5",
      name: "Beef Bowl",
      desc: "Rotisserie beef, white rice or crunchy fries, fresh salad and choice of sauce",
      price: 9.90,
      category: "BOWLS",
      imageUrl: "/assets/menu/products/doener-bowl.jpg",
      allowMealUpgrade: true,
    },
    {
      id: "ord-6",
      name: "Chicken Doener Pizza (33cm)",
      desc: "Stone-baked thin crust, mozzarella, roasted chicken doener, onions, garlic sauce spiral",
      price: 17.90,
      badge: "BESTSELLER",
      category: "PIZZAS",
      imageUrl: "/assets/menu/products/chicken-doener-pizza.jpg",
      allowMealUpgrade: false,
    },
    {
      id: "ord-7",
      name: "Crispy Beef Taco",
      desc: "Crunchy taco shell, seasoned beef, lettuce, tomato, cabbage, BBQ sauce",
      price: 3.50,
      category: "TACOS",
      imageUrl: "/assets/menu/products/beef-taco.jpg",
      allowMealUpgrade: true,
    },
    {
      id: "ord-8",
      name: "Cheesy Loaded Fries",
      desc: "Crispy skin-on fries smothered in rich cheddar cheese sauce, roasted bits & herbs",
      price: 7.90,
      badge: "POPULAR",
      category: "SIDES",
      imageUrl: "/assets/menu/products/cheesy-fries.jpg",
      allowMealUpgrade: false,
    },
    {
      id: "ord-9",
      name: "Crunchy Fries",
      desc: "Skin-on golden fries with German paprika sea salt seasoning",
      price: 2.50,
      category: "SIDES",
      imageUrl: "/assets/menu/products/crunchy-fries.webp",
      allowMealUpgrade: false,
    },
    {
      id: "ord-10",
      name: "Authentic Ayran (0.5L)",
      desc: "Chilled Turkish salted yogurt beverage",
      price: 3.50,
      badge: "BESTSELLER",
      category: "DRINKS",
      imageUrl: "/assets/menu/products/water-ayran.webp",
      allowMealUpgrade: false,
    },
  ];

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

          {/* Category Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
            {["ALL", "DOENER", "WRAPS", "BOWLS", "PIZZAS", "TACOS", "SIDES", "DRINKS"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full font-bold uppercase transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-[#00FCED]/20 text-[#00FCED] border border-[#00FCED]/60"
                    : "bg-[#1A1A1E] text-zinc-400 border border-[#27272A]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Items Feed */}
          <div className="space-y-3">
            {menuItems
              .filter((item) => selectedCategory === "ALL" || item.category === selectedCategory)
              .map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#1A1A1E] border border-[#27272A] flex flex-col gap-2.5 shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display font-bold text-sm text-white truncate">{item.name}</h3>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-[#E50D7E] text-white text-[9px] font-black uppercase">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{item.desc}</p>
                      <p className="font-display font-black text-sm text-[#E50D7E] mt-1 font-mono">
                        {formatEuro(item.price, "en")}
                      </p>
                    </div>
                    <button
                      onClick={() => setCartCount((c) => c + 1)}
                      className="w-8 h-8 rounded-xl bg-[#E50D7E] text-white flex items-center justify-center shadow active:scale-95 shrink-0"
                    >
                      <Plus size={16} className="stroke-[3]" />
                    </button>
                  </div>

                  {/* Make It A Menu with Ingredient Images */}
                  {item.allowMealUpgrade && (
                    <div className="pt-2 border-t border-[#27272A] flex items-center justify-between bg-[#121214]/60 p-2 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#E50D7E] uppercase">
                          Make It A Menu (+€3.00):
                        </span>
                        <div className="flex items-center gap-1">
                          <img
                            src="/assets/menu/upgrade/fries.jpg"
                            alt="Fries"
                            title="Crispy Fries"
                            className="w-6 h-6 rounded object-cover border border-[#27272A]"
                          />
                          <span className="text-[9px] text-zinc-400">or</span>
                          <img
                            src="/assets/menu/upgrade/rice.jpg"
                            alt="Rice"
                            title="Steamed Rice"
                            className="w-6 h-6 rounded object-cover border border-[#27272A]"
                          />
                          <span className="text-[9px] text-zinc-400">+</span>
                          <img
                            src="/assets/menu/upgrade/drink.jpg"
                            alt="0.4L Drink"
                            title="0.4L Drink"
                            className="w-6 h-6 rounded object-cover border border-[#27272A]"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => setCartCount((c) => c + 1)}
                        className="text-[10px] font-mono font-bold bg-[#E50D7E]/20 text-[#E50D7E] border border-[#E50D7E]/40 px-2 py-0.5 rounded-lg hover:bg-[#E50D7E] hover:text-white transition-colors"
                      >
                        + Add Meal
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
            className="w-full py-3.5 px-5 rounded-2xl bg-[#E50D7E] hover:bg-[#C80B6E] text-white font-display font-black text-sm uppercase flex items-center justify-between shadow-xl glow-magenta transition-all active:scale-98"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} />
              <span>{cartCount} Items in Order</span>
            </div>
            <span className="font-mono font-black text-base">{formatEuro(14.50, "en")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
