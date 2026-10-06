# MyGOD (Delivery Manager) integration — Phase 0 plan

Status: **DRAFT, awaiting approval. No code written.** Date: 2026-10-05. Branch: `feat/mygod-integration` (from `feat/ui-kiosk` @ `d756291`).

## 0. Vocabulary (confirmed by Sagar)

| Name | Meaning |
|---|---|
| **MyGOD / MYGD** | The store: My German Döner. DM store `group=mygermandoener`, `store_id=576712`. |
| **DM (Delivery Manager)** | The vendor behind this integration (portal on bridges.gr). Owns the catalog and the kiosk/online order services. Contract `dm.sagar.v1`, doc release 0.2.3. |
| **"Sagar"** (in the vendor docs) | Us: the destination POS = this codebase. |
| **DM Soft** | **Same vendor as DM** (confirmed by Sagar 2026-10-06; portal header: "Owner: DM Integrations → DM SOFT IKE"). DM Soft sold the GoKiosk kiosk and runs the bridge portal. The TRD/PRD items M12 / Q-DM-* / `/api/integrations/dmsoft/orders` are **superseded** by the `dm.sagar.v1` contract in this plan; the route is `/api/webhooks/mygod/orders`. |

## 1. What the vendor docs say (source: portal handbook 0.2.3, pasted 2026-10-05)

| Topic | Facts |
|---|---|
| Catalog | `GET {base}/v1/catalog?g=mygermandoener&s=576712`, `Authorization: Bearer <catalog:read token>`. Response: `group, store_id, environment, catalog_revision, generated_at, catalog.categories, catalog.products`. Products hold option groups; groups hold choices. Product id = `products[].id`; group id = `option.product_id_option_id`; choice id = `choice.option_id_choice_id`. Never split ids, never match by label or SKU. `null` price/availability = unknown, not 0/available. A read failure is an error, never an empty catalog. Snapshot ≤ 2 MiB. |
| Order webhook | DM → us: `POST <our full URL>`, `Authorization: Bearer <receiver token>`, `Idempotency-Key`. Body `OrderDelivery`: `schema_version=dm.sagar.v1`, `store{group,store_id}`, `environment`, one `order`. ≤ 64 KiB. Public IPv4, valid TLS on 443, **no redirects**, 8 s limit, ack ≤ 8 KiB. URL has no credentials/query/fragment. |
| Identity | `order_uid` = `dm:<store_id>:<dm_order_id>` (opaque). Dedup key = environment + group + store + `order_uid`. `display_order_id` is for humans only. `export_revision` starts at 1. |
| Success reply | `200` or `202` with `{success:true, order_uid, export_revision}` matching the delivery, only after the import is **durably recorded**. Transport acceptance only. |
| Retries | At-least-once, same bytes + same `Idempotency-Key`, via DM's retry/DLQ. No fixed interval or order. After a valid receipt DM stops resending. |
| Registration callback | After our commit: `POST {DM API}/v1/orders/{order_uid}/status?g=&s=` with `Bearer <orders:status token>`. `received {export_revision, sagar_order_id, registered_at?}` or `rejected {export_revision, issue{code,message,unmapped_ids}}` (codes: `mapping_missing, invalid_order, unsupported_fulfillment, import_failed`). Retry identical body until DM answers 200 (backoff 5/10/20/40/≤60 s + jitter, honour `Retry-After`). 409 → keep sale, escalate. **Not enabled yet:** the current catalog token gets 403. |
| Money | EUR, 2 decimals, decimal arithmetic. `grand_total = items_total + delivery_fee + service_fee + bag_fee + packaging_fee + tip_total − discount_total`; VAT already included; `paid_amount + amount_due = grand_total`. Accepted orders are never re-priced from today's catalog. |
| Channels | `channel=kiosk` (client_platform null) or `online` (web/android/ios/null). `fulfillment_type`: delivery/takeaway/dinein. Payment: `paid` or `pay_on_fulfillment`. |
| Kitchen | DM does the kitchen receipt + prep tickets **after** our `received` callback. |
| Test orders | **No.** Only synthetic fixtures (never fulfilled/paid/printed) and offline rehearsal now. Real order forwarding is disabled; joint test window comes later (JOINT-01…05). |
| Not provided | No order polling/feed, no cancellation/refund webhook, no catalog writes. |

