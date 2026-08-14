-- Enable public read access for active tables so customers can scan QR codes
create policy "Public read active tables" on public.tables for select using (is_active = true);
