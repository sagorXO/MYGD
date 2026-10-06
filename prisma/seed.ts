import { PrismaClient, VatCategory } from "@prisma/client";
import bcrypt from "bcryptjs";
import menuData from "../data/mygd_menu.json";

const prisma = new PrismaClient();

function generateSku(category: string, name: string, variant?: string | null): string {
  const cleanCat = category.replace(/[^a-zA-Z0-9]/g, "-").toUpperCase().replace(/-+/g, "-");
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, "-").toUpperCase().replace(/-+/g, "-");
  const cleanVariant = variant ? `-${variant.replace(/[^a-zA-Z0-9]/g, "-").toUpperCase().replace(/-+/g, "-")}` : "";
  return `MYGD-${cleanCat}-${cleanName}${cleanVariant}`.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function resolveItemImage(categoryName: string, itemName: string): string {
  const cat = categoryName.toLowerCase();
  const item = itemName.toLowerCase();

  // Pizzas
  if (cat.includes("pizza")) {
    if (item.includes("chicken")) return "/assets/menu/products/chicken-doener-pizza.jpg";
    if (item.includes("salami")) return "/assets/menu/products/pizza-salami.webp";
    if (item.includes("funghi")) return "/assets/menu/products/pizza-funghi.webp";
    if (item.includes("five cheese") || item.includes("cheese")) return "/assets/menu/products/pizza-five-cheese.webp";
    return "/assets/menu/products/pizza-margherita.webp";
  }

  // Tacos
  if (cat.includes("tacos")) {
    if (item.includes("jalape")) return "/assets/menu/products/taco-beef-jalapeno.webp";
    if (item.includes("chicken")) return "/assets/menu/products/taco-chicken.webp";
    if (item.includes("vegan")) return "/assets/menu/products/taco-vegan.webp";
    return "/assets/menu/products/beef-taco.jpg";
  }

  // Doezza
  if (cat.includes("doezza")) {
    if (item.includes("salami")) return "/assets/menu/products/doezza-salami.webp";
    if (item.includes("funghi")) return "/assets/menu/products/doezza-funghi.webp";
    if (item.includes("four cheese") || item.includes("cheese")) return "/assets/menu/products/doezza-four-cheese.webp";
    return "/assets/menu/products/doezza-margherita.webp";
  }

  // Burgers
  if (cat.includes("burger") && !cat.includes("doener")) {
    if (item.includes("cheesy")) return "/assets/menu/products/burger-cheesy-gd.webp";
    if (item.includes("chicken hype")) return "/assets/menu/products/burger-chicken-hype.webp";
    if (item.includes("c & c") || item.includes("cc")) return "/assets/menu/products/burger-cc-chicken.webp";
    return "/assets/menu/products/burger-beefster.webp";
  }

  // Doener burger
  if (cat.includes("doener burger")) {
    if (item.includes("hamburg")) return "/assets/menu/products/hamburg-doener.jpg";
    if (item.includes("cheese chicken")) return "/assets/menu/products/cheese-chicken-doener.webp";
    if (item.includes("cheese")) return "/assets/menu/products/cheese-doener.webp";
    return "/assets/menu/products/chicken-doener.webp";
  }

  // Wraps
  if (cat.includes("wrap")) {
    if (item.includes("chicken")) return "/assets/menu/products/chicken-wrap.webp";
    if (item.includes("mix") || item.includes("miz")) return "/assets/menu/products/mix-wrap.webp";
    if (item.includes("vegan")) return "/assets/menu/products/vegan-wrap.webp";
    return "/assets/menu/products/beef-wrap.jpg";
  }

  // Bigs
  if (cat.includes("big")) {
    if (item.includes("chick")) return "/assets/menu/products/big-chick.webp";
    if (item.includes("mix")) return "/assets/menu/products/big-mix.webp";
    if (item.includes("green")) return "/assets/menu/products/big-green.webp";
    return "/assets/menu/products/big-b-doener.jpg";
  }

  // Bowls
  if (cat.includes("bowl")) {
    if (item.includes("chicken")) return "/assets/menu/products/chicken-bowl.webp";
    if (item.includes("mix")) return "/assets/menu/products/mix-bowl.webp";
    if (item.includes("vegan")) return "/assets/menu/products/vegan-bowl.webp";
    return "/assets/menu/products/doener-bowl.jpg";
  }

  // Sauces
  if (cat.includes("sauce")) {
    if (item.includes("bbq")) return "/assets/menu/sauces/sauce-bbq.webp";
    if (item.includes("honey mustard")) return "/assets/menu/sauces/sauce-honey-mustard.webp";
    if (item.includes("cheese hot")) return "/assets/menu/sauces/sauce-cheese-hot.webp";
    if (item.includes("tzatziki")) return "/assets/menu/sauces/sauce-tzatziki.webp";
    if (item.includes("sour cream")) return "/assets/menu/sauces/sauce-tzatziki.webp";
    if (item.includes("lemon herb")) return "/assets/menu/sauces/sauce-lemon-herb.webp";
    if (item.includes("cocktail")) return "/assets/menu/sauces/sauce-cocktail.webp";
    if (item.includes("spicy")) return "/assets/menu/sauces/sauce-hot-spicy.webp";
    if (item.includes("vegan garlic")) return "/assets/menu/sauces/sauce-vegan-garlic.webp";
    if (item.includes("mayo")) return "/assets/menu/sauces/sauce-mayonnaise.webp";
    if (item.includes("ketchup")) return "/assets/menu/sauces/sauce-ketchup.webp";
    return "/assets/menu/sauces/sauce-garlic.webp";
  }

  // Kids Meal
  if (cat.includes("kid")) return "/assets/menu/products/kids-meal.webp";

  // Chicken nuggets
  if (cat.includes("nugget")) return "/assets/menu/products/chicken-nuggets.webp";

  // Chicken wings
  if (cat.includes("wing")) return "/assets/menu/products/chicken-wings.webp";

  // Crunchy fries
  if (cat.includes("crunchy fries")) return "/assets/menu/products/crunchy-fries.webp";

  // Sweet potato fries
  if (cat.includes("sweet potato")) return "/assets/menu/products/sweet-potato-fries.webp";

  // Make it a menu
  if (cat.includes("make it a menu")) return "/assets/menu/upgrade/combo.jpg";

  // Loaded fries
  if (cat.includes("loaded fries")) {
    if (item.includes("hollandaise")) return "/assets/menu/products/loaded-hollandaise.webp";
    if (item.includes("jalape")) return "/assets/menu/products/loaded-jalapeno.webp";
    if (item.includes("gravy")) return "/assets/menu/products/loaded-gravy.webp";
    return "/assets/menu/products/cheesy-fries.jpg";
  }

  // Fresh salad
  if (cat.includes("salad")) {
    if (item.includes("chicken")) return "/assets/menu/products/salad-chicken.webp";
    if (item.includes("halloumi")) return "/assets/menu/products/salad-halloumi.webp";
    return "/assets/menu/products/salad-garden.webp";
  }

  // Meatballs
  if (cat.includes("meatball")) return "/assets/menu/products/meatballs.webp";

  // Mozzarella sticks
  if (cat.includes("mozzarella")) return "/assets/menu/products/mozzarella-sticks.webp";

  // Smoothies
  if (cat.includes("smoothie")) return "/assets/menu/products/smoothies-blend.webp";

  // Milk shakes
  if (cat.includes("milk shake")) return "/assets/menu/products/milkshakes-trio.webp";

  // Fruit juices
  if (cat.includes("juice")) return "/assets/menu/products/cappy-juice.webp";

  // Water & Ayran
  if (cat.includes("water") || cat.includes("ayran") || cat.includes("aryan")) return "/assets/menu/products/water-ayran.webp";

  // Energy drinks
  if (cat.includes("energy")) {
    if (item.includes("cocoloco") || item.includes("coco")) return "/assets/menu/products/coco-loco.webp";
    return "/assets/menu/products/red-bull.webp";
  }

  // Kombucha
  if (cat.includes("kombucha")) return "/assets/menu/products/kombucha-gaia.webp";

  // Draft beer
  if (cat.includes("draft beer")) return "/assets/menu/products/drink-draft-beer.webp";

  // Bottled beer
  if (cat.includes("bottled beer")) return "/assets/menu/products/drink-bottled-beer.webp";

  // Wine
  if (cat.includes("wine")) return "/assets/menu/products/drink-wine.webp";

  // Soft drinks (postmix)
  if (cat.includes("soft drinks")) return "/assets/menu/products/drink-postmix-soda.webp";

  // Canned drinks
  if (cat.includes("can")) return "/assets/menu/products/drink-canned-soda.webp";

  // Coffee
  if (cat.includes("coffee")) {
    if (item.includes("americano")) return "/assets/menu/products/coffee-americano.webp";
    if (item.includes("cappuccino")) return "/assets/menu/products/coffee-cappuccino.webp";
    if (item.includes("latte")) return "/assets/menu/products/coffee-latte.webp";
    return "/assets/menu/products/coffee-espresso.webp";
  }

  return "/assets/menu/products/hamburg-doener.jpg";
}