## 2. Where the brief and the contract differ (decisions needed)

1. **Callback is mandatory.** Brief has no callback. Contract requires a post-commit `received`/`rejected` callback with a durable retry outbox. *Recommend:* build it, test against a fake DM server, keep it **disabled** until DM issues the `orders:status` grant.
2. **`needs_review` ⇒ send `rejected`** (`mapping_missing` + `unmapped_ids`); after a human repairs the mapping, resume the *stored* import and send `received`. Never ack unmapped orders as received.
3. **Idempotency scope** is wider than "source + external id": environment + group + store + `order_uid`. Same key with different bytes = conflict for reconciliation, not a second sale.
4. **Receiver token is bound to environment/group/store:** reject (401/403) any body whose store/environment differs from our configured values.
5. **Double printing risk.** DM prints kitchen tickets after our `received`. Our PRD says orders create tickets for our KDS/printers. *Recommend:* in this task **do not** create internal `Order`/`KitchenTicket` rows; `ExternalOrder` is the durable import record and `sagar_order_id` is its id. Creating an internal `Order` is a follow-up that needs the TRD Phase 2 schema (Decimal money, order-number sequence race, `terminalId` required) and a decision on who prints.

## 3. Proposed Prisma changes (additive only)

Existing tables are **not altered**. The repo has no `prisma/migrations/` (schema applied with `db push`), so see open question Q-3.

New enums: `ExternalMappingEntity (PRODUCT, OPTION_GROUP, CHOICE)`, `ExternalMappingStatus (SUGGESTED, CONFIRMED, REJECTED)`, `ExternalOrderStatus (RECEIVED, ACCEPTED, NEEDS_REVIEW, REJECTED)`, `ExternalCallbackKind (RECEIVED, REJECTED)`.

New tables:
- `ExternalCatalogMapping`: DM id → our `Product` / `ModifierGroup` / `Modifier`, with `status`, `confirmedBy`, `confirmedAt`, label + catalog revision snapshot. Unique on scope + entity type + external id.
- `ExternalOrder`: scoped identity, `exportRevision`, `idempotencyKey`, `contentHash`, `channel`, `status`, `rawPayload` (JSONB), `parsed` (JSONB), `issue` (JSONB), `sagarOrderId` (unique), `grandTotal`.
- `ExternalCallback` (outbox): `kind`, `body`, `attempts`, `nextAttemptAt`, `lastError`, `completedAt`.

Draft SQL (**to be regenerated and verified with `prisma migrate diff` in Phase 1**; `node_modules` is not installed in this worktree yet):

