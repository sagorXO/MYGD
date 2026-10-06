# MyGOD / DM — answers to the six Sagar handoff questions (DRAFT)

Status: **DRAFT, not sent.** Contract `dm.sagar.v1`, handbook 0.2.3. Date: 2026-10-06.
Rules from the handbook: no secrets and no customer data in the answers. Send the receiver token through the private handoff only.

Markers: **[DECIDE]** needs Sagar's decision. **[TBD]** needs information we do not have yet. **[AFTER CATALOG]** can only be answered once the catalog is read and mapped.

## SAG-Q01 Catalog mapping
- Full DM product, option-group and choice IDs are stored unchanged as text (`ExternalCatalogMapping.externalId`). They are never split, trimmed or matched by label or SKU.
- Unsupported text options, default removals, bundles, selection limits, unmapped products: **[AFTER CATALOG]**. Our menu model has modifier groups with min/max but no bundle or free-text option model. Until confirmed, any order line we cannot map is blocked with `rejected(mapping_missing, unmapped_ids)`, never partly imported.

## SAG-Q02 Order delivery and connectivity
- Test and production receiver URLs: **[TBD]** depends on hosting (open question Q-7). The path is ours to choose and DM uses it verbatim. Planned: `/api/webhooks/mygod/orders`.
- Public IPv4, valid TLS on 443, no redirects: required of the host.
- Separate receiver Bearer tokens for test and production, delivered privately (generate at least 32 random bytes each).
- Durable acceptance: `200` with `{success:true, order_uid, export_revision}` only after the import is committed to our database. Replies within 8 s.

## SAG-Q03 Durable registration
- Transaction boundary: one Postgres transaction records the external order (unique on environment + group + store + `order_uid`), its raw payload and content hash, and the `received` callback row. Commit, then reply.
- Stable Sagar order ID format: **[DECIDE]** depends on whether an internal POS `Order` is created now (see Decisions). If not, the ID is the `ExternalOrder` ID.
- Duplicate delivery (same bytes, same `Idempotency-Key`): same receipt, same Sagar ID, one row. Same identity with different bytes: conflict for reconciliation, original untouched.
- Callback retries come from a persisted outbox with backoff 5, 10, 20, 40, then at most 60 s plus jitter. Honours `Retry-After`. Survives restarts. Completes only on a valid 200. On 409 the sale is kept and flagged for an operator.

## SAG-Q04 Payment and fulfilment
- **[DECIDE]** Not confirmed yet. Our current order model stores payment as columns on `Order`, uses floating-point money, and has order types DINE_IN / TAKE_AWAY / DELIVERY with no table identity, fee or tip fields.
- Planned approach: store the delivered amounts and payment state verbatim as decimals in the external-order record, never re-price, never collect a paid amount again. Mapping into our internal order/payment model is a follow-up that needs the Phase 2 schema.
- Unsupported combinations are reported with `rejected(unsupported_fulfillment)`, never silently changed.

## SAG-Q05 Reconciliation and support
- Technical contact: **[TBD]**.
- Operator inspection by DM identity (`order_uid`) or Sagar ID: planned CLI (`npm run mygod:imports`) listing blocked, rejected, conflicting and callback-pending imports. An admin screen can follow.
- Mapping repair: operator confirms the mapping, the stored import is resumed, `received` is sent. Cancellation races and 409 conflicts: escalated to the operator and DM by hand, no automatic second sale, refund or cancel.

## SAG-Q06 Joint verification
- Implementation milestone and test window: **[TBD]**.
- Endpoint and credential details are exchanged privately only. DM supplies its status API base URL and the `orders:status` grant (the catalog host answers 403 to callbacks).

## Plan deltas from handbook 0.2.3
1. **Operator visibility of blocked imports is required** (SAG-Q05, OFF-10). It was missing from the Phase 2 criteria. Add a CLI listing by DM identity and Sagar ID.
2. **Test and production are separate** environments with separate receiver tokens and namespaces. The receiver must reject a body whose environment differs from the configured one. Config must not assume one token.
3. **202 is allowed** for an async import, but only after a durable record. We reply synchronously with 200 inside the 8 s limit.
4. **Rehearsal acceptance cases OFF-01 to OFF-10** become the named test cases. Each test file names its OFF case.
5. **Still not in the repo:** `sagar-v1.json`, the synthetic payloads, `integration-manifest.json`, `acceptance-checklist.json`. Exact field names and types need them.
