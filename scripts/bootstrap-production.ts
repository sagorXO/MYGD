// First-install data for the hosted server: the EMBA store record that checklists and stock counts belong to.
// Safe to re-run: an existing record is left as it is.
import { PrismaClient } from "@prisma/client";

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
    console.log("Bootstrap finished: EMBA store record is in place.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error("Bootstrap failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
