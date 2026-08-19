# Printer Compatibility — Pinto Coffee

This document tracks which thermal printer can be used with the Pinto admin
"Cetak Struk" flow. The app currently ships with a **browser-print fallback**
that works with any printer, and an **ESC/POS-over-Bluetooth** provider that is
**prepared but not yet implemented** because it depends on the exact printer model.

## Current state

| Provider                       | Status      | Paper        | Notes                                        |
| ------------------------------ | ----------- | ------------ | -------------------------------------------- |
| `web-print`                    | **ACTIVE**  | 58mm / 80mm  | Opens the receipt in a new tab and calls `print()`. Works with any system printer. |
| `escpos-bluetooth`             | Prepared    | 58mm / 80mm  | Not implemented — needs the printer model confirmed. |
| `web-bluetooth`                | Prepared    | —            | Not implemented.                              |
| `android-bridge`               | Prepared    | —            | Not implemented.                              |
| `desktop-agent`                | Prepared    | —            | Not implemented.                              |

## Receipt format

Receipts are rendered as monospace text from one pure formatter
(`src/lib/receipt/receipt-service.ts`):

- **58mm** → 32 characters per line
- **80mm** → 48 characters per line

The same output is reused by the browser-print fallback (`receipt-html.ts`) and
will be sent byte-for-byte to the ESC/POS provider once implemented.

## What the owner must confirm

To switch from browser-print to a direct Bluetooth printer, confirm the following
and update this file:

1. **Printer brand + model** — e.g. Epson TM-T82X, Xprinter XP-58IIH, etc.
2. **Interface** — Bluetooth Classic (SPP) or BLE.
3. **Emulation** — the vast majority support ESC/POS; some clones only support
   a limited subset.
4. **Paper width** — 58mm (default) or 80mm.
5. **Test device** — an Android tablet/laptop used at the counter.

## Implementation plan (once model is confirmed)

- Confirm `CommandSet` in `src/lib/printer/printer-types.ts`
  (e.g. `ESC/POS`, `EPSON`, `STAR`).
- Implement `src/lib/printer/providers/escpos-bluetooth.ts` (or the most
  suitable provider) — feed it `formatReceiptText()` output.
- Swap the active provider in `src/lib/printer/printer-service.ts`.
- Run the manual test checklist in `docs/m5-manual-testing.md`.

## Bluetooth API limitations (Web Bluetooth)

Web Bluetooth cannot talk to Bluetooth **Classic** (SPP) printers, only BLE.
Most 58mm thermal printers are SPP, so they require either:

- the **Android bridge** (Pinto counter app connecting over SPP), or
- the **desktop agent** (small local helper listening on localhost).

Both providers are prepared as stubs and only need the printer model to be
built out.