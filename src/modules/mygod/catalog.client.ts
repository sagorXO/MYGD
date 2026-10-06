// HTTP client for the DM catalog API: GET /v1/catalog?g=<group>&s=<store>.
//
// Rules from the contract (docs/integrations/mygod/PHASE0_PLAN.md §1 and the handbook):
//  - A failed read is an error, never an empty catalog. Callers keep their last good mapping.
//  - 401/403/400 are not retried. 429 honours Retry-After. 5xx, timeouts and network errors
//    are retriable.
//  - The response must be for the store and environment we asked about.
//  - Snapshot limit is 2 MiB.
//
// Secrets: the token is sent only in the Authorization header. Every message that can reach a
// log is built from fixed text; server-provided text is redacted before it is included.
import { catalogResponseSchema, errorEnvelopeSchema, type CatalogResponse } from "./catalog.schema";
import type { MygodCatalogConfig } from "./config";

export const CATALOG_MAX_BYTES = 2 * 1024 * 1024;
const ERROR_BODY_MAX_BYTES = 64 * 1024;
const MAX_RETRY_AFTER_MS = 60_000;
const MAX_BACKOFF_MS = 30_000;
const BASE_BACKOFF_MS = 1_000;
const DEFAULT_MAX_ATTEMPTS = 4;

export type CatalogErrorKind =
  | "auth"
  | "forbidden"
  | "invalid_params"
  | "rate_limited"
  | "unavailable"
  | "timeout"
  | "network"
  | "schema_mismatch"
  | "too_large"
  | "scope_mismatch"
  | "unexpected_status";

export interface CatalogErrorInit {
  readonly kind: CatalogErrorKind;
  readonly message: string;
  readonly retriable: boolean;
  readonly status?: number;
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;
  readonly issuePaths?: readonly string[];
}

export class CatalogError extends Error {
  readonly kind: CatalogErrorKind;
  readonly retriable: boolean;
  readonly status?: number;
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;
  readonly issuePaths?: readonly string[];

  constructor(init: CatalogErrorInit) {
    super(init.message);
    this.name = "CatalogError";
    this.kind = init.kind;
    this.retriable = init.retriable;
    if (init.status !== undefined) this.status = init.status;
    if (init.requestId !== undefined) this.requestId = init.requestId;
    if (init.retryAfterSeconds !== undefined) this.retryAfterSeconds = init.retryAfterSeconds;
    if (init.issuePaths !== undefined) this.issuePaths = init.issuePaths;
  }
}

export interface FetchCatalogOptions {
  readonly fetchFn?: typeof fetch;
  readonly maxBytes?: number;
}

export interface FetchCatalogRetryOptions extends FetchCatalogOptions {
  readonly maxAttempts?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  /** Returns a number in [0, 1). Injectable so tests are deterministic. */
  readonly jitter?: () => number;
}

/** Removes the token and any "Bearer <value>" text from a string that may reach a log. */
export function redactSecrets(text: string, token: string): string {
  const withoutToken = token ? text.split(token).join("[redacted]") : text;
  return withoutToken.replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
}

function tooLarge(limit: number): CatalogError {
  return new CatalogError({
    kind: "too_large",
    message: `The catalog response is larger than the ${limit} byte limit.`,
    retriable: false,
  });
}

async function readBodyBounded(response: Response, maxBytes: number): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) throw tooLarge(maxBytes);
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw tooLarge(maxBytes);
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
}

function parseRetryAfterSeconds(header: string | null): number | undefined {
  if (header === null) return undefined;
  const trimmed = header.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const seconds = Number(trimmed);
  return seconds >= 1 ? seconds : undefined;
}

