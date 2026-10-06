import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedMenu } from "./seed-menu";
import { DEFAULT_VAT_RATE } from "../src/lib/tax";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding MY GERMAN DÖNER Comprehensive 6-Board Production Catalog & Real-Time Ops...");

  // 1. Locations (Emba Flagship & Limassol Marina Hub)
  const embaLocation = await prisma.location.upsert({
    where: { slug: "EMBA" },
    update: {
      name: "MY GERMAN DÖNER — Emba Flagship (Paphos)",
      address: "Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Paphos",
      phone: "+357 99 531198",
      currency: "EUR",
      vatRate: DEFAULT_VAT_RATE,
      isActive: true,
    },
    create: {
      slug: "EMBA",
      name: "MY GERMAN DÖNER — Emba Flagship (Paphos)",
      address: "Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Paphos",
      phone: "+357 99 531198",
      currency: "EUR",
      vatRate: DEFAULT_VAT_RATE,
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
      vatRate: DEFAULT_VAT_RATE,
      isActive: true,
    },
    create: {
      slug: "LIMASSOL",
      name: "MY GERMAN DÖNER — Limassol Marina",
      address: "Limassol Marina Commercial Promenade, 3042 Limassol",
      phone: "+357 99 654321",
      currency: "EUR",
      vatRate: DEFAULT_VAT_RATE,
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

  // 3. Demo accounts — development only.
  // [ADR] Context: these PINs are public (they were in source and docs), and the old
  // upserts reset real PINs on every re-run. Decision: never create them in
  // production and never overwrite an existing account. Consequence: real accounts
  // are created with `npm run user:create` (private PINs, bcrypt cost 12).
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

  // 4. Suppliers (Dedicated Vendor Hub with verified Cyprus contacts)
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
      name: "Paphos Beverage & Beer Distributors",
      category: "BEVERAGES",
      contactName: "Marios Ioannou",
      whatsApp: "+35799901234",
      email: "orders@paphosdrinks.cy",
      leadTimeHours: 24,
    },
    {
      name: "EcoPack Cyprus Packaging Co",
      category: "PACKAGING",
      contactName: "Charis Stylianou",
      whatsApp: "+35799123456",
      email: "orders@ecopack.cy",
      leadTimeHours: 48,
    },
  ];

  const supplierMap: Record<string, any> = {};
  for (const s of suppliersData) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    if (existing) {
      supplierMap[s.category] = existing;
    } else {
      const created = await prisma.supplier.create({ data: s });
      supplierMap[s.category] = created;
    }
  }

  // 5. Ingredients (Gram-precision units & Supplier links)
  const ingredientsData = [
    { sku: "ING-BEEF-SPIT", name: "Veal & Beef Döner Spit Meat", unit: "GRAMS", cost: 0.012, supplier: supplierMap.MEAT.id },
    { sku: "ING-CHICKEN-SPIT", name: "Crispy Chicken Spit Meat", unit: "GRAMS", cost: 0.009, supplier: supplierMap.MEAT.id },
    { sku: "ING-VEGAN-DONER", name: "Plant-Based Veggie Döner Strips", unit: "GRAMS", cost: 0.011, supplier: supplierMap.MEAT.id },
    { sku: "ING-CHICKEN-NUGGETS", name: "Crispy Chicken Breast Nuggets", unit: "PIECES", cost: 0.35, supplier: supplierMap.MEAT.id },
    { sku: "ING-CHICKEN-WINGS", name: "Marinated Hot Chicken Wings", unit: "PIECES", cost: 0.45, supplier: supplierMap.MEAT.id },
    { sku: "ING-BEEF-KOFTE", name: "Berlin Style Spiced Köfte Meatballs", unit: "PIECES", cost: 0.50, supplier: supplierMap.MEAT.id },

    { sku: "ING-BREAD-FLADENBROT", name: "Fresh Sesame Triangle Fladenbrot", unit: "PIECES", cost: 0.40, supplier: supplierMap.BAKERY.id },
    { sku: "ING-BREAD-LAVASH", name: "Warm Lavash Flatbread Wrap", unit: "PIECES", cost: 0.30, supplier: supplierMap.BAKERY.id },
    { sku: "ING-BREAD-BRIOCHE", name: "Toasted Butter Brioche Burger Bun", unit: "PIECES", cost: 0.45, supplier: supplierMap.BAKERY.id },
    { sku: "ING-PIZZA-DOUGH", name: "33cm Stone-Baked Thin Pizza Base", unit: "PIECES", cost: 0.85, supplier: supplierMap.BAKERY.id },

    { sku: "ING-POTATO-FRIES", name: "Skin-On Fries (Raw/Frozen)", unit: "GRAMS", cost: 0.003, supplier: supplierMap.PRODUCE.id },
    { sku: "ING-SWEET-POTATO", name: "Crispy Sweet Potato Fries", unit: "GRAMS", cost: 0.005, supplier: supplierMap.PRODUCE.id },

    { sku: "ING-MOZZ-STICKS", name: "Golden Crumbed Mozzarella Sticks", unit: "PIECES", cost: 0.40, supplier: supplierMap.DAIRY.id },
    { sku: "ING-CYPRUS-HALLOUMI", name: "Authentic Cyprus PDO Grilled Halloumi", unit: "GRAMS", cost: 0.015, supplier: supplierMap.DAIRY.id },
    { sku: "ING-GREEK-FETA", name: "Authentic Sheep's Milk Greek Feta", unit: "GRAMS", cost: 0.012, supplier: supplierMap.DAIRY.id },

    { sku: "ING-BEER-KEG-30L", name: "German Premium Pilsner Draft Keg", unit: "MILLILITERS", cost: 0.003, supplier: supplierMap.BEVERAGES.id },
    { sku: "ING-AYRAN-BOTTLE", name: "Original Chilled Ayran (250ml)", unit: "PIECES", cost: 0.60, supplier: supplierMap.BEVERAGES.id },
    { sku: "ING-REDBULL-CAN", name: "Red Bull Energy Drink (250ml)", unit: "PIECES", cost: 1.10, supplier: supplierMap.BEVERAGES.id },
    { sku: "ING-KOMBUCHA-BOTTLE", name: "Kombucha Bottle (all flavours)", unit: "PIECES", cost: 1.50, supplier: supplierMap.BEVERAGES.id },
    { sku: "ING-COFFEE-BEANS", name: "Specialty Roasted Espresso Beans", unit: "GRAMS", cost: 0.020, supplier: supplierMap.BEVERAGES.id },
  ];

  const ingredientMap: Record<string, any> = {};
  for (const ing of ingredientsData) {
    const item = await prisma.ingredient.upsert({
      where: { sku: ing.sku },
      update: { name: ing.name, unit: ing.unit, costPerUnitEUR: ing.cost, supplierId: ing.supplier },
      create: { sku: ing.sku, name: ing.name, unit: ing.unit, costPerUnitEUR: ing.cost, supplierId: ing.supplier },
    });
    ingredientMap[ing.sku] = item;
  }

  // 6. In-Store Inventory Levels (Store 01 EMBA) with 2 Low Stock Alert Triggers
  const inventorySetup = [
    { sku: "ING-BEEF-SPIT", current: 35000, min: 5000, batch: 20000 },
    { sku: "ING-CHICKEN-SPIT", current: 28000, min: 5000, batch: 20000 },
    { sku: "ING-VEGAN-DONER", current: 6000, min: 2000, batch: 5000 },
    { sku: "ING-CHICKEN-NUGGETS", current: 180, min: 50, batch: 200 },
    { sku: "ING-CHICKEN-WINGS", current: 120, min: 30, batch: 150 },
    // LOW STOCK: Köfte Meatballs currently below min threshold (25 < 40) -> Triggers Warning & Supplier Contact
    { sku: "ING-BEEF-KOFTE", current: 25, min: 40, batch: 100 },

    { sku: "ING-BREAD-FLADENBROT", current: 150, min: 30, batch: 200 },
    { sku: "ING-BREAD-LAVASH", current: 120, min: 30, batch: 150 },
    { sku: "ING-BREAD-BRIOCHE", current: 65, min: 20, batch: 80 },
    { sku: "ING-PIZZA-DOUGH", current: 45, min: 15, batch: 50 },

    { sku: "ING-POTATO-FRIES", current: 40000, min: 10000, batch: 50000 },
    { sku: "ING-SWEET-POTATO", current: 12000, min: 5000, batch: 20000 },

    { sku: "ING-MOZZ-STICKS", current: 140, min: 40, batch: 150 },
    // LOW STOCK: Halloumi currently below min threshold (1200g < 2000g) -> Triggers Warning & Supplier Contact
    { sku: "ING-CYPRUS-HALLOUMI", current: 1200, min: 2000, batch: 10000 },
    { sku: "ING-GREEK-FETA", current: 3500, min: 1500, batch: 5000 },

    { sku: "ING-BEER-KEG-30L", current: 25000, min: 5000, batch: 30000 },
    { sku: "ING-AYRAN-BOTTLE", current: 72, min: 24, batch: 96 },
    { sku: "ING-REDBULL-CAN", current: 48, min: 24, batch: 72 },
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

  // 7-11. Official menu: categories, products, options, recipes, promotions and screens
  await seedMenu(prisma, ingredientMap);

  console.log(`✅ Successfully seeded:
  - 2 Locations (Emba Flagship & Limassol Marina)
  - 11 Terminals (Kiosk, POS, Dual KDS, CX-Wait, 6x 4K Menu Boards)
  - 6 Suppliers with live Cyprus WhatsApp dispatch lines
  - 20 Gram-Precision Ingredients with supplier links
  - In-store inventory stock levels with 2 low-stock alert triggers (Köfte & Halloumi)
  - Official MYGD menu (see the 🍽 line above): categories, products, options, recipes, promotions, screens`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
