# Pinto Coffee — Audit & Rekomendasi
### Addendum terhadap PRD v1.0 & Master Blueprint v1.0
Versi: 1.1 (Audit) · Tanggal: 14 Agustus 2026 · Status: Rekomendasi, belum diimplementasikan

---

## 1. Ringkasan Eksekutif

PRD dan Master Blueprint v1.0 yang sudah dibuat **secara struktural sudah kuat**: ERD, state machine order/payment, sitemap, design system, dan roadmap sudah saling konsisten dan cukup detail untuk langsung dijadikan acuan development. Dokumen ini bukan revisi total, melainkan **lapisan tambahan** yang menutup celah-celah yang baru kelihatan begitu produk dipakai secara nyata di coffee shop fisik — bukan cuma di atas kertas.

Audit ini dibagi jadi lima bagian:
1. Kekuatan dokumen existing (baseline)
2. Temuan gap, dikelompokkan per kategori
3. Penambahan pada ERD/schema
4. Business rules tambahan
5. Prioritas implementasi (dipetakan ke roadmap/sprint yang sudah ada)

---

## 2. Kekuatan Dokumen Existing (Baseline yang Dipertahankan)

Poin-poin ini **sudah benar** dan tidak perlu diubah — disebutkan di sini supaya addendum ini bisa dibaca berdiri sendiri tanpa perlu bolak-balik ke dokumen asli:

- Konsep **Dining Session** (satu meja bisa punya banyak order) sudah tepat sebagai fondasi.
- **Snapshot pricing** di `order_items` (harga tidak berubah walau menu diedit) — ini keputusan yang sering dilewatkan tim pemula, dan di sini sudah benar sejak awal.
- **Webhook idempotent** untuk Midtrans sudah eksplisit disebut sebagai requirement, bukan asumsi.
- Pemisahan `order_status` dan `payment_status` sebagai dua state machine independen.
- Server-side price recalculation ("jangan percaya harga dari client") sudah jadi security requirement eksplisit.
- Struktur Next.js modular monolith untuk skala single coffee shop — pilihan yang tepat, tidak over-engineered ke microservices.

---

## 3. Temuan Audit — Gap Analysis

### 3.1 Keamanan & Anti-Fraud QR/Table Session
**Masalah:** QR di dokumen asli berupa URL statis (`/t/table-07`). Ini rawan disalahgunakan:
- QR bisa di-screenshot/dibagikan, sehingga siapa pun dari luar cafe bisa membuka menu meja tersebut dan membuat order seolah-olah sedang duduk di sana.
- Tidak ada batas waktu (TTL) atau mekanisme rotasi token.

**Rekomendasi:**
- Ganti slug statis dengan **signed token dengan expiry** (misal JWT pendek atau token acak yang di-refresh berkala), bukan `table_number` yang predictable.
- Token di-generate ulang setiap kali dining session baru dibuka oleh staff (bukan permanen menempel di stiker QR meja — atau, kalau stiker QR memang statis secara fisik, redirect-kan ke endpoint yang memvalidasi token session yang masih aktif di backend).
- Opsional tapi direkomendasikan: staff mengaktifkan meja (`table.status = occupied`) sebelum QR bisa dipakai order — order ke meja berstatus `available` otomatis ditolak.

### 3.2 Bisnis & Pembayaran
**Masalah:** Seluruh flow pembayaran mengasumsikan 100% online via Midtrans. Realistanya, banyak coffee shop Indonesia masih butuh opsi bayar tunai/manual di kasir.

**Rekomendasi:**
- Tambahkan payment method `CASH` sebagai jalur paralel: order tetap dibuat lewat app, tapi status `PAID` di-set manual oleh staff kasir setelah menerima uang tunai (dengan role permission khusus, tercatat di `audit_logs`).
- **Tax & service charge** disebut di receipt tapi belum ada mekanisme konfigurasinya — perlu tabel/settings sederhana: persentase pajak, persentase service charge, aktif/nonaktif, apakah dihitung dari subtotal atau per kategori.
- **Refund** baru berupa state (`REFUNDED`), belum ada proses. Perlu didefinisikan: siapa yang boleh trigger (role admin/owner), refund penuh vs sebagian per item, dan integrasi ke Refund API Midtrans (bukan cuma update status lokal).
- **Promo/diskon** boleh tetap masuk kategori "future", tapi field `discount_amount` sebaiknya sudah disiapkan di schema `orders` sejak awal — jauh lebih murah dari migration besar nanti.

