// Suggests mappings from the DM catalog to our menu. Pure function: no I/O, no database writes.
//
// Everything produced here is only a SUGGESTION. A human confirms it (see mapping.review.ts);
// until then the order receiver treats the id as unmapped. Rules:
//  - ids are never split or inferred; labels are only used to propose a candidate for a human;
//  - an ambiguous match is reported, never guessed;
//  - a null DM price is "unknown", so it can support a name match but never a price match;
//  - DM text options have no counterpart in our menu model and are reported as unsupported.
import type { CatalogResponse } from "./catalog.schema";
import type { MappingEntityType } from "./mapping.repository";

export interface OurProduct {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly basePriceCents: number;
}

export interface OurModifier {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly priceAdjustmentCents: number;
}

export interface OurModifierGroup {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly modifiers: readonly OurModifier[];
}

export interface OurMenu {
  readonly products: readonly OurProduct[];
  readonly modifierGroups: readonly OurModifierGroup[];
}

export type SuggestionTarget = { readonly productId: string } | { readonly modifierGroupId: string } | { readonly modifierId: string };
export type SuggestionReason = "name+price" | "name" | "name+choices";
export type SuggestionConfidence = "high" | "medium";

export interface Suggestion {
  readonly entityType: MappingEntityType;
  readonly externalId: string;
  readonly externalLabel: string;
  readonly target: SuggestionTarget;
  readonly reason: SuggestionReason;
  readonly confidence: SuggestionConfidence;
}

export interface AmbiguousItem {
  readonly entityType: MappingEntityType;
  readonly externalId: string;
  readonly externalLabel: string;
  readonly candidates: readonly string[];
}

export interface UnmatchedExternal {
  readonly entityType: MappingEntityType;
  readonly externalId: string;
  readonly externalLabel: string;
}

export interface UnsupportedItem {
  readonly externalId: string;
  readonly externalLabel: string;
  readonly reason: "text_option";
}

export interface SuggestReport {
  readonly suggestions: readonly Suggestion[];
  readonly ambiguous: readonly AmbiguousItem[];
  readonly unmatchedExternal: readonly UnmatchedExternal[];
  readonly unsupported: readonly UnsupportedItem[];
  readonly unmatchedOurs: {
    readonly productIds: readonly string[];
    readonly modifierGroupIds: readonly string[];
    readonly modifierIds: readonly string[];
  };
  readonly counts: {
    readonly dmProducts: number;
    /** Option groups eligible for mapping. Text options are counted under `unsupported`. */
    readonly dmOptionGroups: number;
    readonly dmChoices: number;
    readonly suggested: number;
    readonly ambiguous: number;
    readonly unmatchedExternal: number;
    readonly unsupported: number;
  };
}

