# MyGOD Touch Kiosk & Online Ordering Integration — Master Implementation Plan

Status: **PLAN v2 (Updated 2026-10-06). Awaiting user approval. Zero code written in this phase.**  
Branch: `claude/mygod-kiosk-integration-5abb20`  
Contract: `dm.sagar.v1` (Handbook Release 0.2.3, OpenAPI 3.1.0)  
Parties: **DM Soft / Delivery Manager (bridges.gr)** (Vendor) $\leftrightarrow$ **Sagar (MYGD POS)** (Destination POS)  
Store Target: Group `mygermandoener`, Store ID `576712` (Emba, Paphos, Cyprus)  

---

## 1. Where to Find What You Need Right Now

### A. The Three API Tokens: Where & How to Get Them

| Token Name | Direction | Who Generates It | Where / How You Get It | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`MYGOD_CATALOG_API_TOKEN`** (`SAGAR_CATALOG_TOKEN`) | Us $\rightarrow$ DM | **DM Soft** | **From DM Portal / DM Ops:**<br>1. Log into [`https://bridges.gr/integrations/sagar/latest/index.html`](https://bridges.gr/integrations/sagar/latest/index.html) with your portal login.<br>2. Open `catalog-access.txt` or `catalog-access.html` linked on the page.<br>3. Or request from your DM Soft account manager / integration contact.<br>*Note: The token is bound to `group=mygermandoener`, `store_id=576712`, `environment=test` and has `catalog:read` scope.* | Reading the live catalog via `GET /v1/catalog`. |
| **`MYGOD_WEBHOOK_RECEIVER_TOKEN`** (`SAGAR_WEBHOOK_TOKEN`) | DM $\rightarrow$ Us | **You (Sagar / Us)** | **Generated Locally by You:**<br>Run in terminal: `openssl rand -hex 32`<br>(or `npm run mygod:token` once wired).<br>Put it in your `.env.local` as `MYGOD_WEBHOOK_RECEIVER_TOKEN`.<br>You then provide this secret token **privately to DM** so DM can authenticate when sending orders to our webhook. | Authenticating inbound orders from DM kiosks to our webhook. |
| **`MYGOD_STATUS_API_TOKEN`** (`SAGAR_STORE_TOKEN` for status) | Us $\rightarrow$ DM | **DM Soft** | **From DM Soft during Joint Verification (Phase 6):**<br>DM has disabled this in the onboarding catalog deployment (it currently returns 403). DM will issue the `orders:status` grant and the status base URL when we begin the joint test window. | Calling `POST /v1/orders/{order_uid}/status` to confirm POS registration. |

### B. Where the Drafted Answers Are Located
The formal responses to the six questions required by DM (**SAG-Q01 through SAG-Q06**) are located in:
1. **[`docs/integrations/mygod/HANDOFF_ANSWERS_DRAFT.md`](file:///Users/saiedsagar/DEVELOPER/DEVELOPER/MYGD/.claude/worktrees/mygod-kiosk-integration-5abb20/docs/integrations/mygod/HANDOFF_ANSWERS_DRAFT.md)** in this worktree.
2. In the project artifact: **[`MYGD_DeliveryManager_Integration_Blueprint.md`](file:///Users/saiedsagar/.gemini/antigravity/brain/16e018a1-a3ae-4f4a-a8ab-7f4b9e8d1994/MYGD_DeliveryManager_Integration_Blueprint.md)** under Section 3.

---

## 2. Touch Kiosk Hardware, UI & Printing Reality

### A. Touch Kiosk Machine Facts (GoKiosk × 3)
1. **The Touch Kiosk UI is DM Soft's Software:**
   - The physical hardware is 3× touchscreen self-order kiosks (GoKiosk) supplied by DM Soft.
   - The customer ordering interface, category navigation, photo display, language selection, and modifier flows run inside DM Soft's kiosk application.
   - **We do not write the frontend UI for the kiosk screens.** We integrate via backend webhook API.
2. **Kiosk Menu & Pricing is Managed in DM Back Office:**
   - The products and prices shown on the kiosk screens originate in DM Soft's catalog backend.
   - The contract has **no catalog write endpoints** (we cannot push price updates from our till to the kiosk over API). Price changes and mark-as-sold-out on the kiosks are done by store staff in the DM portal.
3. **Card Payments are Handled on the Kiosk by DM (Link4Pay):**
   - The card reader on the kiosk is integrated with Link4Pay by DM Soft.
   - When an order reaches our system, the payment is already captured (`paid` with a `transaction_reference`). We never re-charge or re-calculate it.
4. **Kitchen Printing is Handled by DM Soft:**
   - DM's existing printer service prints the customer paper receipt and kitchen prep tickets **after** our system replies with the `received` status callback.
   - **Our POS internal thermal printers do not print tickets for kiosk orders** (preventing double-printing).

---

## 3. End-to-End Steps to Implement Touch Kiosks with Your System

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        TOUCH KIOSK IMPLEMENTATION LIFECYCLE                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
  │
  ├─► STEP 1: Credential & Environment Setup
  │   └── Place SAGAR_CATALOG_TOKEN in .env.local; generate SAGAR_WEBHOOK_TOKEN
  │
  ├─► STEP 2: Database Schema & Migration (Additive)
  │   └── Add ExternalCatalogMapping, ExternalOrder, ExternalCallback to schema.prisma
  │
  ├─► STEP 3: Live Catalog Pull & Menu Mapping CLI
  │   └── Run `npm run mygod:catalog` -> `npm run mygod:map` -> confirm item mappings
  │
  ├─► STEP 4: Webhook Receiver Endpoint
  │   └── POST /api/webhooks/mygod/orders (strict validation, constant-time auth, <8s SLA)
  │
  ├─► STEP 5: Real-time Kitchen KDS & Customer Display Integration
  │   └── Dispatch ORDER_CREATED via event broker -> /kds & /display update live
  │
  ├─► STEP 6: Registration Callback Outbox Worker
  │   └── Durable retry loop sending POST /v1/orders/{order_uid}/status (received/rejected)
  │
  ├─► STEP 7: Operator Tools & Reconciliation CLI
  │   └── Build `npm run mygod:imports` to inspect held orders and resume repaired mappings
  │
  ├─► STEP 8: Staging / Cloud Deployment & Networking
  │   └── Expose public IPv4 on HTTPS port 443 with valid TLS certificate and no redirects
  │
  ├─► STEP 9: Physical Kiosk Fleet & Network Verification
  │   └── Verify 3x GoKiosk units are online, bound to store 576712, on stable LAN + power
  │
  ├─► STEP 10: Joint Rehearsal & Live Verification with DM
  │   └── Execute OFF-01..10 offline suite; execute JOINT-01..05 live orders with DM Soft
  │
  └─► STEP 11: Production Cutover & Staff Operational Briefing
      └── Rotate to production credentials, monitor drift, brief staff on sold-out SOP
```

---

### Step 1: Credential & Environment Configuration
1. Retrieve `MYGOD_CATALOG_API_TOKEN` from DM Soft (via portal or email) and add to `.env.local`:
   ```bash
   MYGOD_CATALOG_API_BASE_URL="https://elueplanqhnqogfzahzdknthgu0iyfdg.lambda-url.eu-west-1.on.aws"
   MYGOD_CATALOG_API_TOKEN="<your-token-from-dm>"
   MYGOD_STORE_GROUP="mygermandoener"
   MYGOD_STORE_ID="576712"
   MYGOD_ENVIRONMENT="test"
   ```
2. Generate your webhook receiver token:
   ```bash
   openssl rand -hex 32
   ```
   Add to `.env.local` as `MYGOD_WEBHOOK_RECEIVER_TOKEN="<generated-hex>"`.

---

### Step 2: Database Schema & Migration (Additive Only)
Add three models to `prisma/schema.prisma` without modifying existing tables:
1. **`ExternalCatalogMapping`**:
   - Unique on `(source, environment, storeGroup, storeId, entityType, externalId)`.
   - Foreign keys to `Product`, `ModifierGroup`, and `Modifier` with `ON DELETE RESTRICT`.
   - Tracks `status` (`SUGGESTED`, `CONFIRMED`, `REJECTED`), `confirmedBy`, `confirmedAt`.
2. **`ExternalOrder`**:
   - Stores raw payload JSON, SHA-256 content hash, channel (`kiosk` vs `online`), and status.
   - Money stored as `Decimal(10, 2)` (converted from boundary floats to integer cents).
   - Scoped unique index on `(source, environment, storeGroup, storeId, orderUid)`.
3. **`ExternalCallback`** (Outbox):
   - Stores queued callback bodies, attempt counts, backoff schedules (`nextAttemptAt`), and completion timestamps.
- **Verification:** Generate SQL via `prisma migrate diff`, verify CHECK constraints on local Postgres, and run `prisma generate`.

---

### Step 3: Live Catalog Pull & Menu Mapping
1. Wire CLI scripts in `package.json`:
   - `npm run mygod:catalog` $\rightarrow$ calls `scripts/mygod-catalog.ts`
   - `npm run mygod:map` $\rightarrow$ calls `scripts/mygod-map.ts`
2. Run `npm run mygod:catalog`:
   - Fetches live catalog snapshot from DM Lambda API.
   - Saves formatted JSON in `.import-work/mygod/` (mode 0600).
   - Prints count of categories, products, option groups, and choices.
3. Run `npm run mygod:map`:
   - Compares DM external items with MYGD database menu products and modifiers.
   - Generates a review file: `.import-work/mygod/review-576712.json`.
4. Review & Confirm Mappings:
   - Operator (you) reviews suggestions.
   - For confirmed items, sets `"status": "CONFIRMED"` and `"confirmedBy": "sagar"`.
   - Applies the mappings with `npm run mygod:map -- --apply`.
   - Database writes only confirmed rows; unconfirmed items remain unmapped.

---

### Step 4: Webhook Receiver Endpoint (`/api/webhooks/mygod/orders`)
1. Create `src/app/api/webhooks/mygod/orders/route.ts`.
2. In `src/lib/auth/policy.ts`, add the public exception:
   ```ts
   if (path === "/api/webhooks/mygod/orders" && verb === "POST") return "PUBLIC";
   ```
3. In the route handler:
   - Check `Authorization: Bearer <token>` using `crypto.timingSafeEqual` against `MYGOD_WEBHOOK_RECEIVER_TOKEN`.
   - Assert `body.store.group === "mygermandoener"`, `body.store.store_id === "576712"`, and `body.environment === configuredEnv`. Return 401 on mismatch.
   - Enforce 64 KiB body cap and strict Zod validation against `OrderDelivery` schema. Return 422 on schema violation.
   - Validate arithmetic identities (grand total, items total, line totals, modifiers, fees, tips, discounts). Convert to integer cents.
   - **Idempotency check:**
     - If same identity exists with matching content hash $\rightarrow$ Return existing receipt (HTTP 200).
     - If same identity exists with different content hash or revision $\rightarrow$ Return HTTP 409 `revision_conflict`.
   - **Mapping resolution:**
     - If all products and modifiers are `CONFIRMED` $\rightarrow$ status `ACCEPTED`, generate `sagar_order_id`, insert `ExternalCallback` row with `kind: "RECEIVED"`.
     - If any item is unmapped $\rightarrow$ status `NEEDS_REVIEW`, insert `ExternalCallback` row with `kind: "REJECTED"` (`code: "mapping_missing"`).
   - Respond within 8 seconds with `{ "success": true, "order_uid": order.order_uid, "export_revision": 1 }`.

---

### Step 5: Real-time Kitchen KDS & Customer Display Integration
1. Inside the webhook transaction, after database commit:
   - Publish real-time event via `src/lib/events.ts`:
     ```ts
     eventBroker.publish("all", {
       type: "ORDER_CREATED",
       source: "MYGOD_KIOSK",
       orderId: externalOrder.sagarOrderId,
       displayOrderId: externalOrder.parsed.display_order_id,
       items: externalOrder.parsed.items,
       totals: externalOrder.parsed.totals,
     });
     ```
2. The Kitchen Display (`/kds`) receives the SSE event and immediately shows the ticket in the preparation column.
3. The Customer Pickup Display (`/display`) receives the event and shows the order under `PREPARING` using `display_order_id`.

---

### Step 6: Registration Callback Outbox Worker
1. Background worker service (`src/modules/mygod/callback.outbox.ts`):
   - Queries `ExternalCallback` for pending rows (`completedAt IS NULL AND nextAttemptAt <= NOW()`).
   - Posts status to DM:
     `POST {MYGOD_STATUS_API_BASE_URL}/v1/orders/{order_uid}/status?g=mygermandoener&s=576712`
     with `Authorization: Bearer <MYGOD_STATUS_API_TOKEN>`.
   - If DM returns HTTP 200 $\rightarrow$ mark `completedAt = NOW()`.
   - If DM returns 429 or 5xx $\rightarrow$ schedule retry with backoff ($5\text{s}, 10\text{s}, 20\text{s}, 40\text{s}, \le 60\text{s} + \text{jitter}$), honouring `Retry-After`.
   - If DM returns 409 $\rightarrow$ flag for operator reconciliation (do not retry).
   - *Note: If `MYGOD_STATUS_API_TOKEN` is not yet configured, outbox safely holds queued rows without crashing.*

---

### Step 7: Operator Tools & CLI
1. Implement `scripts/mygod-imports.ts` (`npm run mygod:imports`):
   - `npm run mygod:imports` $\rightarrow$ Lists recent external orders with status, UID, Sagar ID, and totals.
   - `npm run mygod:imports --status NEEDS_REVIEW` $\rightarrow$ Shows blocked orders and their unmapped IDs.
   - `npm run mygod:imports --resume <order_uid>` $\rightarrow$ Re-evaluates a blocked order after mappings are confirmed, creates the sale, and queues the `received` callback.

---

### Step 8: Network & Staging Deployment
1. Hosting requirements:
   - Public IPv4 address.
   - Port 443 with valid TLS certificate (Let's Encrypt / Cloudflare).
   - Direct handling with **no HTTP $\rightarrow$ HTTPS redirects** on the webhook route.
2. Deployment options:
   - Cloud container: Deploy Docker container to always-on EU host with managed Postgres.
   - Store local backup: Run container locally on store PC, exposed through Cloudflare Tunnel with the same domain name.

---

### Step 9: Physical Touch Kiosk Machine Verification (GoKiosk × 3)
1. Physical inspection checklist:
   - Confirm all 3 kiosks are powered and connected to the store LAN/Wi-Fi.
   - Confirm touch screens and receipt paper rolls are loaded.
   - Confirm Link4Pay card reader terminal is online and test-paired.
   - Confirm DM settings on all 3 kiosks point to Store ID `576712`.
2. Operational rule:
   - When an item is 86'd (sold out) in the store, staff mark it unavailable in the DM back office portal so the kiosks stop offering it.

---

### Step 10: Joint Verification with DM Soft (Acceptance Testing)
1. Complete offline rehearsal suite (OFF-01 to OFF-10) with recorded logs.
2. Exchange credentials privately with DM Soft:
   - Provide DM our receiver URL (`https://.../api/webhooks/mygod/orders`) and `MYGOD_WEBHOOK_RECEIVER_TOKEN`.
   - Receive from DM the status API base URL and `MYGOD_STATUS_API_TOKEN`.
3. Schedule joint test window (JOINT-01 to JOINT-05):
   - **JOINT-01:** Verify credentials and store scope enforcement.
   - **JOINT-02:** Verify real catalog items match our confirmed mappings.
   - **JOINT-03:** Place a test order on a physical GoKiosk machine:
     - Customer pays via Link4Pay test card $\rightarrow$ DM pushes order to our webhook.
     - Webhook accepts within 8s $\rightarrow$ Order appears on our `/kds` and `/display`.
     - Outbox sends `received` status to DM.
   - **JOINT-04:** Verify DM prints the physical customer receipt and kitchen prep ticket.
   - **JOINT-05:** Simulate duplicate delivery $\rightarrow$ verify single POS sale and zero duplicate prints.

---

### Step 11: Production Cutover & Sign-Off
1. Rotate tokens to production values.
2. DM enables live order forwarding for store `576712`.
3. Keep operator CLI active for monitoring the first live transactions.
