# Printer Compatibility — Pinto Coffee

This document tracks which thermal printer can be used with the Pinto admin
"Cetak Struk" flow. The app ships with two providers: a **browser-print
fallback** that works with any printer, and an **ESC/POS-over-Bluetooth**
provider that prints directly to the counter printer via the Web Serial API.

## Current state

| Provider           | Status      | Paper        | Notes                                                              |
| ------------------ | ----------- | ------------ | ------------------------------------------------------------------ |
| `web-print`        | **ACTIVE**  | 58mm / 80mm  | Opens the receipt in a new tab and calls `print()`. Works with any system printer. Default provider. |
| `escpos-bluetooth` | **ACTIVE**  | 58mm / 80mm  | Sends ESC/POS bytes over Bluetooth Classic (SPP) via the Web Serial API. See setup guide below. |
| `web-bluetooth`    | Prepared    | —            | Not implemented (Web Bluetooth is BLE-only, not usable for SPP).   |
| `android-bridge`   | Prepared    | —            | Not implemented.                                                   |
| `desktop-agent`    | Prepared    | —            | Not implemented.                                                   |

The active provider is selectable in **Admin → Pengaturan** and persisted in
`localStorage` (`pinto.printer.config`), together with the paper width.

## Printer: PandaPrinter PRJ-58D

| Spec             | Value                                    |
| ---------------- | ---------------------------------------- |
| Model            | PandaPrinter PRJ-58D                     |
| Power            | DC 9V/2A (desktop — must stay plugged in)|
| Paper width      | 58mm (32 characters per line)            |
| Command set      | ESC/POS                                  |
| Bluetooth        | Classic **SPP** (not BLE)                |
| Pairing code     | `0000`                                   |
| Print speed      | 90–100mm/s                               |

## Setup guide (ESC/POS Bluetooth provider)

1. **Pair the printer** in the OS Bluetooth settings of the cashier device.
   Default pairing code: `0000`. Keep the printer powered (DC 9V/2A).
2. **Open the app in a supported browser** (see browser support below).
3. **Admin → Pengaturan → Metode Cetak** → pick **ESC/POS Bluetooth**.
4. Click **Sambungkan** and pick the PRJ-58D in the browser's device picker.
5. Click **Test Print** and verify a sample receipt prints correctly.
6. From any order page, **Cetak Struk** now prints directly — no browser
   print dialog.

### Browser support (Web Serial API)

| Browser                  | Bluetooth SPP support                          |
| ------------------------ | ---------------------------------------------- |
| Chrome / Edge desktop    | ✅ 117+ (RFCOMM/SPP over Web Serial)            |
| Chrome Android           | ✅ 138+ (RFCOMM serial emulation)               |
| Firefox desktop          | ⚠️ 151+ (USB serial only — no Bluetooth SPP)    |
| Safari / iOS             | ❌ Not supported                                |

Since the cashier uses an **Android phone**, make sure Chrome for Android is
version 138 or newer (check in Chrome → Settings → About Chrome). On
unsupported browsers the UI shows an explanatory error and the app falls back
to the **Print Browser** provider.

### Behavior details

- **Reconnect:** after a page refresh the provider silently reconnects to the
  previously granted port (`navigator.serial.getPorts()`) — no picker needed.
  If the printer is off, "Sambungkan" opens the picker again.
- **Fallback:** while the Bluetooth provider is selected but not connected,
  the receipt page shows a "Cetak via Browser" button that uses the browser
  print dialog instead.
- **Write safety:** payloads are written in 512-byte chunks with a short delay
  between chunks to avoid overflowing the printer's receive buffer.
- **Error handling:** if the printer loses power mid-print, the connection is
  dropped and an informative error message is shown.

## Receipt format

Receipts are rendered as monospace text from one pure formatter
(`src/lib/receipt/receipt-service.ts`):

- **58mm** → 32 characters per line
- **80mm** → 48 characters per line

The ESC/POS provider (`src/lib/printer/escpos-encoder.ts`) encodes this text
byte-for-byte (CP437 character table, with fallbacks for common Unicode
symbols), so the printout matches the on-screen preview exactly.

## What is still worth confirming on hardware

1. **Print quality check** — run a Test Print at 58mm and confirm alignment,
   density, and the partial auto-cut behave as expected.
2. **Baud rate** — irrelevant for Bluetooth RFCOMM, but if the printer is ever
   used over USB-serial, verify it expects 9600 (current default).
3. **Android Chrome version** — 138+ on the cashier's phone.

## Remaining provider ideas (not implemented)

- **Android bridge**: a small helper app for guaranteed-reliable printing on
  Android tablets (Web Serial depends on Chrome 138+).
- **Desktop agent**: a local helper listening on localhost for kiosk setups.
