// Zod schemas for the DM catalog API (contract dm.sagar.v1, release 0.2.3).
// Source of truth: docs/integrations/mygod/vendor/openapi.json (CatalogResponse and children).
//
// [ADR] Context: the contract marks every object additionalProperties:false.
// Decision: the schemas are .strict(), so a contract change surfaces as a typed
// schema_mismatch (with the offending paths) instead of silently dropping fields.
// Consequence: a DM release that adds a field needs a deliberate schema update here.
//
// Null semantics are part of the contract: a null price or availability means "unknown",
// never 0 or "available". The types below keep null, and callers must not coerce it.
import { z } from "zod";

const nonBlank = z.string().min(1).regex(/\S/);

export const catalogChoiceSchema = z
  .object({
    id: nonBlank,
    /** Canonical full choice identity used in orders. Never split it. */
    option_id_choice_id: nonBlank,
    title: nonBlank,
    is_preselected: z.boolean(),
    price: z.number().nullable(),
    available: z.boolean().nullable(),
  })
  .strict();

export const catalogOptionSchema = z
  .object({
    id: nonBlank,
    /** Canonical full option-group identity used in orders. Never split it. */
    product_id_option_id: nonBlank,
    title: nonBlank,
    type: nonBlank,
    is_require: z.boolean(),
    min_selected: z.number().int().min(0).nullable(),
    max_selected: z.number().int().min(0).nullable(),
    choices: z.array(catalogChoiceSchema),
  })
  .strict();

export const catalogProductSchema = z
  .object({
    /** DM product identity; equals dm_product_id on order lines. */
    id: nonBlank,
    name: nonBlank,
    price: z.number().min(0),
    available: z.boolean().nullable(),
    options: z.array(catalogOptionSchema),
  })
  .strict();

export const catalogCategorySchema = z
  .object({
    id: nonBlank,
    name: nonBlank,
    products: z.array(nonBlank),
  })
  .strict();

export const catalogResponseSchema = z
  .object({
    success: z.literal(true),
    schema_version: z.literal("dm.sagar.v1"),
    group: nonBlank,
    store_id: nonBlank,
    environment: z.enum(["test", "production"]),
    generated_at: z.string().datetime({ offset: true }),
    catalog_revision: nonBlank,
    currency: z.literal("EUR"),
    catalog: z
      .object({
        products: z.array(catalogProductSchema),
        categories: z.array(catalogCategorySchema),
      })
      .strict(),
    request_id: nonBlank,
  })
  .strict();

/** Lenient view of DM's error envelope: only used to pull out a request id and a message. */
export const errorEnvelopeSchema = z
  .object({
    comment_id: z.string(),
    message: z.string(),
    request_id: z.string(),
    retriable: z.boolean(),
    next_steps: z.array(z.string()),
  })
  .partial();

export type CatalogChoice = z.infer<typeof catalogChoiceSchema>;
export type CatalogOption = z.infer<typeof catalogOptionSchema>;
export type CatalogProduct = z.infer<typeof catalogProductSchema>;
export type CatalogCategory = z.infer<typeof catalogCategorySchema>;
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;
