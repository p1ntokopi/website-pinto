# Dokumentasi Resmi Sistem P1NTO Kopi

Selamat datang di repositori dokumentasi resmi sistem operasional, pemesanan, dan kasir (POS) **P1NTO Kopi** (*Pintö Kupi — Roasted and Eatery*). Seluruh dokumentasi dalam direktori ini disusun berdasarkan audit mendalam terhadap implementasi nyata basis kode dan skema basis data produksi.

---

## 📌 Metadata Sistem & Dokumen

| Parameter | Keterangan |
|---|---|
| **Situs Web Produksi** | [https://www.pintokupi.my.id](https://www.pintokupi.my.id) |
| **Versi Dokumen** | 1.1.0 (Production Release) |
| **Commit Acuan Basis Data/Kode** | `2851d0e` |
| **Tanggal Pembaruan Terakhir** | 20 September 2026 |
| **Penyusun** | Tim Engineering & Operasional P1NTO Kopi |
| **Status Verifikasi** | Lulus Audit Kode Sumber, Vitest (103/103), Typecheck (0 error), Lint (0 error), Build Produksi (27 rute) |

---

## 📚 Dokumen yang Tersedia

Dokumentasi ini dirancang ke dalam dua buku panduan utama yang saling melengkapi untuk audiens operasional dan teknis:

### 1. [Buku Panduan Operasional: Owner & Admin Manual](P1NTO_OWNER_ADMIN_MANUAL.md)
* **Format:** [Markdown](P1NTO_OWNER_ADMIN_MANUAL.md) & [PDF Resmi](P1NTO_OWNER_ADMIN_MANUAL.pdf)
* **Target Pembaca:** Pemilik Bisnis (*Owner*), Manajer Kafe, Supervisor, Kasir, dan Staf Lantai/Barista.
* **Fokus:** Standar Operasional Prosedur (SOP) harian, alur pemesanan *Cashier-First*, hak akses peran & kredensial login bawaan (`owner@pinto.kupi` / `admin@pinto.kopi`), panduan Owner kelola staf (`/admin/owner/accounts`), pembayaran tunai & QRIS manual, format struk thermal hemat kertas (omisi header ID order), konfigurasi printer 58 mm, skenario bisnis kafe, serta panduan finansial khusus Owner.

### 2. [Dokumentasi Sistem & Referensi Arsitektur Teknis](P1NTO_SYSTEM_DOCUMENTATION.md)
* **Format:** [Markdown](P1NTO_SYSTEM_DOCUMENTATION.md) & [PDF Resmi](P1NTO_SYSTEM_DOCUMENTATION.pdf)
* **Target Pembaca:** *Owner* teknis, Administrator Sistem, DevOps, dan Pengembang Perangkat Lunak masa depan (*Maintainer*).
* **Fokus:** Arsitektur Next.js 16 App Router & React 19, skema PostgreSQL/Supabase, aturan keamanan baris (RLS), *Security Definer* RPCs, idempotensi transaksi, mekanisme penguncian *advisory locks*, format snapshot struk kekal, alur polling terisolasi QR meja, kredensial bawaan lingkungan (*seed accounts*), dan domain resmi `www.pintokupi.my.id`.

---

## 🧭 Struktur Direktori Dokumentasi

```text
docs/pinto/
├── README.md                          # Indeks & ringkasan dokumentasi resmi
├── P1NTO_OWNER_ADMIN_MANUAL.md        # Dokumen A: Manual Operasional & SOP Kasir (Markdown)
├── P1NTO_OWNER_ADMIN_MANUAL.pdf       # Dokumen A: Manual Operasional & SOP Kasir (PDF Resmi A4)
├── P1NTO_SYSTEM_DOCUMENTATION.md      # Dokumen B: Dokumentasi Sistem & Teknis (Markdown)
├── P1NTO_SYSTEM_DOCUMENTATION.pdf     # Dokumen B: Dokumentasi Sistem & Teknis (PDF Resmi A4)
├── assets/                            # Brand assets (Pintokupi.webp)
├── diagrams/                          # Diagram alur SVG (Alur Kasir, Arsitektur, Status Pesanan, Sesi Meja)
└── screenshots/                       # Tangkapan layar antarmuka nyata terverifikasi
```

---

## 🎯 Prinsip Utama Sistem P1NTO Kopi

1. **Cashier-First Ordering:** Sesi meja awal selalu dibuka oleh kasir melalui menu *Pesanan Baru* (`/admin/orders/new`). Pelanggan tidak membuka sesi baru secara mandiri dari QR meja.
2. **QR Meja sebagai Kanal Tambah Pesanan:** Scan QR meja (`/t/[slug]`) berfungsi khusus sebagai kanal *Tambah Pesanan* untuk sesi meja yang sudah aktif. Jika meja belum memiliki sesi aktif, sistem menolak pemesanan dan mengarahkan pelanggan ke kasir.
3. **Satu Sesi Meja = Satu Tagihan (One Bill Boundary):** Seluruh pesanan yang dibuat (baik awal dari kasir maupun tambahan dari QR) digabungkan ke dalam satu tagihan meja. *Split bill* tidak didukung.
4. **Pembayaran Manual & Struk Kekal:** Metode pembayaran resmi adalah **CASH** dan **QRIS Manual Confirmation**. Verifikasi pembayaran dilakukan langsung oleh kasir. Pembayaran menerbitkan snapshot struk yang bersifat kekal (*immutable*).
5. **Penyelesaian Sesi Eksplisit:** Pembayaran lunas tidak otomatis mengosongkan meja. Kasir menyelesaikan sesi secara eksplisit setelah pelanggan selesai makan/minum, sehingga meja kembali berstatus *Tersedia*.

---

## 📋 Riwayat Perubahan Dokumen (Change Log)

| Versi | Tanggal | Perubahan | Disetujui Oleh |
|---|---|---|---|
| **1.1.0** | 20 Sep 2026 | Penambahan Ringkasan Eksekutif Owner, pembaruan hak akses 4 peran, penambahan kredensial login bawaan (`owner@pinto.kupi` / `admin@pinto.kopi`), panduan lengkap Owner kelola staf mandiri, format struk thermal hemat kertas (omisi ID order), sinkronisasi branding `Pinto Kupi`, dan domain resmi `www.pintokupi.my.id`. | Tim Engineering & Management P1NTO Kopi |
| **1.0.0** | 13 Sep 2026 | Rilis dokumentasi operasional dan teknis resmi produksi berbasis audit kode sumber nyata pasca-cutover M5 Cashier-First. | Tim Engineering & Management P1NTO Kopi |
