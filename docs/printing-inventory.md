# Printing — implementation inventory

- **Date:** 2026-10-03
- **Branch:** `cleanup/phase0`
- **Status:** documentation only. Nothing has been merged or removed here (per the cleanup plan); consolidation happens in Phase 5 (print queue behind an interface).

## In use: `src/modules/printer/*` (the till uses this)

| File | Role |
|---|---|
| `tcp-spooler.ts` | Raw TCP port 9100 sender with an in-memory retry queue; singleton `tcpPrintSpooler` |
| `escpos-encoder.ts` | ESC/POS byte builder; `buildIndoorChit`, `buildGrillChit` |
| `printer.schema.ts` | Zod schemas: `ThermalChitPayload`, `PrinterConfig`, `PrintJobResult` |

Call paths:
- **Till:** `/pos` → `POST /api/orders` → `POSService.tenderOrder` (`src/modules/pos/pos.service.ts`) → `tcpPrintSpooler.dispatchDualStationPrint()`.
- **KDS reprint:** `KDSTablet` → `POST /api/terminal/print` → `KDSService.reprintThermalChit` (`src/modules/kds/kds.service.ts`) → the same spooler.
- **Tests:** `tests/escpos-spooler.test.mjs`.

Known limits (to fix in Phase 5):
- The queue lives in memory and is lost on restart.
- Failures are only written to `console`.
- Only two fixed stations (`INDOOR`, `GRILL`); printer IPs come from env (`PRINTER_INDOOR_IP` …) with hard-coded fallbacks.
- No customer receipt and no drawer kick.

> **Update 2026-10-03:** done early, at Sagar's request. `src/lib/printer.service.ts` + its test were removed in `94bc63e`; `packages/printing` is on branch `archive/apps-packages`; the fake `/api/terminal/printer-test` route was removed in `28ebb05`. `src/modules/printer/*` is now the only print implementation. The drawer-pulse finding below still stands.

## Remove after Phase 1 (historical)

1. **`src/lib/printer.service.ts`.** Dead code: imported only by `tests/printer-service.test.mjs`, with no runtime caller. It is a parallel INDOOR/GRILL split and raw-TCP sender that duplicates the module above. Remove it together with its test (and port any test case worth keeping).
2. **`packages/printing/*`.** Already removed from the working tree in the `apps/*` + `packages/*` archive commit; it remains on branch `archive/apps-packages`. It holds the only StarPRNT encoder and a `getCashDrawerKickBuffer` helper, so it is worth reading again when the printer models are known (open-questions Q-HW-1).

## Related stubs found during this inventory (not printing code, but misleading)

- **`POST /api/terminal/printer-test`** never contacts a printer. It returns hard-coded text including `Connection: TCP/IP Port 9100 - Status OK` and `Hardware Self-Check: PASSED`. Callers: `src/components/admin/AdminModal.tsx`, `src/components/kiosk/OrderConfirmationScreen.tsx`. A dead printer would still show "PASSED".
- **Cash drawer:** `getCashDrawerCommand` (`src/lib/order-engine.ts`) builds the ESC p pulse, but no code sends it to a printer, so the drawer never opens from the app. *(Its only runtime caller, the deleted `/api/orders/create`, returned the bytes in JSON; now only tests use it.)* To be wired in Phase 4 (PRD M4.5).
