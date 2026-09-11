# Printer Compatibility — P1NTO

This document separates **receipt correctness**, **browser printing**, and **direct ESC/POS transport**. Payment confirmation, receipt issuance, printing, and dining-session closure are independent operations: a printer failure must never duplicate or reverse a payment, and a successful print must never close a table automatically.

## Support status

| Path | Provider id | Status | Evidence / constraint |
| --- | --- | --- | --- |
| Browser/system print | `web-print` | Supported application fallback; release verification required | Uses the OS print dialog and an installed printer driver. 58 mm or 80 mm. Test margins, scaling, wrapping, and header/footer settings on the cashier device. |
| ESC/POS over Web Serial (Bluetooth Classic SPP) | `escpos-bluetooth` | Experimental; device/browser verification required | Requires a browser that exposes a usable serial port and a printer/OS pairing that presents Bluetooth Classic SPP as that port. Primarily 58 mm for the PRJ-58D candidate. |
| Web Bluetooth (BLE) | `web-bluetooth` | Implemented; device verification required | BLE GATT transport with the ESC/POS encoder. Not a substitute for Classic SPP: an RFCOMM/SPP-only printer normally will not appear on a BLE scan. |
| RawBT (Android intent bridge) | `android-print-bridge` | Implemented; requires the RawBT app | Hands the encoded receipt to the RawBT Android app instead of printing from the browser. Device-dependent. |
| Desktop print agent | `desktop-print-agent` | Not implemented (stub) | Reserved fallback if the direct browser transports prove unreliable. |

**PandaPrinter PRJ-58D status: owner-reported working; not independently verified in this repository.** The owner reports the physical unit printing correctly, and commits `2b63311` / `76121fb` added the Web Bluetooth (BLE) and RawBT direct paths. That is an operator report plus source-code support — it is not captured evidence. No hardware test log, photo, captured receipt, port trace, or signed test record is attached here proving the actual unit's protocol, character table, buffer handling, cut/feed support, or sustained print reliability. The matrix below is how that report becomes a verified record.

## Recommended production baseline

Use browser/system print as the default until the exact cashier device, browser build, OS, and physical printer pass the matrix below. It has broader compatibility because the operating system owns USB/Bluetooth pairing and the printer driver. The trade-off is a print dialog and device-specific page setup.

Configure and verify:

- the real printer driver and selected queue;
- 58 mm or 80 mm media size, 100% scaling, minimal margins, and unwanted browser headers/footers disabled;
- complete totals and payment method (`CASH` or manual `QRIS`) on the immutable receipt snapshot;
- cancel, offline, paper-out, and reprint behavior; and
- no automatic payment mutation or table closure after `window.print()` (browsers do not reliably prove ink/paper output).

## Web Serial, Classic SPP, and browser pairing limits

Bluetooth Classic **Serial Port Profile (SPP)** uses RFCOMM to emulate a serial link. Web Serial can use it only when the operating system and browser expose the paired RFCOMM service as a serial port. This is not the same as general Bluetooth access and is not guaranteed merely because the device can pair at the OS level.

Important constraints:

1. **Secure context and support.** Web Serial requires HTTPS (localhost is the development exception) and a compatible Chromium-family implementation. Safari/iOS does not provide Web Serial. Firefox support must not be assumed for Bluetooth Classic SPP.
2. **User gesture and picker.** `navigator.serial.requestPort()` requires an explicit user action. A site cannot silently discover or pair an arbitrary Classic Bluetooth printer.
3. **OS pairing comes first.** Pair the printer in system Bluetooth settings. Some OS/browser combinations expose the resulting RFCOMM COM/tty port; others do not, especially on mobile. A browser/device picker that does not list the printer cannot be fixed by application JavaScript.
4. **Prior permission is origin- and profile-scoped.** `navigator.serial.getPorts()` can return previously granted ports, but clearing browser data, changing origin/profile, OS re-pairing, permission revocation, or a device identifier change can require a new user selection.
5. **No universal Android claim.** Chrome/Chromium version alone does not guarantee that a specific Android build exposes Classic SPP through Web Serial. OEM Bluetooth stacks and browser feature availability vary. Test the exact production handset/tablet and browser build.
6. **Web Bluetooth is not a substitute.** A Classic-only SPP device exposes no BLE GATT service for Web Bluetooth. Conversely, a BLE printer needs its documented GATT service/characteristics and a different provider.
7. **Serial settings and ESC/POS dialect vary.** Paired RFCOMM may hide baud settings, but USB serial may require the correct baud/data/stop/parity configuration. ESC/POS compatibility does not prove matching code page, image commands, cut command, drawer pulse, status reporting, or buffer size.
8. **Browser success is not paper success.** Resolving a stream write usually means bytes reached the OS buffer, not that paper printed. Many low-cost printers provide no usable browser-level completion/status signal.

