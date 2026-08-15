"use client";

import React, { useState } from "react";
import {
  ClipboardCheck,
  Clock,
  BookOpen,
  Thermometer,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Utensils,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Calendar,
  Lock,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChecklistItem {
  id: string;
  title: string;
  category: "OPENING" | "LUNCH_PREP" | "CLOSING" | "HACCP";
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
  isTempCheck?: boolean;
  targetTemp?: string;
  loggedTemp?: string;
}

interface BuildSheet {
  id: string;
  name: string;
  sku: string;
  meatWeight: string;
  breadType: string;
  steps: string[];
  imageUrl: string;
  sauceSequence: string;
}

export default function StaffHubPage() {
  const [activeTab, setActiveTab] = useState<"CHECKLISTS" | "TIMECLOCK" | "BUILD_SHEETS">("CHECKLISTS");
  const [activeChecklistFilter, setActiveChecklistFilter] = useState<"OPENING" | "LUNCH_PREP" | "CLOSING" | "HACCP">("OPENING");

  // Checklists State (M1)
  const [checklists, setChecklists] = useState<ChecklistItem[]>([
    { id: "chk-1", title: "Unlock store & disarm security alarm", category: "OPENING", isCompleted: true, completedBy: "Alex (Opener)", completedAt: "08:32" },
    { id: "chk-2", title: "Power on rotisserie skewer burners (Beef/Lamb & Chicken)", category: "OPENING", isCompleted: true, completedBy: "Alex (Opener)", completedAt: "08:45" },
    { id: "chk-3", title: "Walk-in Raw Meat Fridge Temperature Check", category: "HACCP", isCompleted: true, isTempCheck: true, targetTemp: "< 4.0°C", loggedTemp: "3.1°C", completedBy: "Alex (Opener)", completedAt: "08:50" },
    { id: "chk-4", title: "Sauce & Salad Cold Well Temperature Check", category: "HACCP", isCompleted: false, isTempCheck: true, targetTemp: "< 5.0°C", loggedTemp: "" },
    { id: "chk-5", title: "Calibrate potato fryers to 175°C", category: "OPENING", isCompleted: true, completedBy: "Marco (Lead)", completedAt: "09:10" },
    { id: "chk-6", title: "Inspect fresh Turkish Fladenbrot delivery (150 pcs)", category: "OPENING", isCompleted: false },
    { id: "chk-7", title: "Fill squeeze bottles with homemade Kräuter & Knoblauch sauces", category: "LUNCH_PREP", isCompleted: false },
    { id: "chk-8", title: "Slice 5kg fresh red cabbage, tomatoes, cucumbers & parsley", category: "LUNCH_PREP", isCompleted: false },
    { id: "chk-9", title: "Deep clean skewer rotisserie drip pans & burners", category: "CLOSING", isCompleted: false },
    { id: "chk-10", title: "Print Daily Z-Report & lock cash drop in safe", category: "CLOSING", isCompleted: false },
  ]);

  // Timeclock State (M7)
  const [pinInput, setPinInput] = useState<string>("");
  const [clockedInStaff, setClockedInStaff] = useState<
    Array<{ id: string; name: string; role: string; clockInTime: string; hoursWorked: string }>
  >([
    { id: "stf-1", name: "Alex Mueller", role: "SLICER (Döner Cutter)", clockInTime: "08:30", hoursWorked: "4h 15m" },
    { id: "stf-2", name: "Elena Vassiliou", role: "ASSEMBLY & SALAD", clockInTime: "09:00", hoursWorked: "3h 45m" },
    { id: "stf-3", name: "Christos K.", role: "CASHIER (Till #01)", clockInTime: "10:00", hoursWorked: "2h 45m" },
  ]);
  const [clockMessage, setClockMessage] = useState<string | null>(null);

  // Build Sheets (M8)
  const buildSheets: BuildSheet[] = [
    {
      id: "bs-1",
      name: "Original German Döner (Standard 150g)",
      sku: "MYGD-DON-01",
      meatWeight: "150g Sliced Rotisserie Meat",
      breadType: "Crispy Turkish Fladenbrot",
      imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85",
      sauceSequence: "Bottom: Knoblauch (Garlic) ➔ Top: Kräuter (Herb) + Optional Scharf (Chili)",
      steps: [
        "Toast Turkish Fladenbrot in clamshell grill for 45s until golden and crispy.",
        "Spread 1 generous stroke of homemade Knoblauch (Garlic) sauce along the bottom bread layer.",
        "Add 40g fresh shredded red cabbage and crisp iceberg lettuce foundation.",
        "Layer 150g freshly carved hot rotisserie meat (checked on kitchen scale).",
        "Add 3 ripe tomato half-slices, cucumber ribbons, and fresh chopped parsley.",
        "Top with Kräuter (Herb) sauce and chili spice level to customer specification.",
        "Slide into branded MY GERMAN DÖNER triangle paper sleeve.",
      ],
    },
    {
      id: "bs-2",
      name: "Standard Dürüm Wrap (150g)",
      sku: "MYGD-WRP-01",
      meatWeight: "150g Sliced Rotisserie Meat",
      breadType: "Warm Thin Lavash Flatbread",
      imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=85",
      sauceSequence: "Even stripe of Kräuter & Knoblauch down center line",
      steps: [
        "Warm lavash flatbread on flat grill for 15s to make pliable.",
        "Spread sauces evenly down the center 1/3 of the flatbread.",
        "Add 150g freshly carved rotisserie meat in an even cylinder line.",
        "Top with shredded cabbage, tomatoes, onions, and fresh mint/parsley.",
        "Tightly tuck bottom flap, roll tightly into a cylindrical wrap, and toast exterior 20s.",
        "Wrap bottom half in branded aluminum foil sleeve.",
      ],
    },
    {
      id: "bs-3",
      name: "Döner Box / Bowl with Fries",
      sku: "MYGD-BWL-01",
      meatWeight: "150g Sliced Meat",
      breadType: "No Bread (Base: 150g Berlin Fries)",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85",
      sauceSequence: "Double drizzle over fries + top meat layer",
      steps: [
        "Drop fresh Berlin fries into branded Döner Box (fill 50% height).",
        "Season fries with signature paprika-salt blend.",
        "Drizzle 1 stroke of Garlic or Cocktail sauce over the fries.",
        "Top with 150g hot rotisserie meat.",
        "Add side scoop of mixed red cabbage and tomato salad.",
        "Drizzle top sauce and serve with wooden fork.",
      ],
    },
  ];
  const [selectedBuildSheet, setSelectedBuildSheet] = useState<BuildSheet>(buildSheets[0]);

  // Toggle Checklist Item
  const handleToggleChecklist = (id: string) => {
    setChecklists((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.isCompleted;
          return {
            ...item,
            isCompleted: nextState,
            completedBy: nextState ? "Current Staff" : undefined,
            completedAt: nextState ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
          };
        }
        return item;
      })
    );
  };

  // Clock In Action
  const handleClockAction = (type: "IN" | "OUT" | "BREAK") => {
    if (pinInput.length < 4) {
      setClockMessage("Please enter your 4-digit staff PIN.");
      return;
    }
    const nameMap: Record<string, { name: string; role: string }> = {
      "1111": { name: "Christos K.", role: "CASHIER (Till #01)" },
      "1234": { name: "Marco S.", role: "STORE MANAGER" },
      "0000": { name: "Alex Mueller", role: "SLICER (Döner Cutter)" },
      "9999": { name: "Rico & Oli", role: "HQ OWNER" },
    };
    const matched = nameMap[pinInput] || { name: "Store Crew", role: "FLOOR CREW" };
    setClockMessage(`✅ ${matched.name} (${matched.role}) successfully clocked ${type} at ${new Date().toLocaleTimeString()}!`);
    setPinInput("");
  };

  return (
    <div className="min-h-screen bg-[#121214] text-white flex flex-col font-sans select-none">
      {/* Top Staff Tablet Header */}
      <header className="h-16 bg-[#1A1A1E] border-b border-[#27272A] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E50D7E] to-[#C80B6E] flex items-center justify-center font-display font-black text-white text-base shadow">
            GD
          </div>
          <div>
            <span className="font-display font-black text-base tracking-wider uppercase">
              MY GERMAN DÖNER · <span className="text-[#E50D7E]">STAFF & TRAINING HUB</span>
            </span>
            <span className="text-xs text-zinc-400 font-mono block">
              Wall Tablet Station • Emba Flagship Store (Paphos)
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#252528] border border-[#333336] rounded-xl p-1">
          <button
            onClick={() => setActiveTab("CHECKLISTS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-display font-bold text-xs uppercase transition-all ${
              activeTab === "CHECKLISTS"
                ? "bg-[#E50D7E] text-white shadow glow-magenta"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ClipboardCheck size={16} />
            <span>M1: Checklists</span>
          </button>

          <button
            onClick={() => setActiveTab("TIMECLOCK")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-display font-bold text-xs uppercase transition-all ${
              activeTab === "TIMECLOCK"
                ? "bg-[#E50D7E] text-white shadow glow-magenta"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Clock size={16} />
            <span>M7: Timeclock</span>
          </button>

          <button
            onClick={() => setActiveTab("BUILD_SHEETS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-display font-bold text-xs uppercase transition-all ${
              activeTab === "BUILD_SHEETS"
                ? "bg-[#E50D7E] text-white shadow glow-magenta"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <BookOpen size={16} />
            <span>M8: Build Sheets</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* TAB 1: M1 CHECKLISTS & LOGBOOK */}
        {activeTab === "CHECKLISTS" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Checklist Category Filter Bar */}
            <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
              <div className="flex items-center gap-2">
                {[
                  { id: "OPENING", label: "🌅 Opening Crew (08:30)", count: "3/4" },
                  { id: "LUNCH_PREP", label: "🥪 Lunch Prep (11:30)", count: "0/2" },
                  { id: "HACCP", label: "🌡️ Food Safety / Temps", count: "1/2" },
                  { id: "CLOSING", label: "🌙 Closing Shift (23:00)", count: "0/2" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChecklistFilter(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeChecklistFilter === tab.id
                        ? "bg-[#2A2A2E] text-[#00FCED] border border-[#00FCED]/40 shadow"
                        : "bg-[#1A1A1E] text-zinc-400 hover:text-white border border-[#27272A]"
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist Task Items */}
            <div className="space-y-3">
              {checklists
                .filter((item) =>
                  activeChecklistFilter === "HACCP"
                    ? item.isTempCheck
                    : item.category === activeChecklistFilter
                )
                .map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleChecklist(task.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      task.isCompleted
                        ? "bg-[#18241D] border-[#10B981]/50 text-white"
                        : "bg-[#1A1A1E] border-[#27272A] hover:border-zinc-500 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center border ${
                          task.isCompleted
                            ? "bg-[#10B981] border-[#10B981] text-black"
                            : "border-zinc-600 bg-[#252528]"
                        }`}
                      >
                        {task.isCompleted && <CheckCircle2 size={18} className="stroke-[3]" />}
                      </div>

                      <div>
                        <p className={`font-semibold text-sm ${task.isCompleted ? "line-through text-zinc-400" : "text-white"}`}>
                          {task.title}
                        </p>
                        {task.isTempCheck && (
                          <div className="flex items-center gap-2 text-xs text-[#00FCED] font-mono mt-0.5">
                            <Thermometer size={13} />
                            <span>Target: {task.targetTemp}</span>
                            {task.loggedTemp && <span>• Logged: {task.loggedTemp}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {task.isCompleted && task.completedBy && (
                      <div className="text-right text-xs text-zinc-400 font-mono">
                        <span>Done by {task.completedBy}</span>
                        <span className="block text-[10px] text-zinc-500">{task.completedAt}</span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 2: M7 TIMECLOCK & SHIFTS */}
        {activeTab === "TIMECLOCK" && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* PIN Entry Keypad (Left 5 Cols) */}
            <div className="md:col-span-5 bg-[#1A1A1E] p-6 rounded-3xl border border-[#27272A] space-y-4">
              <h3 className="font-display font-black text-lg text-white uppercase flex items-center gap-2">
                <Lock size={18} className="text-[#E50D7E]" />
                Staff PIN Clock-In
              </h3>

              {/* PIN Display */}
              <div className="h-14 bg-[#121214] border border-[#27272A] rounded-2xl flex items-center justify-center font-mono font-black text-2xl tracking-[0.5em] text-[#00FCED]">
                {pinInput ? "•".repeat(pinInput.length) : "ENTER PIN"}
              </div>

              {/* Number Keypad */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "⌫"].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => {
                      if (btn === "C") setPinInput("");
                      else if (btn === "⌫") setPinInput((p) => p.slice(0, -1));
                      else if (typeof btn === "number" && pinInput.length < 6)
                        setPinInput((p) => p + btn);
                    }}
                    className="h-12 rounded-xl bg-[#252528] hover:bg-[#303034] text-white font-mono font-bold text-lg active:scale-95 transition-all"
                  >
                    {btn}
                  </button>
                ))}
              </div>

              {/* Action Keys */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => handleClockAction("IN")}
                  className="py-3 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-black font-display font-black text-xs uppercase tracking-wider"
                >
                  Clock In
                </button>
                <button
                  onClick={() => handleClockAction("BREAK")}
                  className="py-3 rounded-xl bg-[#E5A93C] hover:bg-amber-600 text-black font-display font-black text-xs uppercase tracking-wider"
                >
                  Break
                </button>
                <button
                  onClick={() => handleClockAction("OUT")}
                  className="py-3 rounded-xl bg-[#EF4444] hover:bg-red-600 text-white font-display font-black text-xs uppercase tracking-wider"
                >
                  Clock Out
                </button>
              </div>

              {clockMessage && (
                <p className="text-xs font-bold text-[#00FCED] bg-[#121214] p-3 rounded-xl border border-[#27272A]">
                  {clockMessage}
                </p>
              )}
            </div>

            {/* Active On-Duty Crew (Right 7 Cols) */}
            <div className="md:col-span-7 bg-[#1A1A1E] p-6 rounded-3xl border border-[#27272A] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-lg text-white uppercase">
                  Currently Clocked-In Crew (3 Active)
                </h3>
                <span className="text-xs font-mono text-[#10B981] bg-[#10B981]/15 px-2.5 py-1 rounded-full font-bold">
                  Emba Store #01
                </span>
              </div>

              <div className="space-y-3">
                {clockedInStaff.map((stf) => (
                  <div
                    key={stf.id}
                    className="p-4 rounded-2xl bg-[#252528] border border-[#333336] flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white">{stf.name}</h4>
                      <p className="text-xs text-[#00FCED] font-mono mt-0.5">{stf.role}</p>
                    </div>
                    <div className="text-right text-xs font-mono text-zinc-400">
                      <span>In at {stf.clockInTime}</span>
                      <span className="block text-white font-bold">{stf.hoursWorked} worked</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: M8 McDONALD'S-STYLE BUILD SHEETS */}
        {activeTab === "BUILD_SHEETS" && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Products Selector (4 Cols) */}
            <div className="md:col-span-4 space-y-3">
              <h3 className="font-display font-black text-sm uppercase tracking-wider text-zinc-400">
                Select Product Build Guide
              </h3>

              {buildSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  onClick={() => setSelectedBuildSheet(sheet)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                    selectedBuildSheet.id === sheet.id
                      ? "bg-[#252528] border-[#E50D7E] shadow glow-magenta"
                      : "bg-[#1A1A1E] border-[#27272A] hover:border-zinc-500"
                  }`}
                >
                  <img src={sheet.imageUrl} alt={sheet.name} className="w-14 h-14 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-display font-bold text-sm text-white">{sheet.name}</h4>
                    <p className="text-[11px] text-[#00FCED] font-mono">{sheet.meatWeight}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Step-by-Step Assembly Sheet (8 Cols) */}
            <div className="md:col-span-8 bg-[#1A1A1E] p-6 rounded-3xl border border-[#27272A] space-y-5">
              <div className="flex items-start justify-between border-b border-[#27272A] pb-4">
                <div>
                  <h3 className="font-display font-black text-2xl text-white uppercase">
                    {selectedBuildSheet.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mt-1">
                    <span>Meat: <strong className="text-white">{selectedBuildSheet.meatWeight}</strong></span>
                    <span>• Bread: <strong className="text-white">{selectedBuildSheet.breadType}</strong></span>
                  </div>
                </div>
                <img
                  src={selectedBuildSheet.imageUrl}
                  alt={selectedBuildSheet.name}
                  className="w-20 h-20 rounded-2xl object-cover border border-[#333336]"
                />
              </div>

              {/* Sauce Rule Callout */}
              <div className="p-3.5 rounded-2xl bg-[#2A1E27] border border-[#E50D7E]/40 text-xs text-white">
                <span className="font-bold text-[#E50D7E] uppercase block">Sauce Dosing Sequence:</span>
                <span className="mt-0.5 block">{selectedBuildSheet.sauceSequence}</span>
              </div>

              {/* Steps List */}
              <div className="space-y-3">
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-400">
                  Step-by-Step Kitchen Assembly Sequence
                </h4>
                {selectedBuildSheet.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-3.5 p-3 rounded-xl bg-[#252528] border border-[#333336]">
                    <span className="w-6 h-6 rounded-full bg-[#E50D7E] text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-zinc-200 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