async function errorForStatus(response: Response, token: string): Promise<CatalogError> {
  let requestId: string | undefined;
  let serverMessage: string | undefined;
  let commentId: string | undefined;
  try {
    const text = await readBodyBounded(response, ERROR_BODY_MAX_BYTES);
    const envelope = errorEnvelopeSchema.safeParse(JSON.parse(text));
    if (envelope.success) {
      requestId = envelope.data.request_id;
      serverMessage = envelope.data.message;
      commentId = envelope.data.comment_id;
    }
  } catch {
    // An unreadable error body is normal for gateway errors; the status alone decides the kind.
  }

  const status = response.status;
  const detail = [commentId, serverMessage].filter(Boolean).join(": ");
  const message = redactSecrets(`MyGOD catalog request failed (HTTP ${status})${detail ? ` ${detail}` : ""}`, token);
  const base = { message, status, ...(requestId !== undefined ? { requestId } : {}) };

  if (status === 401) return new CatalogError({ ...base, kind: "auth", retriable: false });
  if (status === 403) return new CatalogError({ ...base, kind: "forbidden", retriable: false });
  if (status === 400) return new CatalogError({ ...base, kind: "invalid_params", retriable: false });
  if (status === 429) {
    const retryAfterSeconds = parseRetryAfterSeconds(response.headers.get("retry-after"));
    return new CatalogError({
      ...base,
      kind: "rate_limited",
      retriable: true,
      ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
    });
  }
  if (status >= 500) return new CatalogError({ ...base, kind: "unavailable", retriable: true });
  return new CatalogError({ ...base, kind: "unexpected_status", retriable: false });
}

function transportError(error: unknown, timedOut: boolean, timeoutMs: number): CatalogError {
  if (error instanceof CatalogError) return error;
  if (timedOut) {
    return new CatalogError({ kind: "timeout", message: `The MyGOD catalog did not answer within ${timeoutMs} ms.`, retriable: true });
  }
  const name = error instanceof Error ? error.name : "unknown";
  return new CatalogError({ kind: "network", message: `Network error contacting the MyGOD catalog (${name}).`, retriable: true });
}

/** One attempt. Throws CatalogError on every failure; never returns a partial or empty fallback. */
export async function fetchCatalog(config: MygodCatalogConfig, options: FetchCatalogOptions = {}): Promise<CatalogResponse> {
  const fetchFn = options.fetchFn ?? fetch;
  const maxBytes = options.maxBytes ?? CATALOG_MAX_BYTES;
  const query = new URLSearchParams({ g: config.group, s: config.storeId });
  const url = `${config.catalogBaseUrl}/v1/catalog?${query.toString()}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.catalogTimeoutMs);
  try {
    let response: Response;
    try {
      response = await fetchFn(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${config.catalogToken}`, Accept: "application/json" },
        signal: controller.signal,
        // The token must never follow a redirect to another host.
        redirect: "error",
      });
    } catch (error) {
      throw transportError(error, controller.signal.aborted, config.catalogTimeoutMs);
    }

    if (response.status !== 200) throw await errorForStatus(response, config.catalogToken);

    let text: string;
    try {
      text = await readBodyBounded(response, maxBytes);
    } catch (error) {
      throw transportError(error, controller.signal.aborted, config.catalogTimeoutMs);
    }

    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new CatalogError({ kind: "schema_mismatch", message: "The catalog response is not valid JSON.", retriable: false, status: 200 });
    }

    const parsed = catalogResponseSchema.safeParse(json);
    if (!parsed.success) {
      const issuePaths = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".") || "(root)"))];
      throw new CatalogError({
        kind: "schema_mismatch",
        message: `The catalog response does not match contract dm.sagar.v1 (${issuePaths.length} problem path(s)).`,
        retriable: false,
        status: 200,
        issuePaths,
      });
    }

    const catalog = parsed.data;
    if (catalog.group !== config.group || catalog.store_id !== config.storeId || catalog.environment !== config.environment) {
      throw new CatalogError({
        kind: "scope_mismatch",
        message: "The catalog response is for a different store or environment than requested.",
        retriable: false,
        status: 200,
        requestId: catalog.request_id,
      });
    }
    return catalog;
  } finally {
    clearTimeout(timer);
  }
}

const defaultSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function delayBeforeRetry(error: CatalogError, attempt: number, jitter: () => number): number {
  if (error.kind === "rate_limited" && error.retryAfterSeconds !== undefined) {
    return Math.min(error.retryAfterSeconds * 1000, MAX_RETRY_AFTER_MS);
  }
  const backoff = Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS);
  return backoff + Math.floor(jitter() * 250);
}

/** Retries only retriable failures, with exponential backoff and jitter; honours Retry-After. */
export async function fetchCatalogWithRetry(
  config: MygodCatalogConfig,
  options: FetchCatalogRetryOptions = {}
): Promise<CatalogResponse> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const sleep = options.sleep ?? defaultSleep;
  const jitter = options.jitter ?? Math.random;

  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fetchCatalog(config, options);
    } catch (error) {
      if (!(error instanceof CatalogError) || !error.retriable || attempt >= maxAttempts) throw error;
      await sleep(delayBeforeRetry(error, attempt, jitter));
    }
  }
}
