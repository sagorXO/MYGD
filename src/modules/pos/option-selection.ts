// Pure option-selection rules for the till's customise popup.
// [ADR] Context: the popup used a hardcoded list of extras that no longer exist on the menu.
// Decision: the popup renders each product's modifier groups from /api/menu and this module owns the rules
// (defaults, single vs multi choice, "make it a menu" side/drink, required groups).
// Consequence: changing options in the database changes the till with no code change.

import type { POSModifierSelection } from "./pos.schema";

export interface OptionGroup {
  readonly slug: string;
  readonly name: string;
  readonly minSelected: number;
  readonly maxSelected: number;
  readonly isRequired: boolean;
  readonly modifiers: readonly {
    readonly slug: string;
    readonly name: string;
    readonly priceAdjustment: number;
    readonly isDefault: boolean;
    readonly isAvailable?: boolean;
  }[];
}

/** group slug -> chosen option slugs */
export type Selection = Readonly<Record<string, readonly string[]>>;

const MENU_SIZE_GROUP = "make-it-a-menu";
const MENU_DEPENDENT_GROUPS: readonly string[] = ["menu-side", "menu-drink"];

const defaultsOf = (group: OptionGroup): string[] => group.modifiers.filter((m) => m.isDefault).map((m) => m.slug);

export function initialSelection(groups: readonly OptionGroup[]): Selection {
  const out: Record<string, string[]> = {};
  for (const g of groups) out[g.slug] = MENU_SIZE_GROUP === g.slug || MENU_DEPENDENT_GROUPS.includes(g.slug) ? [] : defaultsOf(g);
  return out;
}

const menuChosen = (selection: Selection): boolean => (selection[MENU_SIZE_GROUP] ?? []).length > 0;

export function visibleGroups(groups: readonly OptionGroup[], selection: Selection): OptionGroup[] {
  return groups.filter((g) => !MENU_DEPENDENT_GROUPS.includes(g.slug) || menuChosen(selection));
}

export function toggleOption(groups: readonly OptionGroup[], selection: Selection, groupSlug: string, optionSlug: string): Selection {
  const group = groups.find((g) => g.slug === groupSlug);
  if (!group || !group.modifiers.some((m) => m.slug === optionSlug)) return selection;
  const current = selection[groupSlug] ?? [];
  const chosen = current.includes(optionSlug);
  const mustKeepOne = group.isRequired || group.minSelected >= 1;

  let next: string[];
  if (group.maxSelected <= 1) {
    next = chosen ? (mustKeepOne ? [...current] : []) : [optionSlug];
  } else if (chosen) {
    next = current.filter((s) => s !== optionSlug);
    if (mustKeepOne && next.length < group.minSelected) next = [...current];
  } else {
    next = current.length >= group.maxSelected ? [...current] : [...current, optionSlug];
  }

  const out: Record<string, readonly string[]> = { ...selection, [groupSlug]: next };
  if (groupSlug === MENU_SIZE_GROUP) {
    for (const dep of groups.filter((g) => MENU_DEPENDENT_GROUPS.includes(g.slug))) {
      out[dep.slug] = next.length === 0 ? [] : (selection[dep.slug] ?? []).length > 0 ? selection[dep.slug] : defaultsOf(dep);
    }
  }
  return out;
}

/** Names of visible groups that still need a choice. */
export function validateSelection(groups: readonly OptionGroup[], selection: Selection): string[] {
  const missing: string[] = [];
  for (const g of visibleGroups(groups, selection)) {
    const required = g.isRequired || g.minSelected >= 1 || MENU_DEPENDENT_GROUPS.includes(g.slug);
    const min = required ? Math.max(1, g.minSelected) : g.minSelected;
    if ((selection[g.slug] ?? []).length < min) missing.push(g.name);
  }
  return missing;
}

function chosenOptions(groups: readonly OptionGroup[], selection: Selection) {
  return visibleGroups(groups, selection).flatMap((g) =>
    (selection[g.slug] ?? []).flatMap((slug) => {
      const option = g.modifiers.find((m) => m.slug === slug);
      return option ? [{ group: g, option }] : [];
    }),
  );
}

export function extrasTotal(groups: readonly OptionGroup[], selection: Selection): number {
  const cents = chosenOptions(groups, selection).reduce((sum, { option }) => sum + Math.round(option.priceAdjustment * 100), 0);
  return cents / 100;
}

export function toLineSelections(groups: readonly OptionGroup[], selection: Selection): {
  selectedSauces: string[];
  selectedAdditions: POSModifierSelection[];
} {
  const selectedSauces: string[] = [];
  const selectedAdditions: POSModifierSelection[] = [];
  for (const { group, option } of chosenOptions(groups, selection)) {
    if (group.slug.includes("sauce")) selectedSauces.push(option.name);
    else selectedAdditions.push({ id: `${group.slug}:${option.slug}`, name: option.name, type: "ADDITION", priceAdjustment: option.priceAdjustment, category: "EXTRA" });
  }
  return { selectedSauces, selectedAdditions };
}
