// Review-file workflow for catalog mappings: suggest -> a human edits the file -> import.
//
// [ADR] Context: only a person may decide that a DM id means one of our products; a wrong mapping
// sells the wrong item. Decision: suggestions are written to a JSON review file; the operator flips
// entries to CONFIRMED (adding confirmedBy) or REJECTED, then applies the file. Applying validates
// the whole file first and writes nothing if any entry is invalid.
// Consequence: nothing becomes CONFIRMED without a named person; re-running suggestions never
// downgrades a confirmed mapping or revives a rejected one.
//
// This module has no access to products, prices or modifiers: it can only write mapping rows.
import { z } from "zod";
import type { CatalogResponse } from "./catalog.schema";
import {
  assertMappingInvariants,
  MappingInvariantError,
  sameScope,
  type MappingInput,
  type MappingKey,
  type MappingRecord,
  type MappingRepository,
  type MappingScope,
} from "./mapping.repository";
import type { SuggestReport } from "./mapping.suggest";

const nonBlank = z.string().min(1).regex(/\S/);

const scopeSchema = z
  .object({
    source: z.literal("dm"),
    environment: z.enum(["test", "production"]),
    storeGroup: nonBlank,
    storeId: nonBlank,
  })
  .strict();

const targetSchema = z
  .object({
    productId: z.string().min(1).optional(),
    modifierGroupId: z.string().min(1).optional(),
    modifierId: z.string().min(1).optional(),
  })
  .strict();

const entrySchema = z
  .object({
    entityType: z.enum(["PRODUCT", "OPTION_GROUP", "CHOICE"]),
    externalId: nonBlank,
    externalLabel: z.string(),
    target: targetSchema,
    reason: z.string(),
    confidence: z.enum(["high", "medium", "manual"]),
    status: z.enum(["SUGGESTED", "CONFIRMED", "REJECTED"]),
    confirmedBy: z.string().optional(),
  })
  .strict();

export const reviewFileSchema = z
  .object({
    version: z.literal(1),
    scope: scopeSchema,
    catalogRevision: z.string(),
    generatedAt: z.string(),
    entries: z.array(entrySchema),
    /** Informational: DM ids with no suggestion. Add a manual entry above to map one. */
    notes: z
      .object({
        ambiguous: z.array(z.unknown()),
        unmatchedExternal: z.array(z.unknown()),
        unsupported: z.array(z.unknown()),
      })
      .strict()
      .optional(),
  })
  .strict();

export type ReviewFile = z.infer<typeof reviewFileSchema>;
export type ReviewEntry = z.infer<typeof entrySchema>;

export class ReviewValidationError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(`The mapping review file is not valid (${problems.length} problem(s)): ${problems.slice(0, 5).join("; ")}`);
    this.name = "ReviewValidationError";
    this.problems = problems;
  }
}

export interface BuildReviewOptions {
  readonly scope: MappingScope;
  readonly catalog: CatalogResponse;
  readonly now: Date;
}

export function buildReviewFile(report: SuggestReport, options: BuildReviewOptions): ReviewFile {
  return {
    version: 1,
    scope: { ...options.scope },
    catalogRevision: options.catalog.catalog_revision,
    generatedAt: options.now.toISOString(),
    entries: report.suggestions.map((suggestion) => ({
      entityType: suggestion.entityType,
      externalId: suggestion.externalId,
      externalLabel: suggestion.externalLabel,
      target: { ...suggestion.target },
      reason: suggestion.reason,
      confidence: suggestion.confidence,
      status: "SUGGESTED" as const,
    })),
    notes: {
      ambiguous: [...report.ambiguous],
      unmatchedExternal: [...report.unmatchedExternal],
      unsupported: [...report.unsupported],
    },
  };
}

