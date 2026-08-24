import { create } from "zustand";
import type { CartItem, SelectedModifier } from "@/types";

interface VoucherInfo {
  code: string;
  discountPercent?: number;
  discountFixed?: number;
  description: string;
}

const VALID_VOUCHERS: Record<string, VoucherInfo> = {
  BITETHEHYPE: {
    code: "BITETHEHYPE",
    discountPercent: 10,
    description: "10% Off — Bite The Hype Launch Special",
  },
  MYGD20: {
    code: "MYGD20",
    discountPercent: 20,
    description: "20% Off — VIP Döner Club Pass",
  },
  CYPRUS5: {
    code: "CYPRUS5",
    discountFixed: 5.0,
    description: "€5.00 Voucher Discount",
  },
  EMBA10: {
    code: "EMBA10",
    discountPercent: 10,
    description: "10% Off — Emba Store Welcome Deal",
  },
};

interface CartState {
  items: CartItem[];
  customerNote: string;
  appliedVoucher: VoucherInfo | null;

  // Actions
  addItem: (item: Omit<CartItem, "id" | "unitPrice" | "totalPrice">) => void;
  updateQuantity: (itemId: string, newQuantity: number) => void;
  removeItem: (itemId: string) => void;
  setCustomerNote: (note: string) => void;
  applyVoucher: (code: string) => { success: boolean; message: string };
  removeVoucher: () => void;
  clearCart: () => void;

  // Computed Selectors
  getItemCount: () => number;
  getGrossBeforeDiscount: () => number;
  getDiscountAmount: () => number;
  getSubtotal: () => number;
  getVatAmount: () => number; // 19% Cyprus standard
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerNote: "",
  appliedVoucher: null,

  addItem: (newItem) => {
    const modTotal = newItem.modifiers.reduce(
      (sum: number, m: SelectedModifier) => sum + (m.priceAdjustment || 0),
      0
    );
    const unitPrice = Number(
      (newItem.basePrice + modTotal + (newItem.mealPriceAddon || 0)).toFixed(2)
    );
    const totalPrice = Number((unitPrice * newItem.quantity).toFixed(2));

    const itemWithId: CartItem = {
      ...newItem,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random()}`,
      unitPrice,
      totalPrice,
    };

    set((state) => ({
      items: [...state.items, itemWithId],
    }));
  },

  updateQuantity: (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    set((state) => ({
      items: state.items.map((item) => {
        if (item.id === itemId) {
          const totalPrice = Number((item.unitPrice * newQuantity).toFixed(2));
          return { ...item, quantity: newQuantity, totalPrice };
        }
        return item;
      }),
    }));
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    }));
  },

  setCustomerNote: (customerNote) => set({ customerNote }),

  applyVoucher: (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const voucher = VALID_VOUCHERS[cleanCode];

    if (!voucher) {
      return {
        success: false,
        message: "Invalid voucher code. Try 'BITETHEHYPE' for 10% off!",
      };
    }

    set({ appliedVoucher: voucher });
    return {
      success: true,
      message: `🎉 Applied: ${voucher.description}`,
    };
  },

  removeVoucher: () => set({ appliedVoucher: null }),

  clearCart: () => set({ items: [], customerNote: "", appliedVoucher: null }),

  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getGrossBeforeDiscount: () => {
    const sum = get().items.reduce((total, item) => total + item.totalPrice, 0);
    return Number(sum.toFixed(2));
  },

  getDiscountAmount: () => {
    const gross = get().getGrossBeforeDiscount();
    const voucher = get().appliedVoucher;

    if (!voucher || gross <= 0) return 0.0;

    if (voucher.discountPercent) {
      return Number(((gross * voucher.discountPercent) / 100).toFixed(2));
    }
    if (voucher.discountFixed) {
      return Number(Math.min(gross, voucher.discountFixed).toFixed(2));
    }
    return 0.0;
  },

  getTotal: () => {
    const gross = get().getGrossBeforeDiscount();
    const discount = get().getDiscountAmount();
    return Number(Math.max(0, gross - discount).toFixed(2));
  },

  getSubtotal: () => {
    const grossTotal = get().getTotal();
    // In Cyprus, price is gross (includes 19% VAT) -> Net Subtotal = Gross / 1.19
    return Number((grossTotal / 1.19).toFixed(2));
  },

  getVatAmount: () => {
    const grossTotal = get().getTotal();
    const subtotal = get().getSubtotal();
    return Number((grossTotal - subtotal).toFixed(2));
  },
}));
