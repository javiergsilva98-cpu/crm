-- Google Analytics como tercera integración de Marketing: a diferencia de
-- Meta/Google Ads (una cifra de gasto por canal), Analytics reparte
-- sesiones entre varios canales a la vez, así que necesita su propia
-- tabla en vez de reutilizar channel_spend.

alter table public.marketing_integrations drop constraint if exists marketing_integrations_provider_check;
alter table public.marketing_integrations
  add constraint marketing_integrations_provider_check check (provider in ('meta_ads', 'google_ads', 'google_analytics'));

create table if not exists public.channel_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  channel text not null
    check (channel in ('instagram', 'google', 'whatsapp', 'referido', 'tiktok', 'otro')),
  month date not null, -- siempre el día 1 del mes, ej. 2026-07-01
  sessions integer not null default 0,
  created_at timestamptz not null default now(),
  unique (owner_id, channel, month)
);

alter table public.channel_sessions enable row level security;

create policy "owner_select_channel_sessions" on public.channel_sessions
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_channel_sessions" on public.channel_sessions
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_channel_sessions" on public.channel_sessions
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_channel_sessions" on public.channel_sessions
  for delete using (auth.uid() = owner_id or public.is_admin());
