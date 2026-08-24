export type Locale = "en" | "de" | "gr";

export type OrderType = "DINE_IN" | "TAKE_AWAY";

export type PaymentMethod = "CASH" | "CARD" | "NFC_WALLET" | "QR_CODE";

export type PaymentStatus = "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type PrinterType = "EPSON_TM" | "STAR_MICRONICS" | "SIMULATED_SCREEN";

export interface SelectedModifier {
  modifierId: string;
  groupId: string;
  groupName: string;
  name: string;
  nameDE?: string;
  nameGR?: string;
  priceAdjustment: number;
}

export interface CartItem {
  id: string; // unique cart line ID (UUID)
  productId: string;
  sku: string;
  name: string;
  nameDE?: string;
  nameGR?: string;
  imageUrl?: string;
  basePrice: number;
  quantity: number;
  spiceLevel: number; // 1: Mild, 2: Medium, 3: Scharf, 4: Extra Scharf, 5: Hölle
  modifiers: SelectedModifier[];
  isMealBundle: boolean;
  mealDrinkName?: string;
  mealSideName?: string;
  mealPriceAddon: number;
  itemNotes?: string;
  unitPrice: number; // basePrice + sum(modifiers) + mealPriceAddon
  totalPrice: number; // unitPrice * quantity
}

export interface CategoryDTO {
  id: string;
  slug: string;
  name: string;
  nameDE: string;
  nameGR: string;
  description?: string | null;
  iconSvg?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  products?: ProductDTO[];
}

export interface ProductDTO {
  id: string;
  categoryId: string;
  sku: string;
  name: string;
  nameDE: string;
  nameGR: string;
  description?: string | null;
  descriptionDE?: string | null;
  descriptionGR?: string | null;
  basePrice: number;
  imageUrl?: string | null;
  badge?: string | null;
  calories?: number | null;
  allergens?: string[] | string | null;
  isVeggie: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
  allowMealUpgrade: boolean;
  sortOrder: number;
  modifierGroups?: ModifierGroupDTO[];
}

export interface ModifierGroupDTO {
  id: string;
  slug: string;
  name: string;
  nameDE: string;
  nameGR: string;
  minSelected: number;
  maxSelected: number;
  isRequired: boolean;
  sortOrder: number;
  modifiers: ModifierDTO[];
}

export interface ModifierDTO {
  id: string;
  modifierGroupId: string;
  slug: string;
  name: string;
  nameDE: string;
  nameGR: string;
  priceAdjustment: number;
  isDefault: boolean;
  isAvailable: boolean;
  calories?: number | null;
  sortOrder: number;
}

export interface CreateOrderRequest {
  locationSlug: string;
  terminalCode: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  locale: Locale;
  items: {
    productId: string;
    quantity: number;
    spiceLevel: number;
    modifiers: { modifierId: string }[];
    isMealBundle: boolean;
    mealDrinkName?: string;
    mealSideName?: string;
    itemNotes?: string;
  }[];
  customerNote?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  dailySequence: number;
  orderType: OrderType;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  qrPayload?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}
