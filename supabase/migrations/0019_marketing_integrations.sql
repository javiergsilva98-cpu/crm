-- Guarda las credenciales de integraciones de Ads (Meta, Google) por
-- usuario, para poder sincronizar gasto real por canal en vez de
-- introducirlo a mano en /canales. Las credenciales solo se leen en
-- server actions, nunca se mandan al navegador.

create table if not exists public.marketing_integrations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('meta_ads', 'google_ads')),
  credentials jsonb not null default '{}'::jsonb,
  connected_at timestamptz,
  last_synced_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  unique (owner_id, provider)
);

alter table public.marketing_integrations enable row level security;

create policy "owner_select_marketing_integrations" on public.marketing_integrations
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_marketing_integrations" on public.marketing_integrations
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_marketing_integrations" on public.marketing_integrations
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_marketing_integrations" on public.marketing_integrations
  for delete using (auth.uid() = owner_id or public.is_admin());
