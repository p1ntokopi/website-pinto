-- 0032_testimonials.sql
-- Tabel testimoni pelanggan dengan moderasi oleh Owner.
-- Pengunjung publik dapat mengirimkan testimoni (status default 'pending').
-- Owner dapat menyetujui (approved), menolak (rejected), atau menghapus ulasan.
-- Ulasan yang tampil di homepage hanya yang berstatus 'approved'.

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(trim(customer_name)) > 0),
  customer_role text not null default 'Pelanggan Pinto Kupi',
  rating int not null default 5 check (rating >= 1 and rating <= 5),
  quote text not null check (char_length(trim(quote)) > 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index untuk filter status dan order waktu
create index if not exists idx_testimonials_status_created_at
  on public.testimonials (status, created_at desc);

-- Trigger update updated_at otomatis
drop trigger if exists set_testimonials_updated_at on public.testimonials;
create trigger set_testimonials_updated_at
  before update on public.testimonials
  for each row execute function public.update_updated_at();

-- Enable Row Level Security
alter table public.testimonials enable row level security;

-- 1. Siapapun (termasuk anonim) dapat menambahkan ulasan dengan status 'pending'
drop policy if exists "Public can insert testimonials" on public.testimonials;
create policy "Public can insert testimonials"
  on public.testimonials for insert
  with check (status = 'pending');

-- 2. Publik dapat membaca ulasan yang sudah disetujui ('approved'), owner dapat membaca semua
drop policy if exists "Public read approved testimonials" on public.testimonials;
create policy "Public read approved testimonials"
  on public.testimonials for select
  using (status = 'approved' or is_owner());

-- 3. Hanya Owner yang dapat mengupdate (approve/reject) ulasan
drop policy if exists "Owner update testimonials" on public.testimonials;
create policy "Owner update testimonials"
  on public.testimonials for update
  using (is_owner())
  with check (is_owner());

-- 4. Hanya Owner yang dapat menghapus ulasan
drop policy if exists "Owner delete testimonials" on public.testimonials;
create policy "Owner delete testimonials"
  on public.testimonials for delete
  using (is_owner());

-- Seed data testimoni awal (status approved) agar beranda langsung tampil rapi
insert into public.testimonials (customer_name, customer_role, rating, quote, status)
values
  ('Dimas Aditya', 'Pelanggan tetap Pinto', 5, 'Tempatnya terasa seperti rumah sendiri. Kopinya konsisten, dan selalu ada ruang untuk duduk lebih lama dari yang direncanakan.', 'approved'),
  ('Sarah Maharani', 'Pembeli biji kopi', 5, 'Saya mulai dari satu cangkir, lalu membawa pulang bijinya. Sekarang menyeduh kopi Pinto di rumah setiap pagi.', 'approved'),
  ('Budi Santoso', 'Pengunjung mingguan', 5, 'Kafe yang tenang, kopi yang serius. Tempat yang tepat untuk bekerja, bertemu, atau sekadar menikmati waktu sendiri.', 'approved');
