"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Thermometer,
  Clock,
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  LogIn,
  LogOut,
  RefreshCw,
  Plus,
} from "lucide-react";
import { HACCPTargetType } from "../haccp.schema";
import { HACCPService } from "../haccp.service";

export const StaffHaccpHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"TIMECLOCK" | "HACCP" | "CHECKLIST">("TIMECLOCK");
  const [locationSlug, setLocationSlug] = useState<"EMBA" | "LIMASSOL">("EMBA");

  // Timeclock State
  const [pin, setPin] = useState<string>("");
  const [staffId, setStaffId] = useState<string>("Alex");
  const [clockMessage, setClockMessage] = useState<string | null>(null);

  // HACCP State
  const [equipment, setEquipment] = useState<string>("Walk-in Fridge #1");
  const [targetType, setTargetType] = useState<HACCPTargetType>("CHILLED");
  const [tempInput, setTempInput] = useState<string>("3.2");
  const [correctiveAction, setCorrectiveAction] = useState<string>("");
  const [haccpLogs, setHaccpLogs] = useState<any[]>([]);

  // Timeclock PIN Press
  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleClearPin = () => setPin("");

  const handleClockIn = async () => {
    if (pin.length !== 4) {
      alert("Please enter a 4-digit PIN.");
      return;
    }
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationSlug,
          staffId,
          pin,
          action: "CLOCK_IN",
          role: "CASHIER",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setClockMessage(`✅ Successfully Clocked In as ${staffId}`);
        setPin("");
      } else {
        alert(data.error || "Clock-in failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClockOut = async () => {
    if (pin.length !== 4) {
      alert("Please enter a 4-digit PIN.");
      return;
    }
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationSlug,
          staffId,
          pin,
          action: "CLOCK_OUT",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setClockMessage(`👋 Successfully Clocked Out (${data.totalMinutes} mins logged)`);
        setPin("");
      } else {
        alert(data.error || "Clock-out failed.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit HACCP Log
  const handleSaveHaccp = async () => {
    const tempNum = parseFloat(tempInput);
    if (isNaN(tempNum)) {
      alert("Please enter a valid temperature.");
      return;
    }

    const validation = HACCPService.validateTemperature(targetType, tempNum);
    if (validation.correctiveActionRequired && !correctiveAction.trim()) {
      alert("CRITICAL: Corrective action note is mandatory when temperature is outside statutory limits!");
      return;
    }

    try {
      const res = await fetch("/api/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationSlug,
          equipmentName: equipment,
          targetType,
          temperature: tempNum,
          loggedBy: staffId,
          correctiveAction: correctiveAction.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`HACCP Record logged. Status: ${validation.isCompliant ? "COMPLIANT" : "BREACH FLAGGED"}`);
        setCorrectiveAction("");
      } else {
        alert(data.error || "Failed to log HACCP record.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans text-white">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#1F1F21] border border-[#3A3A3E] p-4 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#10B981]" />
            <h2 className="font-display font-black text-lg text-white uppercase tracking-tight">
              STAFF OPERATIONS & HACCP CONTROL (M1 / M7)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            EU Regulation (EC) 852/2004 temperature compliance • 4-digit PIN timeclock
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#2B2B2E] p-1 rounded-xl border border-[#3A3A3E] text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab("TIMECLOCK")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "TIMECLOCK" ? "bg-[#E50D7E] text-white shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            PIN TIMECLOCK
          </button>
          <button
            onClick={() => setActiveTab("HACCP")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "HACCP" ? "bg-[#E50D7E] text-white shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            HACCP AUDIT
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "TIMECLOCK" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PIN Pad */}
          <div className="bg-[#1F1F21] border-2 border-[#3A3A3E] rounded-3xl p-6 shadow-2xl flex flex-col items-center">
            <h3 className="font-display font-black text-lg uppercase mb-2">Staff 4-Digit PIN Punch</h3>
            <p className="text-xs text-zinc-400 mb-4">Select your profile and punch your 4-digit secret PIN</p>

            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full max-w-xs bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl px-4 py-2 text-xs font-mono text-white mb-4 focus:outline-none focus:border-[#E50D7E]"
            >
              <option value="Alex">Alex (Shift Supervisor / Line)</option>
              <option value="Kostas">Kostas (Outdoor Grill Master)</option>
              <option value="Elena">Elena (Cashier & Counter)</option>
              <option value="Rico">Rico (Store Owner / Manager)</option>
            </select>

            {/* PIN Display Dots */}
            <div className="flex items-center gap-3 mb-5">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    pin.length > idx
                      ? "bg-[#E50D7E] border-[#E50D7E] scale-110 shadow"
                      : "border-zinc-600 bg-[#2B2B2E]"
                  }`}
                />
              ))}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handlePinDigit(String(num))}
                  className="py-3 rounded-2xl bg-[#2B2B2E] hover:bg-[#343438] active:scale-95 text-white font-mono font-black text-lg border border-[#3A3A3E] shadow transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleClearPin}
                className="py-3 rounded-2xl bg-[#2B2B2E] hover:bg-red-950/40 text-red-400 font-mono font-bold text-xs border border-[#3A3A3E]"
              >
                CLEAR
              </button>
              <button
                onClick={() => handlePinDigit("0")}
                className="py-3 rounded-2xl bg-[#2B2B2E] hover:bg-[#343438] active:scale-95 text-white font-mono font-black text-lg border border-[#3A3A3E]"
              >
                0
              </button>
              <div className="py-3" />
            </div>

            {/* Clock Actions */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-5">
              <button
                onClick={handleClockIn}
                className="py-3 rounded-xl bg-[#10B981] hover:bg-[#0ea372] text-black font-display font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow"
              >
                <LogIn size={14} /> CLOCK IN
              </button>
              <button
                onClick={handleClockOut}
                className="py-3 rounded-xl bg-[#E50D7E] hover:bg-[#d00b72] text-white font-display font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow"
              >
                <LogOut size={14} /> CLOCK OUT
              </button>
            </div>

            {clockMessage && (
              <span className="text-xs font-mono font-bold text-[#00FCED] mt-4 block">
                {clockMessage}
              </span>
            )}
          </div>

          {/* Shift Schedule Info */}
          <div className="bg-[#1F1F21] border border-[#3A3A3E] rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-display font-black text-base uppercase text-white">Today&apos;s Shift Roster</h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Alex (Supervisor)</span>
                  <span className="text-[10px] text-zinc-400">10:00 - 18:00 • Assembly</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>
              <div className="p-3 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Kostas (Grill Master)</span>
                  <span className="text-[10px] text-zinc-400">11:00 - 23:00 • Charcoal Rotisserie</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>
              <div className="p-3 bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Elena (Cashier)</span>
                  <span className="text-[10px] text-zinc-400">12:00 - 20:00 • Counter POS</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                  SCHEDULED
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* HACCP Audit View */
        <div className="bg-[#1F1F21] border-2 border-[#3A3A3E] rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#3A3A3E] pb-3">
            <div>
              <h3 className="font-display font-black text-xl uppercase">Statutory Temperature Audit (EU Reg 852/2004)</h3>
              <p className="text-xs text-zinc-400">
                Log critical storage points: Chilled (0–5°C), Frozen (≤ -18°C), Hot-holding rotisserie (≥ 63°C)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Equipment Selection */}
            <div>
              <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Equipment / Station</label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="w-full bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#E50D7E]"
              >
                <option value="Walk-in Fridge #1">Walk-in Fridge #1 (Chilled 0–5°C)</option>
                <option value="Counter Prep Fridge">Counter Prep Fridge (Chilled 0–5°C)</option>
                <option value="Deep Freeze Chest">Deep Freeze Chest (Frozen ≤ -18°C)</option>
                <option value="Rotisserie Spit Core">Rotisserie Spit Core (Hot-Holding ≥ 63°C)</option>
              </select>
            </div>

            {/* Target Standard */}
            <div>
              <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Standard Type</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#E50D7E]"
              >
                <option value="CHILLED">Chilled Storage (0°C – 5°C)</option>
                <option value="FROZEN">Frozen Storage (≤ -18°C)</option>
                <option value="HOT_HOLDING">Hot-Holding Spit (≥ 63°C)</option>
              </select>
            </div>

            {/* Temperature Input */}
            <div>
              <label className="text-xs font-mono text-zinc-400 uppercase block mb-1.5">Recorded Temperature (°C)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={tempInput}
                  onChange={(e) => setTempInput(e.target.value)}
                  className="w-full bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl px-4 py-2.5 text-sm font-mono font-black text-white focus:outline-none focus:border-[#E50D7E]"
                />
                <button
                  onClick={handleSaveHaccp}
                  className="px-5 py-2.5 rounded-xl bg-[#E50D7E] hover:bg-[#d00b72] text-white font-display font-black text-xs shrink-0"
                >
                  LOG AUDIT
                </button>
              </div>
            </div>
          </div>

          {/* Corrective Action Area (Mandatory if in Danger Zone) */}
          <div>
            <label className="text-xs font-mono text-amber-400 uppercase block mb-1.5">
              Corrective Action Note (Mandatory if temperature in Danger Zone 5°C–63°C):
            </label>
            <input
              type="text"
              placeholder="e.g. Adjusted thermostat dial to 3.0°C; checked seal gasket on fridge door..."
              value={correctiveAction}
              onChange={(e) => setCorrectiveAction(e.target.value)}
              className="w-full bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50D7E]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
