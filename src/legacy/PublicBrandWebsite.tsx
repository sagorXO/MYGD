"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatEuro } from "@/lib/i18n";
import {
  Sparkles,
  Flame,
  Leaf,
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  ChevronRight,
  Tv,
  Store,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  ArrowUpRight,
  UtensilsCrossed,
  Layers,
  ChefHat,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { CategoryDTO, ProductDTO } from "@/types";

export default function PublicBrandWebsite() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [activeLocation, setActiveLocation] = useState<"EMBA" | "LIMASSOL">("EMBA");
  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "POPULAR" | "VEGGIE" | "SPICY">("ALL");

  // Fetch Live Menu from DB
  const fetchMenuCatalog = useCallback(async () => {
    setIsLoadingMenu(true);
    try {
      const res = await fetch(`/api/menu?location=${activeLocation}`);
      const data = await res.json();
      if (data.success && data.categories.length > 0) {
        setCategories(data.categories);
        setActiveCategoryId((prev) => prev || data.categories[0].id);
      }
    } catch (err) {
      console.error("Failed to load live menu catalog:", err);
    } finally {
      setIsLoadingMenu(false);
    }
  }, [activeLocation]);

  useEffect(() => {
    fetchMenuCatalog();
  }, [fetchMenuCatalog]);

  const activeCategory = categories.find((c) => c.id === activeCategoryId);
  const baseProducts = activeCategory?.products || [];
  const filteredProducts = baseProducts.filter((p) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "POPULAR") return p.badge === "POPULAR" || p.badge === "CHEF_CHOICE";
    if (activeFilter === "VEGGIE") return p.isVeggie || p.badge === "VEGGIE" || p.name.toLowerCase().includes("falafel");
    if (activeFilter === "SPICY") return p.isSpicy || p.badge === "SPICY" || (p.description?.toLowerCase().includes("chili") ?? false);
    return true;
  });

  return (
    <div className="min-h-screen bg-[#121214] text-white font-sans selection:bg-[#E50D7E] selection:text-white">
      {/* Top Operations Quick Switcher Banner */}
      <div className="bg-[#1F1F21] border-b border-[#2B2B2E] px-4 py-2 text-xs font-mono text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-zinc-300 font-bold">MYGD OPERATIONS SUITE</span>
            <span className="text-zinc-600">|</span>
            <span className="text-[11px] text-zinc-400">Cyprus Stores Active</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/boards"
              className="px-2.5 py-1 rounded-md bg-[#2B2B2E] text-zinc-300 hover:text-white hover:bg-[#38383C] flex items-center gap-1.5 transition-colors"
            >
              <Tv size={12} className="text-[#00FCED]" />
              <span>4K Menu Boards</span>
            </Link>
            <Link
              href="/admin/menu-boards"
              className="px-2.5 py-1 rounded-md bg-[#2B2B2E] text-zinc-300 hover:text-white hover:bg-[#38383C] flex items-center gap-1.5 transition-colors"
            >
              <Sparkles size={12} className="text-[#E50D7E]" />
              <span>Owner CMS</span>
            </Link>
            <Link
              href="/pos"
              className="px-2.5 py-1 rounded-md bg-[#2B2B2E] text-zinc-300 hover:text-white hover:bg-[#38383C] flex items-center gap-1.5 transition-colors"
            >
              <ShoppingBag size={12} className="text-[#E5A93C]" />
              <span>Cashier POS</span>
            </Link>
            <Link
              href="/kds"
              className="px-2.5 py-1 rounded-md bg-[#2B2B2E] text-zinc-300 hover:text-white hover:bg-[#38383C] flex items-center gap-1.5 transition-colors"
            >
              <ChefHat size={12} className="text-[#10B981]" />
              <span>Kitchen KDS</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-[#121214]/90 backdrop-blur-md border-b border-[#2B2B2E] px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50D7E] to-[#C80B6E] flex items-center justify-center font-display font-black text-white text-lg shadow-lg glow-magenta">
              GD
            </div>
            <div>
              <span className="font-display font-black text-xl tracking-tight text-white uppercase block leading-tight">
                MY GERMAN DÖNER
              </span>
              <span className="text-[11px] font-mono text-[#00FCED] font-bold tracking-wider uppercase block">
                THE FIRST REAL GERMAN DÖNER IN CYPRUS
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 font-mono text-xs uppercase tracking-wider text-zinc-300">
            <a href="#menu" className="hover:text-[#E50D7E] transition-colors">
              Menu & Pricing
            </a>
            <a href="#locations" className="hover:text-[#00FCED] transition-colors">
              Locations
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              Our Story
            </a>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://foody.com.cy"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#E50D7E] text-white font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md glow-magenta hover:scale-105 transition-transform"
            >
              <span>Order on Foody</span>
              <ArrowUpRight size={13} />
            </a>
            <a
              href="https://wolt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex px-3.5 py-2 rounded-xl bg-[#00FCED] text-black font-display font-black text-xs uppercase tracking-wider items-center gap-1.5 shadow-md glow-cyan hover:scale-105 transition-transform"
            >
              <span>Order on Wolt</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 lg:px-8 border-b border-[#2B2B2E]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E50D7E]/15 border border-[#E50D7E]/40 text-[#E50D7E] font-mono text-xs font-black tracking-widest uppercase">
              <Sparkles size={14} />
              AUTHENTIC BERLIN STREET FOOD IN PAPHOS & LIMASSOL
            </div>

            <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl text-white tracking-tight uppercase leading-[0.95]">
              BITE THE <span className="text-[#E50D7E]">HYPE.</span>
            </h1>

            <p className="text-lg text-zinc-300 font-body leading-relaxed max-w-xl">
              Freshly carved veal, beef and chicken rotisserie roasted on open vertical spits.
              Served inside toasted triangle Turkish flatbread with crisp red cabbage, fresh herbs,
              and signature homemade garlic & Kräuter sauces.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#menu"
                className="px-6 py-3.5 rounded-2xl bg-[#E50D7E] text-white font-display font-black text-sm uppercase tracking-wider shadow-lg glow-magenta hover:scale-105 transition-all flex items-center gap-2"
              >
                <UtensilsCrossed size={16} />
                <span>Explore Live Menu</span>
              </a>
              <a
                href="#locations"
                className="px-6 py-3.5 rounded-2xl bg-[#2B2B2E] border border-[#3A3A3E] text-zinc-200 font-display font-bold text-sm uppercase tracking-wider hover:bg-[#38383C] hover:text-white transition-all flex items-center gap-2"
              >
                <MapPin size={16} className="text-[#00FCED]" />
                <span>Find Our Stores</span>
              </a>
            </div>

            {/* Quality Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#2B2B2E]">
              <div>
                <span className="font-display font-black text-2xl text-[#00FCED]">100%</span>
                <span className="block text-xs font-mono text-zinc-400">Halal Certified Meats</span>
              </div>
              <div>
                <span className="font-display font-black text-2xl text-[#E50D7E]">DAILY</span>
                <span className="block text-xs font-mono text-zinc-400">Fresh Baked Bread</span>
              </div>
              <div>
                <span className="font-display font-black text-2xl text-[#E5A93C]">12+</span>
                <span className="block text-xs font-mono text-zinc-400">Homemade Sauces</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border-2 border-[#E50D7E]/40 shadow-2xl glow-magenta aspect-square bg-[#1F1F21]">
              <img
                src="https://images.unsplash.com/photo-1561651823-34feb02250e4?w=1200&auto=format&fit=crop&q=85"
                alt="Classic Berlin German Döner"
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                <span className="px-3.5 py-1.5 rounded-xl bg-[#E50D7E] text-white font-display font-black text-xs uppercase tracking-wider">
                  ORIGINAL BERLIN RECIPE
                </span>
                <span className="font-mono text-xs text-white bg-black/70 backdrop-blur px-3 py-1 rounded-xl">
                  From €7.50
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Menu & Pricing Section */}
      <section id="menu" className="py-16 px-4 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#2B2B2E] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#00FCED] uppercase tracking-wider">
                LIVE RESTAURANT MENU
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs font-mono text-zinc-400">
                Synchronized with Emba & Limassol Kitchens
              </span>
            </div>
            <h2 className="font-display font-black text-4xl sm:text-5xl text-white uppercase tracking-tight mt-1">
              THE MASTER MENU
            </h2>
          </div>

          {/* Location & Dietary Filters */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="flex items-center bg-[#1F1F21] p-1 rounded-xl border border-[#2B2B2E]">
              <button
                onClick={() => setActiveLocation("EMBA")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeLocation === "EMBA"
                    ? "bg-[#E50D7E] text-white shadow glow-magenta"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Emba Flagship
              </button>
              <button
                onClick={() => setActiveLocation("LIMASSOL")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeLocation === "LIMASSOL"
                    ? "bg-[#E50D7E] text-white shadow glow-magenta"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Limassol Marina
              </button>
            </div>

            <div className="flex items-center bg-[#1F1F21] p-1 rounded-xl border border-[#2B2B2E]">
              {(["ALL", "POPULAR", "VEGGIE", "SPICY"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                    activeFilter === filter
                      ? "bg-[#00FCED] text-black shadow glow-cyan font-black"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4 py-2.5 rounded-xl font-display font-bold text-sm uppercase tracking-wider whitespace-nowrap transition-all ${
                activeCategoryId === cat.id
                  ? "bg-[#E50D7E] text-white shadow-lg glow-magenta"
                  : "bg-[#1F1F21] text-zinc-400 hover:text-white border border-[#2B2B2E]"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards Grid with Zero-CLS Skeleton Fallback */}
        {isLoadingMenu ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="rounded-3xl bg-[#1F1F21] border border-[#2B2B2E] p-6 space-y-4 animate-pulse"
              >
                <div className="h-44 bg-zinc-800/60 rounded-2xl" />
                <div className="h-6 bg-zinc-800/80 rounded-lg w-3/4" />
                <div className="h-4 bg-zinc-800/40 rounded-lg w-full" />
                <div className="h-8 bg-zinc-800/60 rounded-xl w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className={`group rounded-3xl bg-[#1F1F21] border overflow-hidden shadow-xl transition-all flex flex-col justify-between ${
                  !prod.isAvailable
                    ? "border-[#E53935]/40 opacity-70"
                    : "border-[#2B2B2E] hover:border-[#E50D7E]/70"
                }`}
              >
                <div>
                  {prod.imageUrl ? (
                    <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                          !prod.isAvailable ? "grayscale" : ""
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1F1F21] via-transparent to-transparent" />

                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        {!prod.isAvailable ? (
                          <span className="px-2.5 py-1 rounded-xl bg-[#E53935] text-white text-[10px] font-display font-black uppercase tracking-wider flex items-center gap-1 shadow">
                            <AlertOctagon size={12} /> SOLD OUT
                          </span>
                        ) : prod.badge ? (
                          <span className="px-2.5 py-1 rounded-xl bg-[#E50D7E] text-white text-[10px] font-display font-black uppercase tracking-wider shadow">
                            {prod.badge}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 bg-zinc-800/40" />
                  )}

                  <div className="p-6 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display font-black text-xl text-white uppercase tracking-tight">
                        {prod.name}
                      </h3>
                      <span className="font-display font-black text-2xl text-[#E50D7E] font-mono shrink-0">
                        {formatEuro(prod.basePrice, "en")}
                      </span>
                    </div>

                    {prod.nameDE && (
                      <span className="text-xs text-zinc-400 font-mono block">
                        {prod.nameDE}
                      </span>
                    )}

                    {prod.description && (
                      <p className="text-sm text-zinc-300 font-body leading-relaxed line-clamp-3">
                        {prod.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-[#2B2B2E]/60 flex items-center justify-between text-xs font-mono text-zinc-400 mt-4">
                  <div className="flex items-center gap-2">
                    {prod.isVeggie && (
                      <span className="flex items-center gap-1 text-[#4CAF50] font-bold">
                        <Leaf size={13} /> Veggie
                      </span>
                    )}
                    {prod.isSpicy && (
                      <span className="flex items-center gap-1 text-[#E53935] font-bold">
                        <Flame size={13} /> Spicy
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-500">Gross Price (VAT incl.)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Multi-Store Location Cards Section */}
      <section id="locations" className="py-16 px-4 lg:px-8 bg-[#18181A] border-t border-[#2B2B2E]">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-[#00FCED] uppercase tracking-wider">
              CYPRUS RESTAURANTS
            </span>
            <h2 className="font-display font-black text-4xl sm:text-5xl text-white uppercase tracking-tight">
              VISIT OUR STORES
            </h2>
            <p className="text-zinc-400 font-body text-sm leading-relaxed">
              Experience authentic German rotisserie dining in Paphos or order direct delivery across Limassol.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Store 01: Emba Flagship */}
            <div className="rounded-3xl bg-[#1F1F21] border-2 border-[#E50D7E]/40 p-8 space-y-6 shadow-xl glow-magenta">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#E50D7E]/20 text-[#E50D7E] font-mono font-black text-xs uppercase">
                  STORE 01 • FLAGSHIP
                </span>
                <span className="flex items-center gap-1.5 text-[#10B981] font-mono text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                  OPEN DAILY
                </span>
              </div>

              <div>
                <h3 className="font-display font-black text-3xl text-white uppercase">
                  Emba (Paphos)
                </h3>
                <p className="text-sm text-zinc-300 font-body mt-2 flex items-start gap-2">
                  <MapPin size={16} className="text-[#00FCED] shrink-0 mt-0.5" />
                  <span>Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Paphos, Cyprus</span>
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs text-zinc-300 pt-4 border-t border-[#2B2B2E]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Clock size={13} /> Hours:
                  </span>
                  <span className="font-bold text-white">11:00 AM – 10:00 PM (Daily)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Phone size={13} /> Phone:
                  </span>
                  <a href="tel:+35799531198" className="font-bold text-[#00FCED] hover:underline">
                    +357 99 531198
                  </a>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <a
                  href="https://foody.com.cy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-xl bg-[#E50D7E] text-white font-display font-black text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow"
                >
                  <span>Order Delivery (Foody)</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Store 02: Limassol Marina */}
            <div className="rounded-3xl bg-[#1F1F21] border-2 border-[#00FCED]/40 p-8 space-y-6 shadow-xl glow-cyan">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#00FCED]/20 text-[#00FCED] font-mono font-black text-xs uppercase">
                  STORE 02 • MARINA
                </span>
                <span className="flex items-center gap-1.5 text-[#00FCED] font-mono text-xs font-bold">
                  DELIVERY-FIRST
                </span>
              </div>

              <div>
                <h3 className="font-display font-black text-3xl text-white uppercase">
                  Limassol Marina
                </h3>
                <p className="text-sm text-zinc-300 font-body mt-2 flex items-start gap-2">
                  <MapPin size={16} className="text-[#00FCED] shrink-0 mt-0.5" />
                  <span>Limassol Marina Commercial Promenade, 3042 Limassol, Cyprus</span>
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs text-zinc-300 pt-4 border-t border-[#2B2B2E]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Clock size={13} /> Hours:
                  </span>
                  <span className="font-bold text-white">11:00 AM – 10:00 PM (Daily)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Phone size={13} /> Phone:
                  </span>
                  <span className="font-bold text-[#00FCED]">+357 99 654321</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <a
                  href="https://wolt.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-xl bg-[#00FCED] text-black font-display font-black text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 shadow"
                >
                  <span>Order Delivery (Wolt)</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2B2B2E] py-12 px-4 lg:px-8 bg-[#121214] text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E50D7E] flex items-center justify-center font-display font-black text-white text-xs">
              GD
            </div>
            <span className="text-zinc-300 font-bold">
              © {new Date().getFullYear()} MY GERMAN DÖNER LTD • All Rights Reserved
            </span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <span>Cyprus Standard & Reduced VAT Compliant</span>
            <span>•</span>
            <span>HACCP Food Safety Certified</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