```sql
CREATE TYPE "ExternalMappingEntity" AS ENUM ('PRODUCT','OPTION_GROUP','CHOICE');
CREATE TYPE "ExternalMappingStatus" AS ENUM ('SUGGESTED','CONFIRMED','REJECTED');
CREATE TYPE "ExternalOrderStatus"   AS ENUM ('RECEIVED','ACCEPTED','NEEDS_REVIEW','REJECTED');
CREATE TYPE "ExternalCallbackKind"  AS ENUM ('RECEIVED','REJECTED');

CREATE TABLE "ExternalCatalogMapping" (
  "id" TEXT PRIMARY KEY,
  "source" TEXT NOT NULL DEFAULT 'dm',
  "environment" TEXT NOT NULL, "storeGroup" TEXT NOT NULL, "storeId" TEXT NOT NULL,
  "entityType" "ExternalMappingEntity" NOT NULL,
  "externalId" TEXT NOT NULL, "externalLabel" TEXT, "catalogRevision" TEXT,
  "productId" TEXT REFERENCES "Product"("id") ON DELETE RESTRICT,
  "modifierGroupId" TEXT REFERENCES "ModifierGroup"("id") ON DELETE RESTRICT,
  "modifierId" TEXT REFERENCES "Modifier"("id") ON DELETE RESTRICT,
  "status" "ExternalMappingStatus" NOT NULL DEFAULT 'SUGGESTED',
  "suggestedReason" TEXT, "confirmedBy" TEXT, "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalCatalogMapping_target_matches_type" CHECK (
    ("entityType"='PRODUCT'      AND "modifierGroupId" IS NULL AND "modifierId" IS NULL) OR
    ("entityType"='OPTION_GROUP' AND "productId" IS NULL AND "modifierId" IS NULL) OR
    ("entityType"='CHOICE'       AND "modifierGroupId" IS NULL)),
  CONSTRAINT "ExternalCatalogMapping_confirmed_has_target" CHECK (
    "status" <> 'CONFIRMED' OR ("confirmedBy" IS NOT NULL AND "confirmedAt" IS NOT NULL
      AND ("productId" IS NOT NULL OR "modifierGroupId" IS NOT NULL OR "modifierId" IS NOT NULL)))
);
CREATE UNIQUE INDEX "ExternalCatalogMapping_scope_entity_ext_key"
  ON "ExternalCatalogMapping"("source","environment","storeGroup","storeId","entityType","externalId");

CREATE TABLE "ExternalOrder" (
  "id" TEXT PRIMARY KEY,
  "source" TEXT NOT NULL DEFAULT 'dm',
  "environment" TEXT NOT NULL, "storeGroup" TEXT NOT NULL, "storeId" TEXT NOT NULL,
  "orderUid" TEXT NOT NULL, "exportRevision" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL, "contentHash" TEXT NOT NULL,
  "channel" TEXT NOT NULL, "clientPlatform" TEXT,
  "status" "ExternalOrderStatus" NOT NULL DEFAULT 'RECEIVED',
  "rawPayload" JSONB NOT NULL, "parsed" JSONB, "issue" JSONB,
  "sagarOrderId" TEXT, "grandTotal" DECIMAL(10,2) NOT NULL,
  "requestId" TEXT, "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "committedAt" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "ExternalOrder_scope_orderUid_key"
  ON "ExternalOrder"("source","environment","storeGroup","storeId","orderUid");
CREATE UNIQUE INDEX "ExternalOrder_sagarOrderId_key" ON "ExternalOrder"("sagarOrderId");
CREATE INDEX "ExternalOrder_status_receivedAt_idx" ON "ExternalOrder"("status","receivedAt");

CREATE TABLE "ExternalCallback" (
  "id" TEXT PRIMARY KEY,
  "externalOrderId" TEXT NOT NULL REFERENCES "ExternalOrder"("id") ON DELETE CASCADE,
  "kind" "ExternalCallbackKind" NOT NULL, "exportRevision" INTEGER NOT NULL,
  "body" JSONB NOT NULL, "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT, "lastHttpStatus" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX "ExternalCallback_order_kind_rev_key"
  ON "ExternalCallback"("externalOrderId","kind","exportRevision");
CREATE INDEX "ExternalCallback_due_idx" ON "ExternalCallback"("completedAt","nextAttemptAt");
```

**Non-destructive:** only `CREATE TYPE/TABLE/INDEX`. The only touch on existing tables is three foreign keys *from* new tables *to* `Product`, `ModifierGroup`, `Modifier` (`ON DELETE RESTRICT`). No `ALTER`/`DROP`/data change on existing tables. Rollback = drop the 3 new tables and 4 enums.

## 4. Phases, files, acceptance criteria, tests

Common: TDD, `tsx --tsconfig tsconfig.test.json --test tests/*.test.mjs`, Zod 3, no `any`. Domain logic in `src/modules/mygod/` behind a repository interface (in-memory fake for unit tests, real Postgres for integration). Route handlers stay thin. Before any Next code: read `node_modules/next/dist/docs/` (AGENTS.md) after `npm ci`.

