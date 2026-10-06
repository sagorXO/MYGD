// MY GERMAN DÖNER — Module M10: Digital Menu Boards Real-Time Engine
// Daypart resolution, screen slot configuration, sold-out inventory overlays, layout validation

export type DaypartType = "LUNCH" | "DINNER" | "LATE_NIGHT" | "MORNING";
export type LayoutPresetType = "PROMO_HERO" | "PRICE_MATRIX" | "SPLIT_COMBO";

export interface MenuBoardItem {
  id?: string;
  name: string;
  nameDE?: string;
  nameGR?: string;
  desc?: string;
  price: number;
  badge?: string;
  badgeColor?: string;
  imageUrl?: string;
  calories?: string | number;
  allergens?: string[];
  isSpicy?: boolean;
  isVeggie?: boolean;
  spiceLevel?: number;
  isAvailable?: boolean;
  isSoldOut?: boolean;
  categoryBadge?: string;
}

export interface MenuBoardScreenConfig {
  slotId?: number;
  screenNumber?: number;
  title: string;
  subtitle?: string;
  categoryBadge?: string;
  layoutType: LayoutPresetType | string;
  heroLayout?: boolean;
  activeDaypart?: string;
  boardImageUrl?: string;
  items: MenuBoardItem[];
  isOnline?: boolean;
  updatedAt?: string | Date;
}

/**
 * 7-Screen Canonical Master Configuration
 */
