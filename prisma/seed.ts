import { PrismaClient, VatCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

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
    { sku: "ING-STEAK-MEAT", name: "100% Pure Beef Steak Strips", unit: "GRAMS", cost: 0.016, supplier: supplierMap.MEAT.id },
    { sku: "ING-VEGAN-DONER", name: "Plant-Based Veggie Döner Strips", unit: "GRAMS", cost: 0.011, supplier: supplierMap.MEAT.id },
    { sku: "ING-CHICKEN-NUGGETS", name: "Crispy Chicken Breast Nuggets", unit: "PIECES", cost: 0.35, supplier: supplierMap.MEAT.id },
    { sku: "ING-CHICKEN-WINGS", name: "Marinated Hot Chicken Wings", unit: "PIECES", cost: 0.45, supplier: supplierMap.MEAT.id },
    { sku: "ING-BEEF-KOFTE", name: "Berlin Style Spiced Köfte Meatballs", unit: "PIECES", cost: 0.50, supplier: supplierMap.MEAT.id },

    { sku: "ING-BREAD-FLADENBROT", name: "Fresh Sesame Triangle Fladenbrot", unit: "PIECES", cost: 0.40, supplier: supplierMap.BAKERY.id },
    { sku: "ING-BREAD-LAVASH", name: "Warm Lavash Flatbread Wrap", unit: "PIECES", cost: 0.30, supplier: supplierMap.BAKERY.id },
    { sku: "ING-BREAD-BRIOCHE", name: "Toasted Butter Brioche Burger Bun", unit: "PIECES", cost: 0.45, supplier: supplierMap.BAKERY.id },
    { sku: "ING-PIZZA-DOUGH", name: "33cm Stone-Baked Thin Pizza Base", unit: "PIECES", cost: 0.85, supplier: supplierMap.BAKERY.id },

    { sku: "ING-POTATO-FRIES", name: "Skin-On Berlin Fries (Raw/Frozen)", unit: "GRAMS", cost: 0.003, supplier: supplierMap.PRODUCE.id },
    { sku: "ING-SWEET-POTATO", name: "Crispy Sweet Potato Fries", unit: "GRAMS", cost: 0.005, supplier: supplierMap.PRODUCE.id },
    { sku: "ING-ONION-RINGS", name: "Beer Battered Onion Rings", unit: "PIECES", cost: 0.20, supplier: supplierMap.PRODUCE.id },

    { sku: "ING-MOZZ-STICKS", name: "Golden Crumbed Mozzarella Sticks", unit: "PIECES", cost: 0.40, supplier: supplierMap.DAIRY.id },
    { sku: "ING-CYPRUS-HALLOUMI", name: "Authentic Cyprus PDO Grilled Halloumi", unit: "GRAMS", cost: 0.015, supplier: supplierMap.DAIRY.id },
    { sku: "ING-GREEK-FETA", name: "Authentic Sheep's Milk Greek Feta", unit: "GRAMS", cost: 0.012, supplier: supplierMap.DAIRY.id },

    { sku: "ING-BEER-KEG-30L", name: "German Premium Pilsner Draft Keg", unit: "MILLILITERS", cost: 0.003, supplier: supplierMap.BEVERAGES.id },
    { sku: "ING-AYRAN-BOTTLE", name: "Original Chilled Ayran (250ml)", unit: "PIECES", cost: 0.60, supplier: supplierMap.BEVERAGES.id },
    { sku: "ING-REDBULL-CAN", name: "Red Bull Energy Drink (250ml)", unit: "PIECES", cost: 1.10, supplier: supplierMap.BEVERAGES.id },
    { sku: "ING-KOMBUCHA-BOTTLE", name: "Organic Ginger Kombucha (330ml)", unit: "PIECES", cost: 1.50, supplier: supplierMap.BEVERAGES.id },
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
    { sku: "ING-STEAK-MEAT", current: 8500, min: 3000, batch: 10000 },
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
    { sku: "ING-ONION-RINGS", current: 160, min: 50, batch: 200 },

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

  // 7. Categories for All 6 Physical Boards
  const categoriesData = [
    { slug: "board-1-doener-wraps", name: "Board 1: Döner Buns & Wraps", nameDE: "Döner & Dürüm Spezialitäten", nameGR: "Ντόνερ & Τυλιχτά", sortOrder: 1 },
    { slug: "board-2-loaded-fries-nuggets", name: "Board 2: Loaded Fries, Nuggets & Wings", nameDE: "Loaded Fries, Nuggets & Wings", nameGR: "Ειδικές Πατάτες & Φτερούγες", sortOrder: 2 },
    { slug: "board-3-sides-sticks-kids", name: "Board 3: Fingerfood, Sides & Kids", nameDE: "Fingerfood, Beilagen & Kids", nameGR: "Συνοδευτικά & Παιδικά", sortOrder: 3 },
    { slug: "board-4-burgers-bowls-doezza", name: "Board 4: Burgers, Bowls & Doezza", nameDE: "Burgers, Bowls & Doezza Pizza", nameGR: "Μπέργκερ, Μπολ & Doezza", sortOrder: 4 },
    { slug: "board-5-smoothies-shakes-drinks", name: "Board 5: Smoothies, Shakes & Drinks", nameDE: "Smoothies, Shakes & Erfrischungen", nameGR: "Smoothies & Αναψυκτικά", sortOrder: 5 },
    { slug: "board-6-draft-beer-wine-coffee", name: "Board 6: Draft Beer, Wine & Coffee", nameDE: "Deutsches Bier, Wein & Kaffee", nameGR: "Μπύρα, Κρασί & Καφές", sortOrder: 6 },
    { slug: "meal-combos", name: "Meal Deals & Combos", nameDE: "Sparmenüs & Deals", nameGR: "Οικονομικά Μενού", sortOrder: 7 },
  ];

  const categoryMap: Record<string, any> = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, nameDE: c.nameDE, nameGR: c.nameGR, sortOrder: c.sortOrder },
      create: c,
    });
    categoryMap[c.slug] = cat;
  }

  // 8. Full 6-Board Master Products Catalog (56 Canonical Items)
  const productsData = [
    // === BOARD 1: DOENER BUNS, MY WRAPS, MY BIG'S ===
    {
      categoryId: categoryMap["board-1-doener-wraps"].id,
      sku: "MYGD-B1-CL-DONER",
      name: "The Classic Berlin Döner (150g)",
      nameDE: "Klassischer Berliner Döner (150g)",
      description: "Sesame Fladenbrot with freshly shaved caramelized rotisserie beef & lamb, crisp red cabbage, fresh tomatoes, sliced cucumbers & trio sauces.",
      basePrice: 10.00,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "TOP_SELLER",
      calories: 720,
      allergens: JSON.stringify(["Gluten", "Dairy", "Sesame"]),
      imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 1,
    },
    {
      categoryId: categoryMap["board-1-doener-wraps"].id,
      sku: "MYGD-B1-CK-DONER",
      name: "Crispy Chicken Döner (150g)",
      nameDE: "Knuspriger Hähnchen Döner (150g)",
      description: "Juicy marinated chicken rotisserie strips in toasted sesame Fladenbrot with fresh Mediterranean salad and homemade Kräuter sauce.",
      basePrice: 9.50,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "BESTSELLER",
      calories: 650,
      allergens: JSON.stringify(["Gluten", "Dairy", "Sesame"]),
      imageUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 2,
    },
    {
      categoryId: categoryMap["board-1-doener-wraps"].id,
      sku: "MYGD-B1-ST-DONER",
      name: "Steak Döner (100% Beef 150g)",
      nameDE: "100% Rinder-Steak Döner (150g)",
      description: "Premium pure beef steak slices carved hot with fresh rosemary, parsley, lemon and garlic yogurt cream.",
      basePrice: 12.50,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "CHEF_CHOICE",
      calories: 780,
      allergens: JSON.stringify(["Gluten", "Dairy", "Sesame"]),
      imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 3,
    },
    {
      categoryId: categoryMap["board-1-doener-wraps"].id,
      sku: "MYGD-B1-VG-DONER",
      name: "Plant-Based Veggie Chicken Döner (150g)",
      nameDE: "Veggie Chicken Döner (Vegan Meat)",
      description: "100% plant-based spiced döner strips roasted with fresh peppers, onions, crisp lettuce & vegan tahini sauce.",
      basePrice: 9.50,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      badge: "VEGGIE",
      calories: 540,
      allergens: JSON.stringify(["Gluten", "Sesame"]),
      imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 4,
    },
    {
      categoryId: categoryMap["board-1-doener-wraps"].id,
      sku: "MYGD-B1-BIG-DONER",
      name: "My Big's Jumbo Döner (250g Meat)",
      nameDE: "My Big's XXL Berliner Döner (250g)",
      description: "Giant sesame Fladenbrot loaded with massive 250g double-carved rotisserie meat, triple garlic herb sauce and extra cabbage.",
      basePrice: 14.50,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "POPULAR",
      calories: 1100,
      allergens: JSON.stringify(["Gluten", "Dairy", "Sesame"]),
      imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 5,
    },
    {
      categoryId: categoryMap["board-1-doener-wraps"].id,
      sku: "MYGD-B1-BF-WRAP",
      name: "Beef & Lamb Dürüm Wrap (150g)",
      nameDE: "Rind & Lamm Dürüm Wrap (150g)",
      description: "Warm lavash flatbread rolled with sliced beef & lamb rotisserie, pickled cabbage, onions & spicy Scharf chili.",
      basePrice: 10.50,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "TOP_SELLER",
      calories: 680,
      allergens: JSON.stringify(["Gluten", "Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 6,
    },
    {
      categoryId: categoryMap["board-1-doener-wraps"].id,
      sku: "MYGD-B1-CK-WRAP",
      name: "Chicken Dürüm Wrap (150g)",
      nameDE: "Hähnchen Dürüm Wrap (150g)",
      description: "Warm lavash rolled with rotisserie chicken strips, crisp cucumber, tomatoes and creamy garlic sauce.",
      basePrice: 10.00,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "POPULAR",
      calories: 620,
      allergens: JSON.stringify(["Gluten", "Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 7,
    },
    {
      categoryId: categoryMap["board-1-doener-wraps"].id,
      sku: "MYGD-B1-HL-WRAP",
      name: "Cyprus Grilled Halloumi Dürüm",
      nameDE: "Gegrillter Halloumi Dürüm",
      description: "Thick slices of authentic Cyprus halloumi grilled golden, wrapped with fresh tomatoes, cucumber, mint & yogurt dip.",
      basePrice: 8.00,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      badge: "VEGGIE",
      calories: 590,
      allergens: JSON.stringify(["Gluten", "Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 8,
    },
    {
      categoryId: categoryMap["board-1-doener-wraps"].id,
      sku: "MYGD-B1-FL-WRAP",
      name: "Crispy Fresh Falafel Wrap",
      nameDE: "Frischer Falafel Dürüm",
      description: "Golden fried chickpea falafels with creamy hummus, tahini, parsley salad & pickled red onions.",
      basePrice: 8.00,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      badge: "VEGGIE",
      calories: 530,
      allergens: JSON.stringify(["Gluten", "Sesame"]),
      imageUrl: "https://images.unsplash.com/photo-1593504049359-74330189a345?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 9,
    },
    {
      categoryId: categoryMap["board-1-doener-wraps"].id,
      sku: "MYGD-B1-BIG-WRAP",
      name: "My Big's Jumbo Dürüm (250g Meat)",
      nameDE: "My Big's XXL Dürüm Rolle (250g)",
      description: "XL rolled flatbread packed with 250g carved rotisserie meat, double sauce and crunchy salad garnish.",
      basePrice: 15.00,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "POPULAR",
      calories: 1050,
      allergens: JSON.stringify(["Gluten", "Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 10,
    },

    // === BOARD 2: LOADED FRIES, NUGGETS, WINGS, MEATBALLS ===
    {
      categoryId: categoryMap["board-2-loaded-fries-nuggets"].id,
      sku: "MYGD-B2-DN-BOX",
      name: "Berlin Döner Box with Fries",
      nameDE: "Berliner Döner Box mit Pommes",
      description: "Crispy skin-on fries topped with 150g shaved rotisserie meat, creamy garlic sauce & chili drizzle in a to-go box.",
      basePrice: 8.50,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "TOP_SELLER",
      calories: 740,
      allergens: JSON.stringify(["Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 11,
    },
    {
      categoryId: categoryMap["board-2-loaded-fries-nuggets"].id,
      sku: "MYGD-B2-TR-FRIES",
      name: "Truffle Parmesan Loaded Fries",
      nameDE: "Trüffel Parmesan Pommes",
      description: "Crispy fries drizzled with black truffle mayo, shaved aged parmesan cheese & fresh chopped parsley.",
      basePrice: 8.50,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "NEW",
      calories: 560,
      allergens: JSON.stringify(["Dairy", "Egg"]),
      imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 12,
    },
    {
      categoryId: categoryMap["board-2-loaded-fries-nuggets"].id,
      sku: "MYGD-B2-CC-FRIES",
      name: "Chili-Cheese Loaded Fries",
      nameDE: "Chili-Cheese Pommes",
      description: "Hot crispy fries smothered in melted cheddar cheese sauce and sliced spicy pickled jalapeños.",
      basePrice: 6.50,
      vatCategory: VatCategory.FOOD_BEV,
      isSpicy: true,
      badge: "SPICY_KICK",
      calories: 620,
      allergens: JSON.stringify(["Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 13,
    },
    {
      categoryId: categoryMap["board-2-loaded-fries-nuggets"].id,
      sku: "MYGD-B2-NUG-6",
      name: "Crispy Chicken Nuggets (6pc)",
      nameDE: "Knusprige Hähnchen Nuggets (6 Stück)",
      description: "100% chicken breast meat in golden crispy breading served with your choice of dip.",
      basePrice: 5.50,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "POPULAR",
      calories: 360,
      allergens: JSON.stringify(["Gluten"]),
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=85",
      sortOrder: 14,
    },
    {
      categoryId: categoryMap["board-2-loaded-fries-nuggets"].id,
      sku: "MYGD-B2-NUG-10",
      name: "Crispy Chicken Nuggets (10pc)",
      nameDE: "Knusprige Hähnchen Nuggets (10 Stück)",
      description: "10 pieces of tender golden chicken breast nuggets with two homemade dips.",
      basePrice: 8.00,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "BESTSELLER",
      calories: 590,
      allergens: JSON.stringify(["Gluten"]),
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=85",
      sortOrder: 15,
    },
    {
      categoryId: categoryMap["board-2-loaded-fries-nuggets"].id,
      sku: "MYGD-B2-WNG-6",
      name: "Crispy Hot Wings (6pc)",
      nameDE: "Würzige Chicken Wings (6 Stück)",
      description: "Spicy marinated crispy fried chicken wings coated in Berlin chili paprika glaze.",
      basePrice: 6.90,
      vatCategory: VatCategory.FOOD_BEV,
      isSpicy: true,
      badge: "SPICY_KICK",
      calories: 480,
      imageUrl: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&auto=format&fit=crop&q=85",
      sortOrder: 16,
    },
    {
      categoryId: categoryMap["board-2-loaded-fries-nuggets"].id,
      sku: "MYGD-B2-WNG-10",
      name: "Crispy Hot Wings (10pc)",
      nameDE: "Würzige Chicken Wings (10 Stück)",
      description: "10 pieces of spicy glazed crispy wings with cooling garlic herb dip.",
      basePrice: 10.50,
      vatCategory: VatCategory.FOOD_BEV,
      isSpicy: true,
      badge: "CHEF_CHOICE",
      calories: 790,
      imageUrl: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&auto=format&fit=crop&q=85",
      sortOrder: 17,
    },
    {
      categoryId: categoryMap["board-2-loaded-fries-nuggets"].id,
      sku: "MYGD-B2-KOFTE",
      name: "Berlin Style Meatballs (Köfte 5pc)",
      nameDE: "Berliner Rinder Köfte Frikadellen (5 Stück)",
      description: "Charcoal-grilled spiced minced beef meatballs with sumac onion salad, lemon & toasted pita.",
      basePrice: 7.90,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "NEW",
      calories: 520,
      allergens: JSON.stringify(["Gluten"]),
      imageUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&auto=format&fit=crop&q=85",
      sortOrder: 18,
    },

    // === BOARD 3: MOZZARELLA STICKS, ONION RINGS, FRIES, SWEET POTATO, KIDS ===
    {
      categoryId: categoryMap["board-3-sides-sticks-kids"].id,
      sku: "MYGD-B3-MOZZ",
      name: "Crispy Mozzarella Sticks (5pc)",
      nameDE: "Knusprige Mozzarella Sticks (5 Stück)",
      description: "Golden breaded stretchy Italian mozzarella sticks served with tomato herb dip.",
      basePrice: 5.90,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      badge: "POPULAR",
      calories: 450,
      allergens: JSON.stringify(["Gluten", "Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=800&auto=format&fit=crop&q=85",
      sortOrder: 19,
    },
    {
      categoryId: categoryMap["board-3-sides-sticks-kids"].id,
      sku: "MYGD-B3-RINGS",
      name: "Beer Battered Onion Rings (8pc)",
      nameDE: "Bierteig Zwiebelringe (8 Stück)",
      description: "Sweet whole onion slices in light crisp beer batter with creamy herb sauce.",
      basePrice: 4.90,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      calories: 380,
      allergens: JSON.stringify(["Gluten"]),
      imageUrl: "https://images.unsplash.com/photo-1639024471285-0afc36531393?w=800&auto=format&fit=crop&q=85",
      sortOrder: 20,
    },
    {
      categoryId: categoryMap["board-3-sides-sticks-kids"].id,
      sku: "MYGD-B3-FR-REG",
      name: "Crispy Berlin Fries (Regular)",
      nameDE: "Knusprige Berliner Pommes (Normal)",
      description: "Golden double-fried skin-on potato fries dusted with German paprika salt.",
      basePrice: 3.50,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      calories: 360,
      imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=85",
      sortOrder: 21,
    },
    {
      categoryId: categoryMap["board-3-sides-sticks-kids"].id,
      sku: "MYGD-B3-FR-LRG",
      name: "Crispy Berlin Fries (Large)",
      nameDE: "Knusprige Berliner Pommes (Groß)",
      description: "Generous portion of double-fried golden fries with signature paprika seasoning.",
      basePrice: 4.50,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      badge: "POPULAR",
      calories: 490,
      imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=85",
      sortOrder: 22,
    },
    {
      categoryId: categoryMap["board-3-sides-sticks-kids"].id,
      sku: "MYGD-B3-SWT-FRIES",
      name: "Sweet Potato Fries",
      nameDE: "Süßkartoffel Pommes",
      description: "Crispy fried sweet potato strips served hot with garlic herb mayonnaise.",
      basePrice: 5.50,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      badge: "CHEF_CHOICE",
      calories: 420,
      imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&auto=format&fit=crop&q=85",
      sortOrder: 23,
    },
    {
      categoryId: categoryMap["board-3-sides-sticks-kids"].id,
      sku: "MYGD-B3-KIDS-MEAL",
      name: "MYGD Junior Kids Meal",
      nameDE: "MYGD Kinder Menü Box",
      description: "Mini Döner or 4pc Chicken Nuggets + Kid Fries + 200ml Apple Juice + Surprise Toy.",
      basePrice: 7.50,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "BESTSELLER",
      calories: 510,
      allergens: JSON.stringify(["Gluten"]),
      imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=85",
      sortOrder: 24,
    },

    // === BOARD 4: MYGD BURGERS, MYGD BOWLS, DOEZZA ===
    {
      categoryId: categoryMap["board-4-burgers-bowls-doezza"].id,
      sku: "MYGD-B4-STK-BURGER",
      name: "Steak Döner Brioche Burger",
      nameDE: "Rinder-Steak Döner Burger",
      description: "Juicy beef steak döner slices in toasted brioche with cheddar cheese, lettuce, tomato & cocktail burger sauce.",
      basePrice: 8.50,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "POPULAR",
      calories: 690,
      allergens: JSON.stringify(["Gluten", "Dairy", "Egg"]),
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85",
      sortOrder: 25,
    },
    {
      categoryId: categoryMap["board-4-burgers-bowls-doezza"].id,
      sku: "MYGD-B4-CK-BURGER",
      name: "Crispy Chicken Döner Burger",
      nameDE: "Knuspriger Hähnchen Döner Burger",
      description: "Rotisserie chicken slices in brioche with pickled cucumbers, crisp lettuce and garlic herb mayo.",
      basePrice: 8.00,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "NEW",
      calories: 630,
      allergens: JSON.stringify(["Gluten", "Dairy", "Egg"]),
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85",
      sortOrder: 26,
    },
    {
      categoryId: categoryMap["board-4-burgers-bowls-doezza"].id,
      sku: "MYGD-B4-FIT-BOWL",
      name: "Low-Carb Döner Fitness Bowl (150g)",
      nameDE: "Fitness Döner Salat Bowl (150g)",
      description: "150g carved rotisserie meat over steamed basmati rice, Mediterranean salad, feta cheese & herb dressing.",
      basePrice: 11.50,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "CHEF_CHOICE",
      calories: 610,
      allergens: JSON.stringify(["Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=85",
      sortOrder: 27,
    },
    {
      categoryId: categoryMap["board-4-burgers-bowls-doezza"].id,
      sku: "MYGD-B4-GRD-BOWL",
      name: "Grilled Halloumi & Falafel Garden Bowl",
      nameDE: "Halloumi & Falafel Garten Bowl",
      description: "Cyprus grilled halloumi, fresh chickpea falafel, quinoa, diced tomatoes, cucumbers, hummus & tahini dressing.",
      basePrice: 10.50,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      badge: "VEGGIE",
      calories: 580,
      allergens: JSON.stringify(["Dairy", "Sesame"]),
      imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=85",
      sortOrder: 28,
    },
    {
      categoryId: categoryMap["board-4-burgers-bowls-doezza"].id,
      sku: "MYGD-B4-DOEZZA-CL",
      name: "Doezza Classic Döner Pizza (33cm)",
      nameDE: "33cm Steinofen Doezza Döner Pizza",
      description: "Crispy thin crust topped with tomato sauce, mozzarella, shaved beef & lamb döner, sliced onions & garlic drizzle.",
      basePrice: 14.00,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "POPULAR",
      calories: 1080,
      allergens: JSON.stringify(["Gluten", "Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=85",
      sortOrder: 29,
    },
    {
      categoryId: categoryMap["board-4-burgers-bowls-doezza"].id,
      sku: "MYGD-B4-DOEZZA-SC",
      name: "Doezza Sucuk & Feta Pizza (33cm)",
      nameDE: "33cm Doezza Sucuk & Schafskäse Pizza",
      description: "Stone-baked crust with spicy Turkish sucuk beef sausage, Greek feta cheese, kalamata olives and oregano.",
      basePrice: 14.50,
      vatCategory: VatCategory.FOOD_BEV,
      isSpicy: true,
      badge: "SPICY_KICK",
      calories: 1150,
      allergens: JSON.stringify(["Gluten", "Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=85",
      sortOrder: 30,
    },
    {
      categoryId: categoryMap["board-4-burgers-bowls-doezza"].id,
      sku: "MYGD-B4-DOEZZA-VG",
      name: "Doezza Veggie Halloumi Pizza (33cm)",
      nameDE: "33cm Doezza Vegetarische Halloumi Pizza",
      description: "Stone-baked crust with grilled halloumi slices, roasted bell peppers, tomatoes, fresh basil and olive oil.",
      basePrice: 13.50,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      badge: "VEGGIE",
      calories: 960,
      allergens: JSON.stringify(["Gluten", "Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=85",
      sortOrder: 31,
    },

    // === BOARD 5: SMOOTHIES, MILKSHAKES, FRUIT JUICES, WATER & AYRAN, ENERGY DRINKS, KOMBUCHA ===
    {
      categoryId: categoryMap["board-5-smoothies-shakes-drinks"].id,
      sku: "MYGD-B5-SM-MANGO",
      name: "Fresh Mango-Passion Smoothie (400ml)",
      nameDE: "Frischer Mango-Maracuja Smoothie (400ml)",
      description: "100% natural Alphonso mango, passionfruit, banana and apple juice blended fresh.",
      basePrice: 5.50,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      badge: "BESTSELLER",
      calories: 210,
      imageUrl: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&auto=format&fit=crop&q=85",
      sortOrder: 32,
    },
    {
      categoryId: categoryMap["board-5-smoothies-shakes-drinks"].id,
      sku: "MYGD-B5-SM-BERRY",
      name: "Berlin Berry Blast Smoothie (400ml)",
      nameDE: "Berlin Beeren-Power Smoothie (400ml)",
      description: "Wild strawberries, blueberries, raspberries, and fresh orange juice crushed with ice.",
      basePrice: 5.50,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      badge: "POPULAR",
      calories: 195,
      imageUrl: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=85",
      sortOrder: 33,
    },
    {
      categoryId: categoryMap["board-5-smoothies-shakes-drinks"].id,
      sku: "MYGD-B5-SHK-VAN",
      name: "Creamy Vanilla Milkshake (400ml)",
      nameDE: "Klassischer Vanille Milchshake (400ml)",
      description: "Hand-spun whole milk and Bourbon vanilla ice cream topped with dairy whipped cream.",
      basePrice: 5.00,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      calories: 390,
      allergens: JSON.stringify(["Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=85",
      sortOrder: 34,
    },
    {
      categoryId: categoryMap["board-5-smoothies-shakes-drinks"].id,
      sku: "MYGD-B5-SHK-CHOC",
      name: "Rich Chocolate Milkshake (400ml)",
      nameDE: "Schoko-Traum Milchshake (400ml)",
      description: "Hand-spun dark chocolate ice cream with Belgian cocoa drizzle and whipped cream.",
      basePrice: 5.00,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      badge: "POPULAR",
      calories: 420,
      allergens: JSON.stringify(["Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=85",
      sortOrder: 35,
    },
    {
      categoryId: categoryMap["board-5-smoothies-shakes-drinks"].id,
      sku: "MYGD-B5-OJ-FRESH",
      name: "Fresh Squeezed Orange Juice (350ml)",
      nameDE: "Frisch gepresster Orangensaft (350ml)",
      description: "Freshly squeezed 100% natural sweet local Cyprus oranges with no added sugar.",
      basePrice: 4.00,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      calories: 140,
      imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=85",
      sortOrder: 36,
    },
    {
      categoryId: categoryMap["board-5-smoothies-shakes-drinks"].id,
      sku: "MYGD-B5-AYRAN",
      name: "Original Chilled Ayran (250ml)",
      nameDE: "Original Gekühlter Ayran (250ml)",
      description: "Traditional salted Turkish yogurt drink served cold in cup.",
      basePrice: 2.20,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      badge: "TOP_SELLER",
      calories: 95,
      allergens: JSON.stringify(["Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=85",
      sortOrder: 37,
    },
    {
      categoryId: categoryMap["board-5-smoothies-shakes-drinks"].id,
      sku: "MYGD-B5-WAT-STILL",
      name: "Mineral Water Still (500ml)",
      nameDE: "Stilles Mineralwasser (500ml)",
      description: "Pure natural mountain spring water bottle.",
      basePrice: 1.50,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      calories: 0,
      imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=85",
      sortOrder: 38,
    },
    {
      categoryId: categoryMap["board-5-smoothies-shakes-drinks"].id,
      sku: "MYGD-B5-WAT-SPARK",
      name: "Mineral Water Sparkling (500ml)",
      nameDE: "Sprudelwasser mit Kohlensäure (500ml)",
      description: "Refreshing sparkling carbonated mineral water.",
      basePrice: 1.80,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      calories: 0,
      imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&auto=format&fit=crop&q=85",
      sortOrder: 39,
    },
    {
      categoryId: categoryMap["board-5-smoothies-shakes-drinks"].id,
      sku: "MYGD-B5-RED-BULL",
      name: "Red Bull Energy Drink (250ml)",
      nameDE: "Red Bull Energy Drink (250ml Dose)",
      description: "Original invigorating cold Red Bull energy drink can.",
      basePrice: 3.00,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "POPULAR",
      calories: 115,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=85",
      sortOrder: 40,
    },
    {
      categoryId: categoryMap["board-5-smoothies-shakes-drinks"].id,
      sku: "MYGD-B5-KOMBUCHA",
      name: "Organic Ginger Kombucha (330ml)",
      nameDE: "Bio Ingwer Kombucha Flasche (330ml)",
      description: "Sparkling live fermented raw green tea infused with spicy ginger root.",
      basePrice: 4.20,
      vatCategory: VatCategory.FOOD_BEV,
      isVeggie: true,
      badge: "NEW",
      calories: 60,
      imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=85",
      sortOrder: 41,
    },

    // === BOARD 6: DRAFT BEER, BOTTLED BEER, WINE, POSTMIX SOFT DRINKS, CANNED DRINKS, COFFEE ===
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-BEER-03",
      name: "German Premium Pilsner Draft (0.3L)",
      nameDE: "Deutsches Premium Pils vom Fass (0,3L)",
      description: "Freshly tapped ice cold German draft pilsner lager (5.0% ABV, 19% Cyprus VAT).",
      basePrice: 3.50,
      vatCategory: VatCategory.ALCOHOL,
      badge: "POPULAR",
      calories: 130,
      allergens: JSON.stringify(["Gluten"]),
      imageUrl: "https://images.unsplash.com/photo-1608270199144-8cb38a0f51e0?w=800&auto=format&fit=crop&q=85",
      sortOrder: 42,
    },
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-BEER-05",
      name: "German Premium Pilsner Draft (0.5L)",
      nameDE: "Deutsches Premium Pils vom Fass (0,5L)",
      description: "Generous half-liter stein of cold crisp German draft lager (5.0% ABV, 19% Cyprus VAT).",
      basePrice: 5.00,
      vatCategory: VatCategory.ALCOHOL,
      badge: "TOP_SELLER",
      calories: 215,
      allergens: JSON.stringify(["Gluten"]),
      imageUrl: "https://images.unsplash.com/photo-1608270199144-8cb38a0f51e0?w=800&auto=format&fit=crop&q=85",
      sortOrder: 43,
    },
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-BEER-BTL",
      name: "German Pilsner Bottle (330ml)",
      nameDE: "Deutsches Flaschenbier (330ml)",
      description: "Classic imported German pilsner bottle (5.0% ABV, 19% Cyprus VAT).",
      basePrice: 3.50,
      vatCategory: VatCategory.ALCOHOL,
      calories: 145,
      allergens: JSON.stringify(["Gluten"]),
      imageUrl: "https://images.unsplash.com/photo-1608270199144-8cb38a0f51e0?w=800&auto=format&fit=crop&q=85",
      sortOrder: 44,
    },
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-KEO-BTL",
      name: "Keo Cyprus Lager Bottle (330ml)",
      nameDE: "Keo Zypern Bier Flasche (330ml)",
      description: "Traditional local Cyprus pale lager (4.5% ABV, 19% Cyprus VAT).",
      basePrice: 3.20,
      vatCategory: VatCategory.ALCOHOL,
      calories: 135,
      allergens: JSON.stringify(["Gluten"]),
      imageUrl: "https://images.unsplash.com/photo-1608270199144-8cb38a0f51e0?w=800&auto=format&fit=crop&q=85",
      sortOrder: 45,
    },
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-WINE-RED",
      name: "Cyprus Local Red Wine (Glass 187ml)",
      nameDE: "Zyprischer Rotwein im Glas (187ml)",
      description: "Robust local Paphos regional dry red wine (13.5% ABV, 19% Cyprus VAT).",
      basePrice: 4.50,
      vatCategory: VatCategory.ALCOHOL,
      calories: 155,
      imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=85",
      sortOrder: 46,
    },
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-WINE-WHT",
      name: "Cyprus Local White Wine (Glass 187ml)",
      nameDE: "Zyprischer Weißwein im Glas (187ml)",
      description: "Crisp and refreshing citrus local dry white wine (12.0% ABV, 19% Cyprus VAT).",
      basePrice: 4.50,
      vatCategory: VatCategory.ALCOHOL,
      calories: 145,
      imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=85",
      sortOrder: 47,
    },
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-POSTMIX-REG",
      name: "Postmix Fountain Soda Regular (0.4L)",
      nameDE: "Postmix Schank-Softdrink (0,4L)",
      description: "Freshly poured ice cold fountain soda (Coca-Cola, Zero, Sprite, Fanta).",
      basePrice: 2.50,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "POPULAR",
      calories: 160,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=85",
      sortOrder: 48,
    },
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-POSTMIX-LRG",
      name: "Postmix Fountain Soda Large (0.5L)",
      nameDE: "Postmix Schank-Softdrink Groß (0,5L)",
      description: "Generous 0.5L fountain cup with ice (Coca-Cola, Zero, Sprite, Fanta).",
      basePrice: 3.20,
      vatCategory: VatCategory.FOOD_BEV,
      calories: 200,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=85",
      sortOrder: 49,
    },
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-CAN-COLA",
      name: "Coca-Cola Original Can (330ml)",
      nameDE: "Coca-Cola Classic Dose (330ml)",
      description: "Classic ice-cold Coca-Cola can.",
      basePrice: 2.00,
      vatCategory: VatCategory.FOOD_BEV,
      calories: 139,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=85",
      sortOrder: 50,
    },
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-CAN-ZERO",
      name: "Coca-Cola Zero Can (330ml)",
      nameDE: "Coca-Cola Zero Dose (330ml)",
      description: "Zero calorie ice-cold Coca-Cola can.",
      basePrice: 2.00,
      vatCategory: VatCategory.FOOD_BEV,
      calories: 1,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=85",
      sortOrder: 51,
    },
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-COF-ESP",
      name: "Espresso Single Shot",
      nameDE: "Einfacher Espresso",
      description: "Rich crema specialty roast Italian/German espresso blend.",
      basePrice: 2.00,
      vatCategory: VatCategory.FOOD_BEV,
      calories: 5,
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=85",
      sortOrder: 52,
    },
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-COF-DBL",
      name: "Double Espresso",
      nameDE: "Doppelter Espresso",
      description: "Strong double extraction for intense aromatic flavor.",
      basePrice: 2.80,
      vatCategory: VatCategory.FOOD_BEV,
      calories: 10,
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=85",
      sortOrder: 53,
    },
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-COF-CAP",
      name: "Creamy Cappuccino",
      nameDE: "Cremiger Cappuccino",
      description: "Espresso topped with thick velvety microfoam steamed milk.",
      basePrice: 3.50,
      vatCategory: VatCategory.FOOD_BEV,
      calories: 120,
      allergens: JSON.stringify(["Dairy"]),
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=85",
      sortOrder: 54,
    },
    {
      categoryId: categoryMap["board-6-draft-beer-wine-coffee"].id,
      sku: "MYGD-B6-COF-FREDDO",
      name: "Cyprus Freddo Espresso",
      nameDE: "Freddo Espresso auf Eis",
      description: "Frothy whipped double espresso poured over rock ice cubes.",
      basePrice: 3.50,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "POPULAR",
      calories: 10,
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=85",
      sortOrder: 55,
    },

    // === MEAL COMBOS & DEALS ===
    {
      categoryId: categoryMap["meal-combos"].id,
      sku: "MYGD-COMBO-MYMEAL",
      name: "MY-MEAL Combo Bundle (€15.00)",
      nameDE: "MY-MEAL Sparmenü Bundle (€15.00)",
      description: "Any Standard Döner (150g) + Crispy Berlin Fries + Chilled 330ml Drink. Save €2.00!",
      basePrice: 15.00,
      vatCategory: VatCategory.FOOD_BEV,
      badge: "BESTSELLER",
      calories: 1250,
      imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=1200&auto=format&fit=crop&q=85",
      sortOrder: 56,
    },
  ];

  const productMap: Record<string, any> = {};
  for (const p of productsData) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: p,
      create: p,
    });
    productMap[p.sku] = prod;
  }

  // 9. Modifiers & Customization Groups
  const mgMeat = await prisma.modifierGroup.upsert({
    where: { slug: "meat-choice" },
    update: {},
    create: { slug: "meat-choice", name: "Choose Your Rotisserie Meat", minSelected: 1, maxSelected: 1, isRequired: true, sortOrder: 1 },
  });

  const mgBread = await prisma.modifierGroup.upsert({
    where: { slug: "bread-choice" },
    update: {},
    create: { slug: "bread-choice", name: "Choose Your Bread Variety", minSelected: 1, maxSelected: 1, isRequired: true, sortOrder: 2 },
  });

  const mgSauces = await prisma.modifierGroup.upsert({
    where: { slug: "sauces-12" },
    update: {},
    create: { slug: "sauces-12", name: "12 Homemade Sauces (Pick up to 3)", minSelected: 0, maxSelected: 3, isRequired: false, sortOrder: 3 },
  });

  const mgExtras = await prisma.modifierGroup.upsert({
    where: { slug: "extras-1eur" },
    update: {},
    create: { slug: "extras-1eur", name: "€1.00 Premium Extras", minSelected: 0, maxSelected: 5, isRequired: false, sortOrder: 4 },
  });

  // Modifier Items
  const meatMods = [
    { slug: "meat-beef-lamb", name: "Spiced Beef & Lamb (150g)", price: 0.00, isDefault: true },
    { slug: "meat-chicken", name: "Crispy Chicken Rotisserie (150g)", price: 0.00 },
    { slug: "meat-steak", name: "100% Beef Steak (+€2.50)", price: 2.50 },
    { slug: "meat-mix", name: "Mix Beef & Chicken (150g)", price: 0.00 },
    { slug: "meat-extra-75g", name: "Extra Meat Portion (+75g)", price: 2.00 },
  ];
  for (const m of meatMods) {
    await prisma.modifier.upsert({
      where: { modifierGroupId_slug: { modifierGroupId: mgMeat.id, slug: m.slug } },
      update: { name: m.name, priceAdjustment: m.price, isDefault: m.isDefault ?? false },
      create: { modifierGroupId: mgMeat.id, slug: m.slug, name: m.name, priceAdjustment: m.price, isDefault: m.isDefault ?? false },
    });
  }

  const breadMods = [
    { slug: "bread-berlin-wheat", name: "Berlin Sesame Bread (Wheat)", isDefault: true },
    { slug: "bread-german-wheat", name: "German Crusty Bread (Wheat)" },
    { slug: "bread-hamburg-rye", name: "Hamburg Rustic Bread (Rye/Wheat)" },
    { slug: "bread-durum-wrap", name: "Warm Rolled Lavash Dürüm" },
  ];
  for (const b of breadMods) {
    await prisma.modifier.upsert({
      where: { modifierGroupId_slug: { modifierGroupId: mgBread.id, slug: b.slug } },
      update: { name: b.name, isDefault: b.isDefault ?? false },
      create: { modifierGroupId: mgBread.id, slug: b.slug, name: b.name, isDefault: b.isDefault ?? false },
    });
  }

  const sauceMods = [
    { slug: "sauce-garlic", name: "Knoblauch (Creamy Garlic)", isDefault: true },
    { slug: "sauce-herbs", name: "Kräuter (Fresh Garden Herb)", isDefault: true },
    { slug: "sauce-cocktail", name: "Cocktail Special Sauce" },
    { slug: "sauce-scharf", name: "Scharf (Spicy Chili Fire)" },
    { slug: "sauce-holle", name: "Hölle! (Extra Hot Carolina Reaper)" },
    { slug: "sauce-feta-olive", name: "Feta-Olive-Jalapeño Cream" },
    { slug: "sauce-chili-cheese", name: "Warm Chili-Cheese Dip" },
    { slug: "sauce-tahini", name: "Roasted Sesame Tahini" },
    { slug: "sauce-hummus", name: "Creamy Chickpea Hummus" },
    { slug: "sauce-tzatziki", name: "Greek Yoghurt Tzatziki" },
    { slug: "sauce-ketchup", name: "Classic Tomato Ketchup" },
    { slug: "sauce-mayo", name: "German Mayo" },
  ];
  for (const s of sauceMods) {
    await prisma.modifier.upsert({
      where: { modifierGroupId_slug: { modifierGroupId: mgSauces.id, slug: s.slug } },
      update: { name: s.name, isDefault: s.isDefault ?? false },
      create: { modifierGroupId: mgSauces.id, slug: s.slug, name: s.name, isDefault: s.isDefault ?? false },
    });
  }

  const extraMods = [
    { slug: "extra-halloumi", name: "Cyprus Grilled Halloumi (+€1.00)", price: 1.00 },
    { slug: "extra-feta", name: "Greek Feta Cheese (+€1.00)", price: 1.00 },
    { slug: "extra-fries-inside", name: "Crispy Fries Inside Pocket (+€1.00)", price: 1.00 },
    { slug: "extra-jalapenos", name: "Pickled Jalapeños (+€1.00)", price: 1.00 },
    { slug: "extra-cheddar", name: "Melted Cheddar (+€1.00)", price: 1.00 },
  ];
  for (const ex of extraMods) {
    await prisma.modifier.upsert({
      where: { modifierGroupId_slug: { modifierGroupId: mgExtras.id, slug: ex.slug } },
      update: { name: ex.name, priceAdjustment: ex.price },
      create: { modifierGroupId: mgExtras.id, slug: ex.slug, name: ex.name, priceAdjustment: ex.price },
    });
  }

  // 10. Bill of Materials (BOM) & Recipe Mapping for Production Items
  const bomMappings = [
    { prodSku: "MYGD-B1-CL-DONER", ingSku: "ING-BEEF-SPIT", amount: 150 },
    { prodSku: "MYGD-B1-CL-DONER", ingSku: "ING-BREAD-FLADENBROT", amount: 1 },
    { prodSku: "MYGD-B1-CK-DONER", ingSku: "ING-CHICKEN-SPIT", amount: 150 },
    { prodSku: "MYGD-B1-CK-DONER", ingSku: "ING-BREAD-FLADENBROT", amount: 1 },
    { prodSku: "MYGD-B1-ST-DONER", ingSku: "ING-STEAK-MEAT", amount: 150 },
    { prodSku: "MYGD-B1-ST-DONER", ingSku: "ING-BREAD-FLADENBROT", amount: 1 },
    { prodSku: "MYGD-B1-VG-DONER", ingSku: "ING-VEGAN-DONER", amount: 150 },
    { prodSku: "MYGD-B1-VG-DONER", ingSku: "ING-BREAD-FLADENBROT", amount: 1 },
    { prodSku: "MYGD-B1-BIG-DONER", ingSku: "ING-BEEF-SPIT", amount: 250 },
    { prodSku: "MYGD-B1-BIG-DONER", ingSku: "ING-BREAD-FLADENBROT", amount: 1 },
    { prodSku: "MYGD-B1-BF-WRAP", ingSku: "ING-BEEF-SPIT", amount: 150 },
    { prodSku: "MYGD-B1-BF-WRAP", ingSku: "ING-BREAD-LAVASH", amount: 1 },
    { prodSku: "MYGD-B1-CK-WRAP", ingSku: "ING-CHICKEN-SPIT", amount: 150 },
    { prodSku: "MYGD-B1-CK-WRAP", ingSku: "ING-BREAD-LAVASH", amount: 1 },
    { prodSku: "MYGD-B1-HL-WRAP", ingSku: "ING-CYPRUS-HALLOUMI", amount: 100 },
    { prodSku: "MYGD-B1-HL-WRAP", ingSku: "ING-BREAD-LAVASH", amount: 1 },
    { prodSku: "MYGD-B1-BIG-WRAP", ingSku: "ING-BEEF-SPIT", amount: 250 },
    { prodSku: "MYGD-B1-BIG-WRAP", ingSku: "ING-BREAD-LAVASH", amount: 1 },
    { prodSku: "MYGD-B2-DN-BOX", ingSku: "ING-BEEF-SPIT", amount: 150 },
    { prodSku: "MYGD-B2-DN-BOX", ingSku: "ING-POTATO-FRIES", amount: 150 },
    { prodSku: "MYGD-B2-TR-FRIES", ingSku: "ING-POTATO-FRIES", amount: 250 },
    { prodSku: "MYGD-B2-CC-FRIES", ingSku: "ING-POTATO-FRIES", amount: 250 },
    { prodSku: "MYGD-B2-NUG-6", ingSku: "ING-CHICKEN-NUGGETS", amount: 6 },
    { prodSku: "MYGD-B2-NUG-10", ingSku: "ING-CHICKEN-NUGGETS", amount: 10 },
    { prodSku: "MYGD-B2-WNG-6", ingSku: "ING-CHICKEN-WINGS", amount: 6 },
    { prodSku: "MYGD-B2-WNG-10", ingSku: "ING-CHICKEN-WINGS", amount: 10 },
    { prodSku: "MYGD-B2-KOFTE", ingSku: "ING-BEEF-KOFTE", amount: 5 },
    { prodSku: "MYGD-B3-MOZZ", ingSku: "ING-MOZZ-STICKS", amount: 5 },
    { prodSku: "MYGD-B3-RINGS", ingSku: "ING-ONION-RINGS", amount: 8 },
    { prodSku: "MYGD-B3-FR-REG", ingSku: "ING-POTATO-FRIES", amount: 200 },
    { prodSku: "MYGD-B3-FR-LRG", ingSku: "ING-POTATO-FRIES", amount: 350 },
    { prodSku: "MYGD-B3-SWT-FRIES", ingSku: "ING-SWEET-POTATO", amount: 250 },
    { prodSku: "MYGD-B4-STK-BURGER", ingSku: "ING-STEAK-MEAT", amount: 120 },
    { prodSku: "MYGD-B4-STK-BURGER", ingSku: "ING-BREAD-BRIOCHE", amount: 1 },
    { prodSku: "MYGD-B4-CK-BURGER", ingSku: "ING-CHICKEN-SPIT", amount: 120 },
    { prodSku: "MYGD-B4-CK-BURGER", ingSku: "ING-BREAD-BRIOCHE", amount: 1 },
    { prodSku: "MYGD-B4-FIT-BOWL", ingSku: "ING-BEEF-SPIT", amount: 150 },
    { prodSku: "MYGD-B4-FIT-BOWL", ingSku: "ING-GREEK-FETA", amount: 50 },
    { prodSku: "MYGD-B4-GRD-BOWL", ingSku: "ING-CYPRUS-HALLOUMI", amount: 80 },
    { prodSku: "MYGD-B4-DOEZZA-CL", ingSku: "ING-PIZZA-DOUGH", amount: 1 },
    { prodSku: "MYGD-B4-DOEZZA-CL", ingSku: "ING-BEEF-SPIT", amount: 100 },
    { prodSku: "MYGD-B4-DOEZZA-VG", ingSku: "ING-PIZZA-DOUGH", amount: 1 },
    { prodSku: "MYGD-B4-DOEZZA-VG", ingSku: "ING-CYPRUS-HALLOUMI", amount: 100 },
    { prodSku: "MYGD-B5-AYRAN", ingSku: "ING-AYRAN-BOTTLE", amount: 1 },
    { prodSku: "MYGD-B5-RED-BULL", ingSku: "ING-REDBULL-CAN", amount: 1 },
    { prodSku: "MYGD-B5-KOMBUCHA", ingSku: "ING-KOMBUCHA-BOTTLE", amount: 1 },
    { prodSku: "MYGD-B6-BEER-03", ingSku: "ING-BEER-KEG-30L", amount: 300 },
    { prodSku: "MYGD-B6-BEER-05", ingSku: "ING-BEER-KEG-30L", amount: 500 },
    { prodSku: "MYGD-B6-COF-ESP", ingSku: "ING-COFFEE-BEANS", amount: 9 },
    { prodSku: "MYGD-B6-COF-DBL", ingSku: "ING-COFFEE-BEANS", amount: 18 },
  ];

  for (const bom of bomMappings) {
    const prod = productMap[bom.prodSku];
    const ing = ingredientMap[bom.ingSku];
    if (prod && ing) {
      await prisma.recipeBOM.upsert({
        where: { productId_ingredientId: { productId: prod.id, ingredientId: ing.id } },
        update: { amountGrams: bom.amount },
        create: { productId: prod.id, ingredientId: ing.id, amountGrams: bom.amount },
      });

      // Also ensure parent Recipe & RecipeIngredient exists
      let recipe = await prisma.recipe.findFirst({ where: { productId: prod.id } });
      if (!recipe) {
        recipe = await prisma.recipe.create({
          data: { productId: prod.id, variantName: "STANDARD", yieldServings: 1, prepTimeSec: 180 },
        });
      }

      await prisma.recipeIngredient.upsert({
        where: { recipeId_ingredientId: { recipeId: recipe.id, ingredientId: ing.id } },
        update: { amountUnits: bom.amount },
        create: { recipeId: recipe.id, ingredientId: ing.id, amountUnits: bom.amount },
      });
    }
  }

  // 11. Complete 5 Physical 4K Screen Configs matching Official Menu Boards
  const screenConfigs = [
    {
      screenNumber: 1,
      title: "DOENER BUNS, MY WRAPS & BIG'S",
      layoutType: "PRICE_MATRIX",
      activeDaypart: "AUTO",
      itemsJson: JSON.stringify([
        { name: "Hamburg Doener", desc: "Caramelized rotisserie beef, sesame bun, salad & trio sauces", price: 6.95, badge: "TOP_SELLER", imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85" },
        { name: "Chicken Doener", desc: "Crispy chicken rotisserie, sesame bun, Kräuter garlic sauce", price: 6.95, badge: "BESTSELLER", imageUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&auto=format&fit=crop&q=85" },
        { name: "Cheese Doener", desc: "Rotisserie beef döner with melted cheddar cheese slice", price: 7.50, badge: "POPULAR", imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85" },
        { name: "Cheese Chicken Doener", desc: "Chicken döner with melted cheese & herb mayo", price: 7.50, imageUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&auto=format&fit=crop&q=85" },
        { name: "Beef Wrap", desc: "Warm lavash flatbread rolled with tender rotisserie beef", price: 9.90, badge: "TOP_SELLER", imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=85" },
        { name: "Chicken Wrap", desc: "Toasted flatbread rolled with crispy chicken & fresh salad", price: 9.90, badge: "BESTSELLER", imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=85" },
        { name: "Big B Beef Doener", desc: "Giant triangular sesame Fladenbrot overflowing with meat", price: 11.90, badge: "CHEF_CHOICE", imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85" },
        { name: "Beef Bowl", desc: "Carved rotisserie beef over cabbage, cucumber, sweet corn", price: 9.90, badge: "HEALTHY", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=85" },
      ]),
    },
    {
      screenNumber: 2,
      title: "MYGD BURGERS, PIZZAS & DOEZZA",
      layoutType: "PRICE_MATRIX",
      activeDaypart: "AUTO",
      itemsJson: JSON.stringify([
        { name: "Beefster Burger", desc: "Ciabatta bun, melted cheese, beef döner, onion, tomato", price: 7.95, badge: "BESTSELLER", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85" },
        { name: "Cheesy GD Burger", desc: "Loaded with melted cheddar, double beef döner", price: 9.95, badge: "TOP_SELLER", imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=85" },
        { name: "Chicken Hype Burger", desc: "Crispy chicken döner in toasted bun with special sauce", price: 8.50, badge: "POPULAR", imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85" },
        { name: "Margherita Pizza (33cm)", desc: "Stone-baked thin crust, fior di latte mozzarella, basil", price: 15.95, imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=85" },
        { name: "Salami Pizza (33cm)", desc: "Beef salami slices, rich tomato passata, mozzarella", price: 16.95, badge: "POPULAR", imageUrl: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=85" },
        { name: "Margherita Doezza Slice", desc: "Triangular crispy flatbread pizza slice with cheese", price: 6.50, badge: "CHEF_CHOICE", imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=85" },
        { name: "Salami Doezza Slice", desc: "Crispy triangle slice with savory salami & cheese", price: 7.50, imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=85" },
      ]),
    },
    {
      screenNumber: 3,
      title: "LOADED FRIES, NUGGETS & WINGS",
      layoutType: "PRICE_MATRIX",
      activeDaypart: "AUTO",
      itemsJson: JSON.stringify([
        { name: "Cheesy Loaded Fries", desc: "Crispy fries smothered in cheddar sauce & rotisserie crunch", price: 6.90, badge: "TOP_SELLER", imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&auto=format&fit=crop&q=85" },
        { name: "Hollandaise Loaded Fries", desc: "Creamy hollandaise sauce & shredded döner meat", price: 6.90, badge: "CHEF_CHOICE", imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&auto=format&fit=crop&q=85" },
        { name: "Jalapeño Sour Cream Fries", desc: "Pickled jalapeños, cool sour cream & herbs", price: 6.90, badge: "SPICY_KICK", imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&auto=format&fit=crop&q=85" },
        { name: "Chicken Nuggets (6 Pcs)", desc: "100% chicken breast nuggets with dip", price: 4.90, badge: "BESTSELLER", imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=85" },
        { name: "Chicken Wings (6 Pcs)", desc: "Crispy hot glazed wings with garlic dip", price: 5.90, badge: "POPULAR", imageUrl: "https://images.unsplash.com/photo-1527477378408-1bc09c21311b?w=800&auto=format&fit=crop&q=85" },
        { name: "Meatballs (6 Pcs)", desc: "Spiced beef meatballs with herb yogurt dip", price: 5.90, badge: "NEW", imageUrl: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&auto=format&fit=crop&q=85" },
      ]),
    },
    {
      screenNumber: 4,
      title: "MYGD DRINKS, BEER & COFFEE",
      layoutType: "DRINKS_SIDES",
      activeDaypart: "AUTO",
      itemsJson: JSON.stringify([
        { name: "Hofbräu Original (0.5L)", desc: "Imported German Munich pale lager (5.1% ABV)", price: 5.00, badge: "TOP_SELLER", imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&auto=format&fit=crop&q=85" },
        { name: "Corona Extra", desc: "Imported chilled lager with lime wedge", price: 4.00, imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&auto=format&fit=crop&q=85" },
        { name: "KEO Cyprus Beer", desc: "Local favorite crisp golden lager", price: 3.00, imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&auto=format&fit=crop&q=85" },
        { name: "Authentic Ayran (0.5L)", desc: "Chilled savory yogurt beverage with sea salt", price: 3.50, badge: "BESTSELLER", imageUrl: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=800&auto=format&fit=crop&q=85" },
        { name: "Soft Drinks (Postmix)", desc: "Coca-Cola, Zero, Fanta Zero, Sprite, Soda", price: 2.50, imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=85" },
        { name: "Tropical Twist Smoothie", desc: "Pure mango, passionfruit & banana blend", price: 2.99, badge: "POPULAR", imageUrl: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&auto=format&fit=crop&q=85" },
        { name: "Cappuccino Italiano", desc: "Freshly roasted double espresso with velvety milk foam", price: 3.50, imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&auto=format&fit=crop&q=85" },
      ]),
    },
    {
      screenNumber: 5,
      title: "FINGERFOOD, SIDES & KIDS MEAL",
      layoutType: "SPLIT_COMBO",
      activeDaypart: "AUTO",
      itemsJson: JSON.stringify([
        { name: "Mozzarella Sticks (6 Pcs)", desc: "Golden crumbed mozzarella with stretchy cheese", price: 6.90, badge: "POPULAR", imageUrl: "https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=800&auto=format&fit=crop&q=85" },
        { name: "Onion Rings (6 Pcs)", desc: "Beer battered golden crispy onion rings", price: 6.90, badge: "VEGGIE", imageUrl: "https://images.unsplash.com/photo-1639024471287-032f66e57973?w=800&auto=format&fit=crop&q=85" },
        { name: "MYGD Fries (Regular)", desc: "Double-fried crispy skin-on potato fries", price: 2.50, badge: "BESTSELLER", imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=85" },
        { name: "Sweet Potato Fries (Regular)", desc: "Crispy sweet potato strips with herb mayo", price: 2.90, badge: "CHEF_CHOICE", imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&auto=format&fit=crop&q=85" },
        { name: "MYGD Kids Meal Box", desc: "Main (Doener/Nuggets/Meatballs) + Fries + Drink + Kinder Riegel", price: 5.00, badge: "TOP_SELLER", imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=85" },
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

  console.log(`✅ Successfully seeded:
  - 2 Locations (Emba Flagship & Limassol Marina)
  - 11 Terminals (Kiosk, POS, Dual KDS, CX-Wait, 6x 4K Menu Boards)
  - 6 Suppliers with live Cyprus WhatsApp dispatch lines
  - 22 Gram-Precision Ingredients with supplier links
  - In-store inventory stock levels with 2 low-stock alert triggers (Köfte & Halloumi)
  - 6 Production Menu Categories matching all 6 physical display boards
  - 56 Master Products with Cyprus VAT categories and macro photography
  - 4 Customization Groups (Meat, Bread, 12 Sauces, €1 Extras)
  - 50 Recipe BOM ingredient portion deductions
  - 6 Overhead 4K Menu Board Screen configurations`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
