// MyGOD (Delivery Manager) integration — configuration.
//
// [ADR] Context: the same code must run on the cloud host (primary) and on a local/store
// host (backup). Decision: all deployment-specific values come from environment variables,
// validated once here; nothing else in the module reads process.env. Consequence: switching
// hosts is an env-file change, and a bad value fails loudly at start-up instead of at the
// first order.
//
// Secrets: the token is only ever held in memory and sent in the Authorization header.
// Error messages name the offending variable, never its value.
import { z } from "zod";

export type MygodEnvironment = "test" | "production";

export interface MygodCatalogConfig {
  /** HTTPS base URL of the DM catalog API, without a trailing slash. */
  readonly catalogBaseUrl: string;
  /** Bearer token with the catalog:read scope. Never log or echo it. */
  readonly catalogToken: string;
  readonly group: string;
  readonly storeId: string;
  readonly environment: MygodEnvironment;
  readonly catalogTimeoutMs: number;
}

export class MygodConfigError extends Error {
  readonly fields: readonly string[];

  constructor(fields: readonly string[]) {
    super(`Invalid MyGOD configuration. Check these environment variables: ${fields.join(", ")}`);
    this.name = "MygodConfigError";
    this.fields = fields;
  }
}

const MIN_TOKEN_LENGTH = 16;
export const DEFAULT_CATALOG_TIMEOUT_MS = 10_000;

function isSafeHttpsBaseUrl(value: string): boolean {
  if (value.includes("?") || value.includes("#")) return false;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "https:" && url.username === "" && url.password === "";
}

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

const envSchema = z.object({
  MYGOD_CATALOG_API_BASE_URL: z.string().refine(isSafeHttpsBaseUrl),
  MYGOD_CATALOG_API_TOKEN: z.string().min(MIN_TOKEN_LENGTH),
  MYGOD_STORE_GROUP: z.string().min(1),
  MYGOD_STORE_ID: z.string().min(1),
  MYGOD_ENVIRONMENT: z.enum(["test", "production"]),
  MYGOD_CATALOG_TIMEOUT_MS: z
    .string()
    .regex(/^[1-9]\d*$/)
    .optional(),
});

const ENV_KEYS = Object.keys(envSchema.shape);

/** Blank values count as missing; surrounding whitespace (common in .env files) is dropped. */
function pickEnv(env: Readonly<Record<string, string | undefined>>): Record<string, string | undefined> {
  const picked: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) {
    const trimmed = env[key]?.trim();
    picked[key] = trimmed ? trimmed : undefined;
  }
  return picked;
}

export function loadMygodCatalogConfig(env: Readonly<Record<string, string | undefined>>): MygodCatalogConfig {
  const parsed = envSchema.safeParse(pickEnv(env));
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    throw new MygodConfigError(fields);
  }
  const value = parsed.data;
  return {
    catalogBaseUrl: normalizeBaseUrl(value.MYGOD_CATALOG_API_BASE_URL),
    catalogToken: value.MYGOD_CATALOG_API_TOKEN,
    group: value.MYGOD_STORE_GROUP,
    storeId: value.MYGOD_STORE_ID,
    environment: value.MYGOD_ENVIRONMENT,
    catalogTimeoutMs: value.MYGOD_CATALOG_TIMEOUT_MS ? Number(value.MYGOD_CATALOG_TIMEOUT_MS) : DEFAULT_CATALOG_TIMEOUT_MS,
  };
}

/** Safe one-line summary for logs and CLI output. Never includes the token. */
export function describeMygodConfig(config: MygodCatalogConfig): string {
  return [
    `base=${config.catalogBaseUrl}`,
    `group=${config.group}`,
    `store=${config.storeId}`,
    `environment=${config.environment}`,
    `timeout=${config.catalogTimeoutMs}ms`,
    "token=[set]",
  ].join(" ");
}
