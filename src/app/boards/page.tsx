"use client";

import React, { useState, useEffect } from "react";
import { formatEuro } from "@/lib/i18n";
import {
  Sparkles,
  Flame,
  Leaf,
  Tv,
  Clock,
  Play,
  Pause,
  Maximize,
  CheckCircle2,
  Percent,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BoardItem {
  name: string;
  nameDE?: string;
  desc: string;
  price: number;
  badge?: string;
  badgeColor?: string;
  imageUrl?: string;
  calories?: string;
  isSpicy?: boolean;
  isVeggie?: boolean;
  spiceLevel?: number;
}

export default function DigitalMenuBoardsPage() {
  const [selectedScreenId, setSelectedScreenId] = useState<number>(2); // Default to Screen 2 (Döner Selection)
  const [currentTime, setCurrentTime] = useState<string>("");
  const [daypart, setDaypart] = useState<"LUNCH" | "DINNER">("LUNCH");
  const [isAutoCycle, setIsAutoCycle] = useState<boolean>(false);

  // Live Clock & Dayparting
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      const hour = now.getHours();
      setDaypart(hour >= 11 && hour < 16 ? "LUNCH" : "DINNER");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-Cycle for Monday Presentation
  useEffect(() => {
    if (!isAutoCycle) return;
    const cycleInterval = setInterval(() => {
      setSelectedScreenId((prev) => (prev >= 7 ? 1 : prev + 1));
    }, 8000);
    return () => clearInterval(cycleInterval);
  }, [isAutoCycle]);

  const screenConfigs: Record<
    number,
    {
      title: string;
      subtitle: string;
      categoryBadge: string;
      heroLayout?: boolean;
      items: BoardItem[];
    }
  > = {
    1: {
      title: "BERLIN ROTISSERIE HERO",
      subtitle: "BITE THE HYPE · THE FIRST REAL GERMAN DÖNER IN CYPRUS",
      categoryBadge: "FLAGSHIP ROTISSERIE",
      heroLayout: true,
      items: [
        {
          name: "Original German Döner (150g)",
          nameDE: "Original Berliner Döner Kebab",
          desc: "Freshly carved veal/beef or chicken rotisserie, toasted sesame Fladenbrot, crispy red cabbage, fresh tomatoes, homemade Kräuter & Knoblauch sauces.",
          price: 7.5,
          badge: "BITE THE HYPE",
          badgeColor: "bg-[#E50D7E]",
          imageUrl:
            "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=1200&auto=format&fit=crop&q=85",
        },
      ],
    },
    2: {
      title: "ORIGINAL DÖNER SELECTION",
      subtitle: "100% FRESH GERMAN ROTISSERIE · CARVED TO ORDER",
      categoryBadge: "SANDWICHES",
      items: [
        {
          name: "Original German Döner",
          nameDE: "Classic 150g Meat",
          desc: "Toasted sesame bread, crisp salad, garlic herb sauce",
          price: 7.5,
          badge: "BESTSELLER",
          badgeColor: "bg-[#E50D7E]",
          imageUrl:
            "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85",
        },
        {
          name: "Steak Döner (100% Beef)",
          nameDE: "Premium Cut",
          desc: "Thin-sliced beef steak, fresh herbs, lemon garlic cream",
          price: 9.0,
          badge: "CHEF CHOICE",
          badgeColor: "bg-[#E5A93C]",
          imageUrl:
            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=85",
        },
        {
          name: "Döner Spezial (Double Meat)",
          nameDE: "250g Meat Load",
          desc: "Extra meat load, melted cheddar sauce, grilled onions",
          price: 10.5,
          badge: "🔥 SPICY KICK",
          badgeColor: "bg-[#E53935]",
          isSpicy: true,
          imageUrl:
            "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=85",
        },
        {
          name: "Falafel & Grilled Halloumi",
          nameDE: "Vegetarisch",
          desc: "Crispy chickpea falafel, Cyprus halloumi, sesame tahini",
          price: 7.0,
          badge: "🌱 VEGETARIAN",
          badgeColor: "bg-[#4CAF50]",
          isVeggie: true,
          imageUrl:
            "https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=800&auto=format&fit=crop&q=85",
        },
      ],
    },
    3: {
      title: "WRAPS & DÜRÜM",
      subtitle: "ROLLED WARM IN THIN FLATBREAD WITH HOMEMADE SAUCES",
      categoryBadge: "ROLLED DÜRÜM",
      items: [
        {
          name: "Standard Dürüm Wrap (150g)",
          nameDE: "Berliner Dürüm",
          desc: "Thin lavash flatbread, rotisserie meat, sumac onions, salad",
          price: 8.0,
          badge: "POPULAR",
          badgeColor: "bg-[#E50D7E]",
          imageUrl:
            "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=85",
        },
        {
          name: "Chicken Dürüm Spezial",
          nameDE: "Geflügel Dürüm",
          desc: "Marinated chicken breast, golden fries inside, chili garlic sauce",
          price: 8.5,
          badge: "FRIES INSIDE",
          badgeColor: "bg-[#00FCED] text-black",
          imageUrl:
            "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=85",
        },
        {
          name: "Halloumi & Falafel Dürüm",
          nameDE: "Veggie Wrap",
          desc: "Grilled local halloumi, organic falafel, herbs, tahini dip",
          price: 7.5,
          badge: "🌱 VEGGIE",
          badgeColor: "bg-[#4CAF50]",
          isVeggie: true,
          imageUrl:
            "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=85",
        },
      ],
    },
    4: {
      title: "BOWLS & DÖNER BOXES",
      subtitle: "OVER CRISPY BERLIN FRIES OR AROMATIC SEASONED RICE",
      categoryBadge: "BOXES & BOWLS",
      items: [
        {
          name: "Original Döner Box",
          nameDE: "Mit Pommes",
          desc: "Crispy Berlin fries foundation topped with sliced meat & garlic sauce",
          price: 7.0,
          badge: "TOP SELLER",
          badgeColor: "bg-[#E50D7E]",
          imageUrl:
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85",
        },
        {
          name: "Döner Rice Bowl XL (200g)",
          nameDE: "Teller mit Reis",
          desc: "200g meat load, seasoned Turkish rice, salad, double sauce dips",
          price: 11.5,
          badge: "HIGH PROTEIN",
          badgeColor: "bg-[#E5A93C]",
          imageUrl:
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=85",
        },
        {
          name: "Falafel & Hummus Power Bowl",
          nameDE: "Falafel Teller",
          desc: "4x Falafel patties, creamy hummus, Kalamata olives, sumac salad",
          price: 8.5,
          badge: "🌱 VEGAN",
          badgeColor: "bg-[#4CAF50]",
          isVeggie: true,
          imageUrl:
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=85",
        },
      ],
    },
    5: {
      title: "SPECIALTIES & MEAL COMBOS",
      subtitle: "BERLIN FAST-CASUAL ICONS & BUNDLE DEALS",
      categoryBadge: "ICONS & MEALS",
      items: [
        {
          name: "Original Berlin Currywurst",
          nameDE: "Kult-Currywurst",
          desc: "German pork/beef bratwurst in spiced tomato curry sauce with fries",
          price: 7.5,
          badge: "BERLIN ICON",
          badgeColor: "bg-[#E50D7E]",
          imageUrl:
            "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=85",
        },
        {
          name: "Make It A Meal Combo (+€3.50)",
          nameDE: "Menü Upgrade",
          desc: "Upgrade ANY Döner or Wrap with Crispy Berlin Fries + 330ml Chilled Drink",
          price: 3.5,
          badge: "⭐ BEST VALUE",
          badgeColor: "bg-[#00FCED] text-black",
          imageUrl:
            "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=85",
        },
        {
          name: "German Döner Burger",
          nameDE: "Döner Burger",
          desc: "Toasted brioche, shaved rotisserie meat, melted cheddar, burger sauce",
          price: 7.0,
          badge: "NEW",
          badgeColor: "bg-[#E5A93C]",
          imageUrl:
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85",
        },
      ],
    },
    6: {
      title: "SIDES & SAUCE BAR",
      subtitle: "CRISPY SIDES & HOMEMADE SIGNATURE SAUCES",
      categoryBadge: "SIDES & SAUCES",
      items: [
        {
          name: "Crispy Berlin Fries (Skin-On)",
          nameDE: "Berliner Pommes",
          desc: "Golden fries seasoned with our signature paprika-salt spice blend",
          price: 3.5,
          imageUrl:
            "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=85",
        },
        {
          name: "Chili-Cheese Loaded Fries",
          nameDE: "Käse-Pommes",
          desc: "Warm cheddar cheese sauce, jalapeños, rotisserie beef crumbles",
          price: 6.0,
          badge: "🔥 SPICY",
          badgeColor: "bg-[#E53935]",
          imageUrl:
            "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&auto=format&fit=crop&q=85",
        },
        {
          name: "Grilled Cyprus Halloumi (4 pcs)",
          nameDE: "Gegrillter Halloumi",
          desc: "Authentic grilled Cyprus cheese with fresh oregano and olive oil",
          price: 4.5,
          badge: "CYPRUS SPECIAL",
          badgeColor: "bg-[#00FCED] text-black",
          imageUrl:
            "https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=800&auto=format&fit=crop&q=85",
        },
      ],
    },
    7: {
      title: "DRINKS & HOMEMADE DESSERTS",
      subtitle: "ICE-COLD SODAS, TRADITIONAL AYRAN & FRESH BAKLAVA",
      categoryBadge: "DRINKS & SWEETS",
      items: [
        {
          name: "Traditional Salted Ayran (250ml)",
          nameDE: "Frischer Ayran",
          desc: "Authentic chilled yoghurt drink — the perfect döner companion",
          price: 2.0,
          badge: "DÖNER PAIRING",
          badgeColor: "bg-[#00FCED] text-black",
          imageUrl:
            "https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=85",
        },
        {
          name: "Uludağ Gazoz (330ml Can)",
          nameDE: "Uludağ Gazoz",
          desc: "Famous Turkish sparkling citrus soda",
          price: 2.5,
          imageUrl:
            "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=85",
        },
        {
          name: "Pistachio Baklava (3 pcs)",
          nameDE: "Pistazien Baklava",
          desc: "Handcrafted crispy phyllo pastry, pistachios, honey syrup",
          price: 4.0,
          badge: "SWEET BITE",
          badgeColor: "bg-[#E5A93C]",
          imageUrl:
            "https://images.unsplash.com/photo-1519869325930-281384150729?w=800&auto=format&fit=crop&q=85",
        },
      ],
    },
  };

  const currentConfig = screenConfigs[selectedScreenId] || screenConfigs[2];

  return (
    <div className="min-h-screen bg-[#0E0E10] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Controller Bar */}
      <div className="bg-[#18181B] border-b border-[#27272A] px-6 py-2.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E50D7E] to-[#C80B6E] flex items-center justify-center font-display font-black text-white text-xs shadow">
            GD
          </div>
          <div>
            <span className="font-display font-black text-sm uppercase tracking-wider text-white">
              M10 DIGITAL MENU BOARD CONTROLLER
            </span>
            <span className="text-zinc-500 text-[11px] block">
              Emba Flagship Store (Paphos) • High-Res 16:9 Display Canvas
            </span>
          </div>
        </div>

        {/* 7-Screen Buttons */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((num) => (
            <button
              key={num}
              onClick={() => {
                setSelectedScreenId(num);
                setIsAutoCycle(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold font-mono text-xs transition-all ${
                selectedScreenId === num
                  ? "bg-[#E50D7E] text-white shadow glow-magenta scale-105"
                  : "bg-[#252528] text-zinc-400 hover:text-white"
              }`}
            >
              Screen {num}
            </button>
          ))}
        </div>

        {/* Presentation Controls & Clock */}
        <div className="flex items-center gap-3 font-mono text-zinc-300">
          <button
            onClick={() => setIsAutoCycle(!isAutoCycle)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              isAutoCycle
                ? "bg-[#00FCED] text-black shadow glow-cyan"
                : "bg-[#252528] text-zinc-400 hover:text-white"
            }`}
          >
            {isAutoCycle ? <Pause size={13} /> : <Play size={13} />}
            <span>{isAutoCycle ? "Auto-Cycling (8s)" : "Auto-Cycle"}</span>
          </button>

          <span className="px-2 py-0.5 rounded bg-[#252528] text-[#00FCED] font-bold text-[11px]">
            {daypart === "LUNCH"
              ? "☀️ LUNCH COMBO MODE"
              : "🌙 DINNER PLATTER MODE"}
          </span>

          <div className="flex items-center gap-1">
            <Clock size={14} className="text-[#E50D7E]" />
            <span>{currentTime}</span>
          </div>
        </div>
      </div>

      {/* Main 16:9 Display Canvas */}
      <main className="flex-1 p-6 lg:p-10 flex flex-col justify-between max-w-7xl mx-auto w-full">
        {/* Screen Header */}
        <div className="flex items-center justify-between border-b-2 border-[#E50D7E] pb-5 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black tracking-widest text-[#00FCED] uppercase">
                MY GERMAN DÖNER
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase">
                {currentConfig.subtitle}
              </span>
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight uppercase mt-1">
              {currentConfig.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-[#252528] border border-[#3A3A3E] text-xs font-mono font-bold text-[#E5A93C] uppercase">
              {currentConfig.categoryBadge}
            </span>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E50D7E] to-[#C80B6E] flex items-center justify-center font-display font-black text-white text-2xl shadow-xl glow-magenta">
              GD
            </div>
          </div>
        </div>

        {/* Content View: Hero Screen vs Standard Card Grid */}
        {currentConfig.heroLayout ? (
          /* SCREEN 1: Full-Bleed 16:9 Rotisserie Hero Showcase */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E50D7E]/20 border border-[#E50D7E] text-[#E50D7E] text-xs font-mono font-black tracking-widest uppercase">
                <Sparkles size={14} />
                THE FIRST REAL GERMAN DÖNER IN CYPRUS
              </div>

              <h2 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[0.95] uppercase">
                BITE THE <span className="text-[#E50D7E]">HYPE.</span>
              </h2>

              <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-xl font-body">
                {currentConfig.items[0].desc}
              </p>

              <div className="flex items-center gap-6 pt-2">
                <div className="space-y-1">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                    Starting From
                  </span>
                  <span className="font-display font-black text-5xl sm:text-6xl text-[#E50D7E] font-mono tracking-tight">
                    {formatEuro(currentConfig.items[0].price, "en")}
                  </span>
                </div>

                <div className="h-14 w-px bg-zinc-800" />

                <div className="space-y-1 text-xs font-mono text-zinc-400">
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <CheckCircle2 size={15} className="text-[#10B981]" />
                    <span>100% Halal Certified Meats</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <CheckCircle2 size={15} className="text-[#10B981]" />
                    <span>Fresh Baked Turkish Bread Daily</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <CheckCircle2 size={15} className="text-[#10B981]" />
                    <span>Homemade Garlic & Herb Sauces</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-[#E50D7E]/50 shadow-2xl glow-magenta aspect-square">
                <img
                  src={currentConfig.items[0].imageUrl}
                  alt={currentConfig.items[0].name}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-xl bg-[#E50D7E] text-white font-display font-black text-xs uppercase tracking-wider">
                    {currentConfig.items[0].badge}
                  </span>
                  <span className="font-mono text-xs text-white bg-black/60 backdrop-blur px-3 py-1 rounded-xl">
                    150g Standard Portion
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SCREENS 2 to 7: Large Appetite-Stimulating Product Card Grid */
          <div
            className={`grid gap-6 my-auto py-6 ${
              currentConfig.items.length <= 3
                ? "grid-cols-1 md:grid-cols-3"
                : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {currentConfig.items.map((item, idx) => (
              <div
                key={idx}
                className="group flex flex-col justify-between rounded-3xl bg-[#18181B] border border-[#27272A] overflow-hidden shadow-xl hover:border-[#E50D7E]/80 transition-all hover:shadow-2xl"
              >
                {/* Large Appetizing Food Image */}
                {item.imageUrl && (
                  <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-zinc-900">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#18181B] via-transparent to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      {item.badge && (
                        <span
                          className={`px-3 py-1 rounded-xl text-white text-[11px] font-display font-black uppercase tracking-wider shadow ${
                            item.badgeColor || "bg-[#E50D7E]"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Card Content & Price */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display font-black text-2xl lg:text-3xl text-white uppercase tracking-tight">
                          {item.name}
                        </h3>
                        {item.nameDE && (
                          <span className="text-xs text-zinc-400 font-mono block mt-0.5">
                            {item.nameDE}
                          </span>
                        )}
                      </div>

                      <span className="font-display font-black text-3xl sm:text-4xl text-[#E50D7E] font-mono tracking-tight shrink-0">
                        {formatEuro(item.price, "en")}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-400 leading-relaxed font-body mt-2">
                      {item.desc}
                    </p>
                  </div>

                  {/* Dietary Icons */}
                  <div className="flex items-center gap-3 pt-2 border-t border-[#27272A] text-xs font-mono text-zinc-400">
                    {item.isVeggie && (
                      <span className="flex items-center gap-1 text-[#4CAF50] font-bold">
                        <Leaf size={14} /> Vegetarian Choice
                      </span>
                    )}
                    {item.isSpicy && (
                      <span className="flex items-center gap-1 text-[#E53935] font-bold">
                        <Flame size={14} /> Spicy Heat Available
                      </span>
                    )}
                    <span className="ml-auto text-[11px] text-zinc-500">
                      Cyprus 19% VAT incl.
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Screen Bottom Ticker */}
        <div className="flex items-center justify-between pt-5 border-t border-[#27272A] text-xs text-zinc-400 font-mono font-medium shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-white font-bold">
              ✨ 100% Halal Certified Meats
            </span>
            <span>• Fresh Baked Sesame Bread</span>
            <span>• Homemade Garlic, Herb & Chili Sauces</span>
          </div>

          <div className="flex items-center gap-3 text-[#00FCED]">
            <ShieldCheck size={14} />
            <span>Pavlides Court, Emba (Paphos) • Cyprus</span>
          </div>
        </div>
      </main>
    </div>
  );
}
