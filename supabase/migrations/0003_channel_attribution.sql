-- Canal de origen por contacto + gasto por canal (incrementos 1 y 2).

-- 1) Canal de origen del contacto -------------------------------------------

alter table public.contacts
  add column if not exists source text
    check (source in ('instagram', 'google', 'whatsapp', 'referido', 'tiktok', 'otro')),
  add column if not exists source_detail text;

create index if not exists contacts_source_idx on public.contacts (source);

-- 2) Gasto por canal (manual hoy, "api" cuando se integre Meta/Google Ads) --

create table if not exists public.channel_spend (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  channel text not null
    check (channel in ('instagram', 'google', 'whatsapp', 'referido', 'tiktok', 'otro')),
  month date not null, -- siempre el día 1 del mes, ej. 2026-07-01
  amount numeric(12, 2) not null default 0,
  source_type text not null default 'manual' check (source_type in ('manual', 'api')),
  created_at timestamptz not null default now(),
  unique (owner_id, channel, month)
);

alter table public.channel_spend enable row level security;

create policy "owner_select_channel_spend" on public.channel_spend
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_channel_spend" on public.channel_spend
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_channel_spend" on public.channel_spend
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_channel_spend" on public.channel_spend
  for delete using (auth.uid() = owner_id or public.is_admin());