### Phase 1 — Catalog client + mapping
Files: `src/modules/mygod/config.ts` (env + Zod), `catalog.schema.ts`, `catalog.client.ts`, `mapping.suggest.ts`, `mapping.repository.ts`, `scripts/mygod-catalog.ts` (`npm run mygod:catalog`, `npm run mygod:map`), `prisma/schema.prisma` + migration, `.env.example`, `.gitignore` (`/.import-work/mygod/`), `tests/mygod-catalog-*.test.mjs`, `tests/fixtures/mygod/catalog.json` (synthetic, from `payloads/01-catalog.json`).

| AC | Test |
|---|---|
| C1 Request sends the Bearer token, `g`, `s`, timeout; token never appears in errors/logs | client test with fake fetch; log-capture assertion |
| C2 Response validated against the documented schema; unknown/invalid shape → typed error, never an empty catalog | schema tests incl. null price/availability kept as `unknown` |
| C3 401/403/429/503/timeout map to distinct typed errors; 429 honours `Retry-After` | client tests |
| C4 Snapshot saved with timestamp + `catalog_revision` under a gitignored folder, mode 600 | script test with temp dir |
| C5 Report lists matched / unmatched-on-their-side / unmatched-on-ours, ids intact (no splitting) | pure function tests |
| C6 Suggestions are written as `SUGGESTED`; nothing is `CONFIRMED` without `confirmedBy` | DB CHECK + repository test |
| C7 A `CONFIRMED` mapping is the only thing the receiver may use | covered again in Phase 2 |
| C8 Our DB is never written from the catalog (products/prices untouched) | test asserts no Product/Modifier writes |

