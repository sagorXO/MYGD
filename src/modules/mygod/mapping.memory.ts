// In-memory MappingRepository. Used by unit tests, dry runs and the offline order rehearsal (OFF-xx),
// so those never need a database. It enforces the same invariants as the real repository.
import {
  assertMappingInvariants,
  mappingKeyString,
  scopeKey,
  type MappingInput,
  type MappingKey,
  type MappingRecord,
  type MappingRepository,
  type MappingScope,
} from "./mapping.repository";

const ENTITY_ORDER = { PRODUCT: 0, OPTION_GROUP: 1, CHOICE: 2 } as const;

function copyRecord(record: MappingRecord): MappingRecord {
  return {
    ...record,
    scope: { ...record.scope },
    confirmedAt: record.confirmedAt ? new Date(record.confirmedAt) : null,
  };
}

export function createInMemoryMappingRepository(): MappingRepository {
  const rows = new Map<string, MappingRecord>();
  let sequence = 0;

  return {
    async find(key: MappingKey): Promise<MappingRecord | null> {
      const row = rows.get(mappingKeyString(key));
      return row ? copyRecord(row) : null;
    },

    async list(scope: MappingScope): Promise<MappingRecord[]> {
      const wanted = scopeKey(scope);
      return [...rows.values()]
        .filter((row) => scopeKey(row.scope) === wanted)
        .sort((a, b) => ENTITY_ORDER[a.entityType] - ENTITY_ORDER[b.entityType] || (a.externalId < b.externalId ? -1 : a.externalId > b.externalId ? 1 : 0))
        .map(copyRecord);
    },

    async put(input: MappingInput): Promise<MappingRecord> {
      assertMappingInvariants(input);
      const key = mappingKeyString(input);
      const existing = rows.get(key);
      sequence += 1;
      const record: MappingRecord = {
        id: existing?.id ?? `map_${sequence}`,
        scope: { ...input.scope },
        entityType: input.entityType,
        externalId: input.externalId,
        externalLabel: input.externalLabel ?? null,
        catalogRevision: input.catalogRevision ?? null,
        status: input.status,
        productId: input.productId ?? null,
        modifierGroupId: input.modifierGroupId ?? null,
        modifierId: input.modifierId ?? null,
        suggestedReason: input.suggestedReason ?? null,
        confirmedBy: input.confirmedBy ?? null,
        confirmedAt: input.confirmedAt ? new Date(input.confirmedAt) : null,
      };
      rows.set(key, record);
      return copyRecord(record);
    },
  };
}
