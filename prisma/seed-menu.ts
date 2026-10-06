// Seeds the official MYGD menu (src/lib/menu/mygd-menu.ts) and removes everything from the old menu.
// Safe to re-run: upserts by SKU/slug; sold-out flags set by staff are preserved.
import { PrismaClient, VatCategory } from "@prisma/client";
import {
  MYGD_MENU_BOARDS,
  MYGD_MENU_SECTIONS,
  MYGD_MODIFIER_GROUPS,
  MYGD_PROMOTIONS,
  allMenuItems,
} from "../src/lib/menu/mygd-menu";
import { boardItems } from "../src/lib/menu/boards";

type Ingredients = Record<string, { id: string }>;

/** Bill of materials per menu SKU: [ingredient SKU, amount in the ingredient's unit]. */
const BOM: Record<string, ReadonlyArray<readonly [string, number]>> = {
  "MYGD-PIZZA-MARGHERITA": [["ING-PIZZA-DOUGH", 1]],
  "MYGD-PIZZA-FUNGHI": [["ING-PIZZA-DOUGH", 1]],
  "MYGD-PIZZA-SALAMI": [["ING-PIZZA-DOUGH", 1]],
  "MYGD-PIZZA-FIVE-CHEESE": [["ING-PIZZA-DOUGH", 1], ["ING-GREEK-FETA", 30]],
  "MYGD-PIZZA-CHICKEN-DOENER": [["ING-PIZZA-DOUGH", 1], ["ING-CHICKEN-SPIT", 100]],
  "MYGD-TACO-BEEF": [["ING-BEEF-SPIT", 50]],
  "MYGD-TACO-BEEF-JALAPENO": [["ING-BEEF-SPIT", 50]],
  "MYGD-TACO-CHICKEN": [["ING-CHICKEN-SPIT", 50]],
  "MYGD-TACO-VEGAN": [["ING-VEGAN-DONER", 50]],
  "MYGD-DOEZZA-MARGHERITA": [["ING-PIZZA-DOUGH", 1]],
  "MYGD-DOEZZA-SALAMI": [["ING-PIZZA-DOUGH", 1]],
  "MYGD-DOEZZA-FUNGHI": [["ING-PIZZA-DOUGH", 1]],
  "MYGD-DOEZZA-FOUR-CHEESE": [["ING-PIZZA-DOUGH", 1]],
  "MYGD-BURGER-BEEFSTER": [["ING-BEEF-SPIT", 120], ["ING-BREAD-BRIOCHE", 1]],
  "MYGD-BURGER-CHEESY-GD": [["ING-BEEF-SPIT", 200], ["ING-BREAD-BRIOCHE", 1]],
  "MYGD-BURGER-CHICKEN-HYPE": [["ING-CHICKEN-SPIT", 120], ["ING-BREAD-BRIOCHE", 1]],
  "MYGD-BURGER-CC-CHICKEN": [["ING-CHICKEN-SPIT", 120], ["ING-BREAD-BRIOCHE", 1]],
  "MYGD-DB-MY-CHICKEN": [["ING-CHICKEN-SPIT", 120], ["ING-BREAD-FLADENBROT", 1]],
  "MYGD-DB-CHEESE": [["ING-BEEF-SPIT", 120], ["ING-BREAD-FLADENBROT", 1]],
  "MYGD-DB-CHEESE-CHICKEN": [["ING-CHICKEN-SPIT", 120], ["ING-BREAD-FLADENBROT", 1]],
  "MYGD-DB-HAMBURG": [["ING-BEEF-SPIT", 120], ["ING-BREAD-FLADENBROT", 1]],
  "MYGD-WRAP-BEEF": [["ING-BEEF-SPIT", 150], ["ING-BREAD-LAVASH", 1]],
  "MYGD-WRAP-CHICKEN": [["ING-CHICKEN-SPIT", 150], ["ING-BREAD-LAVASH", 1]],
  "MYGD-WRAP-MIX": [["ING-BEEF-SPIT", 75], ["ING-CHICKEN-SPIT", 75], ["ING-BREAD-LAVASH", 1]],
  "MYGD-WRAP-VEGAN": [["ING-VEGAN-DONER", 150], ["ING-BREAD-LAVASH", 1]],
  "MYGD-BIG-CHICK": [["ING-CHICKEN-SPIT", 250], ["ING-BREAD-FLADENBROT", 1]],
  "MYGD-BIG-B": [["ING-BEEF-SPIT", 250], ["ING-BREAD-FLADENBROT", 1]],
  "MYGD-BIG-MIX": [["ING-BEEF-SPIT", 125], ["ING-CHICKEN-SPIT", 125], ["ING-BREAD-FLADENBROT", 1]],
  "MYGD-BIG-GREEN": [["ING-VEGAN-DONER", 250], ["ING-BREAD-FLADENBROT", 1]],
  "MYGD-BOWL-BEEF": [["ING-BEEF-SPIT", 150], ["ING-POTATO-FRIES", 150]],
  "MYGD-BOWL-CHICKEN": [["ING-CHICKEN-SPIT", 150], ["ING-POTATO-FRIES", 150]],
  "MYGD-BOWL-MIX": [["ING-BEEF-SPIT", 75], ["ING-CHICKEN-SPIT", 75], ["ING-POTATO-FRIES", 150]],
  "MYGD-BOWL-VEGAN": [["ING-VEGAN-DONER", 150], ["ING-POTATO-FRIES", 150]],
  "MYGD-KIDS-MEAL": [["ING-POTATO-FRIES", 100]],
  "MYGD-NUGGETS-6": [["ING-CHICKEN-NUGGETS", 6]],
  "MYGD-NUGGETS-12": [["ING-CHICKEN-NUGGETS", 12]],
  "MYGD-NUGGETS-20": [["ING-CHICKEN-NUGGETS", 20]],
  "MYGD-WINGS-6": [["ING-CHICKEN-WINGS", 6]],
  "MYGD-WINGS-12": [["ING-CHICKEN-WINGS", 12]],
  "MYGD-WINGS-20": [["ING-CHICKEN-WINGS", 20]],
  "MYGD-FRIES-REG": [["ING-POTATO-FRIES", 200]],
  "MYGD-FRIES-LRG": [["ING-POTATO-FRIES", 300]],
  "MYGD-FRIES-XL": [["ING-POTATO-FRIES", 400]],
  "MYGD-SWEET-FRIES-REG": [["ING-SWEET-POTATO", 200]],
  "MYGD-SWEET-FRIES-LRG": [["ING-SWEET-POTATO", 300]],
  "MYGD-SWEET-FRIES-XL": [["ING-SWEET-POTATO", 400]],
  "MYGD-LOADED-HOLLANDAISE": [["ING-POTATO-FRIES", 250]],
  "MYGD-LOADED-JALAPENO": [["ING-POTATO-FRIES", 250]],
  "MYGD-LOADED-GRAVY": [["ING-POTATO-FRIES", 250]],
  "MYGD-LOADED-CHEESY": [["ING-POTATO-FRIES", 250]],
  "MYGD-SALAD-CHICKEN": [["ING-CHICKEN-SPIT", 100]],
  "MYGD-SALAD-HALLOUMI": [["ING-CYPRUS-HALLOUMI", 80]],
  "MYGD-MEATBALLS-6": [["ING-BEEF-KOFTE", 6], ["ING-POTATO-FRIES", 150]],
  "MYGD-MEATBALLS-12": [["ING-BEEF-KOFTE", 12], ["ING-POTATO-FRIES", 200]],
  "MYGD-MEATBALLS-20": [["ING-BEEF-KOFTE", 20], ["ING-POTATO-FRIES", 250]],
  "MYGD-MOZZ-6": [["ING-MOZZ-STICKS", 6]],
  "MYGD-MOZZ-12": [["ING-MOZZ-STICKS", 12]],
  "MYGD-MOZZ-20": [["ING-MOZZ-STICKS", 20]],
  "MYGD-AYRAN-05": [["ING-AYRAN-BOTTLE", 1]],
  "MYGD-ENERGY-REDBULL": [["ING-REDBULL-CAN", 1]],
  "MYGD-ENERGY-REDBULL-SF": [["ING-REDBULL-CAN", 1]],
  "MYGD-KOMBUCHA-HIBISCUS": [["ING-KOMBUCHA-BOTTLE", 1]],
  "MYGD-KOMBUCHA-LEMON-ZEN": [["ING-KOMBUCHA-BOTTLE", 1]],
  "MYGD-KOMBUCHA-GINGER": [["ING-KOMBUCHA-BOTTLE", 1]],
  "MYGD-KOMBUCHA-LEMONGRASS": [["ING-KOMBUCHA-BOTTLE", 1]],
  "MYGD-DRAFT-05": [["ING-BEER-KEG-30L", 500]],
  "MYGD-DRAFT-03": [["ING-BEER-KEG-30L", 300]],
  "MYGD-COFFEE-ESPRESSO": [["ING-COFFEE-BEANS", 9]],
  "MYGD-COFFEE-AMERICANO": [["ING-COFFEE-BEANS", 9]],
  "MYGD-COFFEE-CAPPUCCINO": [["ING-COFFEE-BEANS", 9]],
  "MYGD-COFFEE-LATTE-MACCHIATO": [["ING-COFFEE-BEANS", 9]],
};