export const CANONICAL_SCREEN_CONFIGS: Record<number, MenuBoardScreenConfig> = {
  1: {
    slotId: 1,
    screenNumber: 1,
    title: "BERLIN ROTISSERIE HERO",
    subtitle: "BITE THE HYPE · THE FIRST REAL GERMAN DÖNER IN CYPRUS",
    categoryBadge: "FLAGSHIP ROTISSERIE",
    layoutType: "PROMO_HERO",
    heroLayout: true,
    activeDaypart: "AUTO",
    boardImageUrl: "/assets/boards/board-1-doener-wraps-bigs-bowls.jpg",
    items: [
      {
        id: "prod-big-b",
        name: "The Big B (Beef Döner)",
        nameDE: "Big B Berliner Fladenbrot",
        desc: "Carved rotisserie beef, original Berlin flatbread, crisp red cabbage, fresh tomatoes, cucumber, onions, homemade cocktail sauce.",
        price: 11.90,
        badge: "BITE THE HYPE",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/products/big-b-doener.jpg",
        isAvailable: true,
      },
      {
        id: "prod-big-chick",
        name: "Big Chick (Chicken Döner)",
        nameDE: "Big Chick Berliner Fladenbrot",
        desc: "Carved rotisserie chicken, original Berlin flatbread, crisp red cabbage, fresh tomatoes, onions, garlic herb sauce.",
        price: 11.90,
        badge: "POPULAR",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/products/big-chick.webp",
        isAvailable: true,
      },
      {
        id: "prod-beef-wrap",
        name: "Beef Wrap",
        nameDE: "Rind Dürüm Wrap",
        desc: "Beef döner rolled warm in thin flatbread, lettuce, tomatoes, cucumber, onions, red cabbage, cocktail sauce.",
        price: 9.90,
        badge: "BESTSELLER",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/products/beef-wrap.jpg",
        isAvailable: true,
      },
      {
        id: "prod-doener-burger-cheese",
        name: "Cheese Döner Burger",
        nameDE: "Käse Döner Burger",
        desc: "Carved döner meat, melted cheese, lettuce, tomatoes, cucumber, onions, red cabbage, BBQ sauce.",
        price: 7.50,
        imageUrl: "/assets/menu/products/cheese-doener.webp",
        isAvailable: true,
      },
    ],
  },
  2: {
    slotId: 2,
    screenNumber: 2,
    title: "PIZZAS, TACOS, BURGERS & DOEZZA",
    subtitle: "FRESH STONE-BAKED PIZZAS & SIGNATURE STREET FOOD",
    categoryBadge: "PIZZA & BURGERS",
    layoutType: "PRICE_MATRIX",
    activeDaypart: "AUTO",
    boardImageUrl: "/assets/boards/board-2-burgers-pizzas-doezza.jpg",
    items: [
      {
        id: "prod-pizza-margherita",
        name: "Margherita Pizza",
        nameDE: "Pizza Margherita",
        desc: "Tomato sauce, mozzarella, tomatoes · Second pizza 20% off",
        price: 15.90,
        badge: "20% OFF 2ND",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/products/pizza-margherita.webp",
        isAvailable: true,
      },
      {
        id: "prod-pizza-chicken",
        name: "Chicken Doener Pizza",
        nameDE: "Hähnchen Döner Pizza",
        desc: "Tomato sauce, mozzarella, chicken döner, tomatoes, onions, choice of sauce",
        price: 17.90,
        badge: "TOP SELLER",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/products/chicken-doener-pizza.jpg",
        isAvailable: true,
      },
      {
        id: "prod-taco-beef",
        name: "Beef Taco",
        nameDE: "Rindfleisch Taco",
        desc: "Beef, onions, lettuce, cucumber, tomatoes, red cabbage, BBQ sauce · 4 tacos 11.90€",
        price: 3.50,
        badge: "4 FOR €11.90",
        badgeColor: "bg-[#00FCED] text-black",
        imageUrl: "/assets/menu/products/beef-taco.jpg",
        isAvailable: true,
      },
      {
        id: "prod-burger-beefster",
        name: "Beefster Burger",
        nameDE: "Beefster Burger",
        desc: "MYGD signature beef burger on toasted brioche bun",
        price: 7.95,
        badge: "CHEF CHOICE",
        badgeColor: "bg-[#E5A93C]",
        imageUrl: "/assets/menu/products/burger-beefster.webp",
        isAvailable: true,
      },
      {
        id: "prod-burger-cheesy",
        name: "CHEESY GD Burger",
        nameDE: "Cheesy GD Burger",
        desc: "Double melted cheese döner burger with signature toppings",
        price: 9.95,
        badge: "POPULAR",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/products/burger-cheesy-gd.webp",
        isAvailable: true,
      },
      {
        id: "prod-doezza-margherita",
        name: "MYGD Doezza Margherita",
        nameDE: "Doezza Margherita",
        desc: "Crispy stone-baked Turkish flatbread pizza slice",
        price: 6.50,
        imageUrl: "/assets/menu/products/doezza-margherita.webp",
        isAvailable: true,
      },
    ],
  },
  3: {
    slotId: 3,
    screenNumber: 3,
    title: "BOWLS, LOADED FRIES, NUGGETS & WINGS",
    subtitle: "OVER CRISPY BERLIN FRIES OR AROMATIC WHITE RICE",
    categoryBadge: "BOWLS & LOADED FRIES",
    layoutType: "PRICE_MATRIX",
    activeDaypart: "AUTO",
    boardImageUrl: "/assets/boards/board-3-loaded-fries-nuggets-wings-meatballs.jpg",
    items: [
      {
        id: "prod-bowl-beef",
        name: "Beef Bowl",
        nameDE: "Rindfleisch Bowl",
        desc: "Beef döner, white rice or fries, lettuce, tomatoes, cucumbers, red cabbage, onions, sauce of choice",
        price: 9.90,
        badge: "TOP SELLER",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/products/doener-bowl.jpg",
        isAvailable: true,
      },
      {
        id: "prod-bowl-chicken",
        name: "Chicken Bowl",
        nameDE: "Hähnchen Bowl",
        desc: "Chicken döner, white rice or fries, lettuce, cucumber, tomatoes, red cabbage, onions, sauce of choice",
        price: 9.90,
        badge: "BESTSELLER",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/products/chicken-bowl.webp",
        isAvailable: true,
      },
      {
        id: "prod-loaded-hollandaise",
        name: "Hollandaise Loaded Fries",
        nameDE: "Hollandaise Pommes",
        desc: "Crispy fries smothered in rich warm hollandaise sauce",
        price: 7.90,
        badge: "CHEF CHOICE",
        badgeColor: "bg-[#E5A93C]",
        imageUrl: "/assets/menu/products/loaded-hollandaise.webp",
        isAvailable: true,
      },
      {
        id: "prod-loaded-jalapeno",
        name: "Jalapeño Sour Cream Fries",
        nameDE: "Jalapeño Sauerrahm Pommes",
        desc: "Crispy fries, sliced jalapeños, cool sour cream & herb seasoning",
        price: 7.90,
        badge: "🔥 SPICY",
        badgeColor: "bg-[#E53935]",
        isSpicy: true,
        imageUrl: "/assets/menu/products/loaded-jalapeno.webp",
        isAvailable: true,
      },
      {
        id: "prod-nuggets-6",
        name: "Chicken Nuggets (6 pcs)",
        nameDE: "Chicken Nuggets (6 Stk)",
        desc: "Crispy golden chicken nuggets with dipping sauce",
        price: 4.90,
        imageUrl: "/assets/menu/products/chicken-nuggets.webp",
        isAvailable: true,
      },
      {
        id: "prod-wings-6",
        name: "Chicken Wings (6 pcs)",
        nameDE: "Chicken Wings (6 Stk)",
        desc: "Crispy seasoned chicken wings with sauce",
        price: 5.90,
        imageUrl: "/assets/menu/products/chicken-wings.webp",
        isAvailable: true,
      },
      {
        id: "prod-meatballs-6",
        name: "Meatballs (6 pcs)",
        nameDE: "Köfte Fleischbällchen (6 Stk)",
        desc: "Served with fries or white rice & hollandaise sauce",
        price: 7.50,
        badge: "POPULAR",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/products/meatballs.webp",
        isAvailable: true,
      },
    ],
  },
  4: {
    slotId: 4,
    screenNumber: 4,
    title: "FRIES, SIDES, KIDS MEAL & SALADS",
    subtitle: "DOUBLE-FRIED CRUNCHY FRIES & FRESH MEDITERRANEAN GREENS",
    categoryBadge: "FRIES & SIDES",
    layoutType: "SPLIT_COMBO",
    activeDaypart: "AUTO",
    boardImageUrl: "/assets/boards/board-4-drinks-beers-smoothies-coffee.jpg",
    items: [
      {
        id: "prod-kids-meal",
        name: "Kids Meal Box",
        nameDE: "Kindermenü Box",
        desc: "Kids Döner / 4 Nuggets / 4 Meatballs + Kinder Riegel + Drink + Small fries",
        price: 5.00,
        badge: "KIDS SPECIAL",
        badgeColor: "bg-[#00FCED] text-black",
        imageUrl: "/assets/menu/products/kids-meal.webp",
        isAvailable: true,
      },
      {
        id: "prod-crunchy-fries",
        name: "Crunchy Fries (Regular)",
        nameDE: "Knusprige Pommes",
        desc: "Double-fried crispy fries + 1 sauce (Ketchup or Mayo)",
        price: 2.50,
        badge: "POPULAR",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/products/crunchy-fries.webp",
        isAvailable: true,
      },
      {
        id: "prod-sweet-potato",
        name: "Sweet Potato Fries (Regular)",
        nameDE: "Süßkartoffel-Pommes",
        desc: "Crispy sweet potato fries + 1 sauce (Ketchup or Mayo)",
        price: 2.90,
        imageUrl: "/assets/menu/products/sweet-potato-fries.webp",
        isAvailable: true,
      },
      {
        id: "prod-make-menu",
        name: "Make It A Menu Combo",
        nameDE: "Menü Upgrade",
        desc: "Choose Fries or White Rice + 0.4L drink · Regular €3.00 / Medium €3.50 / Large €4.50",
        price: 3.00,
        badge: "⭐ BEST VALUE",
        badgeColor: "bg-[#00FCED] text-black",
        imageUrl: "/assets/menu/upgrade/combo.jpg",
        isAvailable: true,
      },
      {
        id: "prod-mozzarella-sticks",
        name: "Mozzarella Sticks (6 pcs)",
        nameDE: "Mozzarella-Sticks (6 Stk)",
        desc: "Crispy crumbed mozzarella sticks with 1 dipping sauce",
        price: 5.90,
        imageUrl: "/assets/menu/products/mozzarella-sticks.webp",
        isAvailable: true,
      },
      {
        id: "prod-salad-green",
        name: "Green Salad",
        nameDE: "Grüner Salat",
        desc: "Lettuce, cucumber, tomatoes, red cabbage, onion with vinegar & oil dressing",
        price: 6.90,
        badge: "🌱 VEGAN",
        badgeColor: "bg-[#4CAF50]",
        isVeggie: true,
        imageUrl: "/assets/menu/products/salad-garden.webp",
        isAvailable: true,
      },
      {
        id: "prod-salad-halloumi",
        name: "Halloumi Salad",
        nameDE: "Halloumi Salat",
        desc: "Crisp fresh salad topped with grilled Cyprus PDO halloumi",
        price: 8.90,
        badge: "CYPRUS SPECIAL",
        badgeColor: "bg-[#00FCED] text-black",
        isVeggie: true,
        imageUrl: "/assets/menu/products/salad-halloumi.webp",
        isAvailable: true,
      },
    ],
  },
  5: {
    slotId: 5,
    screenNumber: 5,
    title: "SMOOTHIES, SHAKES, WATER & ENERGY",
    subtitle: "100% REAL FRUIT BLENDS, THICK SHAKES & REFRESHMENTS",
    categoryBadge: "SMOOTHIES & SHAKES",
    layoutType: "SPLIT_COMBO",
    activeDaypart: "AUTO",
    boardImageUrl: "/assets/boards/board-5-sides-fries-kids-meal.jpg",
    items: [
      {
        id: "prod-smoothie-tropical",
        name: "Tropical Twist Smoothie",
        nameDE: "Tropical Twist Smoothie",
        desc: "Mango, pineapple, passion fruit pure fruit blend",
        price: 2.99,
        badge: "REFRESHING",
        badgeColor: "bg-[#E5A93C]",
        imageUrl: "/assets/menu/products/smoothies-blend.webp",
        isAvailable: true,
      },
      {
        id: "prod-smoothie-berry",
        name: "Berry Booster Smoothie",
        nameDE: "Berry Booster Smoothie",
        desc: "Strawberry, blueberry, raspberry antioxidant power blend",
        price: 2.99,
        badge: "VITAMIN BOOST",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/products/smoothies-blend.webp",
        isAvailable: true,
      },
      {
        id: "prod-shake-strawberry",
        name: "Strawberry Milkshake",
        nameDE: "Erdbeer-Milchshake",
        desc: "Creamy whole milk and strawberry puree blend",
        price: 2.90,
        imageUrl: "/assets/menu/products/milkshakes-trio.webp",
        isAvailable: true,
      },
      {
        id: "prod-shake-chocolate",
        name: "Chocolate Milkshake",
        nameDE: "Schoko-Milchshake",
        desc: "Rich Belgian chocolate and creamy whole milk shake",
        price: 2.90,
        imageUrl: "/assets/menu/products/milkshakes-trio.webp",
        isAvailable: true,
      },
      {
        id: "prod-ayran",
        name: "Authentic Ayran (0.5L)",
        nameDE: "Original Ayran (0,5L)",
        desc: "Traditional chilled salted yoghurt drink — perfect döner pairing",
        price: 3.50,
        badge: "TRADITIONAL",
        badgeColor: "bg-[#00FCED] text-black",
        imageUrl: "/assets/menu/products/water-ayran.webp",
        isAvailable: true,
      },
      {
        id: "prod-redbull",
        name: "Red Bull Energy Drink",
        nameDE: "Red Bull Energy Drink",
        desc: "Vitalizes body and mind (250ml can)",
        price: 3.00,
        imageUrl: "/assets/menu/products/red-bull.webp",
        isAvailable: true,
      },
      {
        id: "prod-cocoloco",
        name: "Cocoloco Energy Drink",
        nameDE: "Cocoloco Energy Drink",
        desc: "Refreshing coconut energy boost",
        price: 2.50,
        badge: "NEW",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/products/coco-loco.webp",
        isAvailable: true,
      },
    ],
  },
  6: {
    slotId: 6,
    screenNumber: 6,
    title: "BEERS, WINE, SOFT DRINKS & COFFEE",
    subtitle: "GERMAN MUNICH DRAFT, CRAFT SODAS & SPECIALTY COFFEE",
    categoryBadge: "BAR & COFFEE",
    layoutType: "PRICE_MATRIX",
    activeDaypart: "AUTO",
    boardImageUrl: "/assets/boards/board-6-smoothies-shakes-kombucha.jpg",
    items: [
      {
        id: "prod-beer-draft-500",
        name: "Hofbräu München Draft (0.5L)",
        nameDE: "Hofbräu München Fassbier (0,5L)",
        desc: "Authentic German premium Munich draft lager (5.1% ABV)",
        price: 6.00,
        badge: "GERMAN DRAFT",
        badgeColor: "bg-[#E5A93C]",
        imageUrl: "/assets/menu/products/drink-draft-beer.webp",
        isAvailable: true,
      },
      {
        id: "prod-beer-corona",
        name: "Corona Extra",
        nameDE: "Corona Extra Flasche",
        desc: "Chilled Mexican pale lager served with fresh lime",
        price: 4.00,
        imageUrl: "/assets/menu/products/drink-bottled-beer.webp",
        isAvailable: true,
      },
      {
        id: "prod-beer-keo",
        name: "KEO Beer (Cyprus)",
        nameDE: "KEO Bier Flasche",
        desc: "Cyprus beloved golden lager (330ml bottle)",
        price: 3.00,
        badge: "LOCAL FAVORITE",
        badgeColor: "bg-[#00FCED] text-black",
        imageUrl: "/assets/menu/products/drink-bottled-beer.webp",
        isAvailable: true,
      },
      {
        id: "prod-wine",
        name: "Red Wine / White Wine",
        nameDE: "Rotwein / Weißwein",
        desc: "Chilled glass of selected Mediterranean wine",
        price: 4.00,
        imageUrl: "/assets/menu/products/drink-wine.webp",
        isAvailable: true,
      },
      {
        id: "prod-soft-postmix",
        name: "Postmix Soft Drinks (0.4L)",
        nameDE: "Softdrinks Postmix (0,4L)",
        desc: "Coca-Cola, Coca-Cola Zero, Fanta Zero, Sprite, Soda",
        price: 2.50,
        imageUrl: "/assets/menu/products/drink-postmix-soda.webp",
        isAvailable: true,
      },
      {
        id: "prod-canned-drinks",
        name: "Canned Drinks (330ml)",
        nameDE: "Getränkedosen (330ml)",
        desc: "Fanta Lemon, Lipton Ice Tea Peach, Lipton Ice Tea Lemon",
        price: 2.50,
        imageUrl: "/assets/menu/products/drink-canned-soda.webp",
        isAvailable: true,
      },
      {
        id: "prod-coffee",
        name: "Espresso Roast Coffee",
        nameDE: "Espresso Kaffee",
        desc: "Freshly pulled rich Italian espresso",
        price: 2.00,
        imageUrl: "/assets/menu/products/coffee-espresso.webp",
        isAvailable: true,
      },
    ],
  },
  7: {
    slotId: 7,
    screenNumber: 7,
    title: "12 SIGNATURE SAUCES BAR",
    subtitle: "CRAFTED IN-HOUSE EVERY MORNING FOR REAL GERMAN DÖNER",
    categoryBadge: "SAUCE CRAFT",
    layoutType: "PRICE_MATRIX",
    activeDaypart: "AUTO",
    boardImageUrl: "/assets/boards/board-7-sauces-showcase.jpg",
    items: [
      {
        id: "prod-sauce-garlic",
        name: "Garlic Sauce (Knoblauch)",
        nameDE: "Knoblauchsauce",
        desc: "Rich creamy roasted garlic döner sauce",
        price: 0.00,
        badge: "SIGNATURE",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/sauces/sauce-garlic.webp",
        isAvailable: true,
      },
      {
        id: "prod-sauce-cocktail",
        name: "Cocktail Sauce",
        nameDE: "Cocktailsauce",
        desc: "Classic Berlin orange döner sauce with herbs",
        price: 0.00,
        badge: "BERLIN CLASSIC",
        badgeColor: "bg-[#E5067E]",
        imageUrl: "/assets/menu/sauces/sauce-cocktail.webp",
        isAvailable: true,
      },
      {
        id: "prod-sauce-hot-spicy",
        name: "Hot Spicy (Scharf)",
        nameDE: "Scharfe Sauce",
        desc: "Crushed chili, cayenne and pepper flakes",
        price: 0.00,
        badge: "🔥 HOT",
        badgeColor: "bg-[#E53935]",
        isSpicy: true,
        imageUrl: "/assets/menu/sauces/sauce-hot-spicy.webp",
        isAvailable: true,
      },
      {
        id: "prod-sauce-tzatziki",
        name: "Tzatziki",
        nameDE: "Tzatziki",
        desc: "Strained Greek yogurt, cucumber, garlic & dill",
        price: 0.00,
        imageUrl: "/assets/menu/sauces/sauce-tzatziki.webp",
        isAvailable: true,
      },
      {
        id: "prod-sauce-cheese-hot",
        name: "Cheese Hot",
        nameDE: "Käse Scharf",
        desc: "Warm melted spiced cheese blend",
        price: 0.00,
        badge: "POPULAR",
        badgeColor: "bg-[#E5A93C]",
        imageUrl: "/assets/menu/sauces/sauce-cheese-hot.webp",
        isAvailable: true,
      },
      {
        id: "prod-sauce-vegan-garlic",
        name: "Vegan Garlic",
        nameDE: "Vegane Knoblauchsauce",
        desc: "100% plant-based creamy garlic dressing",
        price: 0.00,
        badge: "🌱 VEGAN",
        badgeColor: "bg-[#4CAF50]",
        isVeggie: true,
        imageUrl: "/assets/menu/sauces/sauce-vegan-garlic.webp",
        isAvailable: true,
      },
    ],
  },
};