function toInput(entry: ReviewEntry, review: ReviewFile, now: Date): MappingInput {
  return {
    scope: review.scope,
    entityType: entry.entityType,
    externalId: entry.externalId,
    externalLabel: entry.externalLabel,
    catalogRevision: review.catalogRevision,
    status: entry.status,
    productId: entry.target.productId ?? null,
    modifierGroupId: entry.target.modifierGroupId ?? null,
    modifierId: entry.target.modifierId ?? null,
    suggestedReason: entry.reason,
    confirmedBy: entry.status === "CONFIRMED" ? (entry.confirmedBy?.trim() ?? null) : null,
    confirmedAt: entry.status === "CONFIRMED" ? now : null,
  };
}

function entryProblems(entry: ReviewEntry, review: ReviewFile, now: Date): string[] {
  const label = `${entry.entityType} ${entry.externalId}`;
  if (entry.status === "CONFIRMED" && (entry.confirmedBy === undefined || entry.confirmedBy.trim() === "")) {
    return [`${label}: CONFIRMED needs confirmedBy (who approved this mapping).`];
  }
  try {
    assertMappingInvariants(toInput(entry, review, now));
    return [];
  } catch (error) {
    if (error instanceof MappingInvariantError) return [error.message];
    throw error;
  }
}

function sameTarget(record: MappingRecord, input: MappingInput): boolean {
  return (
    record.productId === (input.productId ?? null) &&
    record.modifierGroupId === (input.modifierGroupId ?? null) &&
    record.modifierId === (input.modifierId ?? null)
  );
}

export interface ReviewApplyResult {
  readonly created: number;
  readonly updated: number;
  readonly unchanged: number;
  readonly confirmed: number;
  readonly rejected: number;
  readonly preservedConfirmed: number;
}

export interface ApplyReviewOptions {
  /** The store/environment this process is configured for. A review for another scope is refused. */
  readonly scope: MappingScope;
  readonly now: Date;
}

export async function applyMappingReview(raw: unknown, repo: MappingRepository, options: ApplyReviewOptions): Promise<ReviewApplyResult> {
  const parsed = reviewFileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ReviewValidationError(parsed.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`));
  }
  const review = parsed.data;

  const problems: string[] = [];
  if (!sameScope(review.scope, options.scope)) {
    problems.push("The review file is for a different store or environment than this process is configured for.");
  }
  for (const entry of review.entries) problems.push(...entryProblems(entry, review, options.now));
  if (problems.length > 0) throw new ReviewValidationError(problems);

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let confirmed = 0;
  let rejected = 0;
  let preservedConfirmed = 0;

  for (const entry of review.entries) {
    const input = toInput(entry, review, options.now);
    const key: MappingKey = { scope: input.scope, entityType: input.entityType, externalId: input.externalId };
    const existing = await repo.find(key);

    if (entry.status === "SUGGESTED") {
      if (existing?.status === "CONFIRMED") {
        preservedConfirmed += 1;
        continue;
      }
      if (existing && (existing.status === "REJECTED" || existing.status === "SUGGESTED") && sameTarget(existing, input)) {
        unchanged += 1;
        continue;
      }
    } else if (entry.status === "CONFIRMED") {
      if (existing?.status === "CONFIRMED" && sameTarget(existing, input) && existing.confirmedBy === input.confirmedBy) {
        unchanged += 1;
        continue;
      }
    } else if (existing?.status === "REJECTED" && sameTarget(existing, input)) {
      unchanged += 1;
      continue;
    }

    await repo.put(input);
    if (existing) updated += 1;
    else created += 1;
    if (entry.status === "CONFIRMED") confirmed += 1;
    if (entry.status === "REJECTED") rejected += 1;
  }

  return { created, updated, unchanged, confirmed, rejected, preservedConfirmed };
}

/** The only way the order receiver may look a mapping up: SUGGESTED and REJECTED rows never resolve. */
export async function getConfirmedMapping(repo: MappingRepository, key: MappingKey): Promise<MappingRecord | null> {
  const record = await repo.find(key);
  return record?.status === "CONFIRMED" ? record : null;
}
