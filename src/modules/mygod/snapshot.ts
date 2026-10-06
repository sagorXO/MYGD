// Private on-disk snapshots of the DM catalog.
//
// The catalog is real MyGOD data (products, option ids, prices): not a secret, but not for the
// repository either. Snapshots live under a git-ignored folder (.import-work/mygod/), the
// directory is owner-only (0700) and each file owner-only (0600).
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { catalogResponseSchema, type CatalogResponse } from "./catalog.schema";

const FILE_PATTERN = /^catalog-.+-(\d{8}T\d{6}Z)\.json$/;

function timestamp(now: Date): string {
  return now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

/** Keeps the revision readable but guarantees it cannot add a path segment. */
function safeRevision(revision: string): string {
  const cleaned = revision
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 64);
  return cleaned || "unknown";
}

export function saveCatalogSnapshot(dir: string, catalog: CatalogResponse, options: { now?: Date } = {}): string {
  const now = options.now ?? new Date();
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
  const path = join(dir, `catalog-${safeRevision(catalog.catalog_revision)}-${timestamp(now)}.json`);
  writeFileSync(path, `${JSON.stringify(catalog, null, 2)}\n`, { mode: 0o600 });
  chmodSync(path, 0o600);
  return path;
}

export interface LoadedCatalogSnapshot {
  readonly path: string;
  readonly catalog: CatalogResponse;
}

export function loadLatestCatalogSnapshot(dir: string): LoadedCatalogSnapshot {
  const candidates = existsSync(dir)
    ? readdirSync(dir)
        .map((name) => ({ name, stamp: FILE_PATTERN.exec(name)?.[1] }))
        .filter((entry): entry is { name: string; stamp: string } => entry.stamp !== undefined)
        .sort((a, b) => a.stamp.localeCompare(b.stamp))
    : [];
  const latest = candidates.at(-1);
  if (!latest) {
    throw new Error(`No catalog snapshot found in ${dir}. Run "npm run mygod:catalog" first.`);
  }

  const path = join(dir, latest.name);
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(`Catalog snapshot ${latest.name} is invalid: not readable JSON.`);
  }
  const parsed = catalogResponseSchema.safeParse(json);
  if (!parsed.success) {
    const paths = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".") || "(root)"))].join(", ");
    throw new Error(`Catalog snapshot ${latest.name} is invalid: ${paths}`);
  }
  return { path, catalog: parsed.data };
}
