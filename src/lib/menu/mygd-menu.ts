// MY GERMAN DÖNER — Official menu (single source of truth in code).
//
// [ADR] Context: the menu was copied into the seed, the offline API fallback, two board
// engines, the /order page and POS literals, and the copies had drifted apart.
// Decision: this file is the only place menu content lives in source. The seed writes it to
// the database; every screen reads the database through /api/menu and /api/menuboards, and
// falls back to the derived views of this file only when the database is unreachable.
// Consequence: a price change is one edit here plus `npm run db:seed` (or an admin edit in the DB).
//
// Plain TypeScript with no imports, so the seed (tsx), the Next.js app and node tests can all load it.

export type MenuVat = "FOOD_BEV" | "ALCOHOL";
export type MenuSectionKind = "FOOD" | "DRINK";

export interface MenuItemDef {
  readonly sku: string;
  readonly name: string;
  /** Ingredients as printed on the menu. */
  readonly description?: string;
  readonly price: number;
  readonly isVeggie?: boolean;
  readonly isSpicy?: boolean;
  /** "Make it a menu" (fries or rice + 0.4L drink) can be added. */
  readonly allowMealUpgrade?: boolean;
  /** Modifier group slugs, in display order. */
  readonly modifierGroups?: readonly string[];
}

export interface MenuSectionDef {
  readonly slug: string;
  readonly name: string;
  readonly nameDE: string;
  readonly nameGR: string;
  readonly kind: MenuSectionKind;
  readonly vat: MenuVat;
  /** Line printed under the section heading, e.g. "1 sauce included". */
  readonly note?: string;
  readonly imageUrl: string;
  readonly items: readonly MenuItemDef[];
}

export interface MenuItem extends MenuItemDef {
  readonly sectionSlug: string;
  readonly vat: MenuVat;
  readonly imageUrl: string;
  readonly sortOrder: number;
}

export interface ModifierOptionDef {
  readonly slug: string;
  readonly name: string;
  readonly price: number;
  readonly isDefault?: boolean;
}

export interface ModifierGroupDef {
  readonly slug: string;
  readonly name: string;
  readonly minSelected: number;
  readonly maxSelected: number;
  readonly isRequired: boolean;
  readonly options: readonly ModifierOptionDef[];
}

export type PromotionRule =
  | { readonly type: "NTH_ITEM_PERCENT"; readonly sectionSlug: string; readonly nth: number; readonly percent: number }
  | { readonly type: "BUNDLE_PRICE"; readonly sectionSlug: string; readonly quantity: number; readonly bundlePrice: number };

export interface PromotionDef {
  readonly code: string;
  readonly name: string;
  readonly rule: PromotionRule;
}

export interface MenuBoardDef {
  readonly screenNumber: number;
  readonly title: string;
  readonly subtitle: string;
  readonly layoutType: "PRICE_MATRIX" | "SPLIT_COMBO" | "DRINKS_SIDES";
  readonly bannerMessage?: string;
  readonly sectionSlugs: readonly string[];
}

// ---------------------------------------------------------------------------
// Sauces and modifier groups
// ---------------------------------------------------------------------------

export const MYGD_SAUCES: readonly ModifierOptionDef[] = [
  { slug: "garlic", name: "Garlic", price: 0 },
  { slug: "bbq", name: "BBQ", price: 0 },
  { slug: "honey-mustard", name: "Honey Mustard", price: 0 },
  { slug: "cheese-hot", name: "Cheese Hot", price: 0 },
  { slug: "tzatziki", name: "Tzatziki", price: 0 },
  { slug: "sour-cream", name: "Sour Cream", price: 0 },
  { slug: "lemon-herb", name: "Lemon Herb", price: 0 },
  { slug: "cocktail", name: "Cocktail", price: 0 },
  { slug: "hot-spicy", name: "Hot Spicy", price: 0 },
  { slug: "vegan-garlic", name: "Vegan Garlic", price: 0 },
  { slug: "mayonnaise", name: "Mayonnaise", price: 0 },
  { slug: "ketchup", name: "Ketchup", price: 0 },
];

/** Postmix soft drinks served as the 0.4L menu drink. */
const POSTMIX_DRINKS = ["Coca-Cola", "Coca-Cola Zero", "Fanta Zero", "Sprite", "Sprite Zero", "Sparkling Water"] as const;

