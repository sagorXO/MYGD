"use client";

import React, { useState, useEffect } from "react";
import { useKioskStore } from "@/store/kioskStore";
import type { PrinterType } from "@/types";
import { formatEuro } from "@/lib/i18n";
import { X, Lock, Printer, Sliders, Store, Check, RefreshCw, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshMenu?: () => void;
}

export function AdminModal({ isOpen, onClose, onRefreshMenu }: AdminModalProps) {
  const { locationSlug, terminalCode, printerType, setPrinterType, setLocationSlug } = useKioskStore();

  const [pin, setPin] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"MENU" | "PRINTER" | "STORE">("MENU");

  // Admin Data
  const [adminMenuData, setAdminMenuData] = useState<{
    categories: {
      id: string;
      name: string;
      products: {
        id: string;
        name: string;
        basePrice: number;
        isAvailable: boolean;
      }[];
    }[];
    locations: { id: string; slug: string; name: string }[];
  } | null>(null);

  const [isLoadingMenu, setIsLoadingMenu] = useState<boolean>(false);
  const [printerStatusMessage, setPrinterStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPin("");
      setIsAuthenticated(false);
      setAuthError(null);
    }
  }, [isOpen]);

  const handleKeypadPress = (val: string) => {
    if (pin.length < 6) {
      setPin((p) => p + val);
    }
  };

  const handleKeypadClear = () => {
    setPin("");
    setAuthError(null);
  };

  const handleLogin = async () => {
    if (!pin) return;
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Invalid PIN");
      }

      setIsAuthenticated(true);
      setAuthError(null);
      fetchAdminMenu();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : "Incorrect PIN");
      setPin("");
    }
  };

  const fetchAdminMenu = async () => {
    setIsLoadingMenu(true);
    try {
      const res = await fetch("/api/admin/menu");
      const data = await res.json();
      if (data.success) {
        setAdminMenuData(data);
      }
    } catch (err) {
      console.error("Admin fetch failed:", err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const toggleProductAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "PRODUCT",
          targetId: productId,
          isAvailable: !currentStatus,
        }),
      });
      if (res.ok) {
        fetchAdminMenu();
        if (onRefreshMenu) onRefreshMenu();
      }
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleTestPrint = async (targetPrinter: PrinterType) => {
    setPrinterStatusMessage("Sending test print...");
    try {
      const res = await fetch("/api/terminal/printer-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ printerType: targetPrinter }),
      });
      const data = await res.json();
      if (data.success) {
        setPrinterStatusMessage(`✅ ${data.message}`);
      } else {
        setPrinterStatusMessage("❌ Printer test failed");
      }
    } catch {
      setPrinterStatusMessage("❌ Connection error to printer");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative z-10 w-full max-w-2xl bg-[#1E1E1E] border border-[#333333] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A] bg-[#242424]">
            <div className="flex items-center gap-2.5">
              <Lock size={18} className="text-[#FF5722]" />
              <h3 className="font-display font-bold text-base text-white">
                Staff & Manager Terminal Control
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {!isAuthenticated ? (
            /* PIN Gate Keypad */
            <div className="p-6 sm:p-8 flex flex-col items-center space-y-6">
              <div className="text-center">
                <p className="text-xs uppercase tracking-widest text-[#E5A93C] font-bold">
                  Authentication Required
                </p>
                <h4 className="font-display font-extrabold text-xl text-white mt-1">
                  Enter 4-Digit Staff PIN
                </h4>
              </div>

              {/* PIN Dots */}
              <div className="flex items-center gap-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pin.length > idx
                        ? "bg-[#FF5722] border-[#FF7043] scale-110 glow-orange"
                        : "bg-transparent border-zinc-600"
                    }`}
                  />
                ))}
              </div>

              {authError && (
                <div className="flex items-center gap-2 text-xs text-[#E53935] font-semibold bg-red-950/50 px-3 py-1.5 rounded-lg border border-red-800">
                  <AlertTriangle size={14} />
                  <span>{authError}</span>
                </div>
              )}

              {/* 3x4 Number Keypad */}
              <div className="grid grid-cols-3 gap-3 w-64">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map((key) => {
                  if (key === "C") {
                    return (
                      <button
                        key={key}
                        onClick={handleKeypadClear}
                        className="h-14 rounded-2xl bg-[#2A2A2A] text-zinc-400 font-display font-bold text-base hover:bg-[#333333] active:scale-95"
                      >
                        CLR
                      </button>
                    );
                  }
                  if (key === "OK") {
                    return (
                      <button
                        key={key}
                        onClick={handleLogin}
                        className="h-14 rounded-2xl bg-[#FF5722] text-white font-display font-extrabold text-base hover:bg-[#E64A19] glow-orange active:scale-95"
                      >
                        ENT
                      </button>
                    );
                  }
                  return (
                    <button
                      key={key}
                      onClick={() => handleKeypadPress(key)}
                      className="h-14 rounded-2xl bg-[#242424] text-white font-display font-black text-xl hover:bg-[#2F2F2F] active:scale-95 border border-[#333333]"
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-500">
                Default Dev Staff PIN: <span className="text-zinc-300 font-mono">1234</span>
              </p>
            </div>
          ) : (
            /* Manager Dashboard Tabs */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Navigation Tabs */}
              <div className="flex border-b border-[#2A2A2A] bg-[#222222] px-6 gap-4 text-xs font-display font-bold">
                <button
                  onClick={() => setActiveTab("MENU")}
                  className={`py-3 flex items-center gap-1.5 border-b-2 transition-all ${
                    activeTab === "MENU"
                      ? "border-[#FF5722] text-[#FF5722]"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  <Sliders size={14} />
                  <span>Menu & Sold Out</span>
                </button>
                <button
                  onClick={() => setActiveTab("PRINTER")}
                  className={`py-3 flex items-center gap-1.5 border-b-2 transition-all ${
                    activeTab === "PRINTER"
                      ? "border-[#FF5722] text-[#FF5722]"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  <Printer size={14} />
                  <span>Printer Settings</span>
                </button>
                <button
                  onClick={() => setActiveTab("STORE")}
                  className={`py-3 flex items-center gap-1.5 border-b-2 transition-all ${
                    activeTab === "STORE"
                      ? "border-[#FF5722] text-[#FF5722]"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  <Store size={14} />
                  <span>Store & Location</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {activeTab === "MENU" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-sm text-white">
                        Inventory Availability & Out-of-Stock Toggles
                      </h4>
                      <button
                        onClick={fetchAdminMenu}
                        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        <RefreshCw size={12} className={isLoadingMenu ? "animate-spin" : ""} />
                        Refresh
                      </button>
                    </div>

                    {adminMenuData?.categories.map((cat) => (
                      <div
                        key={cat.id}
                        className="bg-[#242424] rounded-2xl border border-[#333333] p-4 space-y-3"
                      >
                        <h5 className="font-display font-extrabold text-xs uppercase tracking-wider text-[#E5A93C]">
                          {cat.name}
                        </h5>
                        <div className="space-y-2">
                          {cat.products.map((prod) => (
                            <div
                              key={prod.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F]"
                            >
                              <div>
                                <span className="font-display font-bold text-sm text-white block">
                                  {prod.name}
                                </span>
                                <span className="text-xs text-zinc-400 font-mono">
                                  {formatEuro(prod.basePrice)}
                                </span>
                              </div>

                              <button
                                onClick={() =>
                                  toggleProductAvailability(prod.id, prod.isAvailable)
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all ${
                                  prod.isAvailable
                                    ? "bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/40"
                                    : "bg-[#E53935]/20 text-[#E53935] border border-[#E53935]/40"
                                }`}
                              >
                                {prod.isAvailable ? "In Stock" : "SOLD OUT"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "PRINTER" && (
                  <div className="space-y-6 bg-[#242424] p-5 rounded-2xl border border-[#333333]">
                    <div>
                      <h4 className="font-display font-bold text-base text-white">
                        Dual Receipt Printer Driver Toggle
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Switch between Epson TM series and Star Micronics hardware protocols instantly.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setPrinterType("EPSON_TM");
                          handleTestPrint("EPSON_TM");
                        }}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          printerType === "EPSON_TM"
                            ? "bg-[#2E241E] border-[#FF5722] shadow glow-orange"
                            : "bg-[#1E1E1E] border-[#333333] text-zinc-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-display font-bold text-sm text-white">
                            Epson TM-T88VI
                          </h5>
                          {printerType === "EPSON_TM" && (
                            <Check size={16} className="text-[#FF5722]" />
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          ESC/POS Protocol • High-Speed Thermal Cutter
                        </p>
                      </button>

                      <button
                        onClick={() => {
                          setPrinterType("STAR_MICRONICS");
                          handleTestPrint("STAR_MICRONICS");
                        }}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          printerType === "STAR_MICRONICS"
                            ? "bg-[#2E241E] border-[#FF5722] shadow glow-orange"
                            : "bg-[#1E1E1E] border-[#333333] text-zinc-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-display font-bold text-sm text-white">
                            Star TSP143
                          </h5>
                          {printerType === "STAR_MICRONICS" && (
                            <Check size={16} className="text-[#FF5722]" />
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          StarPRNT / Line Mode • Guillotine Auto-Cutter
                        </p>
                      </button>
                    </div>

                    {printerStatusMessage && (
                      <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#3A3A3A] text-xs font-mono text-zinc-300">
                        {printerStatusMessage}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "STORE" && (
                  <div className="space-y-4 bg-[#242424] p-5 rounded-2xl border border-[#333333]">
                    <h4 className="font-display font-bold text-base text-white">
                      Store Location & Terminal ID
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1 font-semibold">
                          Active Store Location (Cyprus)
                        </label>
                        <select
                          value={locationSlug}
                          onChange={(e) => {
                            setLocationSlug(e.target.value);
                            if (onRefreshMenu) onRefreshMenu();
                          }}
                          className="w-full bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl p-2.5 text-sm text-white font-medium focus:border-[#FF5722] outline-none"
                        >
                          <option value="EMBA">MY GERMAN DÖNER — Emba (Paphos)</option>
                          <option value="LIMASSOL">MY GERMAN DÖNER — Limassol Marina</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F]">
                          <span className="text-zinc-500 block">Terminal Code</span>
                          <span className="font-mono font-bold text-white text-sm">
                            {terminalCode}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F]">
                          <span className="text-zinc-500 block">Cyprus VAT Rate</span>
                          <span className="font-mono font-bold text-[#FF5722] text-sm">
                            19% (Standard)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
