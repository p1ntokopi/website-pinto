# M5 — Manual Testing Checklist

Pinto Coffee · Real-time notifications, order queue polish, payment abstraction,
receipt formatting, and printer abstraction.

Run each section after a fresh build. Prerequisites: an admin user, a staff user,
a kitchen user, and an active table QR (`/admin/tables`).

## 1. Realtime order notifications (admin dashboard)

- [ ] Open `/admin` in two browser tabs, logged in as admin in both.
- [ ] Place an order from a table QR (`/t/<slug>/menu`).
- [ ] **Both** tabs show a toast "Pesanan Baru" and the bell badge increments once.
- [ ] Only **one** tab plays the chime (Web Locks single-notify).
- [ ] The bell in the header shows the unread count; the bottom-nav "Pesanan"
      badge shows it too on mobile.
- [ ] "Tandai semua dibaca" clears the badge in every open tab (BroadcastChannel).
- [ ] Toggle "Suara" off → new orders still toast/badge but no sound.
- [ ] Toggle the master "Suara & notifikasi desktop" off → no sound, no browser
      notification; toasts + badge still appear.
- [ ] Click "Aktifkan" (desktop notifications) → browser asks permission; once
      granted, a system notification appears for the next order and the toggle
      reflects it.
- [ ] The KDS (`/admin/kitchen`) also chimes when a new operational order lands
      (gated by the same preference).
- [ ] Kill the network briefly → "Menyambung ulang" pulse shows; on reconnect the
      list reconciles orders missed while offline.

## 2. Order queue polish

- [ ] The orders list shows **Pembayaran** status (Lunas / Belum Bayar /
      Menunggu Bayar / Kedaluwarsa) from the latest `payments` row.
- [ ] Item count column renders correctly.
- [ ] Orders in PENDING / PENDING_PAYMENT created within the last 90s are
      highlighted with a pulsing dot; the highlight fades out.
- [ ] Filter chips + search (order number / table) still work and show counts.
- [ ] Mobile card view shows order number, table/takeaway, item count, total,
      payment label, and status.

## 3. Order detail + receipt

- [ ] Open an order → payment section shows Status, Metode (channel name, e.g.
      DANA/BCA), Nominal, Dibayar Pada.
- [ ] "Cetak Struk" navigates to the receipt print page.
- [ ] The receipt print page auto-opens the print dialog after ~0.5s.
- [ ] The 58mm/80mm toggle changes the preview width; every line stays within
      32 (58mm) / 48 (80mm) chars.
- [ ] The printed page has no header/footer margins (monochrome, pure white).
- [ ] An unpaid (PENDING_PAYMENT) order prints "BELUM DIBAYAR"; a paid order
      prints "PAID" with the payment channel.
- [ ] Popup-blocked environments: "Cetak Struk" from the button in
      `NotificationControl`/orders still opens in-app (no reliance on popups).

## 4. Payment abstraction (regression — Xendit must keep working)

- [ ] Place an order → redirected to Xendit payment link exactly as before.
- [ ] Complete payment → order moves PENDING_PAYMENT → PENDING and appears in
      the kitchen queue (webhook path unchanged).
- [ ] Initiate payment twice before expiry → same still-valid payment link is
      reused (no duplicate session).
- [ ] After expiry → a fresh session is created and the old payment is marked
      EXPIRED.
- [ ] CASH/MANUAL are not selectable anywhere in the UI (dormant providers).

## 5. Status updates + error toasts

- [ ] Advancing status from the dashboard and KDS still works and logs history.
- [ ] Force a failure (e.g. stop the DB connection) → an error toast appears
      ("Gagal memperbarui status") in both dashboard and KDS.
- [ ] Kitchen sound no longer depends on the missing `/notification.mp3`.

## 6. Automated checks

- [ ] `npm test` → all unit tests pass (status-machine, receipt-service,
      payment-service dispatch, notification preferences).
- [ ] `npm run lint` passes.
- [ ] `npx tsc --noEmit` passes.
- [ ] `npm run build` completes.

## Known limitations (by design)

- One notification per order id (per browser session), no persistence across
  reloads — the badge is in-memory.
- Browser notifications require HTTPS and a granted permission.
- Printer: browser-print only until the printer model is confirmed
  (see `docs/printer-compatibility.md`).