const slugify = (value: string): string =>
  value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const MYGD_MODIFIER_GROUPS: readonly ModifierGroupDef[] = [
  { slug: "sauce-choice", name: "Sauce of your choice", minSelected: 1, maxSelected: 1, isRequired: true, options: MYGD_SAUCES },
  {
    slug: "fries-sauce-1",
    name: "1 sauce included",
    minSelected: 1,
    maxSelected: 1,
    isRequired: true,
    options: [
      { slug: "ketchup", name: "Ketchup", price: 0, isDefault: true },
      { slug: "mayo", name: "Mayo", price: 0 },
    ],
  },
  {
    slug: "fries-sauce-2",
    name: "2 sauces included",
    minSelected: 1,
    maxSelected: 1,
    isRequired: true,
    options: [
      { slug: "ketchup-ketchup", name: "2× Ketchup", price: 0 },
      { slug: "mayo-mayo", name: "2× Mayo", price: 0 },
      { slug: "ketchup-mayo", name: "Ketchup + Mayo", price: 0, isDefault: true },
    ],
  },
  {
    slug: "bowl-base",
    name: "White rice or fries",
    minSelected: 1,
    maxSelected: 1,
    isRequired: true,
    options: [
      { slug: "white-rice", name: "White Rice", price: 0, isDefault: true },
      { slug: "fries", name: "Fries", price: 0 },
    ],
  },
  {
    slug: "meatballs-side",
    name: "Fries or white rice (with hollandaise sauce)",
    minSelected: 1,
    maxSelected: 1,
    isRequired: true,
    options: [
      { slug: "fries", name: "Fries", price: 0, isDefault: true },
      { slug: "white-rice", name: "White Rice", price: 0 },
    ],
  },
  {
    slug: "kids-main",
    name: "Kids main",
    minSelected: 1,
    maxSelected: 1,
    isRequired: true,
    options: [
      { slug: "kids-doener", name: "Kids Doener", price: 0, isDefault: true },
      { slug: "chicken-nuggets-4", name: "4 Chicken Nuggets", price: 0 },
      { slug: "meatballs-4", name: "4 Meatballs", price: 0 },
    ],
  },
  {
    slug: "kids-drink",
    name: "Kids drink",
    minSelected: 1,
    maxSelected: 1,
    isRequired: true,
    options: [
      { slug: "water", name: "Water", price: 0, isDefault: true },
      { slug: "juice", name: "Juice", price: 0 },
    ],
  },
  {
    slug: "make-it-a-menu",
    name: "Make it a menu (fries or white rice + 0.4L drink)",
    minSelected: 0,
    maxSelected: 1,
    isRequired: false,
    options: [
      { slug: "regular", name: "Regular Menu", price: 3.0 },
      { slug: "medium", name: "Medium Menu", price: 3.5 },
      { slug: "large", name: "Large Menu", price: 4.5 },
    ],
  },
  {
    slug: "menu-side",
    name: "Menu side",
    minSelected: 0,
    maxSelected: 1,
    isRequired: false,
    options: [
      { slug: "fries", name: "Fries", price: 0, isDefault: true },
      { slug: "white-rice", name: "White Rice", price: 0 },
    ],
  },
  {
    slug: "menu-drink",
    name: "Menu drink (0.4L)",
    minSelected: 0,
    maxSelected: 1,
    isRequired: false,
    options: POSTMIX_DRINKS.map((d, i) => ({ slug: slugify(d), name: `${d} (0.4L)`, price: 0, isDefault: i === 0 })),
  },
];

/** Groups that only apply when a "make-it-a-menu" size is chosen. */
export const MEAL_UPGRADE_GROUPS = ["make-it-a-menu", "menu-side", "menu-drink"] as const;

const MEAL: Pick<MenuItemDef, "allowMealUpgrade" | "modifierGroups"> = {
  allowMealUpgrade: true,
  modifierGroups: MEAL_UPGRADE_GROUPS,
};

// ---------------------------------------------------------------------------
// Photos (placeholders until product photography is delivered)
// ---------------------------------------------------------------------------

const img = (id: string): string => `https://images.unsplash.com/photo-${id}?w=1200&auto=format&fit=crop&q=85`;
const PHOTO = {
  pizza: img("1574071318508-1cdbab80d002"),
  taco: img("1565299585323-38d6b0865b47"),
  doezza: img("1513104890138-7c749659a591"),
  burger: img("1568901346375-23c9450c58cd"),
  doener: img("1561651823-34feb02250e4"),
  wrap: img("1626700051175-6818013e1d4f"),
  bowl: img("1546069901-ba9599a7e63c"),
  nuggets: img("1562967914-608f82629710"),
  wings: img("1527477378408-1bc09c21311b"),
  fries: img("1573080496219-bb080dd4f877"),
  loaded: img("1585109649139-366815a0d713"),
  salad: img("1540420773420-3366772f4999"),
  meatballs: img("1529042410759-befb1204b468"),
  mozzarella: img("1548340748-6d2b7d7da280"),
  smoothie: img("1505252585461-04db1eb84625"),
  shake: img("1572490122747-3968b75cc699"),
  juice: img("1600271886742-f049cd451bba"),
  ayran: img("1571212515416-fef01fc43637"),
  energy: img("1622543925917-763c34d1a86e"),
  kombucha: img("1595981267035-7b04ca84a82d"),
  beer: img("1608270586620-248524c67de9"),
  wine: img("1510812431401-41d2bd2722f3"),
  soft: img("1622483767028-3f66f32aef97"),
  coffee: img("1534778101976-62847782c213"),
} as const;