### Phase 2 — Receiver, idempotency, outbox
Files: `src/app/api/webhooks/mygod/orders/route.ts`, `src/modules/mygod/{auth,order.schema,receiver.service,mapping.resolve,callback.outbox,callback.client,events}.ts`, `scripts/mygod-generate-token.ts` (`npm run mygod:token`), `src/lib/auth/policy.ts` (**add `POST /api/webhooks/mygod/orders` as PUBLIC; the handler enforces the Bearer token**, otherwise the middleware's deny-by-default returns 401 for DM), `src/lib/events.ts` (new event type), tests.

| AC | Test |
|---|---|
| R1 Missing/malformed `Authorization` → 401 before parsing the body | route test |
| R2 Wrong token → 401, constant-time compare (`timingSafeEqual`, equal-length digest) | unit + route test |
| R3 Valid token → proceeds; body store/environment must equal configured values else 403 | route test |
| R4 Non-JSON content type → 415; body > 64 KiB → 413, rejected before full read | route tests |
| R5 Invalid payload → 400 with short reason; log has reason + request id, no secrets or customer data | schema + log-capture tests |
| R6 Duplicate delivery (same identity + same bytes) → same 200/202 receipt, one `ExternalOrder`, same `sagarOrderId` | service test + **concurrent** Postgres test (OFF-06) |
| R7 Same identity/key, different content → conflict, original untouched | service test |
| R8 All lines map through `CONFIRMED` mappings → `ACCEPTED`, `sagarOrderId` set, `received` outbox row created in the **same transaction** | service + Postgres test |
| R9 Any unmapped/unconfirmed product, option group or choice → `NEEDS_REVIEW`, nothing partially created, `rejected(mapping_missing, unmapped_ids)` queued | service test |
| R10 Reply within 8 s; slow work (outbox send, SSE emit) after the response | route timing test with slow fake |
| R11 Totals as delivered are stored; arithmetic identity checked with decimals; mismatch → `invalid_order`, nothing re-priced | money tests |
| R12 Raw payload stored verbatim; request id on every log line | tests |
| R13 Outbox: retries identical body with backoff+jitter, honours `Retry-After`, survives restart, 409 → flagged for operator, completes only on 200 | outbox tests with fake DM |
| R14 Callback client disabled when no `orders:status` token is configured; orders still received | config test |
| R15 `EXTERNAL_ORDER_ACCEPTED` published once per accepted order via a named integration point (`events.ts`); cloud→store sync left as documented follow-up | event test |
| R16 Token generator prints ≥ 32 random bytes URL-safe once, writes nothing | script test |
| R17 Required scenarios: missing token, wrong token, valid token, invalid payload, duplicate, unmapped item, happy path with DM's example payload | `tests/mygod-webhook-*.test.mjs` + `tests/fixtures/mygod/orders/*.json` |

### Phase 3 — Staging and handoff
Repo has a `Dockerfile` only (no compose, no cloud config). I will **not** invent infrastructure: I'll report what staging needs (public TLS host on 443, no redirects, Postgres, env vars) and give `curl` commands (token from env, example payload from fixtures), the exact staging URL, and a production-switch checklist.

### Phase 4 — Write-back
`docs/integrations/mygod/README.md`; brain: MYGD project note, `Lessons.md`, decisions.

## 5. Config (names only)

Secrets (env only): `MYGOD_CATALOG_API_TOKEN`, `MYGOD_WEBHOOK_RECEIVER_TOKEN`, later `MYGOD_STATUS_API_TOKEN`.
Non-secret: `MYGOD_CATALOG_API_BASE_URL=https://elueplanqhnqogfzahzdknthgu0iyfdg.lambda-url.eu-west-1.on.aws` (from the portal's catalog page; catalog-only, verified 2026-10-04), `MYGOD_STATUS_API_BASE_URL` (**not the catalog host**: DM's rehearsal templates use a non-live host and the catalog deployment answers 403 to callbacks; value still to come from DM), `MYGOD_STORE_GROUP=mygermandoener`, `MYGOD_STORE_ID=576712`, `MYGOD_ENVIRONMENT=test`.

## 6. Open questions

**For Sagar**
- **Q-1** Double-print decision (§2.5): OK to store `ExternalOrder` only and defer internal `Order`/`KitchenTicket`? Who prints MyGOD kiosk/online orders: DM (per contract) or our KDS too?
- **Q-2** Callback in scope now (built, tested against a fake, off until DM issues the grant)? *Recommended yes.*
- **Q-3** Migrations: no `prisma/migrations/` exists. OK to add a baseline + this migration, or keep `db push` for now and ship the SQL as a reviewed file?
- **Q-4** Mapping confirmation: CLI review file first (suggest → you edit/confirm → import), or an admin screen? *Recommended CLI first.*
- **Q-5** Mapping targets: the DB menu is still the old seed until the "menu single source" plan (d756291) is approved and run. Mapping against it will churn. Do the menu import first, or map now and re-map?
- **Q-6** Which `Location` row is store 576712 (needed later for internal orders)?
- **Q-7** Where does the cloud app run for staging (host, Postgres)? The old Supabase project may be dead (Q-DB-1).
- **Q-8** Push the branch / open a PR at phase ends, or keep local?

**For DM (vendor)**
- **V-1** Full `sagar-v1.json`, `integration-manifest.json`, `catalog-access.txt` and `payloads/*`: needed to build schemas (the handbook prose is not enough for field-level types).
- **V-2** *(partly answered 2026-10-06: the status base is NOT the catalog Lambda; callbacks there return 403 and must not be sent.)* What is the status API base URL, and when is the `orders:status` grant issued?
- **V-3** Exact error body/status for "same key, different bytes" and for receiver rejections; DM's retry count/interval and DLQ behaviour; do they publish egress IPs?
- **V-4** Payment method and VAT fields in the order (VAT is "included"; is a per-line/rate breakdown sent?). Our MSA says 9% food / 19% alcohol.
- **V-5** Can DM trigger a **synthetic test delivery** to our staging URL before the joint window (the docs say real forwarding is disabled)?

## 7. Security note

The portal password and catalog token were pasted into this chat. The vendor handbook says not to give credentials to an AI prompt. I did not use them. Ask DM to rotate both once the work is done, and put the token in `.env.local` yourself.

## 8. Findings from the full OpenAPI (0.2.3, read 2026-10-06; copy at `vendor/openapi.json`)

**Schema facts that change the build**
1. **Every object is `additionalProperties:false`.** Zod schemas are `.strict()`, pinned to `schema_version = dm.sagar.v1`.
2. **Money arrives as JSON numbers (floats).** Convert to integer cents at the boundary (round, then verify the float was within 1e-6 of a 2-decimal value, else `invalid_order`) and store `Decimal(10,2)`. The **content hash is taken over the raw request bytes**, never a re-serialised object.
3. **Only identities the spec states are enforced:** `grand_total = items_total + delivery_fee + service_fee + bag_fee + packaging_fee + tip_total − discount_total`; `items_total = Σ line_total`; `line_total = base_line_total + modifiers_total`; `tip_total = delivery_tip_total + waiter_tip_total`; `paid_amount + amount_due = grand_total`; `paid ⇒ amount_due = 0`. Per-line `unit_price × quantity` is *not* asserted (V-10).
4. **Fulfilment maps 1:1:** `delivery | takeaway | dinein` ↔ our `DELIVERY | TAKE_AWAY | DINE_IN`. Delivery requires `customer.phone`; takeaway/dinein allow `customer = null`. `table_id` is a string. Payment: method `cash | credit_card | other`, status `paid | pay_on_fulfillment`.
5. **Modifiers:** `selected` is always `true`; `selection_type` is `selected | removed | default_included`. A `removed` default is an explicit removal (price may be 0 or negative). `quantity` is across the whole line. `bundle_parent_line_id` must reference a `line_id` in the same order, no cycles. `text_options[]` keyed by `product_id_option_id`.
6. **`unresolved` and `flags.contains_unresolved_items` are `const false`**: `true` is schema-invalid.
7. **Idempotency:** `Idempotency-Key` header is required. Uniqueness is on scope + `order_uid` *independent of revision*; a different `export_revision` for a known `order_uid` is a **409 `revision_conflict`**, never a second sale.

**Receiver replies (only these are documented):** `200/202 {success,order_uid,export_revision}`, `401`, `409`, `422`, `429`, `500`, `503`. Error body is the DM envelope `{success:false, comment_id, message, next_steps[≥1], request_id, retriable}`. Our mapping: 401→`invalid_auth`, 409→`revision_conflict`, 422→`invalid_params`, 429→`rate_limit_exceeded`, 503→`orders_unavailable`, 500→`internal_error`. **This supersedes plan rows R3/R4:** wrong store/environment → **401** (matches DM's own API), bad shape/oversize/wrong content type → **422**, not 403/413/415.

**Callback (`/status`):** `received {export_revision, sagar_order_id, registered_at?}` → 200 with `already_applied`; `rejected {export_revision, issue{code,message,unmapped_ids[]}}` → 200 with `sagar_order_id:null`. 404 = not in our scope (stop and escalate, do not probe); 409 = reconcile; 422 = repair body; 401/403 = credential/grant.

**New questions for DM**
- **V-6** Unmapped lines: reply 200/202 and later send `rejected` (handbook; our recommendation), or reply 422 at the webhook (the OpenAPI 422 text says "Invalid order or missing mapping")?
- **V-7** The schema also allows deliveries with `import_state: "blocked"` + `issue`. What do they mean? Default until answered: store, acknowledge receipt, never import, show to the operator.
- **V-8** `selection_type` description lists `unknown`, the enum does not. Will it ever be sent?
- **V-9** Which status for wrong store/environment, oversize body and wrong content type (only 401/409/422/429/500/503 are documented for the receiver)? We use 401 and 422.
- **V-10** Does `base_line_total = unit_price × quantity` always hold? Are discounts only order-level?