/** Ingredients that only existed for the old menu. */
const STALE_INGREDIENTS = ["ING-STEAK-MEAT", "ING-ONION-RINGS"];

export async function seedMenu(prisma: PrismaClient, ingredients: Ingredients): Promise<void> {
  const items = allMenuItems();
  const skus = new Set(items.map((i) => i.sku));

  // --- Categories (one per menu section) -------------------------------------------------
  const categoryId: Record<string, string> = {};
  for (const [index, s] of MYGD_MENU_SECTIONS.entries()) {
    const data = { name: s.name, nameDE: s.nameDE, nameGR: s.nameGR, description: s.note ?? null, imageUrl: s.imageUrl, sortOrder: index + 1, isActive: true };
    const cat = await prisma.category.upsert({ where: { slug: s.slug }, update: data, create: { slug: s.slug, ...data } });
    categoryId[s.slug] = cat.id;
  }

  // --- Products --------------------------------------------------------------------------
  const productId: Record<string, string> = {};
  for (const item of items) {
    const data = {
      categoryId: categoryId[item.sectionSlug],
      name: item.name,
      nameDE: null,
      nameGR: null,
      description: item.description ?? null,
      descriptionDE: null,
      descriptionGR: null,
      basePrice: item.price,
      imageUrl: item.imageUrl,
      badge: null,
      calories: null,
      allergens: null,
      vatCategory: item.vat === "ALCOHOL" ? VatCategory.ALCOHOL : VatCategory.FOOD_BEV,
      isVeggie: item.isVeggie ?? false,
      isSpicy: item.isSpicy ?? false,
      allowMealUpgrade: item.allowMealUpgrade ?? false,
      sortOrder: item.sortOrder,
    };
    const product = await prisma.product.upsert({ where: { sku: item.sku }, update: data, create: { sku: item.sku, ...data } });
    productId[item.sku] = product.id;
  }

  // --- Remove old products: delete if never sold, otherwise hide (order history keeps its FK)
  const stale = await prisma.product.findMany({ where: { sku: { notIn: [...skus] } }, select: { id: true, sku: true, _count: { select: { orderItems: true } } } });
  let deleted = 0;
  let hidden = 0;
  for (const p of stale) {
    if (p._count.orderItems === 0) {
      await prisma.product.delete({ where: { id: p.id } });
      deleted++;
    } else {
      await prisma.product.update({ where: { id: p.id }, data: { isAvailable: false } });
      hidden++;
    }
  }
  const sectionSlugs = MYGD_MENU_SECTIONS.map((s) => s.slug);
  for (const c of await prisma.category.findMany({ where: { slug: { notIn: sectionSlugs } }, select: { id: true, _count: { select: { products: true } } } })) {
    if (c._count.products === 0) await prisma.category.delete({ where: { id: c.id } });
    else await prisma.category.update({ where: { id: c.id }, data: { isActive: false } });
  }

  // --- Modifier groups, options and product links ----------------------------------------
  const groupId: Record<string, string> = {};
  for (const [gi, g] of MYGD_MODIFIER_GROUPS.entries()) {
    const data = { name: g.name, minSelected: g.minSelected, maxSelected: g.maxSelected, isRequired: g.isRequired, sortOrder: gi + 1 };
    const group = await prisma.modifierGroup.upsert({ where: { slug: g.slug }, update: data, create: { slug: g.slug, ...data } });
    groupId[g.slug] = group.id;
    for (const [oi, o] of g.options.entries()) {
      const mod = { name: o.name, priceAdjustment: o.price, isDefault: o.isDefault ?? false, isAvailable: true, sortOrder: oi + 1 };
      await prisma.modifier.upsert({
        where: { modifierGroupId_slug: { modifierGroupId: group.id, slug: o.slug } },
        update: mod,
        create: { modifierGroupId: group.id, slug: o.slug, ...mod },
      });
    }
    const keep = g.options.map((o) => o.slug);
    for (const m of await prisma.modifier.findMany({ where: { modifierGroupId: group.id, slug: { notIn: keep } }, select: { id: true, _count: { select: { orderItemMods: true } } } })) {
      if (m._count.orderItemMods === 0) await prisma.modifier.delete({ where: { id: m.id } });
      else await prisma.modifier.update({ where: { id: m.id }, data: { isAvailable: false } });
    }
  }
  for (const item of items) {
    const wanted = item.modifierGroups ?? [];
    await prisma.productModifierGroup.deleteMany({ where: { productId: productId[item.sku], modifierGroupId: { notIn: wanted.map((w) => groupId[w]) } } });
    for (const [i, slug] of wanted.entries()) {
      await prisma.productModifierGroup.upsert({
        where: { productId_modifierGroupId: { productId: productId[item.sku], modifierGroupId: groupId[slug] } },
        update: { sortOrder: i + 1 },
        create: { productId: productId[item.sku], modifierGroupId: groupId[slug], sortOrder: i + 1 },
      });
    }
  }
  // Groups from the old menu (meat-choice, bread-choice, sauces-12, extras-1eur …): remove, or unlink + hide if ever sold.
  for (const old of await prisma.modifierGroup.findMany({ where: { slug: { notIn: MYGD_MODIFIER_GROUPS.map((g) => g.slug) } }, include: { modifiers: { select: { id: true, _count: { select: { orderItemMods: true } } } } } })) {
    await prisma.productModifierGroup.deleteMany({ where: { modifierGroupId: old.id } });
    if (old.modifiers.every((m) => m._count.orderItemMods === 0)) await prisma.modifierGroup.delete({ where: { id: old.id } });
    else await prisma.modifier.updateMany({ where: { modifierGroupId: old.id }, data: { isAvailable: false } });
  }

  // --- Bill of materials -----------------------------------------------------------------
  for (const [sku, lines] of Object.entries(BOM)) {
    const pid = productId[sku];
    if (!pid) throw new Error(`BOM references unknown menu SKU ${sku}`);
    let recipe = await prisma.recipe.findFirst({ where: { productId: pid } });
    if (!recipe) recipe = await prisma.recipe.create({ data: { productId: pid, variantName: "STANDARD", yieldServings: 1, prepTimeSec: 180 } });
    const wanted = lines.map(([ing]) => ingredients[ing]?.id).filter((x): x is string => Boolean(x));
    await prisma.recipeBOM.deleteMany({ where: { productId: pid, ingredientId: { notIn: wanted } } });
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: recipe.id, ingredientId: { notIn: wanted } } });
    for (const [ingSku, amount] of lines) {
      const ing = ingredients[ingSku];
      if (!ing) throw new Error(`BOM for ${sku} references unknown ingredient ${ingSku}`);
      await prisma.recipeBOM.upsert({
        where: { productId_ingredientId: { productId: pid, ingredientId: ing.id } },
        update: { amountGrams: amount },
        create: { productId: pid, ingredientId: ing.id, amountGrams: amount },
      });
      await prisma.recipeIngredient.upsert({
        where: { recipeId_ingredientId: { recipeId: recipe.id, ingredientId: ing.id } },
        update: { amountUnits: amount },
        create: { recipeId: recipe.id, ingredientId: ing.id, amountUnits: amount },
      });
    }
  }
  for (const sku of STALE_INGREDIENTS) {
    await prisma.ingredient.deleteMany({ where: { sku } });
  }

  // --- Automatic promotions ----------------------------------------------------------------
  for (const p of MYGD_PROMOTIONS) {
    const data = { name: p.name, ruleJson: JSON.stringify(p.rule), isActive: true };
    await prisma.promotion.upsert({ where: { code: p.code }, update: data, create: { code: p.code, ...data } });
  }
  await prisma.promotion.updateMany({ where: { code: { notIn: MYGD_PROMOTIONS.map((p) => p.code) } }, data: { isActive: false } });

  // --- Menu boards (screens) ---------------------------------------------------------------
  for (const board of MYGD_MENU_BOARDS) {
    const data = {
      title: board.title,
      layoutType: board.layoutType,
      activeDaypart: "AUTO",
      itemsJson: JSON.stringify(boardItems(board)),
    };
    await prisma.menuBoardConfig.upsert({
      where: { screenNumber: board.screenNumber },
      update: data,
      create: { screenNumber: board.screenNumber, ...data, isOnline: true, lastPing: new Date() },
    });
  }
  await prisma.menuBoardConfig.deleteMany({ where: { screenNumber: { notIn: MYGD_MENU_BOARDS.map((b) => b.screenNumber) } } });

  console.log(`🍽  Menu: ${MYGD_MENU_SECTIONS.length} sections, ${items.length} products, ${MYGD_MODIFIER_GROUPS.length} option groups, ${MYGD_PROMOTIONS.length} promotions, ${MYGD_MENU_BOARDS.length} screens (${deleted} old products deleted, ${hidden} hidden because they appear in past orders)`);
}