const SALAD = "lettuce, tomatoes, cucumber, onions, red cabbage";

// ---------------------------------------------------------------------------
// Menu sections (order = menu order)
// ---------------------------------------------------------------------------

export const MYGD_MENU_SECTIONS: readonly MenuSectionDef[] = [
  {
    slug: "pizza", name: "Pizza", nameDE: "Pizza", nameGR: "Πίτσα", kind: "FOOD", vat: "FOOD_BEV",
    note: "Offer: second pizza 20% off", imageUrl: PHOTO.pizza,
    items: [
      { sku: "MYGD-PIZZA-MARGHERITA", name: "Margherita", price: 15.9, isVeggie: true, description: "Tomato sauce, mozzarella, tomatoes" },
      { sku: "MYGD-PIZZA-FUNGHI", name: "Funghi", price: 16.9, isVeggie: true, description: "Tomato sauce, mozzarella, mushrooms, tomatoes" },
      { sku: "MYGD-PIZZA-SALAMI", name: "Salami", price: 16.9, description: "Tomato sauce, mozzarella, salami, tomatoes" },
      { sku: "MYGD-PIZZA-FIVE-CHEESE", name: "Five Cheese", price: 17.5, isVeggie: true, description: "Tomato sauce, mozzarella, gorgonzola, edam, gouda, feta" },
      {
        sku: "MYGD-PIZZA-CHICKEN-DOENER", name: "Chicken Doener Pizza", price: 17.9,
        description: "Tomato sauce, mozzarella, chicken doener, tomatoes, onions, 1 sauce of your choice",
        modifierGroups: ["sauce-choice"],
      },
    ],
  },
  {
    slug: "tacos", name: "Tacos", nameDE: "Tacos", nameGR: "Τάκος", kind: "FOOD", vat: "FOOD_BEV",
    note: "Offer: 4 tacos €11.90", imageUrl: PHOTO.taco,
    items: [
      { sku: "MYGD-TACO-BEEF", name: "Beef Taco", price: 3.5, description: "Beef, onions, lettuce, cucumber, tomatoes, red cabbage, BBQ sauce" },
      { sku: "MYGD-TACO-BEEF-JALAPENO", name: "Beef Taco with Jalapeños", price: 3.5, isSpicy: true, description: "Beef, onions, lettuce, cucumber, tomato sauce, red cabbage, jalapeños, sour cream" },
      { sku: "MYGD-TACO-CHICKEN", name: "Chicken Taco", price: 3.5, description: "Chicken, onions, lettuce, cucumber, tomatoes, red cabbage, garlic sauce" },
      { sku: "MYGD-TACO-VEGAN", name: "Vegan Taco", price: 3.5, isVeggie: true, description: "Vegan chicken strips, onions, lettuce, cucumber, tomatoes, red cabbage, vegan garlic sauce" },
    ],
  },
  {
    slug: "doezza", name: "MYGD Doezza", nameDE: "MYGD Doezza", nameGR: "MYGD Doezza", kind: "FOOD", vat: "FOOD_BEV",
    imageUrl: PHOTO.doezza,
    items: [
      { sku: "MYGD-DOEZZA-MARGHERITA", name: "Margherita", price: 6.5, isVeggie: true },
      { sku: "MYGD-DOEZZA-SALAMI", name: "Salami", price: 7.5 },
      { sku: "MYGD-DOEZZA-FUNGHI", name: "Funghi", price: 6.95, isVeggie: true },
      { sku: "MYGD-DOEZZA-FOUR-CHEESE", name: "Four Cheese", price: 7.95, isVeggie: true },
    ],
  },
  {
    slug: "burgers", name: "MYGD Burger", nameDE: "MYGD Burger", nameGR: "MYGD Μπέργκερ", kind: "FOOD", vat: "FOOD_BEV",
    imageUrl: PHOTO.burger,
    items: [
      { sku: "MYGD-BURGER-BEEFSTER", name: "Beefster", price: 7.95, ...MEAL },
      { sku: "MYGD-BURGER-CHEESY-GD", name: "Cheesy GD", price: 9.95, ...MEAL },
      { sku: "MYGD-BURGER-CHICKEN-HYPE", name: "Chicken Hype", price: 8.5, ...MEAL },
      { sku: "MYGD-BURGER-CC-CHICKEN", name: "C & C Chicken", price: 7.95, ...MEAL },
    ],
  },
  {
    slug: "doener-burgers", name: "Doener Burger", nameDE: "Döner Burger", nameGR: "Ντόνερ Μπέργκερ", kind: "FOOD", vat: "FOOD_BEV",
    imageUrl: PHOTO.doener,
    items: [
      { sku: "MYGD-DB-MY-CHICKEN", name: "My Chicken", price: 6.9, description: `Chicken doener, ${SALAD}, ketchup, mayo`, ...MEAL },
      { sku: "MYGD-DB-CHEESE", name: "Cheese Doener", price: 7.5, description: `Doener meat, cheese, ${SALAD}, BBQ sauce`, ...MEAL },
      { sku: "MYGD-DB-CHEESE-CHICKEN", name: "Cheese Chicken Doener", price: 7.5, description: `Chicken doener, cheese, ${SALAD}, ketchup, mayo`, ...MEAL },
      { sku: "MYGD-DB-HAMBURG", name: "Hamburg Doener", price: 6.9, description: `Doener meat, ${SALAD}, ketchup, mayo, mustard`, ...MEAL },
    ],
  },
  {
    slug: "wraps", name: "My Wraps", nameDE: "My Wraps", nameGR: "Τυλιχτά", kind: "FOOD", vat: "FOOD_BEV",
    imageUrl: PHOTO.wrap,
    items: [
      { sku: "MYGD-WRAP-BEEF", name: "Beef Wrap", price: 9.9, description: `Beef doener, ${SALAD}, cocktail sauce`, ...MEAL },
      { sku: "MYGD-WRAP-CHICKEN", name: "Chicken Wrap", price: 9.9, description: `Chicken doener, ${SALAD}, garlic sauce`, ...MEAL },
      { sku: "MYGD-WRAP-MIX", name: "Mix Wrap", price: 9.9, description: `Beef and chicken doener, ${SALAD}, lemon herb sauce`, ...MEAL },
      { sku: "MYGD-WRAP-VEGAN", name: "Vegan Wrap", price: 9.9, isVeggie: true, description: `Vegan balls, ${SALAD}, vegan garlic sauce`, ...MEAL },
    ],
  },
  {
    slug: "bigs", name: "My Big's", nameDE: "My Big's", nameGR: "My Big's", kind: "FOOD", vat: "FOOD_BEV",
    imageUrl: PHOTO.doener,
    items: [
      { sku: "MYGD-BIG-CHICK", name: "Big Chick", price: 11.9, description: `Chicken doener, original Berlin flatbread, ${SALAD}, garlic sauce`, ...MEAL },
      { sku: "MYGD-BIG-B", name: "Big B", price: 11.9, description: `Beef doener, original Berlin flatbread, ${SALAD}, cocktail sauce`, ...MEAL },
      { sku: "MYGD-BIG-MIX", name: "Big Mix", price: 11.9, description: `Beef and chicken doener, original Berlin flatbread, ${SALAD}, lemon herb sauce`, ...MEAL },
      { sku: "MYGD-BIG-GREEN", name: "Big Green", price: 11.9, isVeggie: true, description: `Vegan doener, original Berlin flatbread, ${SALAD}, vegan sauce`, ...MEAL },
    ],
  },
  {
    slug: "bowls", name: "My Bowls", nameDE: "My Bowls", nameGR: "Μπολ", kind: "FOOD", vat: "FOOD_BEV",
    imageUrl: PHOTO.bowl,
    items: [
      { sku: "MYGD-BOWL-BEEF", name: "Beef Bowl", price: 9.9, description: `Beef doener, white rice or fries, ${SALAD}, sauce of your choice`, modifierGroups: ["bowl-base", "sauce-choice"] },
      { sku: "MYGD-BOWL-CHICKEN", name: "Chicken Bowl", price: 9.9, description: `Chicken doener, white rice or fries, ${SALAD}, sauce of your choice`, modifierGroups: ["bowl-base", "sauce-choice"] },
      { sku: "MYGD-BOWL-MIX", name: "Mix Bowl", price: 9.9, description: `Beef and chicken doener, white rice or fries, ${SALAD}, sauce of your choice`, modifierGroups: ["bowl-base", "sauce-choice"] },
      { sku: "MYGD-BOWL-VEGAN", name: "Vegan Bowl", price: 9.9, isVeggie: true, description: `Vegan balls, white rice or fries, ${SALAD}, vegan garlic sauce`, modifierGroups: ["bowl-base"] },
    ],
  },
  {
    slug: "kids-meal", name: "Kids Meal", nameDE: "Kindermenü", nameGR: "Παιδικό Μενού", kind: "FOOD", vat: "FOOD_BEV",
    imageUrl: PHOTO.nuggets,
    items: [
      {
        sku: "MYGD-KIDS-MEAL", name: "Kids Meal", price: 5.0,
        description: "Kids doener or 4 chicken nuggets or 4 meatballs + 1 Kinder Riegel + 1 drink (water/juice) + small fries",
        modifierGroups: ["kids-main", "kids-drink"],
      },
    ],
  },
  {
    slug: "chicken-nuggets", name: "Chicken Nuggets", nameDE: "Chicken Nuggets", nameGR: "Κοτομπουκιές", kind: "FOOD", vat: "FOOD_BEV",
    imageUrl: PHOTO.nuggets,
    items: [
      { sku: "MYGD-NUGGETS-6", name: "Chicken Nuggets 6 pcs", price: 4.9 },
      { sku: "MYGD-NUGGETS-12", name: "Chicken Nuggets 12 pcs", price: 7.9 },
      { sku: "MYGD-NUGGETS-20", name: "Chicken Nuggets 20 pcs", price: 11.9 },
    ],
  },
  {
    slug: "chicken-wings", name: "Chicken Wings", nameDE: "Chicken Wings", nameGR: "Φτερούγες Κοτόπουλου", kind: "FOOD", vat: "FOOD_BEV",
    imageUrl: PHOTO.wings,
    items: [
      { sku: "MYGD-WINGS-6", name: "Chicken Wings 6 pcs", price: 5.9 },
      { sku: "MYGD-WINGS-12", name: "Chicken Wings 12 pcs", price: 9.9 },
      { sku: "MYGD-WINGS-20", name: "Chicken Wings 20 pcs", price: 14.9 },
    ],
  },
  {
    slug: "crunchy-fries", name: "Crunchy Fries", nameDE: "Crunchy Pommes", nameGR: "Τραγανές Πατάτες", kind: "FOOD", vat: "FOOD_BEV",
    imageUrl: PHOTO.fries,
    items: [
      { sku: "MYGD-FRIES-REG", name: "Crunchy Fries Regular", price: 2.5, isVeggie: true, description: "+ 1 sauce (ketchup or mayo)", modifierGroups: ["fries-sauce-1"] },
      { sku: "MYGD-FRIES-LRG", name: "Crunchy Fries Large", price: 3.5, isVeggie: true, description: "+ 2 sauces (ketchup or mayo)", modifierGroups: ["fries-sauce-2"] },
      { sku: "MYGD-FRIES-XL", name: "Crunchy Fries XL", price: 4.5, isVeggie: true, description: "+ 2 sauces (ketchup or mayo)", modifierGroups: ["fries-sauce-2"] },
    ],
  },
  {
    slug: "sweet-potato-fries", name: "Sweet Potato Fries", nameDE: "Süßkartoffel-Pommes", nameGR: "Γλυκοπατάτες", kind: "FOOD", vat: "FOOD_BEV",
    imageUrl: PHOTO.fries,
    items: [
      { sku: "MYGD-SWEET-FRIES-REG", name: "Sweet Potato Fries Regular", price: 2.9, isVeggie: true, description: "+ 1 sauce (ketchup or mayo)", modifierGroups: ["fries-sauce-1"] },
      { sku: "MYGD-SWEET-FRIES-LRG", name: "Sweet Potato Fries Large", price: 3.9, isVeggie: true, description: "+ 2 sauces (ketchup or mayo)", modifierGroups: ["fries-sauce-2"] },
      { sku: "MYGD-SWEET-FRIES-XL", name: "Sweet Potato Fries XL", price: 4.9, isVeggie: true, description: "+ 2 sauces (ketchup or mayo)", modifierGroups: ["fries-sauce-2"] },
    ],
  },
  {
    slug: "loaded-fries", name: "Loaded Fries", nameDE: "Loaded Fries", nameGR: "Loaded Πατάτες", kind: "FOOD", vat: "FOOD_BEV",
    note: "One size, includes one sauce", imageUrl: PHOTO.loaded,
    items: [
      { sku: "MYGD-LOADED-HOLLANDAISE", name: "Hollandaise Fries", price: 7.9, isVeggie: true, modifierGroups: ["sauce-choice"] },
      { sku: "MYGD-LOADED-JALAPENO", name: "Jalapeño Sour Cream Fries", price: 7.9, isVeggie: true, isSpicy: true, modifierGroups: ["sauce-choice"] },
      { sku: "MYGD-LOADED-GRAVY", name: "Gravy Fries", price: 7.9, modifierGroups: ["sauce-choice"] },
      { sku: "MYGD-LOADED-CHEESY", name: "Cheesy Fries", price: 7.9, isVeggie: true, modifierGroups: ["sauce-choice"] },
    ],
  },
  {
    slug: "fresh-salad", name: "Fresh Salad", nameDE: "Frische Salate", nameGR: "Φρέσκες Σαλάτες", kind: "FOOD", vat: "FOOD_BEV",
    imageUrl: PHOTO.salad,
    items: [
      { sku: "MYGD-SALAD-GREEN", name: "Green Salad", price: 6.9, isVeggie: true, description: "Lettuce, cucumber, tomatoes, red cabbage, onion with vinegar and oil dressing" },
      { sku: "MYGD-SALAD-CHICKEN", name: "Chicken Salad", price: 8.9, description: "Lettuce, cucumber, tomatoes, red cabbage, onion, chicken with vinegar and oil dressing" },
      { sku: "MYGD-SALAD-HALLOUMI", name: "Halloumi Salad", price: 8.9, isVeggie: true, description: "Lettuce, cucumber, tomatoes, red cabbage, onions, halloumi with vinegar and oil dressing" },
    ],
  },
  {
    slug: "meatballs", name: "Meatballs", nameDE: "Frikadellen", nameGR: "Κεφτεδάκια", kind: "FOOD", vat: "FOOD_BEV",
    note: "Fries or white rice with hollandaise sauce", imageUrl: PHOTO.meatballs,
    items: [
      { sku: "MYGD-MEATBALLS-6", name: "Meatballs 6 pcs", price: 7.5, modifierGroups: ["meatballs-side"] },
      { sku: "MYGD-MEATBALLS-12", name: "Meatballs 12 pcs", price: 11.5, modifierGroups: ["meatballs-side"] },
      { sku: "MYGD-MEATBALLS-20", name: "Meatballs 20 pcs", price: 16.5, modifierGroups: ["meatballs-side"] },
    ],
  },
  {
    slug: "mozzarella-sticks", name: "Mozzarella Sticks", nameDE: "Mozzarella Sticks", nameGR: "Στικς Μοτσαρέλας", kind: "FOOD", vat: "FOOD_BEV",
    note: "1 sauce included", imageUrl: PHOTO.mozzarella,
    items: [
      { sku: "MYGD-MOZZ-6", name: "Mozzarella Sticks 6 pcs", price: 5.9, isVeggie: true, modifierGroups: ["sauce-choice"] },
      { sku: "MYGD-MOZZ-12", name: "Mozzarella Sticks 12 pcs", price: 9.9, isVeggie: true, modifierGroups: ["sauce-choice"] },
      { sku: "MYGD-MOZZ-20", name: "Mozzarella Sticks 20 pcs", price: 14.9, isVeggie: true, modifierGroups: ["sauce-choice"] },
    ],
  },
  // ----------------------------- Drinks -----------------------------
  {
    slug: "smoothies", name: "Smoothies", nameDE: "Smoothies", nameGR: "Smoothies", kind: "DRINK", vat: "FOOD_BEV",
    imageUrl: PHOTO.smoothie,
    items: [
      { sku: "MYGD-SMOOTHIE-TROPICAL", name: "Tropical Twist", price: 2.99 },
      { sku: "MYGD-SMOOTHIE-BERRY", name: "Berry Booster", price: 2.99 },
      { sku: "MYGD-SMOOTHIE-GREEN", name: "Green Power", price: 2.99 },
      { sku: "MYGD-SMOOTHIE-SUNSET", name: "Sunset Delight", price: 2.99 },
    ],
  },
  {
    slug: "milkshakes", name: "Milkshakes", nameDE: "Milchshakes", nameGR: "Μιλκσέικ", kind: "DRINK", vat: "FOOD_BEV",
    imageUrl: PHOTO.shake,
    items: [
      { sku: "MYGD-SHAKE-STRAWBERRY", name: "Strawberry", price: 2.9 },
      { sku: "MYGD-SHAKE-VANILLA", name: "Vanilla", price: 2.9 },
      { sku: "MYGD-SHAKE-CHOCOLATE", name: "Chocolate", price: 2.9 },
    ],
  },
  {
    slug: "fruit-juices", name: "Fruit Juices", nameDE: "Fruchtsäfte", nameGR: "Χυμοί", kind: "DRINK", vat: "FOOD_BEV",
    imageUrl: PHOTO.juice,
    items: [
      { sku: "MYGD-JUICE-CAPPY-ORANGE", name: "Cappy Orange", price: 1.5 },
      { sku: "MYGD-JUICE-CAPPY-APPLE", name: "Cappy Apple", price: 1.5 },
    ],
  },
  {
    slug: "water-ayran", name: "Water & Ayran", nameDE: "Wasser & Ayran", nameGR: "Νερό & Αϊράνι", kind: "DRINK", vat: "FOOD_BEV",
    imageUrl: PHOTO.ayran,
    items: [
      { sku: "MYGD-WATER-STILL", name: "Still Water", price: 1.5 },
      { sku: "MYGD-AYRAN-05", name: "Ayran 0.5L", price: 3.5 },
    ],
  },
  {
    slug: "energy-drinks", name: "Energy Drinks", nameDE: "Energy Drinks", nameGR: "Ενεργειακά Ποτά", kind: "DRINK", vat: "FOOD_BEV",
    imageUrl: PHOTO.energy,
    items: [
      { sku: "MYGD-ENERGY-REDBULL", name: "Red Bull", price: 3.0 },
      { sku: "MYGD-ENERGY-REDBULL-SF", name: "Red Bull Sugar Free", price: 3.0 },
      { sku: "MYGD-ENERGY-COCOLOCO", name: "Cocoloco", price: 2.5 },
    ],
  },
  {
    slug: "kombucha", name: "Kombucha", nameDE: "Kombucha", nameGR: "Κομπούχα", kind: "DRINK", vat: "FOOD_BEV",
    imageUrl: PHOTO.kombucha,
    items: [
      { sku: "MYGD-KOMBUCHA-HIBISCUS", name: "Hibiscus", price: 3.5 },
      { sku: "MYGD-KOMBUCHA-LEMON-ZEN", name: "Lemon Zen", price: 3.5 },
      { sku: "MYGD-KOMBUCHA-GINGER", name: "Ginger Insight", price: 3.5 },
      { sku: "MYGD-KOMBUCHA-LEMONGRASS", name: "Lemongrass Unity", price: 3.5 },
    ],
  },
  {
    slug: "draft-beer", name: "Draft Beer", nameDE: "Fassbier", nameGR: "Βαρελίσια Μπύρα", kind: "DRINK", vat: "ALCOHOL",
    imageUrl: PHOTO.beer,
    items: [
      { sku: "MYGD-DRAFT-05", name: "Draft Beer 0.5L", price: 6.0 },
      { sku: "MYGD-DRAFT-03", name: "Draft Beer 0.3L", price: 4.0 },
    ],
  },
  {
    slug: "bottled-beer", name: "Bottled Beer", nameDE: "Flaschenbier", nameGR: "Εμφιαλωμένη Μπύρα", kind: "DRINK", vat: "ALCOHOL",
    imageUrl: PHOTO.beer,
    items: [
      { sku: "MYGD-BEER-HOFBRAEU-ORIGINAL", name: "Hofbräu Original", price: 5.0 },
      { sku: "MYGD-BEER-HOFBRAEU-HELLES", name: "Hofbräu Helles", price: 5.0 },
      { sku: "MYGD-BEER-CORONA", name: "Corona Extra", price: 4.0 },
      { sku: "MYGD-BEER-CORONA-0", name: "Corona 0%", price: 4.0 },
      { sku: "MYGD-BEER-KEO", name: "KEO", price: 3.0 },
      { sku: "MYGD-BEER-CARLSBERG", name: "Carlsberg", price: 3.0 },
      { sku: "MYGD-BEER-CARLSBERG-0", name: "Carlsberg 0%", price: 3.0 },
    ],
  },
  {
    slug: "wine", name: "Wine", nameDE: "Wein", nameGR: "Κρασί", kind: "DRINK", vat: "ALCOHOL",
    imageUrl: PHOTO.wine,
    items: [
      { sku: "MYGD-WINE-RED", name: "Red Wine", price: 4.0 },
      { sku: "MYGD-WINE-WHITE", name: "White Wine", price: 4.0 },
    ],
  },
  {
    slug: "soft-drinks", name: "Soft Drinks (Postmix)", nameDE: "Softdrinks (Postmix)", nameGR: "Αναψυκτικά (Postmix)", kind: "DRINK", vat: "FOOD_BEV",
    imageUrl: PHOTO.soft,
    items: POSTMIX_DRINKS.map((d) => ({ sku: `MYGD-POSTMIX-${slugify(d).replace("coca-cola", "cola").toUpperCase()}`, name: d, price: 2.5 })),
  },
  {
    slug: "canned-drinks", name: "Canned Drinks", nameDE: "Dosengetränke", nameGR: "Αναψυκτικά σε Κουτί", kind: "DRINK", vat: "FOOD_BEV",
    imageUrl: PHOTO.soft,
    items: [
      { sku: "MYGD-CAN-FANTA-ZERO", name: "Fanta Zero", price: 2.5 },
      { sku: "MYGD-CAN-FANTA-LEMON", name: "Fanta Lemon", price: 2.5 },
      { sku: "MYGD-CAN-LIPTON-PEACH", name: "Lipton Ice Tea Peach", price: 2.5 },
      { sku: "MYGD-CAN-LIPTON-PEACH-ZERO", name: "Lipton Ice Tea Peach Zero", price: 2.5 },
      { sku: "MYGD-CAN-LIPTON-LEMON", name: "Lipton Ice Tea Lemon", price: 2.5 },
    ],
  },
  {
    slug: "coffee", name: "Coffee", nameDE: "Kaffee", nameGR: "Καφές", kind: "DRINK", vat: "FOOD_BEV",
    imageUrl: PHOTO.coffee,
    items: [
      { sku: "MYGD-COFFEE-ESPRESSO", name: "Espresso", price: 2.0 },
      { sku: "MYGD-COFFEE-AMERICANO", name: "Americano", price: 2.5 },
      { sku: "MYGD-COFFEE-CAPPUCCINO", name: "Cappuccino", price: 3.0 },
      { sku: "MYGD-COFFEE-LATTE-MACCHIATO", name: "Latte Macchiato", price: 3.0 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Offers (applied automatically by src/lib/discounts/engine.ts)
// ---------------------------------------------------------------------------

export const MYGD_PROMOTIONS: readonly PromotionDef[] = [
  { code: "PIZZA-2ND-20", name: "Second pizza 20% off", rule: { type: "NTH_ITEM_PERCENT", sectionSlug: "pizza", nth: 2, percent: 20 } },
  { code: "TACOS-4-FOR-1190", name: "4 tacos for €11.90", rule: { type: "BUNDLE_PRICE", sectionSlug: "tacos", quantity: 4, bundlePrice: 11.9 } },
];

// ---------------------------------------------------------------------------
// Menu boards (screens). Rendered live from the database; no poster images (their prices go stale).
// ---------------------------------------------------------------------------

export const MYGD_MENU_BOARDS: readonly MenuBoardDef[] = [
  {
    screenNumber: 1, title: "DOENER BURGER, MY WRAPS, MY BIG'S & BOWLS", subtitle: "MAKE IT A MENU: FRIES OR RICE + 0.4L DRINK",
    layoutType: "PRICE_MATRIX",
    bannerMessage: "MAKE IT A MENU · REGULAR €3.00 · MEDIUM €3.50 · LARGE €4.50",
    sectionSlugs: ["doener-burgers", "wraps", "bigs", "bowls"],
  },
  {
    screenNumber: 2, title: "PIZZA, TACOS, DOEZZA & MYGD BURGER", subtitle: "SECOND PIZZA 20% OFF · 4 TACOS €11.90",
    layoutType: "PRICE_MATRIX",
    bannerMessage: "SECOND PIZZA 20% OFF · 4 TACOS FOR €11.90",
    sectionSlugs: ["pizza", "tacos", "doezza", "burgers"],
  },
  {
    screenNumber: 3, title: "LOADED FRIES, NUGGETS, WINGS & MORE", subtitle: "SALADS · MEATBALLS · MOZZARELLA STICKS",
    layoutType: "PRICE_MATRIX",
    sectionSlugs: ["loaded-fries", "chicken-nuggets", "chicken-wings", "meatballs", "mozzarella-sticks", "fresh-salad"],
  },
  {
    screenNumber: 4, title: "DRINKS, BEER, WINE & COFFEE", subtitle: "SMOOTHIES · SHAKES · KOMBUCHA · SOFT DRINKS",
    layoutType: "DRINKS_SIDES",
    sectionSlugs: [
      "smoothies", "milkshakes", "fruit-juices", "water-ayran", "energy-drinks", "kombucha",
      "draft-beer", "bottled-beer", "wine", "soft-drinks", "canned-drinks", "coffee",
    ],
  },
  {
    screenNumber: 5, title: "KIDS MEAL & FRIES", subtitle: "CRUNCHY FRIES · SWEET POTATO FRIES",
    layoutType: "SPLIT_COMBO",
    sectionSlugs: ["kids-meal", "crunchy-fries", "sweet-potato-fries"],
  },
];

// ---------------------------------------------------------------------------
// Derived views
// ---------------------------------------------------------------------------

export function allMenuItems(): MenuItem[] {
  let sortOrder = 0;
  return MYGD_MENU_SECTIONS.flatMap((section) =>
    section.items.map((item) => {
      sortOrder += 1;
      return { ...item, sectionSlug: section.slug, vat: section.vat, imageUrl: section.imageUrl, sortOrder };
    }),
  );
}

export function findMenuItem(sku: string): MenuItem | undefined {
  return allMenuItems().find((item) => item.sku === sku);
}

export function findMenuSection(slug: string): MenuSectionDef | undefined {
  return MYGD_MENU_SECTIONS.find((section) => section.slug === slug);
}

export function findModifierGroup(slug: string): ModifierGroupDef | undefined {
  return MYGD_MODIFIER_GROUPS.find((group) => group.slug === slug);
}

/** Lowest food price on the menu (for "From €x" marketing copy). */
export function lowestFoodPrice(): number {
  const food = new Set(MYGD_MENU_SECTIONS.filter((s) => s.kind === "FOOD").map((s) => s.slug));
  return Math.min(...allMenuItems().filter((i) => food.has(i.sectionSlug)).map((i) => i.price));
}
