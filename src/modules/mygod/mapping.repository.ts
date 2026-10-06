// Catalog mapping model: DM id (product / option group / choice) -> our Product / ModifierGroup / Modifier.
//
// [ADR] Context: DM option groups are per product (id "P001_O01") while our ModifierGroup rows are
// shared across products, so many DM ids map to one of ours. Decision: one row per DM id, the id kept
// verbatim as text (never split, never matched by label at order time), many-to-one allowed.
// Consequence: an order line is importable only if every id on it has a CONFIRMED row.
//
// The invariants below are enforced here (for every repository implementation) AND mirrored as CHECK
// constraints in prisma/sql/mygod-phase1.sql, so a bad row cannot enter by either path.

export type MappingEntityType = "PRODUCT" | "OPTION_GROUP" | "CHOICE";
export type MappingStatus = "SUGGESTED" | "CONFIRMED" | "REJECTED";
export type MappingEnvironment = "test" | "production";

export interface MappingScope {
  readonly source: "dm";
  readonly environment: MappingEnvironment;
  readonly storeGroup: string;
  readonly storeId: string;
}

export interface MappingKey {
  readonly scope: MappingScope;
  readonly entityType: MappingEntityType;
  readonly externalId: string;
}

export interface MappingInput extends MappingKey {
  readonly externalLabel: string | null;
  readonly catalogRevision: string | null;
  readonly status: MappingStatus;
  readonly productId?: string | null;
  readonly modifierGroupId?: string | null;
  readonly modifierId?: string | null;
  readonly suggestedReason?: string | null;
  readonly confirmedBy?: string | null;
  readonly confirmedAt?: Date | null;
}

export interface MappingRecord extends MappingKey {
  readonly id: string;
  readonly externalLabel: string | null;
  readonly catalogRevision: string | null;
  readonly status: MappingStatus;
  readonly productId: string | null;
  readonly modifierGroupId: string | null;
  readonly modifierId: string | null;
  readonly suggestedReason: string | null;
  readonly confirmedBy: string | null;
  readonly confirmedAt: Date | null;
}

export interface MappingRepository {
  find(key: MappingKey): Promise<MappingRecord | null>;
  list(scope: MappingScope): Promise<MappingRecord[]>;
  /** Upsert by (scope, entityType, externalId). Must call assertMappingInvariants first. */
  put(input: MappingInput): Promise<MappingRecord>;
}

export class MappingInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MappingInvariantError";
  }
}

const TARGET_FIELDS = ["productId", "modifierGroupId", "modifierId"] as const;
type TargetField = (typeof TARGET_FIELDS)[number];

const EXPECTED_TARGET: Record<MappingEntityType, TargetField> = {
  PRODUCT: "productId",
  OPTION_GROUP: "modifierGroupId",
  CHOICE: "modifierId",
};

export function expectedTargetField(entityType: MappingEntityType): TargetField {
  return EXPECTED_TARGET[entityType];
}

export function assertMappingInvariants(input: MappingInput): void {
  const label = `${input.entityType} ${input.externalId}`;
  const expected = EXPECTED_TARGET[input.entityType];

  for (const field of TARGET_FIELDS) {
    const value = input[field];
    if (value === undefined || value === null) continue;
    if (field !== expected) {
      throw new MappingInvariantError(`${label}: ${field} must be empty for a ${input.entityType} mapping.`);
    }
    if (value.length === 0) {
      throw new MappingInvariantError(`${label}: ${field} must not be an empty string.`);
    }
  }

  const target = input[expected];
  const hasTarget = typeof target === "string" && target.length > 0;
  if ((input.status === "SUGGESTED" || input.status === "CONFIRMED") && !hasTarget) {
    throw new MappingInvariantError(`${label}: a ${input.status} mapping needs a ${expected}.`);
  }

  if (input.status === "CONFIRMED") {
    if (typeof input.confirmedBy !== "string" || input.confirmedBy.trim().length === 0) {
      throw new MappingInvariantError(`${label}: a CONFIRMED mapping needs confirmedBy.`);
    }
    if (!(input.confirmedAt instanceof Date) || Number.isNaN(input.confirmedAt.getTime())) {
      throw new MappingInvariantError(`${label}: a CONFIRMED mapping needs confirmedAt.`);
    }
  }
}

export function scopeKey(scope: MappingScope): string {
  return JSON.stringify([scope.source, scope.environment, scope.storeGroup, scope.storeId]);
}

export function sameScope(a: MappingScope, b: MappingScope): boolean {
  return scopeKey(a) === scopeKey(b);
}

export function mappingKeyString(key: MappingKey): string {
  return JSON.stringify([scopeKey(key.scope), key.entityType, key.externalId]);
}
