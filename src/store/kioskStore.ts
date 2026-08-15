import { create } from "zustand";
import type { OrderType, PrinterType } from "@/types";

interface KioskState {
  locationSlug: string;
  terminalCode: string;
  orderType: OrderType;
  printerType: PrinterType;
  isIdleWarningOpen: boolean;
  idleTimeRemaining: number;
  lastInteractionTime: number;

  setLocationSlug: (slug: string) => void;
  setTerminalCode: (code: string) => void;
  setOrderType: (orderType: OrderType) => void;
  setPrinterType: (printerType: PrinterType) => void;
  setIdleWarning: (isOpen: boolean, secondsLeft?: number) => void;
  recordInteraction: () => void;
  resetKioskSession: () => void;
}

export const useKioskStore = create<KioskState>((set) => ({
  locationSlug: process.env.NEXT_PUBLIC_DEFAULT_LOCATION || "EMBA",
  terminalCode: process.env.NEXT_PUBLIC_DEFAULT_TERMINAL || "KIOSK-01",
  orderType: "DINE_IN",
  printerType: "EPSON_TM",
  isIdleWarningOpen: false,
  idleTimeRemaining: 15,
  lastInteractionTime: Date.now(),

  setLocationSlug: (slug: string) => set({ locationSlug: slug.toUpperCase() }),
  setTerminalCode: (code: string) => set({ terminalCode: code }),
  setOrderType: (orderType: OrderType) => set({ orderType, lastInteractionTime: Date.now() }),
  setPrinterType: (printerType: PrinterType) => set({ printerType }),
  setIdleWarning: (isOpen: boolean, secondsLeft = 15) =>
    set({ isIdleWarningOpen: isOpen, idleTimeRemaining: secondsLeft }),
  recordInteraction: () => set({ lastInteractionTime: Date.now(), isIdleWarningOpen: false }),
  resetKioskSession: () =>
    set({
      orderType: "DINE_IN",
      isIdleWarningOpen: false,
      idleTimeRemaining: 15,
      lastInteractionTime: Date.now(),
    }),
}));