### 3.3 Order & Kitchen Lifecycle
**Masalah:** Flow saat ini asumsi semua order berjalan mulus dari `PENDING` ke `COMPLETED`. Tidak ada penanganan untuk:
- Staff perlu **menolak/menyesuaikan order** setelah masuk (misal stok habis setelah order dibuat tapi sebelum `CONFIRMED`).
- **Race condition**: dua staff menekan "Accept" di order yang sama secara bersamaan.
- **Order aging** — tidak ada indikator visual di kitchen board untuk order yang sudah menunggu lama, padahal ini fitur standar di hampir semua KDS (Kitchen Display System) modern.

**Rekomendasi:**
- Tambahkan flow *staff reject order* dengan alasan wajib diisi (out of stock, tidak bisa dibuat, dll), status baru atau transisi ke `CANCELLED` dengan `cancel_reason`.
- Terapkan **optimistic locking**: setiap update status menyertakan `version` yang diharapkan; jika sudah berubah duluan, update ditolak dan staff kedua melihat notifikasi "order sudah diproses staff lain".
- Kitchen board menampilkan **warna berbeda berdasarkan waktu tunggu** (misal hijau <5 menit, kuning 5–10 menit, merah >10 menit) dihitung dari `created_at` order.

### 3.4 Notifikasi ke Customer
**Masalah:** Tracking status order hanya bisa dilihat kalau customer aktif membuka halaman order-nya. Tidak ada alert aktif saat order siap.

**Rekomendasi:**
- MVP: browser push notification (jika app di-install sebagai PWA) atau vibration/sound saat status berubah ke `READY` selama tab masih terbuka.
- Fase lanjut (sudah disebut sebagai future expansion di dokumen asli — didukung di sini): integrasi WhatsApp notification untuk alert "pesanan siap" tanpa customer harus membuka app terus-menerus.

### 3.5 UX Multi-Orang per Satu Meja
**Masalah:** Ini gap konseptual yang perlu diputuskan **sebelum** coding, karena mempengaruhi struktur data. Dining Session mendukung banyak order per meja, tapi belum jelas: kalau 4 orang di satu meja scan QR yang sama secara bersamaan —
- Apakah mereka melihat **satu shared cart** (kolaboratif, semua bisa nambah item ke cart yang sama), atau
- Setiap orang punya **cart individual** yang jadi order terpisah (lebih simpel tapi kurang natural untuk grup)?

**Rekomendasi:** Pilih salah satu secara eksplisit di level PRD sebelum sprint 3 (customer ordering) dimulai:

| Model | Kelebihan | Kekurangan |
|---|---|---|
| Shared Cart per Session | Natural untuk grup, satu bill | Butuh realtime sync cart antar device, kompleksitas state lebih tinggi |
| Individual Order per Scan | Simpel, sudah sejalan dengan model "banyak order per session" yang ada | Split bill manual, tiap orang harus bayar sendiri-sendiri |

Rekomendasi: mulai dari **Individual Order per Scan** untuk MVP (lebih sejalan dengan arsitektur yang sudah dirancang), shared cart masuk fase lanjutan jika dibutuhkan.

### 3.6 Kepatuhan Data & Legal
**Masalah:** Checkout mengumpulkan data optional customer (kemungkinan nama/nomor HP), tapi tidak ada pembahasan kepatuhan terhadap **UU PDP (UU No. 27/2022 — Perlindungan Data Pribadi)**, yang berlaku untuk semua bisnis di Indonesia yang menyimpan data kontak pelanggan.

**Rekomendasi:**
- Tambahkan consent checkbox singkat saat customer mengisi data optional.
- Definisikan retention policy: berapa lama data disimpan, siapa yang bisa akses (role-based, sudah ada fondasinya lewat RLS).
- Tambahkan halaman **Kebijakan Privasi** dan **Kebijakan Refund/TOS** di company profile — penting begitu ada transaksi uang riil lewat Midtrans.

