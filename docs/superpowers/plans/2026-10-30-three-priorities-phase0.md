# MYGD: three priorities (POS paused). Phase 0 plan

> **Status:** PLAN ONLY, 30 Oct 2026. No production code written. Waiting for Sagar's approval and answers to the open questions (section 6).
> **Scope:** (1) portrait-screen ads, (2) shift checklists, (3) order time target on the kitchen monitor.
> **Out of scope:** POS checkout, receipts, invoices, credit notes, void/refund, VAT ledger, day close/Z, any Gladius link, stock/BOM depletion, suppliers, scheduling, reporting, Limassol, Shopify.

## 1. Repo state (checked 30 Oct 2026)

| Check | Result |
|---|---|
| This worktree (`claude/mygd-three-priorities-55562e`, base `72d0534`) | Clean. **2 commits ahead, 9 behind `origin/main` (`88b024e`).** The 2 local commits are merges whose content is already in `origin/main`: `git merge-tree HEAD origin/main` gives a tree identical to `origin/main`. |
| Proposed fix before Phase 1 | Reset this branch to `origin/main`. This loses nothing, but it rewrites the branch, so it needs Sagar's OK. |
| `origin/main` baseline (run in a scratch worktree) | `npm test` **414/414 pass**; `tsc --noEmit` **0 errors**; `next build` **succeeds**. |
| Main checkout (`feat/ui-kiosk`) | `README.md` modified; `docs/COMPLETION_PLAN.md` untracked. |
| Other worktrees with uncommitted work | `gladius-legacy-features-26ec7d`: 41 files, incl. `src/app/api/admin/menu/route.ts`. `mygod-kiosk-integration-5abb20`: 22 files, incl. `docs/integrations/mygod/SYSTEM_DESIGN.md` and the Prisma Migrate baseline. |
| Protected files | `DESIGN.md`, `Menu/*`, `prisma/seed.ts`, `Gallery.tsx` and `src/app/layout.tsx` are **not** uncommitted in any worktree I can see. They will not be touched either way. |
| Prisma | `origin/main` has **no `prisma/migrations/`** (`db push` only). The Migrate baseline exists only uncommitted in the kiosk worktree, so "show the migration SQL" needs a decision (Q-GEN-2). |

### Findings that shape the plan
- `/boards` **redirects to ScreenyPro** (`aba38ed`): the menu TVs already run a hosted signage service. The in-app board (`src/modules/signage`) is kept but unused.
- `MenuBoardConfig` allows screens 1–7. `/api/menuboards` seeds 7 configs, but the SOW says 4.
- `/staff`'s HACCP form POSTs to `/api/checklists` (404). The real routes are `/api/checklists/log` and `/api/checklists/template`, and nothing calls them. No route saves `HaccpLog`.
- There are two HACCP validators: `src/lib/haccp-validator.ts` and `HACCPService.validateTemperature`.
- `ChecklistTemplate.tasksJson` and `ChecklistLog.logsJson` are JSON strings: nothing is per item, and nothing records who ticked what.
- KDS thresholds are hard-coded **and disagree**: `KDSTablet.tsx` uses 4/8 min, `src/ui/domain/OrderTicket.tsx` uses 5/8 min.
- `KitchenTicket` and `Order` need `terminalId`, a product FK per item, VAT and payment fields. That makes them fiscal/POS shaped and unsuitable for DM orders.
- The DM contract is in the repo: `docs/integrations/mygod/vendor/openapi.json` (Sagar Bridge 0.2.3: `POST /v1/orders`, `POST /v1/orders/{order_uid}/status`, Idempotency-Key required). **`claude/integrations/mygod-claude-code-prompt.md` is not in the repo or on disk** (Q-DM-A).
- Brain lesson (7 Oct): "the kitchen has NO screen; printed tickets are the KDS". This conflicts with priority 3 (Q-KDS-1).

## 2. Priority 1: portrait-screen ads

**Goal:** a looping playlist of images and videos for the 4 portrait screens, managed in admin, served by our app.

### Additive schema
```
enum AdMediaType { IMAGE VIDEO }
model AdMedia     { id, fileName, mimeType, byteSize, sha256 @unique, width?, height?, durationMs?, storageKey, uploadedBy, createdAt }
model AdPlaylist  { id, name, isActive, updatedAt, items AdPlaylistItem[], displays AdDisplay[] }
model AdPlaylistItem {
  id, playlistId, mediaId, position Int, durationSeconds Int?   // required for IMAGE; VIDEO = natural length unless set
  startsAt DateTime?, endsAt DateTime?, daysOfWeek Int[] @default([]), startMinute Int?, endMinute Int?  // local Asia/Nicosia
  isActive Boolean @default(true), createdAt, updatedAt
  @@unique([playlistId, position]) }
model AdDisplay   { id, code @unique /* "PORTRAIT-1".."PORTRAIT-4" */, name, playlistId?, lastSeenAt?, appVersion? }
```
No existing table changes. Media files go to disk under `MEDIA_ROOT` (env) and are served by a route with HTTP Range support (needed for video) and immutable cache headers keyed by sha256.