/** Case, diacritic, punctuation and spacing insensitive form of a label, for candidate matching only. */
export function normalizeLabel(label: string): string {
  return label
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const toCents = (euros: number): number => Math.round(euros * 100);

function indexByLabel<T>(items: readonly T[], labelOf: (item: T) => string): Map<string, T[]> {
  const index = new Map<string, T[]>();
  for (const item of items) {
    const key = normalizeLabel(labelOf(item));
    const bucket = index.get(key);
    if (bucket) bucket.push(item);
    else index.set(key, [item]);
  }
  return index;
}

const ENTITY_RANK: Record<MappingEntityType, number> = { PRODUCT: 0, OPTION_GROUP: 1, CHOICE: 2 };

function byEntityThenId<T extends { entityType: MappingEntityType; externalId: string }>(a: T, b: T): number {
  return ENTITY_RANK[a.entityType] - ENTITY_RANK[b.entityType] || (a.externalId < b.externalId ? -1 : a.externalId > b.externalId ? 1 : 0);
}

const sortedIds = (ids: Iterable<string>): string[] => [...ids].sort();

export function suggestMappings(catalog: CatalogResponse, menu: OurMenu): SuggestReport {
  const suggestions: Suggestion[] = [];
  const ambiguous: AmbiguousItem[] = [];
  const unmatchedExternal: UnmatchedExternal[] = [];
  const unsupported: UnsupportedItem[] = [];
  let dmOptionGroups = 0;
  let dmChoices = 0;

  const productsByName = indexByLabel(menu.products, (product) => product.name);
  const groupsByName = indexByLabel(menu.modifierGroups, (group) => group.name);

  for (const product of catalog.catalog.products) {
    const candidates = productsByName.get(normalizeLabel(product.name)) ?? [];
    const priceCents = toCents(product.price);
    const priceMatches = candidates.filter((candidate) => candidate.basePriceCents === priceCents);
    const chosen = candidates.length === 1 ? candidates[0] : priceMatches.length === 1 ? priceMatches[0] : undefined;

    if (chosen) {
      const priceAgrees = chosen.basePriceCents === priceCents;
      suggestions.push({
        entityType: "PRODUCT",
        externalId: product.id,
        externalLabel: product.name,
        target: { productId: chosen.id },
        reason: priceAgrees ? "name+price" : "name",
        confidence: priceAgrees ? "high" : "medium",
      });
    } else if (candidates.length === 0) {
      unmatchedExternal.push({ entityType: "PRODUCT", externalId: product.id, externalLabel: product.name });
    } else {
      ambiguous.push({
        entityType: "PRODUCT",
        externalId: product.id,
        externalLabel: product.name,
        candidates: candidates.map((candidate) => candidate.id),
      });
    }

    for (const option of product.options) {
      if (option.type.trim().toLowerCase() === "text") {
        unsupported.push({ externalId: option.product_id_option_id, externalLabel: option.title, reason: "text_option" });
        continue;
      }
      dmOptionGroups += 1;
      dmChoices += option.choices.length;

      const groupCandidates = groupsByName.get(normalizeLabel(option.title)) ?? [];
      const group = groupCandidates.length === 1 ? groupCandidates[0] : undefined;

      if (!group) {
        if (groupCandidates.length === 0) {
          unmatchedExternal.push({ entityType: "OPTION_GROUP", externalId: option.product_id_option_id, externalLabel: option.title });
        } else {
          ambiguous.push({
            entityType: "OPTION_GROUP",
            externalId: option.product_id_option_id,
            externalLabel: option.title,
            candidates: groupCandidates.map((candidate) => candidate.id),
          });
        }
        for (const choice of option.choices) {
          unmatchedExternal.push({ entityType: "CHOICE", externalId: choice.option_id_choice_id, externalLabel: choice.title });
        }
        continue;
      }

      const modifiersByName = indexByLabel(group.modifiers, (modifier) => modifier.name);
      const choicesLineUp = option.choices.length > 0 && option.choices.every((choice) => modifiersByName.has(normalizeLabel(choice.title)));
      suggestions.push({
        entityType: "OPTION_GROUP",
        externalId: option.product_id_option_id,
        externalLabel: option.title,
        target: { modifierGroupId: group.id },
        reason: choicesLineUp ? "name+choices" : "name",
        confidence: choicesLineUp ? "high" : "medium",
      });

      for (const choice of option.choices) {
        const modifierCandidates = modifiersByName.get(normalizeLabel(choice.title)) ?? [];
        const modifier = modifierCandidates.length === 1 ? modifierCandidates[0] : undefined;
        if (modifier) {
          const priceAgrees = choice.price !== null && toCents(choice.price) === modifier.priceAdjustmentCents;
          suggestions.push({
            entityType: "CHOICE",
            externalId: choice.option_id_choice_id,
            externalLabel: choice.title,
            target: { modifierId: modifier.id },
            reason: priceAgrees ? "name+price" : "name",
            confidence: priceAgrees ? "high" : "medium",
          });
        } else if (modifierCandidates.length === 0) {
          unmatchedExternal.push({ entityType: "CHOICE", externalId: choice.option_id_choice_id, externalLabel: choice.title });
        } else {
          ambiguous.push({
            entityType: "CHOICE",
            externalId: choice.option_id_choice_id,
            externalLabel: choice.title,
            candidates: modifierCandidates.map((candidate) => candidate.id),
          });
        }
      }
    }
  }

  const targetedProducts = new Set<string>();
  const targetedGroups = new Set<string>();
  const targetedModifiers = new Set<string>();
  for (const suggestion of suggestions) {
    if ("productId" in suggestion.target) targetedProducts.add(suggestion.target.productId);
    else if ("modifierGroupId" in suggestion.target) targetedGroups.add(suggestion.target.modifierGroupId);
    else targetedModifiers.add(suggestion.target.modifierId);
  }

  const unmatchedOurs = {
    productIds: sortedIds(menu.products.filter((product) => !targetedProducts.has(product.id)).map((product) => product.id)),
    modifierGroupIds: sortedIds(menu.modifierGroups.filter((group) => !targetedGroups.has(group.id)).map((group) => group.id)),
    modifierIds: sortedIds(
      menu.modifierGroups.flatMap((group) => group.modifiers).filter((modifier) => !targetedModifiers.has(modifier.id)).map((modifier) => modifier.id)
    ),
  };

  const sortedSuggestions = [...suggestions].sort(byEntityThenId);
  const sortedAmbiguous = [...ambiguous].sort(byEntityThenId);
  const sortedUnmatched = [...unmatchedExternal].sort(byEntityThenId);
  const sortedUnsupported = [...unsupported].sort((a, b) => (a.externalId < b.externalId ? -1 : a.externalId > b.externalId ? 1 : 0));

  return {
    suggestions: sortedSuggestions,
    ambiguous: sortedAmbiguous,
    unmatchedExternal: sortedUnmatched,
    unsupported: sortedUnsupported,
    unmatchedOurs,
    counts: {
      dmProducts: catalog.catalog.products.length,
      dmOptionGroups,
      dmChoices,
      suggested: sortedSuggestions.length,
      ambiguous: sortedAmbiguous.length,
      unmatchedExternal: sortedUnmatched.length,
      unsupported: sortedUnsupported.length,
    },
  };
}