function resolveVatCategory(catName: string): VatCategory {
  const lower = catName.toLowerCase();
  if (lower.includes("draft beer") || lower.includes("bottled beer") || lower.includes("wine")) {
    return VatCategory.ALCOHOL;
  }
  return VatCategory.FOOD_BEV;
}

function isVeggieItem(catName: string, itemName: string, isVegan: boolean): boolean {
  if (isVegan) return true;
  const lower = (catName + " " + itemName).toLowerCase();
  return (
    lower.includes("vegan") ||
    lower.includes("veggie") ||
    lower.includes("salad") ||
    lower.includes("halloumi") ||
    lower.includes("mozzarella") ||
    (lower.includes("cheese") && !lower.includes("doener") && !lower.includes("chicken") && !lower.includes("beef") && !lower.includes("meat"))
  );
}

function isSpicyItem(itemName: string, desc?: string): boolean {
  const lower = (itemName + " " + (desc || "")).toLowerCase();
  return lower.includes("jalape") || lower.includes("spicy") || lower.includes("hot") || lower.includes("scharf");
}

function allowMealUpgrade(catName: string): boolean {
  const cat = catName.toLowerCase();
  return (
    cat.includes("burger") ||
    cat.includes("wrap") ||
    cat.includes("big") ||
    cat.includes("bowl") ||
    cat.includes("taco") ||
    cat.includes("pizza") ||
    cat.includes("doezza")
  );
}

