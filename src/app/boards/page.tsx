"use client";

import React, { useState, useEffect } from "react";
import { formatEuro } from "@/lib/i18n";
import { Sparkles, Flame, Leaf, Tv, RefreshCw, Clock } from "lucide-react";

interface BoardItem {
  name: string;
  nameDE?: string;
  desc: string;
  price: number;
  badge?: string;
  imageUrl?: string;
  calories?: string;
}

export default function DigitalMenuBoardsPage() {
  const [selectedScreenId, setSelectedScreenId] = useState<number>(2); // Default to Screen 2 (Döner Selection)
  const [currentTime, setCurrentTime] = useState<string>("");
  const [daypart, setDaypart] = useState<"LUNCH" | "DINNER">("LUNCH");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      const hour = now.getHours();
      setDaypart(hour >= 11 && hour < 16 ? "LUNCH" : "DINNER");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const screenConfigs: Record<number, { title: string; subtitle: string; items: BoardItem[] }> = {
    1: {
      title: "BERLIN ROTISSERIE HERO",
      subtitle: "BITE THE HYPE · THE FIRST REAL GERMAN DÖNER IN CYPRUS",
      items: [
        {
          name: "Original German Döner",
          nameDE: "Berliner Original",
          desc: "Fresh rotisserie beef/lamb or chicken, toasted sesame bread, homemade garlic herb sauce",
          price: 6.50,
          badge: "POPULAR",
          imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85",
        },
      ],
    },
    2: {
      title: "DÖNER KEBAB SELECTION",
      subtitle: "100% FRESH GERMAN ROTISSERIE · CARVED TO ORDER",
      items: [
        { name: "Original German Döner (150g)", desc: "Toasted sesame bread, crisp salad, herb garlic sauce", price: 6.50, badge: "POPULAR" },
        { name: "Steak Döner (100% Beef)", desc: "Sliced beef steak, fresh herbs, lemon garlic cream", price: 8.50, badge: "CHEF PICK" },
        { name: "Döner Spezial (Double Meat)", desc: "250g meat load, melted cheddar, grilled onions", price: 9.00, badge: "SPICY" },
        { name: "Veggie Falafel & Halloumi Döner", desc: "Grilled Cyprus halloumi, chickpea falafel, tahini", price: 7.00, badge: "VEGGIE" },
      ],
    },
    3: {
      title: "WRAPS & DÜRÜM",
      subtitle: "ROLLED WARM IN THIN FLATBREAD WITH HOMEMADE SAUCES",
      items: [
        { name: "Standard Dürüm Wrap (150g)", desc: "Warm lavash, rotisserie meat, fresh tomato & parsley", price: 8.00, badge: "TOP SELLER" },
        { name: "Falafel & Halloumi Wrap", desc: "Crispy falafel, grilled halloumi, sesame tahini dip", price: 7.50, badge: "VEGGIE" },
        { name: "Chicken Dürüm Spezial", desc: "Rotisserie chicken, fries inside, garlic chili blend", price: 8.50 },
      ],
    },
    4: {
      title: "BOWLS & DÖNER BOXES",
      subtitle: "OVER CRISPY BERLIN FRIES OR AROMATIC SEASONED RICE",
      items: [
        { name: "Döner Box with Fries", desc: "Crispy fries base topped with sliced meat & garlic sauce", price: 6.50, badge: "POPULAR" },
        { name: "Döner Bowl XL (200g Meat)", desc: "Mixed fries and rice, 200g meat, double sauce dips", price: 11.50, badge: "CHEF CHOICE" },
        { name: "Falafel & Hummus Protein Bowl", desc: "Organic falafel, hummus, salad blend, olives", price: 8.50, badge: "VEGGIE" },
      ],
    },
    5: {
      title: "PIZZA & BURGERS",
      subtitle: "BERLIN FAST-CASUAL FUSION CLASSICS",
      items: [
        { name: "33cm Döner Pizza", desc: "Stone-baked dough, mozzarella, döner meat, garlic herb drizzle", price: 13.50, badge: "NEW" },
        { name: "German Döner Burger", desc: "Brioche bun, rotisserie meat, cheddar, cocktail sauce", price: 7.00, badge: "POPULAR" },
      ],
    },
    6: {
      title: "SIDES & LOADED FRIES",
      subtitle: "GOLDEN CRISPY SKIN-ON FRIES WITH GERMAN PAPRIKA SALT",
      items: [
        { name: "Crispy Berlin Fries", desc: "Skin-on fries seasoned with paprika salt blend", price: 3.50 },
        { name: "Chili-Cheese Loaded Fries", desc: "Melted cheddar sauce, jalapeños, döner beef crumbles", price: 6.00, badge: "SPICY" },
        { name: "Original Berlin Currywurst", desc: "German pork bratwurst in spiced tomato curry sauce", price: 7.50, badge: "BERLIN ICON" },
      ],
    },
    7: {
      title: "DRINKS & MEAL DEALS",
      subtitle: "REFRESHING BEVERAGES & LUNCH COMBO UPGRADES",
      items: [
        { name: "Traditional Salted Ayran (250ml)", desc: "Authentic yoghurt beverage", price: 2.00 },
        { name: "Uludağ Gazoz (330ml)", desc: "Turkish sparkling lemonade", price: 2.50 },
        { name: "Coca-Cola / Zero (330ml)", desc: "Chilled can", price: 2.50 },
        { name: "Make It A Meal Combo (+€3.50)", desc: "Add Berlin Fries + 330ml Drink to any sandwich", price: 3.50, badge: "BEST VALUE" },
      ],
    },
  };

  const currentConfig = screenConfigs[selectedScreenId] || screenConfigs[2];

  return (
    <div className="min-h-screen bg-[#0E0E10] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Channel Selector Bar (For Testing & Switcher) */}
      <div className="bg-[#18181B] border-b border-[#27272A] px-6 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Tv size={16} className="text-[#E50D7E]" />
          <span className="font-display font-black text-sm uppercase">
            M10 DIGITAL MENU BOARD CONTROLLER
          </span>
          <span className="text-zinc-500">• Emba Store (Paphos)</span>
        </div>

        {/* 7-Screen Buttons */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <button
              key={num}
              onClick={() => setSelectedScreenId(num)}
              className={`px-3 py-1 rounded-lg font-bold font-mono text-xs transition-all ${
                selectedScreenId === num
                  ? "bg-[#E50D7E] text-white shadow glow-magenta"
                  : "bg-[#252528] text-zinc-400 hover:text-white"
              }`}
            >
              Screen {num}
            </button>
          ))}
        </div>

        {/* Live Clock & Dayparting */}
        <div className="flex items-center gap-3 font-mono text-zinc-300">
          <span className="px-2 py-0.5 rounded bg-[#252528] text-[#00FCED] font-bold">
            {daypart === "LUNCH" ? "☀️ LUNCH COMBO MODE" : "🌙 DINNER PLATTER MODE"}
          </span>
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-[#E50D7E]" />
            <span>{currentTime}</span>
          </div>
        </div>
      </div>

      {/* Main Overhead Screen Canvas (16:9 1920x1080 Aspect Ratio) */}
      <main className="flex-1 p-8 sm:p-12 flex flex-col justify-between max-w-7xl mx-auto w-full">
        {/* Screen Header */}
        <div className="flex items-center justify-between border-b-2 border-[#E50D7E] pb-6">
          <div>
            <span className="text-xs font-mono font-black tracking-widest text-[#00FCED] uppercase">
              MY GERMAN DÖNER · {currentConfig.subtitle}
            </span>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight uppercase mt-1">
              {currentConfig.title}
            </h1>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E50D7E] to-[#C80B6E] flex items-center justify-center font-display font-black text-white text-2xl shadow-xl glow-magenta">
            GD
          </div>
        </div>

        {/* Product Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-auto py-6">
          {currentConfig.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-6 rounded-3xl bg-[#18181B] border border-[#27272A] shadow-xl hover:border-[#E50D7E]/60 transition-all"
            >
              <div className="space-y-1.5 flex-1 pr-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-2xl text-white uppercase">
                    {item.name}
                  </h3>
                  {item.badge && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E50D7E] text-white text-[10px] font-black uppercase tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">
                  {item.desc}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="font-display font-black text-3xl sm:text-4xl text-[#E50D7E] font-mono tracking-tight">
                  {formatEuro(item.price, "en")}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Screen Bottom Ticker */}
        <div className="flex items-center justify-between pt-6 border-t border-[#27272A] text-xs text-zinc-400 font-mono font-medium">
          <span>✨ 100% Halal Certified Meats · Fresh Baked Bread · Real Berlin Rotisserie</span>
          <span className="text-[#00FCED]">Pavlides Court, Emba (Paphos) • Cyprus</span>
        </div>
      </main>
    </div>
  );
}
