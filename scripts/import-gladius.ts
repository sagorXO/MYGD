// Import the Gladius POS catalogue snapshot into MYGD.
//
//   npm run import:gladius                      # dry run (default): report only, no DB access
//   npm run import:gladius -- --apply           # write to DATABASE_URL (refused while items are blocked)
//   npm run import:gladius -- --apply --allow-blocked   # import only the decided items
//
// Options: --snapshot <dir>  (default .import-work/gladius-2026-09-24)
//          --decisions <file> (default .import-work/gladius-decisions.json; created as a template if missing)
import { PrismaClient } from "@prisma/client";
import { parseArgs } from "node:util";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { buildImportPlan, type ImportDecisions } from "../src/lib/import/gladius/plan";
import { applyImportPlan } from "../src/lib/import/gladius/apply";
import { prismaCatalogStore } from "../src/lib/import/gladius/prisma-store";
import { renderReport } from "../src/lib/import/gladius/report";

const FILES: Record<string, string> = {
  departments: "departments", taxRates: "tax_rates", inventory: "inventory", groupModifiers: "group_modifiers",
  itemPrinters: "item_printers", lastChargedPrice: "last_charged_price",
};

// VAT categories fixed by the signed MSA §3.4 (9% food, 19% alcohol). The old till also
// used 5% on most items; that mapping is left null on purpose for the accountant.
const TEMPLATE_DECISIONS: ImportDecisions = {
  vatRateToCategory: { "0": "ZERO", "5": null, "9": "FOOD_BEV", "19": "ALCOHOL" },
  priceOverrides: {},
  skipItems: [],
};

async function main() {
  const { values } = parseArgs({
    options: {
      snapshot: { type: "string", default: ".import-work/gladius-2026-09-24" },
      decisions: { type: "string", default: ".import-work/gladius-decisions.json" },
      apply: { type: "boolean", default: false },
      "allow-blocked": { type: "boolean", default: false },
    },
  });
  const snapshotDir = values.snapshot!;
  const raw = Object.fromEntries(
    Object.entries(FILES).map(([key, file]) => [key, JSON.parse(readFileSync(join(snapshotDir, `${file}.json`), "utf8"))])
  );

  if (!existsSync(values.decisions!)) {
    writeFileSync(values.decisions!, JSON.stringify(TEMPLATE_DECISIONS, null, 2) + "\n", { mode: 0o600 });
    console.log(`Created decisions template: ${values.decisions}`);
  }
  const decisions = JSON.parse(readFileSync(values.decisions!, "utf8")) as ImportDecisions;

  const plan = buildImportPlan(raw, decisions);
  const source = `gladius:${basename(snapshotDir)}`;
  const mode = values.apply ? "apply" : "dry-run";

  let result;
  if (values.apply) {
    const prisma = new PrismaClient();
    try {
      result = await prisma.$transaction((tx) => applyImportPlan(plan, prismaCatalogStore(tx), { source, allowBlocked: values["allow-blocked"] }), {
        timeout: 120_000,
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  const reportsDir = ".import-work/reports";
  mkdirSync(reportsDir, { recursive: true });
  const generatedAt = new Date();
  const reportPath = join(reportsDir, `gladius-${mode}-${generatedAt.toISOString().replace(/[:.]/g, "-")}.md`);
  writeFileSync(reportPath, renderReport({ plan, source, mode, result, generatedAt }), { mode: 0o600 });

  const blocking = plan.issues.filter((i) => i.blocking).length;
  console.log(`${mode}: ${plan.categories.length} categories, ${plan.products.length} products, ${plan.modifierGroups.length} modifier groups, ${plan.modifiers.length} modifiers; ${plan.issues.length} issues (${blocking} blocking).`);
  if (result) console.log(JSON.stringify(result));
  console.log(`Report: ${reportPath}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