### Files
- `src/modules/signage/ads/ads.schema.ts`: Zod for the API and admin forms; type allow-list (jpg/png/webp, mp4 H.264/AAC) and size cap (config).
- `src/modules/signage/ads/playlist.ts`: **pure** functions `isItemActive(item, now, tz)`, `activePlaylist(items, now)` (ordered by `position`), `itemDurationMs(item, media)`, `nextItem(list, currentId)`, `nextScheduleChange(items, now)`.
- `src/app/api/signage/ads/[display]/route.ts`: GET resolved playlist for a display (public read; heartbeat updates `lastSeenAt`).
- `src/app/api/admin/ads/*`: CRUD, upload, reorder, assign playlist to display (admin role via existing `guard.ts`/`policy.ts`).
- `src/app/signage/ads/page.tsx` + its own `layout.tsx` (no change to the root layout): chrome-free fixed 1080×1920 stage scaled to fit, black letterbox, crossfade, `video muted playsinline`, preloads the next item.
- Resilience: Service Worker scoped to `/signage/`, caching the playlist JSON and media (Cache API). On network loss it keeps looping the cached set and retries with backoff. SSE `ADS_UPDATED` triggers a refetch. A watchdog reloads the page if playback stalls.
- `src/app/admin/ads/page.tsx`: list, upload, drag to reorder, duration and schedule, preview at portrait ratio. **Mockup first, then code**, built with `src/ui` + `SurfaceRoot`.

### Acceptance criteria
1. Items play in `position` order and loop. Images show for `durationSeconds`; videos play to the end (or stop at `durationSeconds` if set).
2. Items outside their date range, weekday or time window (Asia/Nicosia, including the DST change) are skipped. Items enter and leave the loop without a reload.
3. An empty or fully expired playlist shows a neutral brand slate, never a blank or error screen.
4. If the network is lost, playback continues from cache. It recovers by itself once the network is back.
5. Admin changes reach the screens in under 5 s through SSE; screens that miss the event pick it up on the 60 s poll.

### Tests
- `tests/ads-playlist.test.mjs`: ordering; equal and missing positions are rejected; date, weekday and minute windows, including a window crossing midnight and the DST day; image without duration rejected; video duration rules; `nextItem` wrap-around; `nextScheduleChange`.
- `tests/ads-api.test.mjs`: schema validation, MIME/size rejection, unknown display → 404.

## 3. Priority 2: shift checklists

**Goal:** digital checklists from Oli's 20-page station PDF: tick items, record who and when, add notes, enforce required items, show a shift summary, and validate HACCP temperatures.

### Additive schema (old JSON columns stay, unused by new code)
```
enum ChecklistItemKind { CHECK TEMPERATURE NUMBER TEXT }
model ChecklistTemplate (+ station String?, version Int @default(1), sourceRef String?)  // nullable additions only
model ChecklistItem { id, templateId, position, label, labelGR?, kind, isRequired Boolean @default(true),
                      haccpTarget String? /* CHILLED | FROZEN | HOT_HOLDING */, minValue Float?, maxValue Float?, unit String?,
                      sourceRef String? /* PDF page/line */, needsReview Boolean @default(false)  @@unique([templateId, position]) }
model ChecklistRun  { id, templateId, templateVersion, locationId, shiftDate DateTime @db.Date, startedById, startedAt,
                      completedAt?, completedById?, status /* OPEN | COMPLETED | INCOMPLETE */, summaryNote?
                      @@unique([templateId, locationId, shiftDate]) }
model ChecklistEntry { id, runId, itemId, value String?, temperature Float?, isCompliant Boolean?, note?, correctiveAction?,
                       recordedById, recordedAt  @@unique([runId, itemId]) }
```
A temperature entry also writes a `HaccpLog` row in the same transaction, so the existing HACCP audit trail stays complete.

