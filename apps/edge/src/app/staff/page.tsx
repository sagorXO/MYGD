"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  Send,
  AlertCircle,
  Timer,
  UserCheck,
  Coffee,
  LogOut,
  LogIn,
  Check,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { validateHACCPTemperature, HACCPTargetType } from "@/lib/haccp-validator";

interface ChecklistTaskState {
  id: string;
  title: string;
  isTempCheck?: boolean;
  tempType?: HACCPTargetType;
  target?: string;
  isCompleted: boolean;
  loggedTemp?: number;
  correctiveActionNote?: string;
}

interface ClockedInStaffItem {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  clockIn: string;
  clockInTime: string;
  hoursWorked: string;
  totalMinutes: number;
  isApproved?: boolean;
}

interface ShiftLogItem {
  id: string;
  staffId: string;
  staffName: string;
  role: string;
  clockIn: string;
  clockOut: string | null;
  clockInTime: string;
  clockOutTime: string | null;
  totalMinutes: number;
  hoursWorked: string;
  isApproved: boolean;
}

interface FormattedRecipeStep {
  stepNumber: number;
  instruction: string;
  instructionDE?: string;
  targetSec: number;
  qualityCheck: string;
  imageUrl: string | null;
}

interface BuildSheetItem {
  productId: string;
  productName: string;
  sku: string;
  meatWeight?: string;
  breadType?: string;
  sauceSequence?: string;
  imageUrl: string | null;
  steps: FormattedRecipeStep[];
  totalTargetSec: number;
  stepCount: number;
  hasDefaultSOP: boolean;
}

