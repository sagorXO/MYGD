// MY GERMAN DÖNER — Shared Types & DTO Definitions
// Sourced from M1-M11 Module Specifications

export type Locale = "en" | "de" | "gr";

export interface BrandTokens {
  charcoal: string;
  surface: string;
  surfaceLight: string;
  magenta: string;
  cyan: string;
  gold: string;
  orange: string;
  success: string;
  danger: string;
}

export const MYGD_BRAND_TOKENS: BrandTokens = {
  charcoal: "#121214",
  surface: "#1A1A1E",
  surfaceLight: "#2B2B2E",
  magenta: "#E50D7E",
  cyan: "#00FCED",
  gold: "#E5A93C",
  orange: "#FF5722",
  success: "#4CAF50",
  danger: "#E53935",
};

// -----------------------------------------
// Catalog & Pricing DTOs (M11)
// -----------------------------------------
export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
  nameDE?: string | null;
  nameGR?: string | null;
  description?: string | null;
  iconSvg?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  products?: ProductDTO[];
}

export interface ModifierOptionDTO {
  id: string;
  slug: string;
  name: string;
  nameDE?: string | null;
  nameGR?: string | null;
  priceAdjustment: number;
  isDefault: boolean;
  isAvailable: boolean;
  calories?: number | null;
  sortOrder: number;
}

export interface ModifierGroupDTO {
  id: string;
  slug: string;
  name: string;
  nameDE?: string | null;
  nameGR?: string | null;
  minSelected: number;
  maxSelected: number;
  isRequired: boolean;
  sortOrder: number;
  modifiers: ModifierOptionDTO[];
}

export interface ProductDTO {
  id: string;
  categoryId: string;
  sku: string;
  name: string;
  nameDE?: string | null;
  nameGR?: string | null;
  description?: string | null;
  descriptionDE?: string | null;
  descriptionGR?: string | null;
  basePrice: number;
  imageUrl?: string | null;
  badge?: "POPULAR" | "NEW" | "VEGGIE" | "SPICY" | "CHEF_CHOICE" | null;
  calories?: number | null;
  allergens?: string[] | string | null;
  isVeggie: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
  allowMealUpgrade: boolean;
  sortOrder: number;
  modifierGroups?: {
    modifierGroup: ModifierGroupDTO;
  }[];
}

// -----------------------------------------
// Cart & Order Customization
// -----------------------------------------
export interface CartItemModifier {
  modifierId: string;
  groupName: string;
  modifierName: string;
  priceAdjustment: number;
}

export interface CartItem {
  id: string; // Unique cart line uuid
  product: ProductDTO;
  quantity: number;
  spiceLevel: number; // 1 to 5
  selectedModifiers: CartItemModifier[];
  isMealBundle: boolean;
  mealDrinkName?: string;
  mealSideName?: string;
  mealPriceAddon: number;
  itemNotes?: string;
  unitPrice: number;
  totalPrice: number;
}

export type OrderType = "DINE_IN" | "TAKE_AWAY" | "DELIVERY";
export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "PREPARING" | "READY_FOR_PICKUP" | "COMPLETED" | "CANCELLED" | "REFUNDED";
export type PaymentMethod = "CASH" | "CARD" | "NFC_WALLET" | "QR_CODE";
export type PaymentStatus = "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED";

export interface CreateOrderPayload {
  locationSlug: string;
  terminalCode: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  items: {
    productId: string;
    productName: string;
    productSku: string;
    basePrice: number;
    quantity: number;
    spiceLevel: number;
    isMealBundle: boolean;
    mealDrinkName?: string;
    mealSideName?: string;
    mealPriceAddon: number;
    itemNotes?: string;
    totalPrice: number;
    modifiers: {
      modifierId: string;
      groupName: string;
      modifierName: string;
      priceAdjustment: number;
    }[];
  }[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  customerNote?: string;
  locale?: string;
  discountCode?: string;
  discountPercent?: number;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  dailySequence: number;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  estimatedWaitMinutes: number;
  qrPayloadUrl: string;
  rawThermalReceiptBufferHex?: string;
}

// -----------------------------------------
// Kitchen Display System (M5)
// -----------------------------------------
export type StationRoute = "ALL" | "GRILL" | "ASSEMBLY" | "FRYER";

export interface KDSTicketItem {
  name: string;
  quantity: number;
  spiceLevel: number;
  modifiers: string[];
  isMeal: boolean;
  mealDetails?: string;
  station: StationRoute;
}

export interface KDSTicketDTO {
  id: string;
  orderId: string;
  orderNumber: string;
  dailySequence: number;
  orderType: OrderType;
  status: "NEW" | "PREPARING" | "READY" | "COMPLETED";
  claimedByStaffId?: string | null;
  claimedByStaffName?: string | null;
  claimedAt?: string | null;
  createdAt: string;
  customerNote?: string;
  elapsedSeconds: number;
  items: KDSTicketItem[];
}

// -----------------------------------------
// M1: Digital Logbook & HACCP
// -----------------------------------------
export interface HACCPLogEntry {
  id: string;
  locationId: string;
  equipmentName: string; // e.g. "Walk-in Freezer 1", "Döner Meat Prep Chiller"
  targetTempMin: number;
  targetTempMax: number;
  loggedTemp: number;
  isCompliant: boolean;
  loggedByStaffName: string;
  notes?: string;
  createdAt: string;
}

// -----------------------------------------
// M2: Supplier Ordering
// -----------------------------------------
export interface SupplierItem {
  id: string;
  name: string;
  sku: string;
  category: "MEAT" | "PRODUCE" | "BAKERY" | "PACKAGING" | "BEVERAGES";
  currentStockUnits: number;
  reorderThreshold: number;
  orderUnit: string; // "KG", "BOX_24", "CRATE"
  supplierName: string;
  supplierWhatsApp: string;
  supplierEmail: string;
  unitPriceEUR: number;
}

// -----------------------------------------
// M3 & M8: Recipe BOM & Build Sheets
// -----------------------------------------
export interface RecipeIngredient {
  ingredientId: string;
  name: string;
  gramsPerPortion: number;
  costPerGramEUR: number;
}

export interface BuildSheetStep {
  stepNumber: number;
  title: string;
  description: string;
  imageUrl?: string;
  qualityCheck: string;
}

export interface ProductBuildSheet {
  productId: string;
  productName: string;
  sku: string;
  portionGramsMeat: number;
  breadType: string;
  targetPrepTimeSec: number;
  ingredients: RecipeIngredient[];
  assemblySteps: BuildSheetStep[];
}

// -----------------------------------------
// M7: Scheduling & Shift TimeLog
// -----------------------------------------
export interface StaffTimeLog {
  id: string;
  staffId: string;
  staffName: string;
  role: "CASHIER" | "GRILL_MASTER" | "ASSEMBLER" | "MANAGER";
  clockInTime: string;
  clockOutTime?: string;
  totalHoursWorked?: number;
  locationSlug: string;
}

// -----------------------------------------
// Printing & Hardware Types
// -----------------------------------------
export type PrinterProtocol = "EPSON_ESC_POS" | "STAR_PRNT" | "VIRTUAL_HEX";

export interface ReceiptPrintJob {
  orderNumber: string;
  dailySequence: number;
  storeName: string;
  storeAddress: string;
  storePhone?: string;
  createdAt: string;
  orderType: OrderType;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    modifiers: string[];
    spiceLevel?: number;
  }[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  qrPayloadUrl: string;
  kickCashDrawer?: boolean;
}