/**
 * Resolves active operational daypart based on current time or numerical hour:
 * - LUNCH: 11:00 to 16:00 (11.00 <= h < 16.00)
 * - DINNER: 16:00 to 23:00 (16.00 <= h < 23.00)
 * - LATE_NIGHT: 23:00 to 04:00 (23.00 <= h or h < 4.00)
 * - MORNING: 04:00 to 11:00 (4.00 <= h < 11.00)
 * Handles modulo 24 normalization for negative numbers and overflow.
 */
export function resolveActiveDaypart(hourOrDate: number | Date): DaypartType {
  let h: number;

  if (hourOrDate instanceof Date) {
    h =
      hourOrDate.getHours() +
      hourOrDate.getMinutes() / 60 +
      hourOrDate.getSeconds() / 3600 +
      hourOrDate.getMilliseconds() / 3600000;
  } else if (typeof hourOrDate === "number") {
    h = ((hourOrDate % 24) + 24) % 24;
  } else {
    const now = new Date();
    h = now.getHours() + now.getMinutes() / 60;
  }

  if (h >= 11 && h < 16) {
    return "LUNCH";
  } else if (h >= 16 && h < 23) {
    return "DINNER";
  } else if (h >= 23 || h < 4) {
    return "LATE_NIGHT";
  } else {
    return "MORNING";
  }
}

