-- 0023_app_settings.sql
-- Singleton business-profile settings, editable by the OWNER, readable by
-- everyone (marketing pages, receipts, customer views). Replaces the
-- hard-coded config in src/config/business.ts as the source of truth.

create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'Pinto Coffee',
  tagline text not null default 'Kopi • Makanan • Biji Kopi',
  address text not null default 'Jl. Flamboyan No. 8, Perumahan Bumi Insani, Tajur Halang, Bogor',
  website text not null default 'www.pintokopi.web.id',
  wifi_name text not null default 'P1NTO',
  wifi_password text not null default 'terimakasih',
  footer_message text not null default 'Terima kasih telah berkunjung.',
  opening_hours text not null default '13.00 – 24.00 (Setiap hari)',
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
  before update on public.app_settings
  for each row execute function public.update_updated_at();

alter table public.app_settings enable row level security;

-- Everyone (including anon visitors) can read the public business profile.
drop policy if exists "Public read app_settings" on public.app_settings;
create policy "Public read app_settings"
  on public.app_settings for select
  using (true);

-- Only the owner can edit it.
drop policy if exists "Owner full access app_settings" on public.app_settings;
create policy "Owner full access app_settings"
  on public.app_settings for all
  using (is_owner()) with check (is_owner());
