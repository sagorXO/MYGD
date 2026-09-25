"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatEuro } from "@/lib/i18n";
import {
  Tv,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Flame,
  Clock,
  RefreshCw,
  Edit2,
  Save,
  X,
  ChevronRight,
  TrendingUp,
  Layers,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import {
  MenuBoardScreenConfig,
  MenuBoardItem,
  CANONICAL_SCREEN_CONFIGS,
  DaypartType,
} from "@/lib/menuboard-engine";

export default function MobileOwnerMenuBoardsCMS() {
  const [configs, setConfigs] = useState<Record<number, MenuBoardScreenConfig>>(CANONICAL_SCREEN_CONFIGS);
  const [selectedScreenNum, setSelectedScreenNum] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editName, setEditName] = useState<string>("");
  const [editBadge, setEditBadge] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch configs
  const fetchConfigs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/menuboards");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.configs)) {
          const map: Record<number, MenuBoardScreenConfig> = {};
          data.configs.forEach((c: any) => {
            const num = c.screenNumber || c.slotId;
            if (num) map[num] = c;
          });
          setConfigs((prev) => ({ ...prev, ...map }));
        }
      }
    } catch (err) {
      console.error("[Owner CMS] Failed to fetch menu board configs:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Real-time listener
  const { isConnected, connectionTier } = useRealtimeEvents({
    channel: "all",
    onEvent: (type, data) => {
      if (type === "MENU_BOARD_UPDATED" && data?.screenNumber && data?.config) {
        setConfigs((prev) => ({
          ...prev,
          [data.screenNumber]: data.config,
        }));
      }
    },
  });

  const currentConfig = configs[selectedScreenNum] || CANONICAL_SCREEN_CONFIGS[selectedScreenNum];

  // 1-Tap Toggle Sold Out
  const toggleSoldOut = async (itemIdx: number) => {
    if (!currentConfig) return;
    const updatedItems = [...currentConfig.items];
    const currentStatus = updatedItems[itemIdx].isSoldOut;
    updatedItems[itemIdx] = {
      ...updatedItems[itemIdx],
      isSoldOut: !currentStatus,
      isAvailable: currentStatus, // Inverse
    };

    // Optimistic UI update
    const updatedConfig = { ...currentConfig, items: updatedItems };
    setConfigs((prev) => ({ ...prev, [selectedScreenNum]: updatedConfig }));

    try {
      const res = await fetch("/api/menuboards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenNumber: selectedScreenNum,
          items: updatedItems,
        }),
      });
      if (res.ok) {
        showToast(
          `${updatedItems[itemIdx].name} is now ${
            !currentStatus ? "SOLD OUT" : "AVAILABLE"
          } on Screen ${selectedScreenNum}`
        );
      }
    } catch (err) {
      console.error("Failed to update item availability:", err);
      fetchConfigs(); // Rollback
    }
  };

  // Quick Edit Price & Details
  const startEditItem = (idx: number, item: MenuBoardItem) => {
    setEditingItemIdx(idx);
    setEditName(item.name);
    setEditPrice(item.price ? item.price.toFixed(2) : "7.50");
    setEditBadge(item.badge || "");
  };

  const saveItemEdit = async () => {
    if (editingItemIdx === null || !currentConfig) return;
    setIsSaving(true);

    const parsedPrice = parseFloat(editPrice) || 0;
    const updatedItems = [...currentConfig.items];
    updatedItems[editingItemIdx] = {
      ...updatedItems[editingItemIdx],
      name: editName,
      price: parsedPrice,
      badge: editBadge || undefined,
    };

    // Optimistic UI update
    const updatedConfig = { ...currentConfig, items: updatedItems };
    setConfigs((prev) => ({ ...prev, [selectedScreenNum]: updatedConfig }));

    try {
      const res = await fetch("/api/menuboards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenNumber: selectedScreenNum,
          items: updatedItems,
        }),
      });
      if (res.ok) {
        showToast(`Updated ${editName} (€${parsedPrice.toFixed(2)}) on Screen ${selectedScreenNum}`);
        setEditingItemIdx(null);
      }
    } catch (err) {
      console.error("Failed to save item edit:", err);
      fetchConfigs();
    } finally {
      setIsSaving(false);
    }
  };

  // Daypart Preset Switcher
  const setDaypart = async (daypart: string) => {
    if (!currentConfig) return;
    const updatedConfig = { ...currentConfig, activeDaypart: daypart };
    setConfigs((prev) => ({ ...prev, [selectedScreenNum]: updatedConfig }));

    try {
      await fetch("/api/menuboards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenNumber: selectedScreenNum,
          activeDaypart: daypart,
        }),
      });
      showToast(`Screen ${selectedScreenNum} set to ${daypart} mode.`);
    } catch (err) {
      console.error("Failed to set daypart:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#1F1F21] text-zinc-100 font-sans pb-16">
      {/* Top Mobile App Header */}
      <header className="sticky top-0 z-30 bg-[#2B2B2E]/95 backdrop-blur-md border-b border-[#3A3A3E] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E50D7E] to-[#C80B6E] flex items-center justify-center font-display font-black text-white text-xs shadow-md glow-magenta">
              GD
            </div>
            <div>
              <h1 className="font-display font-black text-sm uppercase tracking-wide text-white">
                OWNER SIGNAGE CMS
              </h1>
              <span className="text-[10px] font-mono text-zinc-400 block">
                Instant 4K Push (&lt;500ms)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                isConnected
                  ? "bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]"
                  : "bg-[#E53935]/15 border-[#E53935]/40 text-[#E53935]"
              }`}
            >
              {isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
              <span>{connectionTier === "EDGE" ? "EDGE LAN" : isConnected ? "CLOUD SSE" : "OFFLINE"}</span>
            </div>

            <button
              onClick={fetchConfigs}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-[#3A3A3E] text-zinc-300 hover:text-white transition-colors"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin text-[#00FCED]" : ""} />
            </button>
          </div>
        </div>

        {/* 4 Physical Screen Select Tabs */}
        <div className="mt-3 grid grid-cols-4 gap-1.5 font-mono text-xs">
          {[1, 2, 3, 4].map((num) => {
            const isSelected = selectedScreenNum === num;
            return (
              <button
                key={num}
                onClick={() => {
                  setSelectedScreenNum(num);
                  setEditingItemIdx(null);
                }}
                className={`py-2 px-1 rounded-xl font-bold flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? "bg-[#E50D7E] text-white shadow-lg glow-magenta"
                    : "bg-[#1F1F21] text-zinc-400 hover:text-white border border-[#3A3A3E]"
                }`}
              >
                <Tv size={14} className="mb-0.5" />
                <span className="text-[11px] leading-tight">Screen {num}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-4 py-4 max-w-xl mx-auto space-y-4">
        {/* Active Screen Info & Daypart Controls */}
        <div className="bg-[#2B2B2E] border border-[#3A3A3E] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-[#00FCED] tracking-wider">
                Screen {selectedScreenNum} Overview
              </span>
              <h2 className="font-display font-black text-xl text-white uppercase tracking-tight">
                {currentConfig?.title || `Screen ${selectedScreenNum}`}
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#1F1F21] border border-[#3A3A3E] text-[10px] font-mono text-[#E5A93C] font-bold">
              {currentConfig?.layoutType || "PRICE_MATRIX"}
            </span>
          </div>

          {/* Daypart Mode Buttons */}
          <div className="pt-2 border-t border-[#3A3A3E]/60 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-mono">Daypart Schedule:</span>
            <div className="flex items-center gap-1 font-mono text-xs">
              {["AUTO", "LUNCH", "DINNER", "LATE_NIGHT"].map((dp) => (
                <button
                  key={dp}
                  onClick={() => setDaypart(dp)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    (currentConfig?.activeDaypart || "AUTO") === dp
                      ? "bg-[#00FCED] text-black font-black shadow glow-cyan"
                      : "bg-[#1F1F21] text-zinc-400 hover:text-white"
                  }`}
                >
                  {dp}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Items Quick Control List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Menu Items ({currentConfig?.items?.length || 0})
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              Tap toggle for instant 4K push
            </span>
          </div>

          {currentConfig?.items?.map((item, idx) => {
            const isEditing = editingItemIdx === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  item.isSoldOut
                    ? "bg-[#1F1F21]/80 border-[#E53935]/40 opacity-80"
                    : "bg-[#2B2B2E] border-[#3A3A3E] hover:border-[#E50D7E]/50"
                }`}
              >
                {/* Standard View */}
                {!isEditing ? (
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className={`w-12 h-12 rounded-xl object-cover shrink-0 ${
                            item.isSoldOut ? "grayscale" : ""
                          }`}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold shrink-0">
                          GD
                        </div>
                      )}

                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-display font-bold text-base text-white truncate">
                            {item.name}
                          </h3>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded bg-[#E50D7E] text-white text-[9px] font-black uppercase shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span className="font-display font-black text-sm text-[#00FCED] font-mono">
                          {formatEuro(item.price || 0, "en")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Edit Button */}
                      <button
                        onClick={() => startEditItem(idx, item)}
                        className="p-2 rounded-xl bg-[#1F1F21] text-zinc-400 hover:text-white border border-[#3A3A3E] transition-colors"
                        title="Edit price/name"
                      >
                        <Edit2 size={15} />
                      </button>

                      {/* 1-Tap Sold Out Toggle Button */}
                      <button
                        onClick={() => toggleSoldOut(idx)}
                        className={`px-3 py-2 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow ${
                          item.isSoldOut
                            ? "bg-[#E53935] text-white glow-red animate-pulse"
                            : "bg-[#10B981] text-black font-bold glow-green"
                        }`}
                      >
                        {item.isSoldOut ? (
                          <>
                            <AlertOctagon size={14} />
                            <span>SOLD OUT</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            <span>IN STOCK</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Edit Drawer View */
                  <div className="p-4 bg-[#1F1F21] space-y-3 border-t-2 border-[#E50D7E]">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-black text-sm text-white uppercase">
                        Edit Item Details
                      </span>
                      <button
                        onClick={() => setEditingItemIdx(null)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-2 font-mono text-xs">
                      <div>
                        <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                          Product Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-[#E50D7E]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                            Gross Price (€ EUR)
                          </label>
                          <input
                            type="number"
                            step="0.10"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-full bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00FCED]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                            Promo Badge
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. POPULAR"
                            value={editBadge}
                            onChange={(e) => setEditBadge(e.target.value)}
                            className="w-full bg-[#2B2B2E] border border-[#3A3A3E] rounded-xl px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-[#E5A93C]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingItemIdx(null)}
                        className="px-3 py-2 rounded-xl bg-[#2B2B2E] text-zinc-400 text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveItemEdit}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-xl bg-[#E50D7E] text-white font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow glow-magenta"
                      >
                        <Save size={14} />
                        <span>{isSaving ? "Saving..." : "Save & Push to 4K"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Push Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 bg-[#1F1F21] border-2 border-[#00FCED] p-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-[#00FCED]/20 text-[#00FCED] flex items-center justify-center shrink-0">
            <Zap size={18} />
          </div>
          <span className="font-mono text-xs text-white font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