/**
 * Validates layout type preset.
 * Only exact strings 'PROMO_HERO', 'PRICE_MATRIX', 'SPLIT_COMBO' are accepted.
 */
export function validateLayoutType(layoutType: any): boolean {
  if (typeof layoutType !== "string") return false;
  return layoutType === "PROMO_HERO" || layoutType === "PRICE_MATRIX" || layoutType === "SPLIT_COMBO";
}

/**
 * Resolves screen configuration for a given screen slot (1-7), applying live inventory overlays (isSoldOut).
 * Guarantees immutability of the input configs.
 */
export function resolveScreenConfig(
  screenNumber: number,
  configs: any[] | Record<string | number, any> | Map<string | number, any>,
  liveInventory?: any
): MenuBoardScreenConfig {
  let targetConfig: any = null;

  if (Array.isArray(configs)) {
    targetConfig = configs.find(
      (c) =>
        c?.screenNumber === screenNumber ||
        c?.slotId === screenNumber ||
        c?.id === screenNumber ||
        c?.id === String(screenNumber)
    );
    if (!targetConfig && configs.length > 0) {
      targetConfig = configs[screenNumber - 1] || configs[0];
    }
  } else if (configs instanceof Map) {
    targetConfig = configs.get(screenNumber) || configs.get(String(screenNumber));
  } else if (configs && typeof configs === "object") {
    targetConfig = configs[screenNumber] || configs[String(screenNumber)];
  }

  if (!targetConfig) {
    targetConfig =
      CANONICAL_SCREEN_CONFIGS[screenNumber] ||
      CANONICAL_SCREEN_CONFIGS[1] || {
        slotId: screenNumber,
        screenNumber,
        title: `SCREEN ${screenNumber}`,
        subtitle: "MY GERMAN DÖNER",
        categoryBadge: "MENU",
        layoutType: "PRICE_MATRIX",
        items: [],
      };
  }

  // Parse items if stored as JSON string (e.g. from Prisma itemsJson)
  let itemsList: any[] = targetConfig.items;
  if (!itemsList && typeof targetConfig.itemsJson === "string") {
    try {
      itemsList = JSON.parse(targetConfig.itemsJson);
    } catch {
      itemsList = [];
    }
  }

  // Deep clone to guarantee immutability
  const resolved: MenuBoardScreenConfig = JSON.parse(
    JSON.stringify({
      ...targetConfig,
      items: Array.isArray(itemsList) ? itemsList : targetConfig.items || [],
    })
  );

  if (typeof resolved.items === "string") {
    try {
      resolved.items = JSON.parse(resolved.items);
    } catch {
      resolved.items = [];
    }
  }

  if (Array.isArray(resolved.items)) {
    resolved.items = resolved.items.map((item: any) => {
      const clonedItem = { ...item };
      const itemId = clonedItem.id;

      let isAvail: boolean | undefined = undefined;

      if (liveInventory !== undefined && liveInventory !== null) {
        if (Array.isArray(liveInventory)) {
          const entry = liveInventory.find(
            (inv: any) =>
              inv?.id === itemId || inv?.productId === itemId || inv?.sku === itemId
          );
          if (entry !== undefined) {
            if (typeof entry === "boolean") {
              isAvail = entry;
            } else if (entry && typeof entry === "object") {
              if (entry.isAvailable !== undefined) isAvail = Boolean(entry.isAvailable);
              else if (entry.isSoldOut !== undefined) isAvail = !entry.isSoldOut;
              else if (entry.currentStock !== undefined) isAvail = entry.currentStock > 0;
            }
          }
        } else if (liveInventory instanceof Map) {
          if (liveInventory.has(itemId)) {
            const entry = liveInventory.get(itemId);
            if (typeof entry === "boolean") {
              isAvail = entry;
            } else if (entry && typeof entry === "object") {
              if (entry.isAvailable !== undefined) isAvail = Boolean(entry.isAvailable);
              else if (entry.isSoldOut !== undefined) isAvail = !entry.isSoldOut;
              else if (entry.currentStock !== undefined) isAvail = entry.currentStock > 0;
            }
          }
        } else if (typeof liveInventory === "object") {
          if (itemId in liveInventory) {
            const entry = liveInventory[itemId];
            if (typeof entry === "boolean") {
              isAvail = entry;
            } else if (entry && typeof entry === "object") {
              if (entry.isAvailable !== undefined) isAvail = Boolean(entry.isAvailable);
              else if (entry.isSoldOut !== undefined) isAvail = !entry.isSoldOut;
              else if (entry.currentStock !== undefined) isAvail = entry.currentStock > 0;
            }
          }
        }
      }

      if (isAvail === false) {
        clonedItem.isSoldOut = true;
        clonedItem.isAvailable = false;
        clonedItem.badge = "SOLD OUT";
      } else if (isAvail === true) {
        clonedItem.isSoldOut = false;
        clonedItem.isAvailable = true;
      } else if (isAvail === undefined) {
        if (clonedItem.isSoldOut === true || clonedItem.isAvailable === false) {
          clonedItem.isSoldOut = true;
          clonedItem.isAvailable = false;
          if (!clonedItem.badge) clonedItem.badge = "SOLD OUT";
        } else if (liveInventory !== undefined && liveInventory !== null) {
          clonedItem.isSoldOut = clonedItem.isSoldOut ?? false;
          clonedItem.isAvailable = clonedItem.isAvailable ?? true;
        }
      }

      return clonedItem;
    });
  }

  return resolved;
}