### 3.7 Ketahanan Teknis & Operasional
| Isu | Kenapa penting | Rekomendasi |
|---|---|---|
| Wifi cafe tidak stabil | Customer order dari dalam fisik cafe, bukan dari rumah dengan koneksi bagus | Minimal cache menu via service worker (PWA-lite), retry queue untuk submit order |
| Tidak ada staging environment | Langsung MVP → production berisiko untuk test webhook & migration | Supabase project terpisah untuk staging, Midtrans sandbox key terpisah dari production key |
| Rate limiting endpoint publik | Endpoint create-order/create-payment bisa diakses tanpa login | Rate limit per IP/per table token (Vercel Edge Middleware atau Upstash) |
| Monitoring & error tracking | "Observability" disebut general di NFR tapi belum ada tool | Sentry (atau setara) untuk error tracking, uptime monitor untuk webhook endpoint |
| Backup/DR belum konkret | DoD menyebut "dipahami sebelum launch" tapi tanpa target | Tentukan RPO/RTO eksplisit; manfaatkan point-in-time recovery Supabase |
| Analytics funnel marketing | Sitemap company profile lengkap tapi tanpa tracking | GA4/Meta Pixel di halaman marketing; event funnel scan→menu→order→pay di sisi admin untuk lihat drop-off |
| Keterbacaan UI outdoor | Banyak coffee shop punya area outdoor/teras, customer scan QR di bawah sinar matahari langsung | Cek kontras warna Cream/Paper (#F7F5F0) khusus untuk kondisi cahaya terang, bukan cuma di studio desain |

---

## 4. Penambahan pada ERD / Schema

Field tambahan yang disarankan pada tabel yang sudah ada (bukan tabel baru, supaya minim disrupsi terhadap desain existing):

| Tabel | Field baru | Alasan |
|---|---|---|
| `tables` | `qr_token`, `qr_expires_at` | Anti-fraud QR (3.1) |
| `dining_sessions` | `guest_count` (opsional) | Berguna untuk reporting kapasitas meja |
| `orders` | `discount_amount`, `tax_amount`, `service_charge_amount`, `version` (int, untuk optimistic lock), `cancel_reason` | Menutup gap 3.2 dan 3.3 |
| `payments` | `method` (enum: `midtrans` \| `cash`), `received_by` (staff id, untuk cash), `refund_amount`, `refunded_at`, `refunded_by` | Menutup gap 3.2 |
| `audit_logs` | *(sudah ada, tidak perlu field baru)* | Pastikan reject order & refund selalu ditulis ke sini |

---

## 5. Business Rules Tambahan

Ditambahkan ke daftar "Critical Business Rules" yang sudah ada di PRD asli:

- QR table token punya masa berlaku; token kedaluwarsa menampilkan halaman "sesi tidak aktif, hubungi staff".
- Order hanya bisa ditolak staff **sebelum** status `CONFIRMED`; setelah `CONFIRMED`, perubahan wajib lewat flow refund/adjustment, bukan reject langsung.
- Setiap update status order menyertakan `version` yang diharapkan (optimistic locking) — update dengan version usang ditolak server.
- Pembayaran tunai (`CASH`) hanya bisa ditandai `PAID` oleh akun dengan role staff/admin, tercatat siapa yang menerima (`received_by`).
- Refund sebagian (partial) hanya berlaku per item, dihitung ulang dari snapshot harga di `order_items`, bukan dari harga menu saat ini.

---

## 6. Prioritas Implementasi

### Wajib sebelum coding dimulai (masuk Phase 0–1 / Sprint 1)
1. Putuskan model cart: **Individual Order per Scan** (lihat 3.5) — mempengaruhi struktur `dining_sessions` sejak awal.
2. Desain mekanisme QR token dengan expiry, bukan slug statis.
3. Tambahkan field `discount_amount`, `tax_amount`, `service_charge_amount`, `version` ke schema `orders` sejak migration pertama.
4. Tambahkan `method` enum di `payments` untuk mendukung `CASH` sejak awal (meski UI cash belum dibangun di MVP).

### Sebelum fase Admin/Kitchen (Sprint 4–5)
5. Flow reject/adjust order oleh staff + alasan wajib.
6. Optimistic locking pada update status order.
7. Order aging indicator (color-coded) di kitchen board.

### Sebelum fase Payment (Sprint 6)
8. Refund flow (partial & full) terintegrasi ke Midtrans Refund API.
9. Konfigurasi tax/service charge (settings sederhana, bisa di-toggle admin).

### Sebelum Production Launch (Sprint 9–10)
10. Halaman Kebijakan Privasi & Refund/TOS di company profile.
11. Staging environment terpisah (Supabase project + Midtrans sandbox key berbeda dari production).
12. Rate limiting di endpoint create-order & create-payment.
13. Error tracking (Sentry) + uptime monitor untuk webhook endpoint.
14. Definisikan RPO/RTO backup secara eksplisit.

### Nice-to-have, boleh masuk roadmap "Future Expansion"
15. Push notification / WhatsApp alert saat order ready.
16. PWA offline-lite untuk cache menu saat wifi cafe tidak stabil.
17. Analytics funnel (GA4/Meta Pixel + event tracking scan→order→pay).
18. Shared cart kolaboratif per meja (upgrade dari model individual).

---

## 7. Catatan Penutup

Dokumen asli (PRD + Master Blueprint) sudah lebih dari cukup sebagai **fondasi arsitektur**. Gap yang ditemukan di sini semuanya bersifat *operational hardening* — hal yang biasanya baru ketahuan lewat pengalaman menjalankan produk serupa, bukan kesalahan desain. Prioritas #1–4 di atas paling penting untuk diputuskan **sebelum** baris kode pertama ditulis, karena keempatnya mempengaruhi struktur schema dan bakal mahal untuk diubah setelah data mulai berjalan di production.
