# Pintö Kupi (P1NTO) — Roasted & Eatery

[![Production Site](https://img.shields.io/badge/Production-www.pintokupi.my.id-2d6a4f?style=flat-square)](https://www.pintokupi.my.id)
[![Admin Portal](https://img.shields.io/badge/Admin%20Portal-/admin/login-bc6c25?style=flat-square)](https://www.pintokupi.my.id/admin/login)
[![Tests](https://img.shields.io/badge/Vitest-103%20passed-success?style=flat-square)](tests/)
[![Docs Version](https://img.shields.io/badge/Docs%20Version-1.1.0-blue?style=flat-square)](docs/pinto/)

P1NTO adalah sistem terintegrasi pemesanan meja kafe, operasional dapur (KDS), kasir POS, penerbitan struk thermal kekal (*immutable receipts*), dan pelaporan finansial eksekutif berbasis **Next.js 16 (App Router)** dan **PostgreSQL / Supabase**.

Sistem menerapkan model operasional **Cashier-First**: pelanggan membuka sesi meja dan membayar di kasir terlebih dahulu, pesanan disiapkan oleh barista dapur, pelanggan dapat menambah pesanan melalui QR meja ke tagihan yang sama, dan kasir menyelesaikan sesi saat meja dikosongkan.

---

## 📚 Dokumentasi Resmi & Buku Panduan (PDF)

Dokumentasi lengkap sistem telah dikompilasi ke dalam format PDF A4 dan Markdown di direktori [`docs/pinto/`](docs/pinto/):

| Dokumen | Format & Tautan | Sasaran Pembaca | Deskripsi Utama |
|---|---|---|---|
| **Buku Panduan Operasional (Owner & Admin Manual)** | [📄 PDF Resmi (A4)](docs/pinto/P1NTO_OWNER_ADMIN_MANUAL.pdf) · [Markdown](docs/pinto/P1NTO_OWNER_ADMIN_MANUAL.md) | Owner, Manajer Kafe, Supervisor, Kasir, & Barista | Ringkasan Eksekutif Owner, SOP alur *Cashier-First*, matriks hak akses 4 peran, manajemen akun staf, SOP kasir, format struk hemat kertas 58mm, dan skenario nyata. |
| **Dokumentasi Sistem & Referensi Teknis** | [📄 PDF Resmi (A4)](docs/pinto/P1NTO_SYSTEM_DOCUMENTATION.pdf) · [Markdown](docs/pinto/P1NTO_SYSTEM_DOCUMENTATION.md) | Developer, DevOps, & Technical Owner | Arsitektur Next.js 16 + Supabase, skema database, RLS policies, *Security Definer* RPCs, engine cetak ESC/POS, dan spesifikasi 27 rute. |
| **Pusat Indeks Dokumentasi** | [📂 Hub Dokumentasi](docs/pinto/README.md) | Seluruh Tim | Rangkuman audit dokumen, aset visual, dan riwayat revisi rilis. |

---

## 👥 Struktur Peran & Hak Akses Pengguna

Sistem membagi wewenang ke dalam 4 peran (*Role-Based Access Control*):
* **👑 Owner (Pemilik Kafe):** Akses penuh mencakup laporan finansial laba/rugi, beban pengeluaran, manajemen akun staf, pembatalan/penghapusan transaksi, dan profil bisnis kafe.
* **🛡️ Admin (Supervisor / Manajer):** Akses manajerial operasional, manajemen katalog produk, kategori menu, tata letak meja, dan konfigurasi printer kasir.
* **☕ Staff (Kasir):** Operasional POS kasir (buat pesanan baru, terima pembayaran tunai/QRIS, cetak struk thermal, dan selesaikan sesi meja).
* **🍳 Kitchen (Barista & Dapur):** Layar antrean pesanan dapur (KDS) untuk pembaruan status racikan kopi/makanan (`PREPARING` → `READY`).

> [!NOTE]
> Prosedur login operasional, panduan kredensial, dan manajemen akun karyawan terdokumentasi secara terperinci pada dokumen [Buku Panduan Operasional Owner & Admin (`docs/pinto/P1NTO_OWNER_ADMIN_MANUAL.pdf`)](docs/pinto/P1NTO_OWNER_ADMIN_MANUAL.pdf).

---

## 🏗️ Arsitektur Sistem

- **Next.js App Router (React 19)** menyediakan rute pemesanan pelanggan `/t/[slug]`, halaman kasir terotentikasi, antrean dapur KDS, dan antarmuka manajemen Owner.
- **Supabase Auth + PostgreSQL** mengelola identitas, profil peran, Row Level Security (RLS), dan RPCs `SECURITY DEFINER` untuk mutasi transaksional terisolasi.
- **Dining Session (Sesi Meja)** bertindak sebagai batas satu tagihan (*bill boundary*). Sebuah partial unique index memastikan hanya ada satu sesi `open` per meja; semua pesanan tambahan terikat ke sesi ini.
- **Pemisahan Mesin Status:** Status pemesanan (`NEW → PREPARING → READY → SERVED`) terpisah dari status pembayaran (`UNPAID → PAID`). Konfirmasi bayar tidak mengubah progres racikan kopi.
- **Struk Kekal (*Immutable Receipt*):** Setiap pembayaran menerbitkan snapshot struk permanen (`receipts`). Percetakan ulang struk tidak pernah menduplikasi transaksi.
- **Struk Thermal 58mm Hemat Kertas:** Header ID order berulang (`ORDER Pinto-...`) dihilangkan pada struk kasir agar menghemat panjang kertas thermal kasir hingga 35%, dengan identitas resmi **Pinto Kupi** dan situs **www.pintokupi.my.id**.

---

## ⚡ Alur Operasional Utama (Cashier-First)

1. **Pemesanan Awal di Kasir:** Pelanggan memesan di kasir (`/admin/orders/new`), memilih tipe Dine-In, dan menetapkan meja.
2. **Review & Konfirmasi:** Kasir memverifikasi item dan total pesanan bersama pelanggan sebelum disimpan ke sistem.
3. **Buka Sesi Meja:** Konfirmasi pesanan otomatis membuka sesi meja aktif (`dining_sessions`). Pelanggan menerima nomor stand meja dan menuju tempat duduk.
4. **Kanal Tambahan via QR Meja:** Pelanggan dapat memindai QR stand meja untuk menambah pesanan. Pesanan baru otomatis tersambung ke tagihan sesi meja yang sama. QR meja **tidak dapat** membuka sesi baru secara mandiri jika belum dibuka kasir.
5. **Proses Dapur (KDS):** Barista/dapur memproses pesanan melalui antrean KDS dari `NEW` → `PREPARING` → `READY`, lalu pelayan mengantar ke meja (`SERVED`).
6. **Pembayaran Terpusat:** Pelanggan membayar di kasir dengan **CASH** atau **QRIS Manual**. Kasir memvalidasi nominal/mutasi sebelum konfirmasi.
7. **Penerbitan Struk & Penutupan Meja:** Struk thermal dicetak, sesi meja diselesaikan secara eksplisit oleh kasir, dan status meja kembali *Tersedia*.

---

## 💻 Panduan Pengembangan Lokal

### Kebutuhan Sistem
* Node.js v20+ atau v24+
* npm v10+
* Proyek Supabase aktif (atau stack lokal Supabase)

### Instalasi & Menjalankan Dev Server
```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server lokal
npm run dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000).

### Perintah Pengujian & Verifikasi Kualitas
```bash
# Menjalankan seluruh 103 unit test Vitest
npm test

# Menjalankan linter ESLint
npm run lint

# Memeriksa static type TypeScript
npx tsc --noEmit

# Menguji build produksi Next.js
npm run build

# Mengaudit konsistensi dokumentasi, tautan, & gambar
node scripts/verify-documentation.js

# Mengompilasi ulang dokumentasi markdown ke PDF resmi (Playwright)
node scripts/generate-pdf.js
```

---

## 🔐 Variabel Lingkungan (*Environment Variables*)

Konfigurasi lingkungan disimpan dalam file `.env` di root proyek:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application URLs
NEXT_PUBLIC_APP_URL=https://www.pintokupi.my.id
NEXT_PUBLIC_SITE_URL=https://www.pintokupi.my.id
NEXT_PUBLIC_WHATSAPP_NUMBER=628xxxxxxxxxx

# Cloudflare R2 Media Storage
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://media.pintokupi.my.id
NEXT_PUBLIC_R2_PUBLIC_URL=https://media.pintokupi.my.id
```

---

## 🛡️ Batasan Keamanan Produksi

- Protokol HTTPS wajib aktif di lingkungan produksi.
- Seluruh `SUPABASE_SERVICE_ROLE_KEY` terisolasi di sisi server (Node.js runtime) dan tidak pernah diekspos ke klien peramban.
- Akses anonim di meja dibatasi oleh token sesi aman bertipe `HttpOnly` (`pinto_dining_session`), mencegah manipulasi pesanan lintas meja.
- Tabel sensitif finansial (`expenses`, `financial_adjustments`) dikunci dengan RLS khusus fungsi `is_owner()`.
- Mutasi transaksi (pesanan, pembayaran, sesi meja) diwajibkan melalui Stored Procedures resmi dengan verifikasi status atomic (*idempotent locks*).

---

## 📄 Lisensi & Hak Cipta

Dokumen dan seluruh kode sumber dilindungi hak cipta © 2026 **Pintö Kupi (P1NTO) — Roasted & Eatery**. Seluruh hak cipta dilindungi undang-undang.