async function main() {
  console.log("Seeding MY GERMAN DÖNER Production Catalog with Official Master Menu...");

  // 1. Locations (Emba Flagship & Limassol Marina Hub)
  const embaLocation = await prisma.location.upsert({
    where: { slug: "EMBA" },
    update: {
      name: "MY GERMAN DÖNER — Emba Flagship (Paphos)",
      address: "Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Paphos",
      phone: "+357 99 531198",
      currency: "EUR",
      vatRate: 0.19,
      isActive: true,
    },
    create: {
      slug: "EMBA",
      name: "MY GERMAN DÖNER — Emba Flagship (Paphos)",
      address: "Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Paphos",
      phone: "+357 99 531198",
      currency: "EUR",
      vatRate: 0.19,
      isActive: true,
    },
  });

  const limassolLocation = await prisma.location.upsert({
    where: { slug: "LIMASSOL" },
    update: {
      name: "MY GERMAN DÖNER — Limassol Marina",
      address: "Limassol Marina Commercial Promenade, 3042 Limassol",
      phone: "+357 99 654321",
      currency: "EUR",
      vatRate: 0.19,
      isActive: true,
    },
    create: {
      slug: "LIMASSOL",
      name: "MY GERMAN DÖNER — Limassol Marina",
      address: "Limassol Marina Commercial Promenade, 3042 Limassol",
      phone: "+357 99 654321",
      currency: "EUR",
      vatRate: 0.19,
      isActive: true,
    },
  });

  // 2. Hardware Terminals (1 Kiosk, 1 POS, 2 KDS, 1 Display, 6 Menu Boards)
  const terminals = [
    { code: "KIOSK-01", type: "KIOSK", printer: "EPSON_TM" },
    { code: "POS-01", type: "POS_COUNTER", printer: "STAR_MICRONICS" },
    { code: "KDS-INDOOR", type: "KITCHEN_DISPLAY", printer: "EPSON_TM" },
    { code: "KDS-GRILL", type: "KITCHEN_DISPLAY", printer: "EPSON_TM" },
    { code: "DISPLAY-01", type: "CUSTOMER_DISPLAY", printer: "SIMULATED_SCREEN" },
    { code: "BOARD-01", type: "MENU_BOARD", printer: "SIMULATED_SCREEN" },
    { code: "BOARD-02", type: "MENU_BOARD", printer: "SIMULATED_SCREEN" },
    { code: "BOARD-03", type: "MENU_BOARD", printer: "SIMULATED_SCREEN" },
    { code: "BOARD-04", type: "MENU_BOARD", printer: "SIMULATED_SCREEN" },
    { code: "BOARD-05", type: "MENU_BOARD", printer: "SIMULATED_SCREEN" },
    { code: "BOARD-06", type: "MENU_BOARD", printer: "SIMULATED_SCREEN" },
  ];

  for (const t of terminals) {
    await prisma.terminal.upsert({
      where: {
        locationId_terminalCode: {
          locationId: embaLocation.id,
          terminalCode: t.code,
        },
      },
      update: {},
      create: {
        locationId: embaLocation.id,
        terminalCode: t.code,
        terminalType: t.type as any,
        printerType: t.printer as any,
        isActive: true,
      },
    });
  }

  // 3. Demo accounts
  if (process.env.NODE_ENV === "production") {
    console.log("Skipping demo accounts in production — use npm run user:create.");
  } else {
    const demoAccounts = [
      { username: "demo_owner", pin: "9999", role: "SYSTEM_ADMIN" as const },
      { username: "demo_manager", pin: "1111", role: "STORE_MANAGER" as const },
      { username: "demo_staff", pin: "1234", role: "STORE_STAFF" as const },
    ];
    for (const account of demoAccounts) {
      await prisma.adminUser.upsert({
        where: { username: account.username },
        update: {},
        create: { username: account.username, pinHash: await bcrypt.hash(account.pin, 10), role: account.role },
      });
    }
  }

  // 4. Suppliers
  const suppliersData = [
    {
      name: "Berlin Döner Fleischerei GmbH",
      category: "MEAT",
      contactName: "Hans Becker",
      whatsApp: "+35799531198",
      email: "orders@berlinfleisch.de",
      leadTimeHours: 24,
    },
    {
      name: "Paphos Fresh Bakery Ltd",
      category: "BAKERY",
      contactName: "Nikos Christou",
      whatsApp: "+35799654321",
      email: "orders@paphosbakery.cy",
      leadTimeHours: 12,
    },
    {
      name: "Cyprus Greens & Farm Fresh",
      category: "PRODUCE",
      contactName: "Elena Georgiou",
      whatsApp: "+35799789012",
      email: "supply@cyprusgreens.com",
      leadTimeHours: 24,
    },
    {
      name: "Hellenic Dairy & Cheese Imports",
      category: "DAIRY",
      contactName: "Andreas Dimitriou",
      whatsApp: "+35799890123",
      email: "sales@hellenicdairy.cy",
      leadTimeHours: 48,
    },
    {
      name: "German Spices & Marinades Co.",
      category: "DRY_GOODS",
      contactName: "Klaus Schmidt",
      whatsApp: "+35799901234",
      email: "klaus@germanspices.de",
      leadTimeHours: 72,
    },
    {
      name: "Bavaria Beverage Distributors",
      category: "BEVERAGE",
      contactName: "Markus Weber",
      whatsApp: "+35799012345",
      email: "orders@bavariabev.cy",
      leadTimeHours: 24,
    },
  ];

  const supplierMap: Record<string, any> = {};
  for (const s of suppliersData) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    if (existing) {
      const updated = await prisma.supplier.update({
        where: { id: existing.id },
        data: s,
      });
      supplierMap[s.category] = updated;
    } else {
      const created = await prisma.supplier.create({ data: s });
      supplierMap[s.category] = created;
    }
  }

  // 5. Raw Ingredients
  const ingredientsData = [
    { sku: "ING-BEEF-SPIT", name: "Veal & Beef Spit Rotisserie Meat", unit: "GRAMS", costPerUnitEUR: 0.012, supplierId: supplierMap["MEAT"].id },
    { sku: "ING-CHICKEN-SPIT", name: "Crispy Chicken Spit Rotisserie Meat", unit: "GRAMS", costPerUnitEUR: 0.009, supplierId: supplierMap["MEAT"].id },
    { sku: "ING-BREAD-FLADENBROT", name: "Toasted Sesame Berlin Fladenbrot", unit: "PIECES", costPerUnitEUR: 0.35, supplierId: supplierMap["BAKERY"].id },
    { sku: "ING-BREAD-LAVASH", name: "Thin Lavash Dürüm Flatbread", unit: "PIECES", costPerUnitEUR: 0.30, supplierId: supplierMap["BAKERY"].id },
    { sku: "ING-BREAD-BRIOCHE", name: "Toasted Brioche Burger Bun", unit: "PIECES", costPerUnitEUR: 0.40, supplierId: supplierMap["BAKERY"].id },
    { sku: "ING-PIZZA-DOUGH", name: "Stone-Baked Doezza Pizza Dough Base", unit: "PIECES", costPerUnitEUR: 0.65, supplierId: supplierMap["BAKERY"].id },
    { sku: "ING-POTATO-FRIES", name: "Crispy Skin-on Berlin Fries", unit: "GRAMS", costPerUnitEUR: 0.003, supplierId: supplierMap["PRODUCE"].id },
    { sku: "ING-SWEET-POTATO", name: "Sweet Potato Fry Cuts", unit: "GRAMS", costPerUnitEUR: 0.005, supplierId: supplierMap["PRODUCE"].id },
    { sku: "ING-CYPRUS-HALLOUMI", name: "Cyprus Fresh Grilling Halloumi", unit: "GRAMS", costPerUnitEUR: 0.014, supplierId: supplierMap["DAIRY"].id },
    { sku: "ING-GREEK-FETA", name: "Greek PDO Feta Cheese", unit: "GRAMS", costPerUnitEUR: 0.011, supplierId: supplierMap["DAIRY"].id },
    { sku: "ING-MOZZ-STICKS", name: "Crumbed Mozzarella Sticks", unit: "PIECES", costPerUnitEUR: 0.28, supplierId: supplierMap["DAIRY"].id },
    { sku: "ING-CHICKEN-NUGGETS", name: "100% Chicken Breast Nuggets", unit: "PIECES", costPerUnitEUR: 0.22, supplierId: supplierMap["MEAT"].id },
    { sku: "ING-CHICKEN-WINGS", name: "Crispy Seasoned Chicken Wings", unit: "PIECES", costPerUnitEUR: 0.32, supplierId: supplierMap["MEAT"].id },
    { sku: "ING-BEEF-KOFTE", name: "Berlin Style Spiced Köfte Meatballs", unit: "PIECES", costPerUnitEUR: 0.30, supplierId: supplierMap["MEAT"].id },
    { sku: "ING-AYRAN-BOTTLE", name: "Authentic Turkish/German Ayran (0.5L)", unit: "PIECES", costPerUnitEUR: 0.85, supplierId: supplierMap["BEVERAGE"].id },
    { sku: "ING-REDBULL-CAN", name: "Red Bull Energy Drink (250ml)", unit: "PIECES", costPerUnitEUR: 1.10, supplierId: supplierMap["BEVERAGE"].id },
    { sku: "ING-KOMBUCHA-BOTTLE", name: "Gaia Organic Kombucha (330ml)", unit: "PIECES", costPerUnitEUR: 1.25, supplierId: supplierMap["BEVERAGE"].id },
    { sku: "ING-COFFEE-BEANS", name: "Espresso Roast Coffee Beans", unit: "GRAMS", costPerUnitEUR: 0.018, supplierId: supplierMap["DRY_GOODS"].id },
    { sku: "ING-BEER-KEG-30L", name: "Hofbräu München Draft Beer Keg", unit: "MILLILITERS", costPerUnitEUR: 0.003, supplierId: supplierMap["BEVERAGE"].id },
  ];

  const ingredientMap: Record<string, any> = {};
  for (const ing of ingredientsData) {
    const item = await prisma.ingredient.upsert({
      where: { sku: ing.sku },
      update: ing,
      create: ing,
    });
    ingredientMap[ing.sku] = item;
  }

  // 6. Inventory stock setup
  const inventorySetup = [
    { sku: "ING-BEEF-SPIT", current: 35000, min: 8000, batch: 25000 },
    { sku: "ING-CHICKEN-SPIT", current: 28000, min: 6000, batch: 20000 },
    { sku: "ING-BREAD-FLADENBROT", current: 180, min: 40, batch: 120 },
    { sku: "ING-BREAD-LAVASH", current: 140, min: 30, batch: 100 },
    { sku: "ING-BREAD-BRIOCHE", current: 80, min: 20, batch: 60 },
    { sku: "ING-POTATO-FRIES", current: 45000, min: 10000, batch: 30000 },
    { sku: "ING-SWEET-POTATO", current: 15000, min: 4000, batch: 10000 },
    { sku: "ING-CYPRUS-HALLOUMI", current: 1500, min: 2000, batch: 5000 },
    { sku: "ING-BEEF-KOFTE", current: 25, min: 40, batch: 100 },
    { sku: "ING-CHICKEN-NUGGETS", current: 350, min: 100, batch: 200 },
    { sku: "ING-CHICKEN-WINGS", current: 280, min: 80, batch: 150 },
    { sku: "ING-MOZZ-STICKS", current: 180, min: 50, batch: 120 },
    { sku: "ING-AYRAN-BOTTLE", current: 65, min: 24, batch: 72 },
    { sku: "ING-REDBULL-CAN", current: 48, min: 20, batch: 48 },
    { sku: "ING-KOMBUCHA-BOTTLE", current: 36, min: 12, batch: 48 },
    { sku: "ING-COFFEE-BEANS", current: 2500, min: 1000, batch: 5000 },
  ];

  for (const inv of inventorySetup) {
    const ing = ingredientMap[inv.sku];
    if (ing) {
      await prisma.inventoryItem.upsert({
        where: { locationId_ingredientId: { locationId: embaLocation.id, ingredientId: ing.id } },
        update: { currentStock: inv.current, minThreshold: inv.min, reorderBatchSize: inv.batch },
        create: {
          locationId: embaLocation.id,
          ingredientId: ing.id,
          currentStock: inv.current,
          minThreshold: inv.min,
          reorderBatchSize: inv.batch,
        },
      });
    }
  }

  // ---------------------------------------------------------
  // 7. CLEANUP: REMOVE ALL OLD MENU ITEMS, ORDERS & CATEGORIES
  // ---------------------------------------------------------
  console.log("Removing all old menu items, orders and categories...");
  await prisma.kitchenTicket.deleteMany({});
  await prisma.orderItemModifier.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.recipeStep.deleteMany({});
  await prisma.recipeIngredient.deleteMany({});
  await prisma.recipeBOM.deleteMany({});
  await prisma.recipe.deleteMany({});
  await prisma.productModifierGroup.deleteMany({});
  await prisma.locationPrice.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  // ---------------------------------------------------------
  // 8. SEED NEW MASTER MENU CATEGORIES & PRODUCTS
  // ---------------------------------------------------------
  console.log(`Seeding ${menuData.categories.length} master categories and their items...`);

  const CATEGORY_TRANSLATIONS: Record<string, { de: string; gr: string }> = {
    "Pizza": { de: "Pizza", gr: "Πίτσα" },
    "Tacos": { de: "Tacos", gr: "Τάκος" },
    "MYGD Doezza": { de: "MYGD Doezza", gr: "MYGD Doezza" },
    "MYGD Burger": { de: "MYGD Burger", gr: "MYGD Μπέργκερ" },
    "Doener burger": { de: "Döner Burger", gr: "Ντονέρ Μπέργκερ" },
    "My warps": { de: "Meine Wraps", gr: "Τα Wrap μου" },
    "My big’s": { de: "Meine Big's", gr: "Τα Big μου" },
    "My Bowls": { de: "Meine Bowls", gr: "Τα Bowl μου" },
    "Sauce": { de: "Saucen", gr: "Σάλτσες" },
    "Kids Meal": { de: "Kindermenü", gr: "Παιδικό Γεύμα" },
    "Chicken Nuggets": { de: "Chicken Nuggets", gr: "Κοτομπουκιές" },
    "Chicken Wings": { de: "Chicken Wings", gr: "Φτερούγες Κοτόπουλου" },
    "Crunchy Fries": { de: "Knusprige Pommes", gr: "Τραγανές Πατάτες" },
    "Sweet Potato Fries": { de: "Süßkartoffel-Pommes", gr: "Πατάτες Γλυκοπατάτας" },
    "Make it a menu": { de: "Menü-Upgrade", gr: "Κάντο Μενού" },
    "Loaded Fries": { de: "Loaded Pommes", gr: "Loaded Πατάτες" },
    "Fresh Salad": { de: "Frischer Salat", gr: "Φρέσκια Σαλάτα" },
    "Meatballs": { de: "Köfte Fleischbällchen", gr: "Κεφτεδάκια" },
    "Mozzarella Sticks": { de: "Mozzarella-Sticks", gr: "Στικς Μοτσαρέλας" },
    "Smoothies": { de: "Smoothies", gr: "Smoothies" },
    "Milk shakes": { de: "Milchshakes", gr: "Μιλκσέικ" },
    "Fruit juices": { de: "Fruchtsäfte", gr: "Χυμοί Φρούτων" },
    "Water & Aryan": { de: "Wasser & Ayran", gr: "Νερό & Αριάνι" },
    "Energy drinks": { de: "Energy Drinks", gr: "Ενεργειακά Ποτά" },
    "Kombucha": { de: "Kombucha", gr: "Kombucha" },
    "Draft beer": { de: "Fassbier", gr: "Βαρελίσια Μπύρα" },
    "Bottled beer": { de: "Flaschenbier", gr: "Μπουκάλι Μπύρα" },
    "Wine": { de: "Wein", gr: "Κρασί" },
    "Soft drinks (postmix)": { de: "Alkoholfreie Getränke", gr: "Αναψυκτικά" },
    "Canned drinks": { de: "Getränkedosen", gr: "Κουτάκια Αναψυκτικών" },
    "Coffee": { de: "Kaffee", gr: "Καφές" },
  };

  const categoryMap: Record<string, any> = {};
  const productMap: Record<string, any> = {};

  for (let cIdx = 0; cIdx < menuData.categories.length; cIdx++) {
    const rawCat = menuData.categories[cIdx];
    const catSlug = "cat-" + rawCat.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const trans = CATEGORY_TRANSLATIONS[rawCat.category] || { de: rawCat.category, gr: rawCat.category };

    const category = await prisma.category.create({
      data: {
        slug: catSlug,
        name: rawCat.category,
        nameDE: trans.de,
        nameGR: trans.gr,
        description: rawCat.offer?.text || `${rawCat.category} selection`,
        sortOrder: cIdx + 1,
        isActive: true,
      },
    });
    categoryMap[rawCat.category] = category;

    // Seed items within category
    for (let iIdx = 0; iIdx < rawCat.items.length; iIdx++) {
      const it = rawCat.items[iIdx];
      const sku = generateSku(rawCat.category, it.name, it.variant);
      const fullName = it.variant ? `${it.name} (${it.variant})` : it.name;
      const imageUrl = resolveItemImage(rawCat.category, it.name);
      const vatCat = resolveVatCategory(rawCat.category);
      const veggie = isVeggieItem(rawCat.category, it.name, it.vegan || false);
      const spicy = isSpicyItem(it.name, it.description);
      const price = it.price_eur ?? 0.00;
      const mealUpgrade = allowMealUpgrade(rawCat.category);

      const prod = await prisma.product.create({
        data: {
          categoryId: category.id,
          sku,
          name: fullName,
          description: it.description || (it.ingredients && it.ingredients.length > 0 ? it.ingredients.join(", ") : undefined),
          basePrice: price,
          imageUrl,
          vatCategory: vatCat,
          isVeggie: veggie,
          isSpicy: spicy,
          isAvailable: true,
          allowMealUpgrade: mealUpgrade,
          sortOrder: iIdx + 1,
        },
      });
      productMap[sku] = prod;

      // Seed LocationPrice for EMBA and LIMASSOL
      await prisma.locationPrice.create({
        data: {
          locationId: embaLocation.id,
          productId: prod.id,
          price,
          isAvailable: true,
        },
      });

      await prisma.locationPrice.create({
        data: {
          locationId: limassolLocation.id,
          productId: prod.id,
          price,
          isAvailable: true,
        },
      });
    }
  }

  // ---------------------------------------------------------
  // 9. MODIFIERS & CUSTOMIZATION GROUPS
  // ---------------------------------------------------------
  const mgSauces = await prisma.modifierGroup.upsert({
    where: { slug: "sauces-12" },
    update: {},
    create: {
      slug: "sauces-12",
      name: "12 Signature Sauces",
      minSelected: 0,
      maxSelected: 3,
      isRequired: false,
      sortOrder: 1,
    },
  });

  const sauceMods = [
    { slug: "sauce-garlic", name: "Garlic Sauce", isDefault: true },
    { slug: "sauce-bbq", name: "BBQ Sauce" },
    { slug: "sauce-honey-mustard", name: "Honey Mustard" },
    { slug: "sauce-cheese-hot", name: "Cheese Hot Dip" },
    { slug: "sauce-tzatziki", name: "Tzatziki" },
    { slug: "sauce-sour-cream", name: "Sour Cream" },
    { slug: "sauce-lemon-herb", name: "Lemon Herb" },
    { slug: "sauce-cocktail", name: "Cocktail Sauce" },
    { slug: "sauce-hot-spicy", name: "Hot Spicy" },
    { slug: "sauce-vegan-garlic", name: "Vegan Garlic" },
    { slug: "sauce-mayo", name: "Mayonnaise" },
    { slug: "sauce-ketchup", name: "Ketchup" },
  ];

  for (const s of sauceMods) {
    await prisma.modifier.upsert({
      where: { modifierGroupId_slug: { modifierGroupId: mgSauces.id, slug: s.slug } },
      update: { name: s.name, isDefault: s.isDefault ?? false },
      create: { modifierGroupId: mgSauces.id, slug: s.slug, name: s.name, priceAdjustment: 0.00, isDefault: s.isDefault ?? false },
    });
  }

  const mgMealUpgrade = await prisma.modifierGroup.upsert({
    where: { slug: "make-it-a-menu" },
    update: {},
    create: {
      slug: "make-it-a-menu",
      name: "Make It A Menu (Fries/Rice + 0.4L Drink)",
      minSelected: 0,
      maxSelected: 1,
      isRequired: false,
      sortOrder: 2,
    },
  });

  const mealUpgradeOptions = [
    { slug: "menu-regular", name: "Regular Menu (Fries/Rice + 0.4L Drink)", price: 3.00 },
    { slug: "menu-medium", name: "Medium Menu (Fries/Rice + 0.4L Drink)", price: 3.50 },
    { slug: "menu-large", name: "Large Menu (Fries/Rice + 0.4L Drink)", price: 4.50 },
  ];

  for (const o of mealUpgradeOptions) {
    await prisma.modifier.upsert({
      where: { modifierGroupId_slug: { modifierGroupId: mgMealUpgrade.id, slug: o.slug } },
      update: { name: o.name, priceAdjustment: o.price },
      create: { modifierGroupId: mgMealUpgrade.id, slug: o.slug, name: o.name, priceAdjustment: o.price },
    });
  }

  // Link Sauces and Meal Upgrade to eligible products
  for (const [sku, prod] of Object.entries(productMap)) {
    if (prod.allowMealUpgrade) {
      await prisma.productModifierGroup.create({
        data: {
          productId: prod.id,
          modifierGroupId: mgMealUpgrade.id,
          sortOrder: 1,
        },
      });
      await prisma.productModifierGroup.create({
        data: {
          productId: prod.id,
          modifierGroupId: mgSauces.id,
          sortOrder: 2,
        },
      });
    }
  }

  // ---------------------------------------------------------
  // 10. BILL OF MATERIALS (BOM) & RECIPE MAPPINGS
  // ---------------------------------------------------------
  const bomMappings = [
    { prodSku: "MYGD-DOENER-BURGER-HAMBURG-DOENER", ingSku: "ING-BEEF-SPIT", amount: 150 },
    { prodSku: "MYGD-DOENER-BURGER-HAMBURG-DOENER", ingSku: "ING-BREAD-FLADENBROT", amount: 1 },
    { prodSku: "MYGD-DOENER-BURGER-MY-CHICKEN", ingSku: "ING-CHICKEN-SPIT", amount: 150 },
    { prodSku: "MYGD-DOENER-BURGER-MY-CHICKEN", ingSku: "ING-BREAD-FLADENBROT", amount: 1 },
    { prodSku: "MYGD-MY-WRAPS-BEEF-WRAP", ingSku: "ING-BEEF-SPIT", amount: 150 },
    { prodSku: "MYGD-MY-WRAPS-BEEF-WRAP", ingSku: "ING-BREAD-LAVASH", amount: 1 },
    { prodSku: "MYGD-MY-WRAPS-CHICKEN-WRAP", ingSku: "ING-CHICKEN-SPIT", amount: 150 },
    { prodSku: "MYGD-MY-WRAPS-CHICKEN-WRAP", ingSku: "ING-BREAD-LAVASH", amount: 1 },
    { prodSku: "MYGD-MY-BIG-S-BIG-B", ingSku: "ING-BEEF-SPIT", amount: 250 },
    { prodSku: "MYGD-MY-BIG-S-BIG-B", ingSku: "ING-BREAD-FLADENBROT", amount: 1 },
    { prodSku: "MYGD-MY-BIG-S-BIG-CHICK", ingSku: "ING-CHICKEN-SPIT", amount: 250 },
    { prodSku: "MYGD-MY-BIG-S-BIG-CHICK", ingSku: "ING-BREAD-FLADENBROT", amount: 1 },
    { prodSku: "MYGD-MY-BOWLS-BEEF-BOWL", ingSku: "ING-BEEF-SPIT", amount: 150 },
    { prodSku: "MYGD-MY-BOWLS-CHICKEN-BOWL", ingSku: "ING-CHICKEN-SPIT", amount: 150 },
    { prodSku: "MYGD-CHICKEN-NUGGETS-CHICKEN-NUGGETS-6-PCS", ingSku: "ING-CHICKEN-NUGGETS", amount: 6 },
    { prodSku: "MYGD-CHICKEN-WINGS-CHICKEN-WINGS-6-PCS", ingSku: "ING-CHICKEN-WINGS", amount: 6 },
    { prodSku: "MYGD-MEATBALLS-MEATBALLS-6-PCS", ingSku: "ING-BEEF-KOFTE", amount: 6 },
    { prodSku: "MYGD-MOZZARELLA-STICKS-MOZZARELLA-STICKS-6-PCS", ingSku: "ING-MOZZ-STICKS", amount: 6 },
    { prodSku: "MYGD-CRUNCHY-FRIES-CRUNCHY-FRIES-REGULAR", ingSku: "ING-POTATO-FRIES", amount: 200 },
    { prodSku: "MYGD-SWEET-POTATO-FRIES-SWEET-POTATO-FRIES-REGULAR", ingSku: "ING-SWEET-POTATO", amount: 200 },
    { prodSku: "MYGD-LOADED-FRIES-CHEESY-FRIES", ingSku: "ING-POTATO-FRIES", amount: 250 },
    { prodSku: "MYGD-WATER-AYRAN-AYRAN-0-5L", ingSku: "ING-AYRAN-BOTTLE", amount: 1 },
    { prodSku: "MYGD-ENERGY-DRINKS-REDBULL", ingSku: "ING-REDBULL-CAN", amount: 1 },
    { prodSku: "MYGD-DRAFT-BEER-HOFBR-U-M-NCHEN-0-5L", ingSku: "ING-BEER-KEG-30L", amount: 500 },
    { prodSku: "MYGD-COFFEE-ESPRESSO", ingSku: "ING-COFFEE-BEANS", amount: 9 },
  ];

  for (const bom of bomMappings) {
    const prod = productMap[bom.prodSku];
    const ing = ingredientMap[bom.ingSku];
    if (prod && ing) {
      await prisma.recipeBOM.create({
        data: { productId: prod.id, ingredientId: ing.id, amountGrams: bom.amount },
      });

      const recipe = await prisma.recipe.create({
        data: { productId: prod.id, variantName: "STANDARD", yieldServings: 1, prepTimeSec: 180 },
      });

      await prisma.recipeIngredient.create({
        data: { recipeId: recipe.id, ingredientId: ing.id, amountUnits: bom.amount },
      });
    }
  }

  // ---------------------------------------------------------
  // 11. COMPLETE PHYSICAL 4K SCREEN CONFIGS (ZERO UNSPLASH)
  // ---------------------------------------------------------
  const screenConfigs = [
    {
      screenNumber: 1,
      title: "DOENER BURGERS, MY WRAPS & BIG'S",
      layoutType: "PRICE_MATRIX",
      activeDaypart: "AUTO",
      itemsJson: JSON.stringify([
        { name: "Hamburg Doener", desc: "Doener meat, salad, ketchup, mayo, mustard", price: 6.90, badge: "TOP_SELLER", imageUrl: "/assets/menu/products/hamburg-doener.jpg" },
        { name: "My Chicken", desc: "Chicken doener, crisp salad, ketchup, mayo", price: 6.90, badge: "BESTSELLER", imageUrl: "/assets/menu/products/chicken-doener.webp" },
        { name: "Cheese Doener", desc: "Doener meat, cheese, salad, bbq sauce", price: 7.50, badge: "POPULAR", imageUrl: "/assets/menu/products/cheese-doener.webp" },
        { name: "Cheese Chicken Doener", desc: "Chicken doener, cheese, salad, ketchup, mayo", price: 7.50, imageUrl: "/assets/menu/products/cheese-chicken-doener.webp" },
        { name: "Beef Wrap", desc: "Beef doener, salad, cocktail sauce", price: 9.90, badge: "TOP_SELLER", imageUrl: "/assets/menu/products/beef-wrap.jpg" },
        { name: "Chicken Wrap", desc: "Chicken doener, salad, garlic sauce", price: 9.90, badge: "BESTSELLER", imageUrl: "/assets/menu/products/chicken-wrap.webp" },
        { name: "Big Chick", desc: "Chicken doener, original berlin flatbread, salad, garlic sauce", price: 11.90, badge: "CHEF_CHOICE", imageUrl: "/assets/menu/products/big-chick.webp" },
        { name: "Big B", desc: "Beef doener, original berlin flatbread, salad, cocktail sauce", price: 11.90, badge: "POPULAR", imageUrl: "/assets/menu/products/big-b-doener.jpg" },
      ]),
    },
    {
      screenNumber: 2,
      title: "PIZZAS, TACOS, BURGERS & DOEZZA",
      layoutType: "PRICE_MATRIX",
      activeDaypart: "AUTO",
      itemsJson: JSON.stringify([
        { name: "Margherita Pizza", desc: "Tomato sauce, mozzarella, tomatoes · 2nd pizza 20% off", price: 15.90, badge: "20% OFF 2ND", imageUrl: "/assets/menu/products/pizza-margherita.webp" },
        { name: "Chicken Doener Pizza", desc: "Tomato sauce, mozzarella, chicken doener, onions, choice of sauce", price: 17.90, badge: "BESTSELLER", imageUrl: "/assets/menu/products/chicken-doener-pizza.jpg" },
        { name: "Beef Taco", desc: "Beef, salad, bbq sauce · 4 tacos 11.90€", price: 3.50, badge: "4 FOR €11.90", imageUrl: "/assets/menu/products/beef-taco.jpg" },
        { name: "Chicken Taco", desc: "Chicken, salad, garlic sauce · 4 tacos 11.90€", price: 3.50, imageUrl: "/assets/menu/products/taco-chicken.webp" },
        { name: "Beefster Burger", desc: "MYGD signature beef burger", price: 7.95, badge: "BESTSELLER", imageUrl: "/assets/menu/products/burger-beefster.webp" },
        { name: "CHEESY GD Burger", desc: "Double melted cheese döner burger", price: 9.95, badge: "POPULAR", imageUrl: "/assets/menu/products/burger-cheesy-gd.webp" },
        { name: "Doezza Margherita", desc: "Crispy flatbread pizza slice", price: 6.50, imageUrl: "/assets/menu/products/doezza-margherita.webp" },
        { name: "Doezza Four Cheese", desc: "Four melted cheeses flatbread slice", price: 7.95, badge: "CHEF_CHOICE", imageUrl: "/assets/menu/products/doezza-four-cheese.webp" },
      ]),
    },
    {
      screenNumber: 3,
      title: "BOWLS, LOADED FRIES, NUGGETS & WINGS",
      layoutType: "PRICE_MATRIX",
      activeDaypart: "AUTO",
      itemsJson: JSON.stringify([
        { name: "Beef Bowl", desc: "Beef doener, white rice or fries, fresh salad, choice of sauce", price: 9.90, badge: "TOP_SELLER", imageUrl: "/assets/menu/products/doener-bowl.jpg" },
        { name: "Chicken Bowl", desc: "Chicken doener, white rice or fries, fresh salad, choice of sauce", price: 9.90, badge: "BESTSELLER", imageUrl: "/assets/menu/products/chicken-bowl.webp" },
        { name: "Hollandaise Loaded Fries", desc: "Crispy fries smothered in hollandaise sauce", price: 7.90, badge: "CHEF_CHOICE", imageUrl: "/assets/menu/products/loaded-hollandaise.webp" },
        { name: "Jalapeño Sour Cream Fries", desc: "Crispy fries, jalapeños, sour cream & herbs", price: 7.90, badge: "SPICY", imageUrl: "/assets/menu/products/loaded-jalapeno.webp" },
        { name: "Cheesy Loaded Fries", desc: "Warm melted cheddar cheese sauce", price: 7.90, badge: "POPULAR", imageUrl: "/assets/menu/products/cheesy-fries.jpg" },
        { name: "Chicken Nuggets (6 pcs)", desc: "100% chicken breast bites with dipping sauce", price: 4.90, imageUrl: "/assets/menu/products/chicken-nuggets.webp" },
        { name: "Chicken Wings (6 pcs)", desc: "Crispy hot seasoned wings with sauce", price: 5.90, imageUrl: "/assets/menu/products/chicken-wings.webp" },
        { name: "Meatballs (6 pcs)", desc: "Served with fries or white rice & hollandaise", price: 7.50, badge: "POPULAR", imageUrl: "/assets/menu/products/meatballs.webp" },
      ]),
    },
    {
      screenNumber: 4,
      title: "FRIES, SIDES, KIDS MEAL & SALADS",
      layoutType: "SPLIT_COMBO",
      activeDaypart: "AUTO",
      itemsJson: JSON.stringify([
        { name: "Kids Meal Box", desc: "Kids Doener / 4 Nuggets / 4 Meatballs + Kinder Riegel + Drink + Fries", price: 5.00, badge: "KIDS SPECIAL", imageUrl: "/assets/menu/products/kids-meal.webp" },
        { name: "Crunchy Fries (Regular)", desc: "Double-fried crispy fries with ketchup or mayo", price: 2.50, badge: "BESTSELLER", imageUrl: "/assets/menu/products/crunchy-fries.webp" },
        { name: "Sweet Potato Fries (Regular)", desc: "Crispy sweet potato fries with ketchup or mayo", price: 2.90, imageUrl: "/assets/menu/products/sweet-potato-fries.webp" },
        { name: "Make It A Menu", desc: "Choose Fries or Rice + 0.4L drink · Reg €3.00 / Med €3.50 / Lrg €4.50", price: 3.00, badge: "UPGRADE", imageUrl: "/assets/menu/upgrade/combo.jpg" },
        { name: "Mozzarella Sticks (6 pcs)", desc: "Golden crumbed mozzarella with dipping sauce", price: 5.90, imageUrl: "/assets/menu/products/mozzarella-sticks.webp" },
        { name: "Green Salad", desc: "Lettuce, cucumber, tomatoes, red cabbage, onion, vinegar & oil", price: 6.90, badge: "VEGGIE", imageUrl: "/assets/menu/products/salad-garden.webp" },
        { name: "Chicken Salad", desc: "Fresh salad topped with chicken, vinegar & oil dressing", price: 8.90, imageUrl: "/assets/menu/products/salad-chicken.webp" },
        { name: "Halloumi Salad", desc: "Fresh salad with grilled Cyprus halloumi cheese", price: 8.90, badge: "CHEF_CHOICE", imageUrl: "/assets/menu/products/salad-halloumi.webp" },
      ]),
    },
    {
      screenNumber: 5,
      title: "SMOOTHIES, SHAKES, JUICES & WATER",
      layoutType: "DRINKS_SIDES",
      activeDaypart: "AUTO",
      itemsJson: JSON.stringify([
        { name: "Tropical Twist Smoothie", desc: "Pure tropical fruit blend", price: 2.99, badge: "POPULAR", imageUrl: "/assets/menu/products/smoothies-blend.webp" },
        { name: "Berry Booster Smoothie", desc: "Antioxidant rich wild berry blend", price: 2.99, imageUrl: "/assets/menu/products/smoothies-blend.webp" },
        { name: "Strawberry Milkshake", desc: "Creamy classic strawberry shake", price: 2.90, imageUrl: "/assets/menu/products/milkshakes-trio.webp" },
        { name: "Chocolate Milkshake", desc: "Rich double chocolate shake", price: 2.90, imageUrl: "/assets/menu/products/milkshakes-trio.webp" },
        { name: "Authentic Ayran (0.5L)", desc: "Chilled savory yogurt drink", price: 3.50, badge: "BESTSELLER", imageUrl: "/assets/menu/products/water-ayran.webp" },
        { name: "Still Water", desc: "Natural chilled mineral water", price: 1.50, imageUrl: "/assets/menu/products/water-ayran.webp" },
        { name: "Red Bull Energy Drink", desc: "Vitalizes body and mind (250ml)", price: 3.00, imageUrl: "/assets/menu/products/red-bull.webp" },
        { name: "Cocoloco Energy Drink", desc: "Refreshing coconut energy boost", price: 2.50, imageUrl: "/assets/menu/products/coco-loco.webp" },
      ]),
    },
    {
      screenNumber: 6,
      title: "BEERS, WINE, SOFT DRINKS & COFFEE",
      layoutType: "PRICE_MATRIX",
      activeDaypart: "AUTO",
      itemsJson: JSON.stringify([
        { name: "Hofbräu München Draft (0.5L)", desc: "Imported German Munich lager (5.1% ABV)", price: 6.00, badge: "GERMAN DRAFT", imageUrl: "/assets/menu/products/drink-draft-beer.webp" },
        { name: "Hofbräu München Draft (0.3L)", desc: "Fresh pulled German draft", price: 4.00, imageUrl: "/assets/menu/products/drink-draft-beer.webp" },
        { name: "Corona Extra", desc: "Chilled Mexican pale lager", price: 4.00, imageUrl: "/assets/menu/products/drink-bottled-beer.webp" },
        { name: "KEO Beer (Cyprus)", desc: "Local favorite golden lager", price: 3.00, imageUrl: "/assets/menu/products/drink-bottled-beer.webp" },
        { name: "Red Wine / White Wine", desc: "Selected glass of Mediterranean wine", price: 4.00, imageUrl: "/assets/menu/products/drink-wine.webp" },
        { name: "Postmix Soft Drinks (0.4L)", desc: "Coca-Cola, Zero, Fanta Zero, Sprite, Soda", price: 2.50, imageUrl: "/assets/menu/products/drink-postmix-soda.webp" },
        { name: "Canned Drinks (330ml)", desc: "Fanta Lemon, Lipton Ice Tea Peach/Lemon", price: 2.50, imageUrl: "/assets/menu/products/drink-canned-soda.webp" },
        { name: "Espresso / Cappuccino", desc: "Freshly roasted Italian coffee roast", price: 2.00, imageUrl: "/assets/menu/products/coffee-espresso.webp" },
      ]),
    },
  ];

  for (const s of screenConfigs) {
    await prisma.menuBoardConfig.upsert({
      where: { screenNumber: s.screenNumber },
      update: s,
      create: { ...s, isOnline: true, lastPing: new Date() },
    });
  }

  const seededCatCount = await prisma.category.count();
  const seededProdCount = await prisma.product.count();

  console.log(`✅ Successfully seeded MYGD Master Menu:
  - 2 Locations (Emba Flagship & Limassol Marina)
  - 11 Terminals (Kiosk, POS, Dual KDS, CX-Wait, 6x 4K Menu Boards)
  - 6 Suppliers with live Cyprus WhatsApp dispatch lines
  - 19 Gram-Precision Ingredients with supplier links
  - In-store inventory stock levels
  - ${seededCatCount} Production Menu Categories
  - ${seededProdCount} Master Products with exact pricing, VAT classification & local macro assets
  - 2 Master Customization Groups (12 Sauces, Make It A Menu)
  - 25 Recipe BOM ingredient portion deductions
  - 6 Overhead 4K Menu Board Screen configurations (100% local assets, zero unsplash)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