### Files
- **Seed data:** `prisma/seed-checklists.ts` reads a reviewed `data/checklists/*.json`, transcribed from the PDF (not committed until Sagar approves it). Anything unclear gets `needsReview: true` plus a question in `docs/open-questions.md`; nothing is invented. A separate seed file is used because `prisma/seed.ts` must not be touched.
- `src/modules/haccp/temperature.ts`: **one** validator replacing both existing ones. Chilled: 0 to 5 °C compliant. Hot hold: 63 °C or more compliant. Danger zone: above 5 and below 63 °C. Frozen stays at -18 °C or below (already in the code). The PDF decides whether frozen applies. Each item can override with min/max from the DB.
- `src/modules/checklists/completion.ts`: **pure** functions `canComplete(run, items, entries)`, `missingRequired`, `shiftSummary` (done/required/optional, breaches, corrective actions, who/when).
- Routes:
  - `GET /api/checklists/templates?station=`
  - `POST /api/checklists/runs` (open or resume today's run)
  - `PUT /api/checklists/runs/:id/entries/:itemId`
  - `POST /api/checklists/runs/:id/complete`
  - `GET /api/checklists/runs/:id/summary`
  - `POST /api/haccp/readings` (the call `/staff` needs)
- Fix `StaffHaccpHub.tsx`: point it at the real routes; replace `alert()` with inline states; identify the user by staff PIN (`src/lib/auth/staff-pin.ts`), not a free-text name. The new checklist screen: **mockup first**.

### Acceptance criteria
1. A run cannot be completed while any required item is missing. The error lists the missing items.
2. A non-compliant temperature cannot be saved without a corrective action.
3. Every entry records who and when (staff id from PIN plus a server timestamp). Re-ticking keeps the latest value, and the change is written to `AuditLog`.
4. One run per template, location and shift date. A second "start" resumes it.
5. The shift summary shows progress, breaches and notes per station.
6. `/staff` makes no calls to missing routes. A test asserts every client `fetch` path exists as a route.

### Tests
- `tests/haccp-temperature.test.mjs`: boundaries 0, 5, 5.01, 62.99, 63, -18, -17.9; per-item override; corrective action required.
- `tests/checklist-completion.test.mjs`: required vs optional; missing list; double-start resume; summary counts.
- `tests/staff-route-contract.test.mjs`: client fetch paths ↔ `src/app/api` routes.

## 4. Priority 3: order time target on the kitchen monitor (DM orders)

**Goal:** receive DM kiosk and online orders, store them as **internal order records** (not fiscal, never repriced, no stock deduction), and show them on `/kds` with a countdown to a configured target.

### [ADR] Order record
- **Context:** `Order`/`OrderItem`/`KitchenTicket` need a terminal, a product FK per item, VAT and payment fields, which is POS/fiscal shape. POS is paused, and a DM order must never be repriced.
- **Decision:** a new `ExternalOrder` with a `source` field (`DM` now; `POS`/`GLADIUS` can be added later), plus line snapshots exactly as DM sent them.
- **Consequence:** no product mapping is needed to show an order. Mapping stays a later concern, and the KDS reads one general record.

### Additive schema
```
enum OrderSource { DM }                         // POS, GLADIUS later
enum ExternalOrderStatus { RECEIVED IN_KITCHEN READY COLLECTED CANCELLED REJECTED }
model ExternalOrder {
  id, source OrderSource, environment String, storeGroup String, storeId String, orderUid String,
  exportRevision Int, dmOrderId String, displayOrderId String?, channel String, fulfillmentType String,
  status ExternalOrderStatus @default(RECEIVED), payloadSha256 String,
  orderSnapshot Json            // items, modifiers, notes, totals as sent; customer contact data stripped (Q-DM-D)
  dmCreatedAt DateTime, dmAcceptedAt DateTime?, requestedFor DateTime?, receivedAt DateTime @default(now()),
  targetSeconds Int,            // snapshot of the target when received
  inKitchenAt DateTime?, readyAt DateTime?, collectedAt DateTime?, updatedAt
  @@unique([environment, storeGroup, storeId, orderUid]) @@index([status, receivedAt]) }
model ExternalOrderDelivery { id, idempotencyKey String @unique, externalOrderId, exportRevision Int, payloadSha256, outcome String, receivedAt }
model OutboxMessage { id, kind String /* DM_STATUS_RECEIVED */, aggregateId String, payload Json, status /* PENDING|SENT|FAILED|DISABLED */,
                      attempts Int @default(0), nextAttemptAt DateTime, lastError String?, sentAt DateTime?  @@unique([kind, aggregateId]) @@index([status, nextAttemptAt]) }
model OperationalSetting { key String @id, value Json, updatedBy String?, updatedAt }   // e.g. kds.orderTarget = { targetSeconds, nearSeconds }
```

### Receiver: `POST /api/webhooks/dm/orders`
- `PUBLIC` in middleware. Bearer token checked with `timingSafeEqual` against `DM_WEBHOOK_TOKEN` (env). Body capped at 64 KiB before parsing (413). Zod validation against `OrderDelivery` from the 0.2.3 OpenAPI (422).
- Identity check: `environment`, `store.group` and `store.store_id` must match `DM_ENVIRONMENT`, `DM_STORE_GROUP` and `DM_STORE_ID` (EMBA = 576712). A mismatch is rejected and nothing is stored.
- One DB transaction: insert the delivery by Idempotency-Key and upsert the order by the unique key.
  - Same key with the same hash → replay: 200 with the original `sagar_order_id`.
  - Same key with a different hash → 409.
  - New key for an `order_uid` already stored → 200 and no second import, whatever the revision ("import once per order_uid").
- The outbox row is written in the same transaction. Then the SSE event `EXTERNAL_ORDER_CREATED` goes to `kds`. The reply is 200/202 well under 8 s; no outbound call runs inline.
- Logs keep only `orderUid`, the revision and the outcome: never the payload, names, phones or addresses. Notes and options are displayed as text and never interpreted.

### Outbox worker
`scripts/outbox-worker.ts` (long-running; systemd/pm2 later). It POSTs `/v1/orders/{order_uid}/status` `received`, with exponential backoff and jitter, a max-attempt ceiling, and a lease so two workers can't double-send. **Behind `DM_STATUS_CALLBACK_ENABLED=false`** (default): while the flag is off, rows stay `DISABLED`/`PENDING` and nothing is sent. Tests run against a local stub server. **There is no production URL anywhere in the code.**

### `/kds`
- New `ExternalOrderBoard` (`src/ui` + `SurfaceRoot`, mockup first). Tickets are sorted by the time left. A countdown runs from the start time (Q-KDS-3) to `targetSeconds`.
- States, pure in `src/modules/kds/timer.ts`: `ON_TIME` (more than `nearSeconds` left), `NEAR` (0 to `nearSeconds` left), `LATE` (time is up; shown counting up). The hard-coded 4/8 and 5/8 thresholds are replaced by `OperationalSetting`.
- Bump: Received → In kitchen → Ready → Collected, audit-logged.
- Offline: SSE reconnects with backoff. A banner shows "offline since hh:mm", and timers keep ticking on the server-time offset measured at the last heartbeat. On reconnect the screen refetches the full set.
- `scripts/dm-simulator.ts` posts fixture orders (normal, replay, conflict, wrong store, oversize, bad token) to localhost only.

### Acceptance criteria
1. The same delivery posted twice creates 1 record and gets 2 identical 200s.
2. The same Idempotency-Key with a different body gets 409, and nothing changes.
3. Wrong store, group or environment, or a bad or missing token, is rejected with nothing stored.
4. A body over 64 KiB gets 413.
5. The reply comes within 8 s, with p95 under 300 ms locally.
6. A new order appears on `/kds` within 2 s through SSE.
7. Timer states change at exactly `target - near` and `target`.
8. With the flag off, nothing leaves the box.
9. Labels on any order view say "internal order record, not a fiscal receipt".

### Tests
- `tests/dm-receiver.test.mjs`: auth, size, schema, identity mismatch, idempotency, replay, conflict, revision after import.
- `tests/outbox.test.mjs`: backoff schedule, ceiling, flag off, lease.
- `tests/kds-timer.test.mjs`: boundaries, skew offset, late count-up.
- `tests/kds-sse.test.mjs`: event reaches subscriber; reconnect refetch.
- `tests/kds-offline.test.mjs`: offline banner state and local ticking.

## 5. Order of work and gates
Phase 1 ads → stop → Phase 2 checklists (blocked on the PDF) → stop → Phase 3 DM/KDS → stop → Phase 4 handoff. Each phase:
1. Acceptance criteria and failing tests first.
2. Migration SQL via `prisma migrate diff`, shown and confirmed additive (only `CREATE`/`ALTER … ADD COLUMN` with nullable or defaulted columns) before it is applied.
3. Implementation; `npm test`, `tsc` and `build` green.
4. Review by a separate reviewer agent.
5. Summary.

## 6. Open questions
See the chat summary of 30 Oct 2026 (Q-AD-1..4, Q-CL-1..3, Q-KDS-1..4, Q-DM-A..D, Q-GEN-1..2), mirrored into `docs/open-questions.md` once approved.

## 7. Decisions (30 Oct 2026, after Sagar's answers)

- **Q-AD-2 answered:** the 4 portrait screens are the 4 menu-board screens. `AdDisplay.screenNumber` uses the same numbering as `MenuBoardConfig.screenNumber`.
- **Q-GEN-2 (Sagar: "analyze and decide the best"):**

  [ADR] **Context:**
  - `origin/main` has no `prisma/migrations/`; the schema is applied with `db push`.
  - The local DB `mygd_edge_db` was migrated from the kiosk worktree's uncommitted migrations (`20261001000000_baseline`, `20261006000000_mygod_mapping_and_order_v2_slice1`). It does **not** match `main`: it lacks `Promotion`, `Voucher` and `VoucherRedemption`, and it has `ExternalCatalogMapping`, `OrderCounter`, extra `Location` columns and a different `VatRate` shape.
  - Moving it to `main` would drop 2 tables and 9 columns, and would add NOT NULL columns to `OrderItem`, which has 4 rows. It also holds the 118 products Sagar entered.

  **Decision:**
  1. Adopt **Prisma Migrate** on this branch, with a baseline `20261030000000_baseline` generated from `origin/main`'s schema.
  2. Every feature change from now on is an additive migration whose SQL is reviewed before it is applied. The first is `20261030000100_portrait_screen_ads`: 1 enum, 4 tables, indexes and FKs from the new tables only. It has no DROP, no ALTER of an existing table, and no data changes.
  3. **Do not touch `mygd_edge_db`.** Development and tests use a new, empty local DB built from the migrations.

  **Consequence:**
  - SQL is versioned and reviewable, and `db push` drift like this can't happen again.
  - The kiosk branch's migrations conflict with `main`'s schema (the `VatRate` shape). They must be regenerated on top of this baseline when that branch is merged; that is a separate task.
  - Aligning `mygd_edge_db` (keeping Sagar's products) is a separate task and needs his explicit go.
- **Scope note:** `nextScheduleChange` from the Phase 0 plan was dropped (YAGNI). The player re-evaluates the active list at every item change, which is at least every 120 s.

## 8. Deploy note: the baseline migration

`20261030000000_baseline` creates every table. On a **new** database, `prisma migrate deploy` is enough. On a database already built with `db push` (or from the kiosk branch), it would fail on tables that exist, and that database's shape must be checked against `main` first. Once it matches, mark the baseline as already done with `prisma migrate resolve --applied 20261030000000_baseline`, then run `migrate deploy`. `mygd_edge_db` does not match `main` today (section 7), so this does not apply to it until it has been aligned.

## 9. Update, 2 Nov 2026: Sagar's facts and the new order of work

**Facts**
- Our system **replaces screenypro.com** on the 4 portrait screens.
- Two non-smart LED TVs (static images from USB today, can't run ScreenyPro) may become **landscape drinks screens** that work like the portrait ones.
- Separate **smart monitors show customers the waiting time**. The timer TV is for customers.
- Kitchens have **printers and no screens**. Kitchen screens come later.
- **Main priority:** finish Oli's 3 points and **host the system online**. Everything else comes after.

**Priority 1 changes (done, not committed):** screens 1-6 with a saved orientation (5-6 landscape), one playlist per screen, a playlist picker in admin. `/boards` still redirects to ScreenyPro until the switchover.

**Priority 3 re-scoped:** the time target shows on the **customer waiting-time monitor (`/display`)**, not a kitchen monitor. The receiver and `ExternalOrder` are unchanged. `/display` reads `ExternalOrder`, and `/kds` reuses the same data once kitchen screens exist. Customers see friendly states, not a red "late". The kitchen keeps its printed tickets.

**Hosting (new):**
- [ADR] **Context:** uploads need a persistent disk; the SSE broker is in memory, so it needs one long-running process; the DM outbox worker runs continuously; DM needs a public HTTPS endpoint with no redirects; service workers only run over HTTPS or on localhost, so offline playback depends on real HTTPS.
- **Decision:** one cloud VPS running Docker (existing standalone `Dockerfile`), Postgres, a volume for `MEDIA_ROOT`, a reverse proxy with automatic TLS, and scheduled backups of the database and media.
- **Consequence:** Vercel-style serverless does not fit today's design. We run one server, so backups and updates are ours. Moving to something larger later means moving the event broker and media storage out of the process.
- **To build:** compose file, `prisma migrate deploy` on release, health check, backups and restore test, secrets in env only, a staging URL first. The fresh database starts from the baseline; `mygd_edge_db` is not migrated.

**Order of work:** hosting and Priority 1 on real screens run alongside Priority 2 (needs the PDF) and Priority 3 (needs the answers below).

**Open (Sagar/Oli):** which device runs the browser on each TV; who marks a DM order ready when the kitchen has no screen; what the timer monitors run today; whether till orders must appear on them; the target time; the VPS provider and domain; the checklist PDF.
