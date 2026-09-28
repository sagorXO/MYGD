# MYGD — Phase 0 Decision Record

**Date:** 28 September 2026
**Plan:** MYGD Remediation & Hardening Plan v1.0 (`Documents/Remediation/MYGD_Remediation_Plan_v1.0.md`)
**Branch:** `remediation/phase-0`
**Status:** D-1 decided. D-2 decided as (b), pending owner sign-off (Sagar) before WU-7 starts.

Phase 0 changes no application code. It records two decisions and the evidence
behind them, so Phases 1–4 build on a fixed shape.

---

## D-1 — Canonical codebase 🔴

### Decision

**One Next.js app rooted at `src/`.** Everything else in the table below is
deleted in WU-12. `prisma/schema.prisma` is the only schema.

### Evidence (verified 28 Sep 2026, commit `cd205cb`)

| Path | Finding | Action in WU-12 |
|---|---|---|
| `src/` | Complete app: 21 API routes, 12 pages, all modules. `next build` passes from root. | **Keep — canonical** |
| `apps/edge/src/` | 44 files; 33 identical to `src/`, **11 already differ**. No file exists only in `apps/edge`. | Delete |
| `apps/{boards,hq,kds,order,pos,staff}/` | Config files only (`package.json`, `next.config.mjs`, tailwind, tsconfig). No source. | Delete |
| `components/` (root) | 6 components. **Zero imports** from `src/` or `tests/`. | Delete |
| `packages/db/prisma/schema.prisma` | Byte-identical to `prisma/schema.prisma` today — a drift trap, not a second source. | Delete |
| `packages/db/src/sync-engine.ts` | The only code that ever writes `SyncQueue`. **Never imported.** | Delete; salvage the backoff logic into WU-7 |
| `packages/{printing,types,ui}` | **Zero `@mygd/*` imports** anywhere in `src/`, `tests/`, `prisma/`, `scripts/`. `tailwind.config.ts` does not use the `ui` preset. `src/modules/printer` duplicates `packages/printing`. | Delete all three |
| `tsconfig.json` `paths` for `@mygd/*` | Point at the packages above. They also pull `apps/edge` into `tsc`, which is why type-check reports errors from a copy that never ships. | Remove |
| `package.json` `workspaces`, `turbo.json`, `turbo` devDep, `db:*` scripts via `turbo run` | `build` is plain `next build`; the `db:*` scripts delegate to workspaces that have no `db:*` tasks wired to the real schema. | Replace with direct `prisma` scripts; remove turbo |
| `prisma/data/kiosk_pos.db*` | Untracked, gitignored SQLite leftovers (3.5 MB). Datasource is Postgres. | Delete from disk |
| `initializeDatabasePragmas()` in `src/lib/prisma.ts` | No-op on Postgres; called from 7 route files. | Remove function and call sites |

Also found during verification, fixed inside WU-12 as part of the collapse:

- `src/lib/printer.service.ts` is a second printer service used only by
  `tests/printer-service.test.mjs`; production code uses `src/modules/printer/`.
  One of them goes.

### Rejected alternative

Completing the monorepo split — about a week of work for no benefit on a
single edge server.

---

## D-2 — Offline model 🔴

### Decision

**(b) Scoped offline:** cash-only capture during a WAN outage, queued on disk,
reconciled exactly once on reconnect. Card (Link4Pay) and Shopify are disabled
with a clear message while offline.

### Evidence

- The PRD (§2, "100% In-Store Offline Autonomy") and the Technical Architecture
  (v3.3, Layer 2) describe an embedded **SQLite** database on the edge PC.
  The code has none of that: `DATABASE_URL` points at **Supabase (cloud)**
  through the transaction pooler. A dropped WAN link therefore takes the
  database down with it — today *nothing* works offline, cash included.
- `SyncQueue` is declared in the schema and written by nothing in `src/`.
- `tests/offlineSyncQueue.test.mjs` defines `MockSyncQueue` inside the test and
  asserts against it. It exercises no application code.
- The architecture doc marks "WU-8 Offline Sync Queue" as 🟢 COMPLETE. That is
  not accurate and is corrected in WU-15.

### What (b) means for WU-7 — refinement to the plan

Because the primary database is in the cloud, the plan's step 1 ("write every
order to `SyncQueue` in the creating transaction") cannot capture outage
orders: that transaction cannot run when the database is unreachable. WU-7 is
therefore built as:

1. **On-disk capture journal** on the edge server (append-only, fsync'd). When
   the DB health check fails, cash orders go here, the kitchen chit prints over
   the LAN (TCP 9100 needs no WAN), and the drawer kicks. Survives process kill.
2. **Replay worker** drains the journal through the same shared order service
   as every other channel (WU-2), keyed by journal entry id, so reconnect
   produces each order exactly once — with correct VAT split, stock deduction
   and a real ticket number.
3. **Connectivity monitor** + degraded-mode banner on POS, kiosk and KDS.
   Card, QR and Shopify are refused with a message, not a spinner.
4. **`SyncQueue` outbox** is kept for the upgrade path to (a): it only becomes
   meaningful when the edge runs its own Postgres and syncs to cloud HQ.
   It is written only when a sync target is configured.

Provisional offline ticket numbers are printed as `OFF-###`; the real
store-wide number is allocated at replay and the provisional number is kept on
the order for reconciliation.

### Consequences to act on

- **PRD amendment (WU-15):** replace "100% offline autonomy" with the scoped
  statement above. Tell Rico before go-live, not after.
- Shopify POS orders never arrive offline under any option — webhooks
  originate in Shopify's cloud.
- If the client later needs card payments offline, that is option (a):
  local Postgres on the edge PC plus the outbox. The `postgres-local` service
  already sketched in `docker-compose.yml` is the starting point.

### Rejected alternatives

- **(a) Full offline** — 5–8 days, rebuilds the data layer, still cannot
  deliver Shopify orders offline. Revisit post-launch if card-offline is
  required.
- **(c) Drop the claim** — a WAN drop during service would stop cash sales
  entirely. Not acceptable for a single-site restaurant.

---

## Additional findings raised by Phase 0 (need a decision, not blocking Phase 1)

### F-1 — Prisma engine / test database (recommend decide before WU-13)

WU-13 requires integration tests against a real Postgres. The native Prisma
engines are fetched from `binaries.prisma.sh` at install time; in the build
sandbox (and possibly on CI) that host is blocked, and the Mac's
`node_modules` only contains `darwin-arm64` engines — the Linux VM and the
`node:20-alpine` Docker image need different binaries.

Recommendation: switch the generator to Prisma's Rust-free client
(`engineType = "client"`, GA since Prisma 6.16) with `@prisma/adapter-pg`.
No native binaries, identical query API, works on the Mac, Linux, Alpine and
CI. Verified in the sandbox that the schema DDL can be generated this way.
Cost: ~1 hour, touches `schema.prisma` generator block, `src/lib/prisma.ts`,
`package.json`.

### F-2 — Secrets already in the repository (WU-14, do soon)

- `docker-compose.yml` contains a database password in `DATABASE_URL`.
- `.env.example` contains the live Supabase project ref and `ADMIN_DEFAULT_PIN`.
- `src/lib/timeclock-engine.ts` holds a **plaintext staff PIN roster** that the
  timeclock authenticates against — separate from the bcrypt PINs in
  `AdminUser`. WU-6/WU-9 must retire it.
- `.env` and `.env.local` are gitignored and not in current history — confirm
  with `git log --all -- .env .env.local` on the Mac before closing WU-14.
  Rotate the Supabase password regardless, since it is in `docker-compose.yml`.

### F-3 — Broken UI calls found while mapping order paths

`StaffHaccpHub` posts to `/api/staff` and `/api/checklists`; neither route
exists (the real ones are `/api/staff/timeclock` and `/api/checklists/log`).
Staff clock-in and HACCP logging from that screen currently fail. Fold into
WU-9. Also: `/admin` has **no login gate at all** — covered by WU-5.

### F-4 — Baseline

- `next build`: passes (Next 15.5.23).
- `tsc --noEmit`: 52 errors, mostly implicit-any in the Prisma callbacks and
  the `apps/edge` copy; drops after WU-12 removes the copy.
- Test suite: 78 of 83 pass in the Linux sandbox. Failing:
  `haccp-statutory` and four `inventory-engine` tests. On the Mac's Linux VM
  58 fail because `node_modules` holds macOS-only native binaries — run tests
  on the Mac itself, not the VM.

---

## Sign-off

| Decision | Owner | Status |
|---|---|---|
| D-1 single app at `src/` | Sagar | Decided |
| D-2 option (b) | Sagar | Decided — confirm before WU-7 |
| F-1 Rust-free Prisma client | Sagar | Open |
| Tell Rico about the offline scope | Sagar | Before go-live |
