// First-install data for the hosted server: the EMBA location and the VAT reference rates. Safe to re-run.
// [ADR] Context: prisma/seed.ts also creates Limassol, terminals, suppliers and ingredients.
// Decision: production starts from only what the three current priorities need.
// Consequence: the menu is loaded separately, once Sagar confirms it (nothing here touches products).
import { PrismaClient } from "@prisma/client";
import { VAT_RATE_SEED } from "../prisma/reference-data";

const EMBA = {
  name: "MY GERMAN DÖNER — Emba Flagship (Paphos)",
  address: "Pavlides Court, Agíou Stefánou Street 134, 8260 Emba, Paphos",
  phone: "+357 99 531198",
  currency: "EUR",
  isActive: true,
};

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.location.upsert({ where: { slug: "EMBA" }, update: {}, create: { slug: "EMBA", ...EMBA } });
    for (const seed of VAT_RATE_SEED) {
      await prisma.vatRate.upsert({
        where: { category_validFrom: { category: seed.category, validFrom: seed.validFrom } },
        update: {},
        create: { category: seed.category, rate: seed.rate, validFrom: seed.validFrom, note: seed.note },
      });
    }
    console.log(`Bootstrap finished: EMBA location, ${VAT_RATE_SEED.length} VAT rates.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("Bootstrap failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
