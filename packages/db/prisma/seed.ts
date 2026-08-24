import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding MY GERMAN DONER Master Database...");

  // 1. Locations
  const embaLocation = await prisma.location.upsert({
    where: { slug: "EMBA" },
    update: {
      name: "MY GERMAN DONER — Emba (Paphos)",
      address: "Pavlides Court, Agiou Stefanou Street 134, 8260 Emba",
    },
    create: {
      slug: "EMBA",
      name: "MY GERMAN DONER — Emba (Paphos)",
      address: "Pavlides Court, Agiou Stefanou Street 134, 8260 Emba",
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
      name: "MY GERMAN DONER — Limassol Marina",
      address: "Limassol Marina Commercial Promenade, 3042 Limassol",
      phone: "+357 99 654321",
      currency: "EUR",
      vatRate: 0.19,
      isActive: true,
    },
  });

  // 2. Terminals
  const terminals = [
    { code: "KIOSK-01", type: "KIOSK", printer: "EPSON_TM" },
    { code: "POS-01", type: "POS_COUNTER", printer: "STAR_MICRONICS" },
    { code: "KDS-01", type: "KITCHEN_DISPLAY", printer: "SIMULATED_SCREEN" },
    { code: "DISPLAY-01", type: "CUSTOMER_DISPLAY", printer: "SIMULATED_SCREEN" },
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

  // 3. Admin Users
  const pin9999 = await bcrypt.hash("9999", 10);
  const pin1234 = await bcrypt.hash("1234", 10);
  const pin1111 = await bcrypt.hash("1111", 10);

  await prisma.adminUser.upsert({
    where: { username: "manager_rico" },
    update: { pinHash: pin9999 },
    create: { username: "manager_rico", pinHash: pin9999, role: "SYSTEM_ADMIN" },
  });

  await prisma.adminUser.upsert({
    where: { username: "staff_alex" },
    update: { pinHash: pin1234 },
    create: { username: "staff_alex", pinHash: pin1234, role: "STORE_STAFF" },
  });

  await prisma.adminUser.upsert({
    where: { username: "lead_markus" },
    update: { pinHash: pin1111 },
    create: { username: "lead_markus", pinHash: pin1111, role: "STORE_MANAGER" },
  });

  // 4. Categories & Products
  const catDoner = await prisma.category.upsert({
    where: { slug: "doner-kebab" },
    update: {},
    create: {
      slug: "doner-kebab",
      name: "Classic Doner Kebab",
      nameDE: "Klassischer Doner Kebab",
      nameGR: "Κλασικο Ντονερ Κεμπαπ",
      sortOrder: 1,
    },
  });

  const catBoxes = await prisma.category.upsert({
    where: { slug: "doner-box" },
    update: {},
    create: {
      slug: "doner-box",
      name: "Doner Boxes & Bowls",
      nameDE: "Doner Boxen & Bowls",
      nameGR: "Κουτια & Μπολ Ντονερ",
      sortOrder: 2,
    },
  });

  const catSides = await prisma.category.upsert({
    where: { slug: "sides-fries" },
    update: {},
    create: {
      slug: "sides-fries",
      name: "Sides & Loaded Fries",
      nameDE: "Beilagen & Pommes",
      nameGR: "Συνοδευτικα & Πατατες",
      sortOrder: 3,
    },
  });

  const catDrinks = await prisma.category.upsert({
    where: { slug: "drinks" },
    update: {},
    create: {
      slug: "drinks",
      name: "Drinks & Ayran",
      nameDE: "Getraenke & Ayran",
      nameGR: "Ποτα & Αϊρανι",
      sortOrder: 4,
    },
  });

  // Products
  const prodClassicDoner = await prisma.product.upsert({
    where: { sku: "MYGD-CL-DONER" },
    update: {},
    create: {
      categoryId: catDoner.id,
      sku: "MYGD-CL-DONER",
      name: "Classic German Doner",
      nameDE: "Klassischer Berliner Doner",
      description: "Original toasted triangle flatbread, sliced rotisserie meat, fresh crisp salad & trio homemade sauces.",
      basePrice: 7.50,
      badge: "POPULAR",
      calories: 680,
      allergens: JSON.stringify(["Gluten", "Dairy", "Sesame"]),
      sortOrder: 1,
    },
  });

  const prodDonerBox = await prisma.product.upsert({
    where: { sku: "MYGD-BOX-CRISP" },
    update: {},
    create: {
      categoryId: catBoxes.id,
      sku: "MYGD-BOX-CRISP",
      name: "Berlin Doner Box with Fries",
      nameDE: "Berliner Doner Box mit Pommes",
      description: "Crispy skin-on fries topped with juicy rotisserie meat, garlic herb sauce, and pickled red cabbage.",
      basePrice: 8.50,
      badge: "CHEF_CHOICE",
      calories: 740,
      sortOrder: 2,
    },
  });

  const prodLoadedFries = await prisma.product.upsert({
    where: { sku: "MYGD-FR-TRUFFLE" },
    update: {},
    create: {
      categoryId: catSides.id,
      sku: "MYGD-FR-TRUFFLE",
      name: "Truffle Parmesan Loaded Fries",
      nameDE: "Trueffel Parmesan Pommes",
      description: "Golden crispy fries drizzled with black truffle mayo, shaved aged parmesan & fresh parsley.",
      basePrice: 4.90,
      badge: "NEW",
      calories: 520,
      sortOrder: 3,
    },
  });

  const prodAyran = await prisma.product.upsert({
    where: { sku: "MYGD-DR-AYRAN" },
    update: {},
    create: {
      categoryId: catDrinks.id,
      sku: "MYGD-DR-AYRAN",
      name: "Authentic Chilled Ayran (250ml)",
      nameDE: "Original Gekuehlter Ayran (250ml)",
      description: "Traditional salted yogurt drink, ice cold.",
      basePrice: 2.20,
      calories: 95,
      sortOrder: 4,
    },
  });

  // 5. Modifier Groups & Modifiers
  const mgMeat = await prisma.modifierGroup.upsert({
    where: { slug: "meat-choice" },
    update: {},
    create: {
      slug: "meat-choice",
      name: "Choose Your Meat",
      minSelected: 1,
      maxSelected: 1,
      isRequired: true,
      sortOrder: 1,
    },
  });

  const mgBread = await prisma.modifierGroup.upsert({
    where: { slug: "bread-choice" },
    update: {},
    create: {
      slug: "bread-choice",
      name: "Choose Your Bread",
      minSelected: 1,
      maxSelected: 1,
      isRequired: true,
      sortOrder: 2,
    },
  });

  const mgSauces = await prisma.modifierGroup.upsert({
    where: { slug: "sauces" },
    update: {},
    create: {
      slug: "sauces",
      name: "Homemade Sauces (Pick up to 3)",
      minSelected: 0,
      maxSelected: 3,
      isRequired: false,
      sortOrder: 3,
    },
  });

  // Modifiers
  await prisma.modifier.upsert({
    where: { modifierGroupId_slug: { modifierGroupId: mgMeat.id, slug: "meat-chicken" } },
    update: {},
    create: { modifierGroupId: mgMeat.id, slug: "meat-chicken", name: "Juicy Chicken Doner (150g)", isDefault: true },
  });

  await prisma.modifier.upsert({
    where: { modifierGroupId_slug: { modifierGroupId: mgMeat.id, slug: "meat-beef" } },
    update: {},
    create: { modifierGroupId: mgMeat.id, slug: "meat-beef", name: "Premium Beef & Lamb (150g)", priceAdjustment: 1.00 },
  });

  await prisma.modifier.upsert({
    where: { modifierGroupId_slug: { modifierGroupId: mgBread.id, slug: "bread-fladenbrot" } },
    update: {},
    create: { modifierGroupId: mgBread.id, slug: "bread-fladenbrot", name: "Toasted Berlin Fladenbrot", isDefault: true },
  });

  await prisma.modifier.upsert({
    where: { modifierGroupId_slug: { modifierGroupId: mgSauces.id, slug: "sauce-garlic" } },
    update: {},
    create: { modifierGroupId: mgSauces.id, slug: "sauce-garlic", name: "Knoblauch (Creamy Garlic)", isDefault: true },
  });

  await prisma.modifier.upsert({
    where: { modifierGroupId_slug: { modifierGroupId: mgSauces.id, slug: "sauce-krauter" } },
    update: {},
    create: { modifierGroupId: mgSauces.id, slug: "sauce-krauter", name: "Krauter (Fresh Herb)", isDefault: true },
  });

  await prisma.modifier.upsert({
    where: { modifierGroupId_slug: { modifierGroupId: mgSauces.id, slug: "sauce-scharf" } },
    update: {},
    create: { modifierGroupId: mgSauces.id, slug: "sauce-scharf", name: "Scharf (Spicy Chilli Fire)" },
  });

  // Link Product to Groups
  const prodGroups = [mgMeat.id, mgBread.id, mgSauces.id];
  for (let i = 0; i < prodGroups.length; i++) {
    await prisma.productModifierGroup.upsert({
      where: {
        productId_modifierGroupId: {
          productId: prodClassicDoner.id,
          modifierGroupId: prodGroups[i],
        },
      },
      update: {},
      create: {
        productId: prodClassicDoner.id,
        modifierGroupId: prodGroups[i],
        sortOrder: i + 1,
      },
    });
  }

  // 6. Suppliers (M2)
  const suppMeat = await prisma.supplier.upsert({
    where: { id: "supp-meat-01" },
    update: {},
    create: {
      id: "supp-meat-01",
      name: "Berlin Doner Fleischerei GmbH",
      category: "MEAT",
      contactName: "Hans Weber",
      whatsApp: "+35799112233",
      email: "orders@berlindonerspitz.de",
      leadTimeHours: 24,
    },
  });

  // 7. Ingredients & Recipe (M3)
  const ingChicken = await prisma.ingredient.upsert({
    where: { sku: "ING-CHICKEN-SPIT" },
    update: {},
    create: {
      sku: "ING-CHICKEN-SPIT",
      name: "Marinated Chicken Spit Meat",
      unit: "GRAMS",
      costPerUnitEUR: 0.0075,
      supplierId: suppMeat.id,
    },
  });

  const recClassic = await prisma.recipe.upsert({
    where: { id: "rec-classic-doner" },
    update: {},
    create: {
      id: "rec-classic-doner",
      productId: prodClassicDoner.id,
      variantName: "STANDARD_150G",
      yieldServings: 1,
      prepTimeSec: 120,
    },
  });

  await prisma.recipeIngredient.upsert({
    where: {
      recipeId_ingredientId: {
        recipeId: recClassic.id,
        ingredientId: ingChicken.id,
      },
    },
    update: {},
    create: {
      recipeId: recClassic.id,
      ingredientId: ingChicken.id,
      amountUnits: 150.0,
    },
  });

  // 8. Build Sheets (M8)
  const buildSteps = [
    { step: 1, text: "Toast triangle sesame bread in contact grill for 25 seconds.", targetSec: 25, quality: "Check internal bread warmth > 60C" },
    { step: 2, text: "Spread 20g Knoblauch garlic sauce on bottom bread layer.", targetSec: 15, quality: "Even edge-to-edge spread" },
    { step: 3, text: "Weigh exactly 150g thinly shaved crispy rotisserie chicken.", targetSec: 30, quality: "Zero clumps, meat temp > 75C" },
    { step: 4, text: "Top with crisp iceberg lettuce, pickled red cabbage, tomato slice.", targetSec: 20, quality: "Vibrant color contrast" },
    { step: 5, text: "Wrap in MYGD branded foil pocket with logo upright.", targetSec: 10, quality: "Tight wrap, no sauce leak" },
  ];

  for (let b = 0; b < buildSteps.length; b++) {
    const bs = buildSteps[b];
    await prisma.recipeStep.upsert({
      where: {
        productId_stepNumber: {
          productId: prodClassicDoner.id,
          stepNumber: bs.step,
        },
      },
      update: {},
      create: {
        productId: prodClassicDoner.id,
        stepNumber: bs.step,
        instruction: bs.text,
        targetSec: bs.targetSec,
        qualityCheck: bs.quality,
      },
    });
  }

  // 9. Checklist Template (M1)
  await prisma.checklistTemplate.upsert({
    where: { id: "chk-opening-01" },
    update: {},
    create: {
      id: "chk-opening-01",
      title: "Store Opening & HACCP Safety Checklist",
      shiftType: "OPENING",
      tasksJson: JSON.stringify([
        { task: "Turn on Doner Rotisserie Spits and check gas ignition", required: true },
        { task: "Log Walk-in Chiller temperature (Target: 1C - 4C)", isTemp: true, minTemp: 1.0, maxTemp: 4.0 },
        { task: "Log Deep Freezer temperature (Target: -22C - -18C)", isTemp: true, minTemp: -22.0, maxTemp: -18.0 },
        { task: "Calibrate touchscreen kiosks and load 80mm thermal receipt rolls", required: true },
        { task: "Verify POS cash drawer starting float (200 EUR in small notes/coins)", required: true },
      ]),
    },
  });

  // 10. Menu Boards (M10)
  for (let s = 1; s <= 7; s++) {
    await prisma.menuBoardConfig.upsert({
      where: { screenNumber: s },
      update: {},
      create: {
        screenNumber: s,
        title: s === 1 ? "Brand Hero & Slogan" : s === 2 ? "Doner & Wraps" : s === 3 ? "Bowls & Boxes" : s === 4 ? "Burgers & Sides" : s === 5 ? "Sauces & Drinks" : s === 6 ? "Meal Combo Deals" : "Doner Club & Promotions",
        layoutType: s === 1 ? "PROMO_HERO" : "PRICE_MATRIX",
        activeDaypart: "AUTO",
        itemsJson: JSON.stringify({
          headline: s === 2 ? "BERLIN DONER KEBAB" : "BITE THE HYPE",
          subheadline: "Handcrafted fresh daily in Cyprus",
          featuredSkus: ["MYGD-CL-DONER", "MYGD-BOX-CRISP", "MYGD-FR-TRUFFLE"],
        }),
        isOnline: true,
      },
    });
  }

  console.log("Database seeded successfully with all 11 modules!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
