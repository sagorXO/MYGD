import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding MY GERMAN DÖNER database aligned with mygermandoener.com...");

  // 1. Locations (Emba / Paphos & Limassol Marina)
  const embaLocation = await prisma.location.upsert({
    where: { slug: "EMBA" },
    update: {
      name: "MY GERMAN DÖNER — Emba (Paphos)",
      address: "Pavlides Court, Agíou Stefánou Street 134, 8260 Emba",
    },
    create: {
      slug: "EMBA",
      name: "MY GERMAN DÖNER — Emba (Paphos)",
      address: "Pavlides Court, Agíou Stefánou Street 134, 8260 Emba",
      phone: "+357 99 123456",
      currency: "EUR",
      vatRate: 0.19,
      isActive: true,
    },
  });

  const limassolLocation = await prisma.location.upsert({
    where: { slug: "LIMASSOL" },
    update: {},
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

  // 2. Terminals
  await prisma.terminal.upsert({
    where: {
      locationId_terminalCode: {
        locationId: embaLocation.id,
        terminalCode: "KIOSK-01",
      },
    },
    update: {},
    create: {
      locationId: embaLocation.id,
      terminalCode: "KIOSK-01",
      terminalType: "KIOSK",
      printerType: "EPSON_TM",
      isActive: true,
    },
  });

  await prisma.terminal.upsert({
    where: {
      locationId_terminalCode: {
        locationId: embaLocation.id,
        terminalCode: "POS-01",
      },
    },
    update: {},
    create: {
      locationId: embaLocation.id,
      terminalCode: "POS-01",
      terminalType: "POS_COUNTER",
      printerType: "STAR_MICRONICS",
      isActive: true,
    },
  });

  // 3. Staff & Admin Accounts (PINs for fast kiosk/POS login)
  const pin9999 = await bcrypt.hash("9999", 10);
  const pin1234 = await bcrypt.hash("1234", 10);
  const pin1111 = await bcrypt.hash("1111", 10);
  const pin0000 = await bcrypt.hash("0000", 10);

  // HQ System Admin
  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      pinHash: pin9999,
      role: "SYSTEM_ADMIN",
    },
  });

  // Store Manager
  await prisma.adminUser.upsert({
    where: { username: "manager" },
    update: {},
    create: {
      username: "manager",
      pinHash: pin1234,
      role: "STORE_MANAGER",
    },
  });

  // Cashier / Counter Till
  await prisma.adminUser.upsert({
    where: { username: "cashier" },
    update: {},
    create: {
      username: "cashier",
      pinHash: pin1111,
      role: "STORE_STAFF",
    },
  });

  // Store Staff / Floor
  await prisma.adminUser.upsert({
    where: { username: "staff" },
    update: {},
    create: {
      username: "staff",
      pinHash: pin0000,
      role: "STORE_STAFF",
    },
  });

  // 4. Categories from mygermandoener.com
  const catDoener = await prisma.category.upsert({
    where: { slug: "doener" },
    update: { name: "Döner", iconSvg: "sandwich" },
    create: {
      slug: "doener",
      name: "Döner",
      nameDE: "Döner Kebab",
      nameGR: "Ντονέρ Κεμπάπ",
      description: "Freshly sliced German rotisserie meat in crispy toasted bread with crunchy salad",
      iconSvg: "sandwich",
      sortOrder: 1,
    },
  });

  const catWraps = await prisma.category.upsert({
    where: { slug: "wraps" },
    update: { name: "Wraps", iconSvg: "scroll" },
    create: {
      slug: "wraps",
      name: "Wraps",
      nameDE: "Dürüm Wraps",
      nameGR: "Τυλιχτά Wraps",
      description: "Light, fresh and rolled in warm flatbread with signature homemade sauces",
      iconSvg: "scroll",
      sortOrder: 2,
    },
  });

  const catBowls = await prisma.category.upsert({
    where: { slug: "bowls" },
    update: { name: "Bowls", iconSvg: "box" },
    create: {
      slug: "bowls",
      name: "Bowls",
      nameDE: "Döner Bowls",
      nameGR: "Μπωλ Ντονέρ",
      description: "Juicy döner meat over crispy fries or seasoned rice with fresh salad & dips",
      iconSvg: "box",
      sortOrder: 3,
    },
  });

  const catPizzaBurger = await prisma.category.upsert({
    where: { slug: "pizza-burger" },
    update: { name: "Pizza & Burger", iconSvg: "french-fries" },
    create: {
      slug: "pizza-burger",
      name: "Pizza & Burger",
      nameDE: "Döner Pizza & Burger",
      nameGR: "Πίτσα & Μπέργκερ",
      description: "Fusion classics: 33cm Döner Pizza & loaded German Döner Burgers",
      iconSvg: "french-fries",
      sortOrder: 4,
    },
  });

  const catSides = await prisma.category.upsert({
    where: { slug: "sides" },
    update: { name: "Sides & Loaded Fries", iconSvg: "french-fries" },
    create: {
      slug: "sides",
      name: "Sides & Loaded Fries",
      nameDE: "Beilagen & Pommes Spezial",
      nameGR: "Συνοδευτικά & Πατάτες",
      description: "Crispy Berlin fries, chili-cheese fries, truffle parmesan and falafel",
      iconSvg: "french-fries",
      sortOrder: 5,
    },
  });

  const catDrinks = await prisma.category.upsert({
    where: { slug: "drinks" },
    update: { name: "Drinks", iconSvg: "cup" },
    create: {
      slug: "drinks",
      name: "Drinks",
      nameDE: "Getränke",
      nameGR: "Ποτά & Αναψυκτικά",
      description: "Ayran, Fritz-Kola, Uludağ Gazoz, soft drinks and water",
      iconSvg: "cup",
      sortOrder: 6,
    },
  });

  // Clean old modifier groups & recreate
  await prisma.productModifierGroup.deleteMany({});
  await prisma.modifier.deleteMany({});
  await prisma.modifierGroup.deleteMany({});

  // 5. Modifier Groups (Meat, Bread/Size, Sauces, Extras)
  const groupMeat = await prisma.modifierGroup.create({
    data: {
      slug: "choose-meat",
      name: "Choose Your Meat",
      nameDE: "Fleischsorte wählen",
      nameGR: "Επιλογή Κρέατος",
      minSelected: 1,
      maxSelected: 1,
      isRequired: true,
      sortOrder: 1,
      modifiers: {
        create: [
          { slug: "meat-chicken", name: "Original Chicken", nameDE: "Hähnchen", nameGR: "Κοτόπουλο", priceAdjustment: 0.0, isDefault: true },
          { slug: "meat-beef-lamb", name: "German Beef & Lamb", nameDE: "Kalbfleisch / Lamm", nameGR: "Μοσχάρι & Αρνί", priceAdjustment: 0.5 },
          { slug: "meat-steak", name: "Steak Döner (Premium)", nameDE: "Steak Döner", nameGR: "Μοσχαρίσιο Στέικ", priceAdjustment: 1.5 },
          { slug: "meat-mixed", name: "Mixed (Chicken & Beef)", nameDE: "Gemischt", nameGR: "Ανάμεικτο", priceAdjustment: 0.5 },
          { slug: "meat-falafel", name: "Veggie Falafel (Plant-based)", nameDE: "Vegetarisch Falafel", nameGR: "Φαλάφελ", priceAdjustment: 0.0 },
        ],
      },
    },
  });

  const groupBread = await prisma.modifierGroup.create({
    data: {
      slug: "bread-size",
      name: "Bread & Size",
      nameDE: "Brot & Größe",
      nameGR: "Ψωμί & Μέγεθος",
      minSelected: 1,
      maxSelected: 1,
      isRequired: true,
      sortOrder: 2,
      modifiers: {
        create: [
          { slug: "size-standard", name: "Standard (150g Meat)", nameDE: "Standard (150g)", nameGR: "Κανονικό (150g)", priceAdjustment: 0.0, isDefault: true },
          { slug: "size-small", name: "Small (100g Meat)", nameDE: "Klein (100g)", nameGR: "Μικρό (100g)", priceAdjustment: -1.0 },
          { slug: "size-mini", name: "Mini (75g Meat)", nameDE: "Mini (75g)", nameGR: "Μίνι (75g)", priceAdjustment: -2.0 },
          { slug: "bread-fladenbrot", name: "German Fladenbrot", nameDE: "Berliner Fladenbrot", nameGR: "Γερμανικό Ψωμί", priceAdjustment: 0.0 },
        ],
      },
    },
  });

  const groupSauces = await prisma.modifierGroup.create({
    data: {
      slug: "homemade-sauces",
      name: "Homemade Sauces (Pick up to 3)",
      nameDE: "Hausgemachte Saucen (Bis zu 3)",
      nameGR: "Σάλτσες (Έως 3)",
      minSelected: 0,
      maxSelected: 3,
      isRequired: false,
      sortOrder: 3,
      modifiers: {
        create: [
          { slug: "sauce-kraeuter", name: "Kräuter (German Herb)", nameDE: "Kräuter Sauce", nameGR: "Σάλτσα Βοτάνων", priceAdjustment: 0.0, isDefault: true },
          { slug: "sauce-knoblauch", name: "Knoblauch (Garlic)", nameDE: "Knoblauch Sauce", nameGR: "Σκορδάτη", priceAdjustment: 0.0, isDefault: true },
          { slug: "sauce-scharf", name: "Scharf (Spicy Chili)", nameDE: "Scharfe Chilisauce", nameGR: "Καυτερή", priceAdjustment: 0.0 },
          { slug: "sauce-feta-jalapeno", name: "Feta-Olive-Jalapeño", nameDE: "Feta-Olive-Jalapeño", nameGR: "Φέτα-Ελιά", priceAdjustment: 0.5 },
          { slug: "sauce-cocktail", name: "Cocktail Sauce", nameDE: "Cocktail Sauce", nameGR: "Κοκτέιλ", priceAdjustment: 0.0 },
          { slug: "sauce-tzatziki", name: "Tzatziki (Garlic Yoghurt)", nameDE: "Tzatziki", nameGR: "Τζατζίκι", priceAdjustment: 0.0 },
        ],
      },
    },
  });

  const groupExtras = await prisma.modifierGroup.create({
    data: {
      slug: "toppings-extras",
      name: "Toppings & Extras (+€1.00 each)",
      nameDE: "Extras (+€1.00)",
      nameGR: "Έξτρα (+€1.00)",
      minSelected: 0,
      maxSelected: 5,
      isRequired: false,
      sortOrder: 4,
      modifiers: {
        create: [
          { slug: "extra-halloumi", name: "Grilled Cyprus Halloumi", nameDE: "Gegrillter Halloumi", nameGR: "Χαλλούμι", priceAdjustment: 1.0 },
          { slug: "extra-feta", name: "Greek Feta Cheese", nameDE: "Schafskäse (Feta)", nameGR: "Φέτα", priceAdjustment: 1.0 },
          { slug: "extra-fries-inside", name: "Fries Inside (Pommes im Döner)", nameDE: "Pommes im Döner", nameGR: "Πατάτες μέσα", priceAdjustment: 1.0 },
          { slug: "extra-jalapenos", name: "Pickled Jalapeños", nameDE: "Jalapeños", nameGR: "Πιπεριές Jalapeño", priceAdjustment: 1.0 },
          { slug: "extra-cheddar", name: "Cheddar Cheese", nameDE: "Cheddar Käse", nameGR: "Τσένταρ", priceAdjustment: 1.0 },
        ],
      },
    },
  });

  // 6. Products from mygermandoener.com
  const productsData = [
    // DOENER
    {
      sku: "MYGD-DON-01",
      name: "Original German Döner",
      nameDE: "Original Berliner Döner",
      nameGR: "Αυθεντικό Γερμανικό Ντονέρ",
      description: "Authentic Berlin döner in toasted sesame bread, fresh crisp salad, and homemade sauces",
      basePrice: 6.50,
      imageUrl: "https://images.unsplash.com/photo-1561651823-34feb02250e4?w=800&auto=format&fit=crop&q=85",
      badge: "POPULAR",
      categoryId: catDoener.id,
      groups: [groupMeat.id, groupBread.id, groupSauces.id, groupExtras.id],
    },
    {
      sku: "MYGD-DON-02",
      name: "Steak Döner (100% Beef Steak)",
      nameDE: "Steak Döner (100% Rindfleisch)",
      nameGR: "Στέικ Ντονέρ",
      description: "Premium sliced beef steak layered with fresh herb salad, garlic cream, and lemon twist",
      basePrice: 8.50,
      imageUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=85",
      badge: "CHEF_CHOICE",
      categoryId: catDoener.id,
      groups: [groupMeat.id, groupBread.id, groupSauces.id, groupExtras.id],
    },
    {
      sku: "MYGD-DON-03",
      name: "Döner Spezial (Double Meat)",
      nameDE: "Döner Spezial (Doppelt Fleisch)",
      nameGR: "Ντονέρ Σπεσιάλ",
      description: "Heavy loaded 250g meat portion with melted cheddar, grilled onions, and extra sauce",
      basePrice: 9.00,
      imageUrl: "https://images.unsplash.com/photo-1549611016-3a70d82b5040?w=800&auto=format&fit=crop&q=85",
      badge: "SPICY",
      categoryId: catDoener.id,
      groups: [groupMeat.id, groupBread.id, groupSauces.id, groupExtras.id],
    },
    {
      sku: "MYGD-DON-04",
      name: "Veggie Chicken & Halloumi Döner",
      nameDE: "Vegetarischer Halloumi Döner",
      nameGR: "Χορτοφαγικό Ντονέρ Χαλλούμι",
      description: "Grilled Cyprus halloumi, plant-based chicken strips, crunchy red cabbage, and garlic herb sauce",
      basePrice: 7.00,
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=85",
      badge: "VEGGIE",
      categoryId: catDoener.id,
      groups: [groupMeat.id, groupBread.id, groupSauces.id, groupExtras.id],
    },

    // WRAPS
    {
      sku: "MYGD-WRP-01",
      name: "Standard Dürüm Wrap",
      nameDE: "Standard Dürüm Wrap",
      nameGR: "Κλασικό Τυλιχτό Dürüm",
      description: "Rolled warm flatbread packed with 150g meat, fresh tomato, cucumber, parsley, and garlic herb sauce",
      basePrice: 8.00,
      imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop&q=85",
      badge: "POPULAR",
      categoryId: catWraps.id,
      groups: [groupMeat.id, groupSauces.id, groupExtras.id],
    },
    {
      sku: "MYGD-WRP-02",
      name: "Falafel & Halloumi Wrap",
      nameDE: "Falafel-Halloumi Dürüm",
      nameGR: "Τυλιχτό Φαλάφελ & Χαλλούμι",
      description: "Crispy chickpea falafel, grilled halloumi, sesame tahini, and pickled salad in warm lavash",
      basePrice: 7.50,
      imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=85",
      badge: "VEGGIE",
      categoryId: catWraps.id,
      groups: [groupSauces.id, groupExtras.id],
    },

    // BOWLS
    {
      sku: "MYGD-BWL-01",
      name: "Döner Box / Bowl (Fries Base)",
      nameDE: "Döner Box mit Pommes",
      nameGR: "Μπωλ Ντονέρ με Πατάτες",
      description: "Hot crispy Berlin fries topped with juicy rotisserie meat and smothered in garlic & chili sauces",
      basePrice: 6.50,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85",
      badge: "POPULAR",
      categoryId: catBowls.id,
      groups: [groupMeat.id, groupSauces.id, groupExtras.id],
    },
    {
      sku: "MYGD-BWL-02",
      name: "Döner Bowl XL (200g Meat + Rice & Fries)",
      nameDE: "Döner Bowl XL (200g)",
      nameGR: "Μπωλ Ντονέρ XL (200g)",
      description: "Extra large bowl with mixed fries and aromatic rice, 200g meat, mixed salad, and double sauce dips",
      basePrice: 11.50,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=85",
      badge: "CHEF_CHOICE",
      categoryId: catBowls.id,
      groups: [groupMeat.id, groupSauces.id, groupExtras.id],
    },

    // PIZZA & BURGER
    {
      sku: "MYGD-PIZ-01",
      name: "33cm Döner Pizza",
      nameDE: "33cm Döner Pizza",
      nameGR: "Πίτσα Ντονέρ 33εκ",
      description: "Stone-baked Italian dough with tomato base, mozzarella, juicy döner meat, onions, and garlic herb drizzle",
      basePrice: 13.50,
      imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=85",
      badge: "NEW",
      categoryId: catPizzaBurger.id,
      groups: [groupMeat.id, groupSauces.id],
    },
    {
      sku: "MYGD-BGR-01",
      name: "German Döner Burger",
      nameDE: "Berliner Döner Burger",
      nameGR: "Μπέργκερ Ντονέρ",
      description: "Brioche bun filled with rotisserie döner meat, cheddar cheese, crisp lettuce, tomato, and cocktail sauce",
      basePrice: 7.00,
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=85",
      badge: "POPULAR",
      categoryId: catPizzaBurger.id,
      groups: [groupMeat.id, groupSauces.id],
    },

    // SIDES
    {
      sku: "MYGD-SID-01",
      name: "Crispy Berlin Fries",
      nameDE: "Knusprige Berliner Pommes",
      nameGR: "Τραγανές Πατάτες Βερολίνου",
      description: "Golden crispy skin-on fries seasoned with signature German paprika salt blend",
      basePrice: 3.50,
      imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=85",
      categoryId: catSides.id,
      groups: [],
    },
    {
      sku: "MYGD-SID-02",
      name: "Chili-Cheese Loaded Fries",
      nameDE: "Chili-Cheese Pommes Spezial",
      nameGR: "Πατάτες Chili-Cheese",
      description: "Fries topped with melted cheddar sauce, sliced jalapeños, and döner beef crumbles",
      basePrice: 6.00,
      imageUrl: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=800&auto=format&fit=crop&q=85",
      badge: "SPICY",
      categoryId: catSides.id,
      groups: [],
    },
    {
      sku: "MYGD-SID-03",
      name: "Berlin Currywurst mit Pommes",
      nameDE: "Original Berliner Currywurst",
      nameGR: "Λουκάνικο Κάρι με Πατάτες",
      description: "Traditional German pork bratwurst in homemade spiced tomato curry sauce with fries",
      basePrice: 7.50,
      imageUrl: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=800&auto=format&fit=crop&q=85",
      badge: "POPULAR",
      categoryId: catSides.id,
      groups: [],
    },

    // DRINKS
    {
      sku: "MYGD-DRK-01",
      name: "Traditional Ayran (250ml)",
      nameDE: "Traditioneller Ayran (250ml)",
      nameGR: "Παραδοσιακό Αριάνι",
      description: "Refreshing salted yoghurt beverage — the classic döner companion",
      basePrice: 2.00,
      imageUrl: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop&q=85",
      categoryId: catDrinks.id,
      groups: [],
    },
    {
      sku: "MYGD-DRK-02",
      name: "Uludağ Gazoz (330ml)",
      nameDE: "Uludağ Gazoz (330ml)",
      nameGR: "Αναψυκτικό Uludağ",
      description: "Famous Turkish sparkling lemonade",
      basePrice: 2.50,
      imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=85",
      categoryId: catDrinks.id,
      groups: [],
    },
    {
      sku: "MYGD-DRK-03",
      name: "Coca-Cola / Zero (330ml)",
      nameDE: "Coca-Cola / Zero (330ml)",
      nameGR: "Coca-Cola / Zero",
      description: "Chilled can 330ml",
      basePrice: 2.50,
      imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=85",
      categoryId: catDrinks.id,
      groups: [],
    },
  ];

  for (const prod of productsData) {
    const createdProd = await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {
        name: prod.name,
        nameDE: prod.nameDE,
        nameGR: prod.nameGR,
        description: prod.description,
        basePrice: prod.basePrice,
        imageUrl: prod.imageUrl,
        badge: prod.badge || null,
        categoryId: prod.categoryId,
      },
      create: {
        sku: prod.sku,
        name: prod.name,
        nameDE: prod.nameDE,
        nameGR: prod.nameGR,
        description: prod.description,
        basePrice: prod.basePrice,
        imageUrl: prod.imageUrl,
        badge: prod.badge || null,
        categoryId: prod.categoryId,
        allowMealUpgrade: true,
      },
    });

    // Link modifier groups
    for (const groupId of prod.groups) {
      await prisma.productModifierGroup.create({
        data: {
          productId: createdProd.id,
          modifierGroupId: groupId,
        },
      });
    }
  }

  console.log("✅ Database seeded successfully with official mygermandoener.com menu!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
