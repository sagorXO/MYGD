export type OrderCategory = "DOENER" | "WRAPS" | "BOWLS" | "PIZZAS" | "TACOS" | "SIDES" | "DRINKS";

export interface OrderItem {
  id: string;
  name: string;
  desc: string;
  priceCents: number;
  badge?: string;
  category: OrderCategory;
  imageUrl: string;
  allowMealUpgrade: boolean;
}

export const CATEGORIES: { id: "ALL" | OrderCategory; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "DOENER", label: "Döner" },
  { id: "WRAPS", label: "Wraps" },
  { id: "BOWLS", label: "Bowls" },
  { id: "PIZZAS", label: "Pizzas" },
  { id: "TACOS", label: "Tacos" },
  { id: "SIDES", label: "Sides" },
  { id: "DRINKS", label: "Drinks" },
];

export const MENU_ITEMS: OrderItem[] = [
  { id: "ord-1", name: "Hamburg Doener", desc: "Rotisserie beef, salad, tomato, cucumber, onions, red cabbage (Ketchup, Mayo, Mustard)", priceCents: 690, badge: "Popular", category: "DOENER", imageUrl: "/assets/menu/products/hamburg-doener.jpg", allowMealUpgrade: true },
  { id: "ord-2", name: "Chicken Doener", desc: "Juicy chicken doener, salad, tomato, cucumber, onions, red cabbage (Ketchup, Mayo)", priceCents: 690, badge: "Bestseller", category: "DOENER", imageUrl: "/assets/menu/products/chicken-doener.webp", allowMealUpgrade: true },
  { id: "ord-3", name: "Beef Wrap", desc: "Toasted lavash flatbread, beef doener, fresh salad, cocktail sauce", priceCents: 990, badge: "Top seller", category: "WRAPS", imageUrl: "/assets/menu/products/beef-wrap.jpg", allowMealUpgrade: true },
  { id: "ord-4", name: "Big B (Original Berlin Flatbread)", desc: "Massive triangular flatbread packed with extra beef doener, salad & cocktail sauce", priceCents: 1190, badge: "Chef pick", category: "DOENER", imageUrl: "/assets/menu/products/big-b-doener.jpg", allowMealUpgrade: true },
  { id: "ord-5", name: "Beef Bowl", desc: "Rotisserie beef, white rice or crunchy fries, fresh salad and choice of sauce", priceCents: 990, category: "BOWLS", imageUrl: "/assets/menu/products/doener-bowl.jpg", allowMealUpgrade: true },
  { id: "ord-6", name: "Chicken Doener Pizza (33cm)", desc: "Stone-baked thin crust, mozzarella, roasted chicken doener, onions, garlic sauce spiral", priceCents: 1790, badge: "Bestseller", category: "PIZZAS", imageUrl: "/assets/menu/products/chicken-doener-pizza.jpg", allowMealUpgrade: false },
  { id: "ord-7", name: "Crispy Beef Taco", desc: "Crunchy taco shell, seasoned beef, lettuce, tomato, cabbage, BBQ sauce", priceCents: 350, category: "TACOS", imageUrl: "/assets/menu/products/beef-taco.jpg", allowMealUpgrade: true },
  { id: "ord-8", name: "Cheesy Loaded Fries", desc: "Crispy skin-on fries smothered in rich cheddar cheese sauce, roasted bits & herbs", priceCents: 790, badge: "Popular", category: "SIDES", imageUrl: "/assets/menu/products/cheesy-fries.jpg", allowMealUpgrade: false },
  { id: "ord-9", name: "Crunchy Fries", desc: "Skin-on golden fries with German paprika sea salt seasoning", priceCents: 250, category: "SIDES", imageUrl: "/assets/menu/products/crunchy-fries.webp", allowMealUpgrade: false },
  { id: "ord-10", name: "Authentic Ayran (0.5L)", desc: "Chilled Turkish salted yogurt beverage", priceCents: 350, badge: "Bestseller", category: "DRINKS", imageUrl: "/assets/menu/products/water-ayran.webp", allowMealUpgrade: false },
];
