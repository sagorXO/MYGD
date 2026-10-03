// Human-readable import report (Markdown). Lists every item needing a decision.
import type { ApplyResult } from "./apply";
import type { ImportIssue, ImportPlan } from "./plan";

const ISSUE_TITLES: Record<string, string> = {
  VAT_UNMAPPED: "VAT rate has no MYGD category (blocking — accountant decision)",
  PRICE_MISSING: "No price (blocking)",
  MODIFIER_RULE_UNKNOWN: "Unknown modifier selection rule (blocking)",
  PRICE_DIFFERS_FROM_LAST_SALE: "Menu price differs from the last sale (check)",
  DUPLICATE_NAME: "Duplicate product names (check)",
  MODIFIER_GROUP_UNKNOWN: "Link to a missing modifier group (not created)",
  SKIPPED_BY_DECISION: "Skipped by decision",
  INACTIVE_SKIPPED: "Inactive in Gladius (not imported)",
};

const cell = (s: string | undefined) => (s ?? "").replace(/\|/g, "\\|");

export function renderReport(input: {
  plan: ImportPlan; source: string; mode: "dry-run" | "apply"; result?: ApplyResult; generatedAt: Date;
}): string {
  const { plan, result } = input;
  const blocking = plan.issues.filter((i) => i.blocking);
  const lines: string[] = [
    `# Gladius catalogue import — ${input.mode}`,
    "",
    `- **Source:** ${input.source}`,
    `- **Generated:** ${input.generatedAt.toISOString()}`,
    `- **Planned:** ${plan.categories.length} categories, ${plan.products.length} products, ${plan.modifierGroups.length} modifier groups, ${plan.modifiers.length} modifiers, ${plan.productModifierGroups.length} product↔group links`,
    `- **Blocking issues:** ${blocking.length} ${blocking.length ? "(apply is refused until resolved in the decisions file)" : ""}`,
    "",
  ];
  if (result) {
    lines.push("## Result", "", "| | created | updated | unchanged |", "|---|---|---|---|");
    for (const [k, v] of Object.entries(result)) lines.push(`| ${k} | ${v.created} | ${v.updated} | ${v.unchanged} |`);
    lines.push("");
  }
  const byCode = new Map<string, ImportIssue[]>();
  for (const i of plan.issues) byCode.set(i.code, [...(byCode.get(i.code) ?? []), i]);
  lines.push("## Items needing a decision or check", "");
  if (byCode.size === 0) lines.push("None.", "");
  for (const code of Object.keys(ISSUE_TITLES)) {
    const items = byCode.get(code);
    if (!items) continue;
    lines.push(`### ${ISSUE_TITLES[code]} — ${items.length}`, "", "| Gladius item | Name | Detail |", "|---|---|---|");
    for (const i of items) lines.push(`| ${cell(i.itemNum)} | ${cell(i.name)} | ${cell(i.message)} |`);
    lines.push("");
  }
  const routing = new Map<string, number>();
  for (const h of plan.stationHints) {
    const key = `kitchen ${h.kitchen ?? "-"} · printers ${h.printers.join("+") || "(none)"}`;
    routing.set(key, (routing.get(key) ?? 0) + 1);
  }
  lines.push("## Old kitchen routing (evidence for station mapping, Q-HW-3)", "", "| Gladius routing | Products |", "|---|---|");
  for (const [k, n] of [...routing.entries()].sort((a, b) => b[1] - a[1])) lines.push(`| ${cell(k)} | ${n} |`);
  lines.push("");
  return lines.join("\n");
}