export default function StaffHubPage() {
  const [activeTab, setActiveTab] = useState<"CHECKLISTS" | "TIMECLOCK" | "BUILD_SHEETS">("CHECKLISTS");

  // ==========================================
  // MODULE M1: CHECKLISTS & HACCP AUDIT
  // ==========================================
  const [activeChecklistFilter, setActiveChecklistFilter] = useState<"OPENING" | "LUNCH_PREP" | "CLOSING" | "HACCP">("OPENING");
  const [staffName, setStaffName] = useState<string>("Alex (Line Opener)");
  const [tasks, setTasks] = useState<ChecklistTaskState[]>([]);
  const [isLoadingChecklists, setIsLoadingChecklists] = useState<boolean>(true);
  const [isSubmittingChecklist, setIsSubmittingChecklist] = useState<boolean>(false);
  const [checklistSubmitMessage, setChecklistSubmitMessage] = useState<string | null>(null);

  const loadChecklistTemplate = useCallback(async () => {
    try {
      setIsLoadingChecklists(true);
      const res = await fetch(`/api/checklists/template?shiftType=${activeChecklistFilter}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.templates) && data.templates.length > 0) {
        const templateTasks = data.templates[0].tasks || [];
        setTasks(
          templateTasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            isTempCheck: Boolean(t.isTempCheck),
            tempType: t.tempType,
            target: t.target,
            isCompleted: false,
            loggedTemp: t.isTempCheck
              ? t.tempType === "FROZEN"
                ? -19
                : t.tempType === "HOT_HOLDING"
                ? 68
                : 3.2
              : undefined,
          }))
        );
      }
    } catch (err) {
      console.error("[StaffHub] Failed to load checklist template:", err);
    } finally {
      setIsLoadingChecklists(false);
    }
  }, [activeChecklistFilter]);

  useEffect(() => {
    loadChecklistTemplate();
  }, [loadChecklistTemplate]);

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
    );
  };

  const handleTempChange = (id: string, temp: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, loggedTemp: temp, isCompleted: true } : t))
    );
  };

  const handleSubmitChecklist = async () => {
    setIsSubmittingChecklist(true);
    setChecklistSubmitMessage(null);

    try {
      const payload = {
        locationSlug: "EMBA",
        shiftType: activeChecklistFilter,
        completedBy: staffName,
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          isCompleted: t.isCompleted,
          isTempCheck: t.isTempCheck,
          tempType: t.tempType,
          loggedTemp: t.loggedTemp,
          correctiveActionNote: t.correctiveActionNote,
        })),
      };

      const res = await fetch("/api/checklists/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        if (data.dangerZoneTriggered) {
          setChecklistSubmitMessage("⚠️ Logged with HACCP Danger Zone Alert — Incident Escalated to HQ.");
        } else {
          setChecklistSubmitMessage("✅ Checklist Routine Verified & Persisted to DB.");
        }
      } else {
        setChecklistSubmitMessage(`❌ Submission failed: ${data.error}`);
      }
    } catch (err) {
      console.error("[StaffHub] Submit error:", err);
      setChecklistSubmitMessage("❌ Network error submitting checklist.");
    } finally {
      setIsSubmittingChecklist(false);
    }
  };

  // ==========================================
  // MODULE M7: TIMECLOCK & PIN AUTHENTICATION
  // ==========================================
  const [pinInput, setPinInput] = useState<string>("");
  const [clockedInStaff, setClockedInStaff] = useState<ClockedInStaffItem[]>([]);
  const [recentShiftLogs, setRecentShiftLogs] = useState<ShiftLogItem[]>([]);
  const [isLoadingTimeclock, setIsLoadingTimeclock] = useState<boolean>(false);
  const [isPunchingShift, setIsPunchingShift] = useState<boolean>(false);
  const [clockMessage, setClockMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const loadTimeclockData = useCallback(async () => {
    try {
      setIsLoadingTimeclock(true);
      const res = await fetch("/api/staff/timeclock?location=EMBA");
      const data = await res.json();
      if (data.success) {
        setClockedInStaff(data.activeStaff || []);
        setRecentShiftLogs(data.recentLogs || []);
      }
    } catch (err) {
      console.error("[StaffHub] Failed to load timeclock data:", err);
    } finally {
      setIsLoadingTimeclock(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "TIMECLOCK") {
      loadTimeclockData();
      const interval = setInterval(loadTimeclockData, 30000); // 30s auto-refresh
      return () => clearInterval(interval);
    }
  }, [activeTab, loadTimeclockData]);

  const handleClockAction = async (action: "IN" | "OUT" | "BREAK") => {
    if (pinInput.length !== 4) {
      setClockMessage({ text: "Please enter your 4-digit staff PIN.", isError: true });
      return;
    }

    try {
      setIsPunchingShift(true);
      setClockMessage(null);

      const res = await fetch("/api/staff/timeclock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: pinInput,
          action,
          locationSlug: "EMBA",
        }),
      });

      const data = await res.json();

      if (data.success) {
        const staffName = data.staff?.name || "Staff";
        const role = data.staff?.role || "CREW";
        setClockMessage({
          text: `✅ ${staffName} (${role}) successfully clocked ${action}!`,
          isError: false,
        });
        setPinInput("");
        await loadTimeclockData();
      } else {
        setClockMessage({
          text: `❌ ${data.error || "Authentication failed."}`,
          isError: true,
        });
      }
    } catch (err) {
      console.error("[StaffHub] Punch error:", err);
      setClockMessage({ text: "❌ Network error communicating with timeclock.", isError: true });
    } finally {
      setIsPunchingShift(false);
    }
  };

  // ==========================================
  // MODULE M8: McDONALD'S-STYLE BUILD SHEETS
  // ==========================================
  const [buildSheets, setBuildSheets] = useState<BuildSheetItem[]>([]);
  const [selectedBuildSheet, setSelectedBuildSheet] = useState<BuildSheetItem | null>(null);
  const [isLoadingBuildSheets, setIsLoadingBuildSheets] = useState<boolean>(false);

  const loadBuildSheets = useCallback(async () => {
    try {
      setIsLoadingBuildSheets(true);
      const res = await fetch("/api/staff/build-sheets");
      const data = await res.json();
      if (data.success && Array.isArray(data.buildSheets) && data.buildSheets.length > 0) {
        setBuildSheets(data.buildSheets);
        setSelectedBuildSheet((prev) => {
          if (!prev) return data.buildSheets[0];
          const match = data.buildSheets.find((b: BuildSheetItem) => b.productId === prev.productId);
          return match || data.buildSheets[0];
        });
      }
    } catch (err) {
      console.error("[StaffHub] Failed to load build sheets:", err);
    } finally {
      setIsLoadingBuildSheets(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "BUILD_SHEETS") {
      loadBuildSheets();
    }
  }, [activeTab, loadBuildSheets]);

  return (
    <div className="min-h-screen bg-[#1F1F21] text-white flex flex-col font-sans select-none">
      {/* Top Staff Tablet Header */}
      <header className="h-16 bg-[#2B2B2E] border-b border-[#3A3A3E] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E50D7E] flex items-center justify-center font-display font-black text-white text-base shadow">
            GD
          </div>
          <div>
            <span className="font-display font-black text-base tracking-wider uppercase">
              MY GERMAN DÖNER · <span className="text-[#E50D7E]">STAFF & OPS HUB</span>
            </span>
            <span className="text-xs text-zinc-400 font-mono block">
              Wall Tablet Station • Emba Flagship Store (Paphos)
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#1F1F21] border border-[#3A3A3E] rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab("CHECKLISTS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-display font-bold text-xs uppercase transition-all ${
              activeTab === "CHECKLISTS"
                ? "bg-[#E50D7E] text-white shadow"
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
                ? "bg-[#E50D7E] text-white shadow"
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
                ? "bg-[#E50D7E] text-white shadow"
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
        {/* ========================================================================= */}
        {/* TAB 1: M1 CHECKLISTS & LOGBOOK */}
        {/* ========================================================================= */}
        {activeTab === "CHECKLISTS" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Checklist Category Filter Bar */}
            <div className="flex items-center justify-between border-b border-[#3A3A3E] pb-4">
              <div className="flex items-center gap-2">
                {[
                  { id: "OPENING", label: "🌅 Opening Routine" },
                  { id: "HACCP", label: "🌡️ HACCP Temperature Audit" },
                  { id: "LUNCH_PREP", label: "🥪 Afternoon Prep" },
                  { id: "CLOSING", label: "🌙 Closing Shift" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveChecklistFilter(tab.id as any)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeChecklistFilter === tab.id
                        ? "bg-[#2B2B2E] text-[#00FCED] border border-[#00FCED]/50 shadow"
                        : "bg-[#2B2B2E] text-zinc-400 hover:text-white border border-[#3A3A3E]"
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Staff Signature Field */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-zinc-400">Staff:</span>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="bg-[#2B2B2E] border border-[#3A3A3E] rounded-lg px-3 py-1 text-white font-bold outline-none focus:border-[#E50D7E]"
                />
              </div>
            </div>

            {/* Checklist Task Items */}
            <div className="space-y-3">
              {isLoadingChecklists ? (
                <div className="py-12 text-center text-zinc-500 text-xs">
                  Loading routine tasks...
                </div>
              ) : (
                tasks.map((task) => {
                  let haccpResult = null;
                  if (task.isTempCheck && typeof task.loggedTemp === "number" && task.tempType) {
                    haccpResult = validateHACCPTemperature(task.tempType, task.loggedTemp);
                  }

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        task.isCompleted
                          ? "bg-[#1F2B22] border-[#4CAF50]/60 text-white"
                          : "bg-[#2B2B2E] border-[#3A3A3E] text-zinc-300"
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1">
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 transition-all ${
                            task.isCompleted
                              ? "bg-[#4CAF50] border-[#4CAF50] text-black"
                              : "border-zinc-500 bg-[#1F1F21]"
                          }`}
                        >
                          {task.isCompleted && <CheckCircle2 size={18} className="stroke-[3]" />}
                        </button>

                        <div className="flex-1">
                          <p className={`font-semibold text-sm ${task.isCompleted ? "text-zinc-300" : "text-white"}`}>
                            {task.title}
                          </p>

                          {task.isTempCheck && (
                            <div className="flex flex-wrap items-center gap-3 text-xs font-mono mt-1.5">
                              <span className="text-[#00FCED] flex items-center gap-1">
                                <Thermometer size={13} />
                                <span>Target: {task.target}</span>
                              </span>

                              {haccpResult && (
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    haccpResult.isDangerZone
                                      ? "bg-[#E53935]/20 text-[#E53935] border border-[#E53935]/40"
                                      : haccpResult.isCompliant
                                      ? "bg-[#4CAF50]/20 text-[#4CAF50] border border-[#4CAF50]/40"
                                      : "bg-[#E5A93C]/20 text-[#E5A93C]"
                                  }`}
                                >
                                  {haccpResult.isDangerZone
                                    ? "⚠️ DANGER ZONE"
                                    : haccpResult.isCompliant
                                    ? "✅ Compliant"
                                    : "Out of Range"}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Temp Input for HACCP Tasks */}
                      {task.isTempCheck && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-400">Log Temp:</span>
                          <input
                            type="number"
                            step="0.1"
                            value={task.loggedTemp ?? ""}
                            onChange={(e) => handleTempChange(task.id, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-[#1F1F21] border border-[#3A3A3E] rounded-xl px-2.5 py-1.5 text-center font-mono font-bold text-sm text-[#00FCED] outline-none focus:border-[#E50D7E]"
                          />
                          <span className="text-xs font-mono text-zinc-400">°C</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Submission Action */}
            <div className="pt-4 border-t border-[#3A3A3E] flex items-center justify-between">
              {checklistSubmitMessage && (
                <span className="text-xs font-mono text-zinc-300">
                  {checklistSubmitMessage}
                </span>
              )}

              <button
                onClick={handleSubmitChecklist}
                disabled={isSubmittingChecklist || tasks.length === 0}
                className="ml-auto px-6 py-3 rounded-2xl bg-[#E50D7E] hover:bg-[#C90B6E] text-white font-display font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow transition-all disabled:opacity-50"
              >
                <Send size={16} />
                <span>{isSubmittingChecklist ? "Persisting to DB..." : "Sign & Submit Checklist"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: M7 TIMECLOCK */}
        {/* ========================================================================= */}
        {activeTab === "TIMECLOCK" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: PIN Keypad Punch Station (5 Cols) */}
              <div className="lg:col-span-5 bg-[#2B2B2E] border border-[#3A3A3E] rounded-3xl p-6 shadow-2xl space-y-5">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-2xl bg-[#E50D7E]/20 text-[#E50D7E] border border-[#E50D7E]/30 mx-auto flex items-center justify-center mb-2 shadow">
                    <Lock size={20} />
                  </div>
                  <h2 className="font-display font-black text-xl text-white uppercase tracking-wider">
                    Staff PIN Timeclock
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 font-mono">
                    Enter your 4-digit employee PIN to punch shift
                  </p>
                </div>

                {/* PIN Display */}
                <div className="h-14 bg-[#1F1F21] border border-[#3A3A3E] rounded-2xl flex items-center justify-center tracking-[0.5em] text-2xl font-mono text-[#00FCED] shadow-inner">
                  {pinInput ? "•".repeat(pinInput.length) : (
                    <span className="text-zinc-600 text-sm font-sans tracking-normal">
                      Enter 4-Digit PIN
                    </span>
                  )}
                </div>

                {/* Keypad Buttons */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "⌫"].map((key) => (
                    <button
                      key={String(key)}
                      onClick={() => {
                        if (key === "C") setPinInput("");
                        else if (key === "⌫") setPinInput((prev) => prev.slice(0, -1));
                        else if (pinInput.length < 4) setPinInput((prev) => prev + String(key));
                      }}
                      className="h-12 bg-[#1F1F21] hover:bg-[#343438] active:scale-95 border border-[#3A3A3E] rounded-xl font-mono font-bold text-lg text-white transition-all shadow"
                    >
                      {key}
                    </button>
                  ))}
                </div>

                {/* Punch Shift Actions */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <button
                    disabled={isPunchingShift || pinInput.length !== 4}
                    onClick={() => handleClockAction("IN")}
                    className="py-3 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] active:scale-95 text-white font-display font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <LogIn size={14} />
                    <span>Clock In</span>
                  </button>
                  <button
                    disabled={isPunchingShift || pinInput.length !== 4}
                    onClick={() => handleClockAction("BREAK")}
                    className="py-3 rounded-xl bg-[#E5A93C] hover:bg-[#D4982E] active:scale-95 text-black font-display font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <Coffee size={14} />
                    <span>Break</span>
                  </button>
                  <button
                    disabled={isPunchingShift || pinInput.length !== 4}
                    onClick={() => handleClockAction("OUT")}
                    className="py-3 rounded-xl bg-[#E53935] hover:bg-[#D32F2F] active:scale-95 text-white font-display font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <LogOut size={14} />
                    <span>Clock Out</span>
                  </button>
                </div>

                {/* Clock Message Banner */}
                {clockMessage && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs font-mono text-center transition-all ${
                      clockMessage.isError
                        ? "bg-[#E53935]/15 border-[#E53935]/40 text-[#E53935]"
                        : "bg-[#4CAF50]/15 border-[#4CAF50]/40 text-[#4CAF50]"
                    }`}
                  >
                    {clockMessage.text}
                  </div>
                )}
              </div>

              {/* Right Column: Currently Clocked-In Crew List (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[#2B2B2E] border border-[#3A3A3E] rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-[#3A3A3E] pb-3">
                    <div className="flex items-center gap-2">
                      <UserCheck size={18} className="text-[#00FCED]" />
                      <h3 className="font-display font-black text-base text-white uppercase tracking-wider">
                        Currently Clocked-In Crew ({clockedInStaff.length} Active)
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-[#00FCED] bg-[#00FCED]/10 border border-[#00FCED]/30 px-3 py-0.5 rounded-full font-bold">
                      Emba Store
                    </span>
                  </div>

                  {isLoadingTimeclock && clockedInStaff.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-zinc-500">
                      Loading staff records...
                    </div>
                  ) : clockedInStaff.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-zinc-400 bg-[#1F1F21] rounded-2xl border border-[#3A3A3E]">
                      No staff members currently clocked in. Enter PIN to punch shift.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clockedInStaff.map((stf) => (
                        <div
                          key={stf.id}
                          className="p-4 rounded-2xl bg-[#1F1F21] border border-[#3A3A3E] flex items-center justify-between hover:border-[#00FCED]/40 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-[#4CAF50] animate-pulse shrink-0" />
                            <div>
                              <h4 className="font-bold text-sm text-white">{stf.staffName}</h4>
                              <span className="text-xs font-mono text-[#00FCED] font-bold block">
                                {stf.role}
                              </span>
                            </div>
                          </div>
                          <div className="text-right text-xs font-mono">
                            <span className="text-zinc-400 block">In at {stf.clockInTime}</span>
                            <span className="text-[#E5A93C] font-bold block mt-0.5">
                              {stf.hoursWorked} worked
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Shift Logs Table */}
                {recentShiftLogs.length > 0 && (
                  <div className="bg-[#2B2B2E] border border-[#3A3A3E] rounded-3xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-display font-bold uppercase tracking-wider text-zinc-400">
                      <Timer size={15} className="text-[#E50D7E]" />
                      <span>Recent Shift Punch Activity</span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {recentShiftLogs.slice(0, 5).map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#1F1F21] border border-[#3A3A3E] text-xs font-mono"
                        >
                          <div>
                            <span className="text-white font-bold">{log.staffName}</span>
                            <span className="text-zinc-500 ml-2">({log.role})</span>
                          </div>
                          <div className="text-right text-zinc-400">
                            <span>{log.clockInTime} ➔ {log.clockOutTime || "Active"}</span>
                            <span className="text-[#00FCED] font-bold ml-3">
                              {log.hoursWorked}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: M8 McDONALD'S-STYLE VISUAL SOP BUILD SHEETS */}
        {/* ========================================================================= */}
        {activeTab === "BUILD_SHEETS" && (
          <div className="max-w-5xl mx-auto space-y-6">
            {isLoadingBuildSheets && buildSheets.length === 0 ? (
              <div className="py-16 text-center text-xs font-mono text-zinc-500">
                Loading visual assembly SOP build sheets...
              </div>
            ) : (
              <>
                {/* Dynamic Product Selector Bar */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {buildSheets.map((sheet) => (
                    <button
                      key={sheet.productId}
                      onClick={() => setSelectedBuildSheet(sheet)}
                      className={`px-4 py-2.5 rounded-2xl font-display font-bold text-xs uppercase shrink-0 transition-all flex items-center gap-2.5 ${
                        selectedBuildSheet?.productId === sheet.productId
                          ? "bg-[#E50D7E] text-white shadow"
                          : "bg-[#2B2B2E] text-zinc-400 border border-[#3A3A3E] hover:text-white"
                      }`}
                    >
                      {sheet.imageUrl && (
                        <img
                          src={sheet.imageUrl}
                          alt={sheet.productName}
                          className="w-6 h-6 rounded-lg object-cover"
                        />
                      )}
                      <span>{sheet.productName}</span>
                    </button>
                  ))}
                </div>

                {/* Active Build Sheet Details Card */}
                {selectedBuildSheet && (
                  <div className="bg-[#2B2B2E] border border-[#3A3A3E] rounded-3xl p-6 space-y-6 shadow-2xl">
                    {/* Header: Product Specs & Total Time */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#3A3A3E] pb-5">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#E50D7E]/20 text-[#E50D7E] border border-[#E50D7E]/40 font-mono text-xs font-bold">
                            {selectedBuildSheet.sku}
                          </span>
                          <span className="text-xs font-mono text-zinc-400">
                            {selectedBuildSheet.stepCount} Assembly Steps
                          </span>
                        </div>
                        <h3 className="font-display font-black text-2xl text-white uppercase tracking-wider">
                          {selectedBuildSheet.productName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-300">
                          {selectedBuildSheet.meatWeight && (
                            <span className="text-[#00FCED]">
                              🥩 {selectedBuildSheet.meatWeight}
                            </span>
                          )}
                          {selectedBuildSheet.breadType && (
                            <span className="text-zinc-400">
                              🥖 {selectedBuildSheet.breadType}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Total Target Time Badge */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                        <div className="px-4 py-2 rounded-2xl bg-[#1F1F21] border border-[#00FCED]/40 text-right">
                          <span className="text-[11px] font-mono text-zinc-400 block">Total Target Time</span>
                          <span className="text-base font-display font-black text-[#00FCED] tracking-wide">
                            ⏱️ {selectedBuildSheet.totalTargetSec}s ({Math.floor(selectedBuildSheet.totalTargetSec / 60)}m {selectedBuildSheet.totalTargetSec % 60}s)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sauce Sequence Rule Callout */}
                    {selectedBuildSheet.sauceSequence && (
                      <div className="p-4 rounded-2xl bg-[#1F1F21] border border-[#E5A93C]/40 text-xs font-mono text-[#E5A93C] flex items-center gap-3">
                        <Flame size={18} className="shrink-0 text-[#E5A93C]" />
                        <div>
                          <strong className="text-white uppercase font-display block">
                            Sauce Dosing & Sequence SOP:
                          </strong>
                          <span>{selectedBuildSheet.sauceSequence}</span>
                        </div>
                      </div>
                    )}

                    {/* Sequential Assembly Step Cards */}
                    <div className="space-y-3">
                      <span className="font-display font-bold text-xs uppercase tracking-wider text-zinc-400 block">
                        Sequential Kitchen Assembly Sequence
                      </span>

                      <div className="space-y-3">
                        {selectedBuildSheet.steps.map((step) => (
                          <div
                            key={step.stepNumber}
                            className="p-4 rounded-2xl bg-[#1F1F21] border border-[#3A3A3E] flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-[#E50D7E]/40 transition-all"
                          >
                            <div className="flex items-start gap-3.5 flex-1">
                              <span className="w-8 h-8 rounded-xl bg-[#E50D7E] text-white font-mono font-black text-sm flex items-center justify-center shrink-0 shadow">
                                {step.stepNumber}
                              </span>
                              <div className="space-y-1 flex-1">
                                <p className="text-sm text-white font-semibold leading-relaxed">
                                  {step.instruction}
                                </p>
                                {step.instructionDE && (
                                  <p className="text-xs text-zinc-400 font-mono italic">
                                    🇩🇪 {step.instructionDE}
                                  </p>
                                )}

                                {/* Quality Check Callout */}
                                {step.qualityCheck && (
                                  <div className="mt-2 text-xs font-mono text-[#00FCED] bg-[#00FCED]/10 border border-[#00FCED]/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                    <ShieldCheck size={14} className="shrink-0" />
                                    <span>
                                      <strong>Quality Inspection:</strong> {step.qualityCheck}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Target Seconds Pill */}
                            <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                              <span className="px-3 py-1 rounded-xl bg-[#2B2B2E] border border-[#3A3A3E] text-xs font-mono font-bold text-[#E5A93C]">
                                ⏱️ {step.targetSec}s
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