Do not hard-code or publish a default PIN as a guaranteed PRJ-58D fact. Use the label/manual supplied with the actual unit and change any configurable default where possible.

## Direct-print connection procedure (test only)

1. Power the physical printer, load the correct paper, and pair it in the cashier device's OS settings using the unit's supplied documentation.
2. Open P1NTO over HTTPS in the exact supported browser/profile that will be used at the counter.
3. From a user click/tap, request a serial port and select the OS-exposed printer port. If none appears, stop and use browser print; do not weaken browser security or install an unknown extension.
4. Send a small ASCII-only test receipt. Then test Indonesian text, punctuation, long item names, quantities, large totals, line feeds, and any feed/cut command actually used.
5. Power-cycle, refresh, revoke permission, re-pair, and repeat. Verify reconnection behavior is understandable and never triggers an unsolicited print.
6. Run repeated and long receipts to detect truncation/buffer overflow. Validate chunking/delay on the physical model rather than treating current constants as universal.
7. Capture the evidence listed below before changing status from experimental.

## PRJ-58D physical verification matrix

Record exact values; do not replace unknowns with assumptions.

| Item                | Evidence required                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hardware identity   | Photos of model/serial label and power rating; vendor manual/datasheet revision.                                                                     |
| Cashier platform    | Device model, OS/build, architecture, browser name/version/profile, P1NTO origin.                                                                    |
| Pairing/port        | OS pairing steps, whether an RFCOMM COM/tty port is created, browser picker screenshot, permission/reconnect results.                                |
| Command behavior    | Raw test payload version; ASCII and Indonesian sample; code page; width; feed; cut/tear behavior; status/error response if any.                      |
| Reliability         | At least repeated short/long prints, power-cycle, printer-off mid-write, paper-out, reconnect, refresh, permission reset, and rapid reprint results. |
| Receipt correctness | 58 mm wrapping (target formatter width 32 characters), totals, CASH/QRIS label, order/session/receipt identifiers, timestamp, and no clipped lines.  |
| Failure isolation   | Database evidence that canceled/failed/retried prints create no extra payment, receipt, or session closure.                                          |
| Approval            | Tester/date, captured receipt photos, logs with secrets/customer data redacted, and explicit go/no-go decision.                                      |

Until all applicable rows pass, record PRJ-58D as **owner-reported working, not independently verified**, and keep browser print available as the fallback.

## Receipt and print-attempt rules

- Render from the immutable receipt snapshot associated with a recorded payment, not from mutable product/catalog rows.
- One payment maps to one receipt target (order or dining session); reprint the same receipt identifier.
- Create a print-attempt record for requested/succeeded/failed where the approved backend supports it. Treat browser-dialog completion conservatively because it cannot prove physical output.
- Include non-secret printer metadata needed for support (provider, width, browser/device class), but never store pairing PINs, session tokens, Supabase keys, or unrelated device identifiers.
- Bound receipt size and serial write chunks; serialize writes per printer to prevent interleaving.
- On disconnect, abort/close the writer cleanly, surface a retry action, and leave payment/receipt/session state untouched.

## Security constraints

- Web Serial device access must start from a deliberate cashier gesture on an authenticated, authorized page.
- Do not auto-print attacker-controlled text or emit raw ESC/POS from customer input. Sanitize/normalize notes and encode only through the receipt formatter.
- Do not send project data, receipt data, or device identifiers to third-party printer services without explicit approval and a data-processing review.
- Keep browser/system print as a safe fallback; never instruct operators to disable HTTPS, browser isolation, or permission prompts.
- Printer configuration stored in browser storage is a convenience preference, not an authorization control.

## Release decision

A production compatibility statement must name the exact printer hardware revision, connection type, cashier device/OS, browser version, paper width, and evidence date. Generic claims such as “Bluetooth printer supported,” “Chrome supports SPP,” or “PRJ-58D works” are insufficient. When any element changes, rerun the relevant matrix and retain the previous evidence for incident comparison.
