-- Preferencia por usuario y tabla de qué campos se muestran (y en qué
-- orden) al desplegar una ficha de empresa/contacto/oportunidad.

create table if not exists public.detail_view_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  table_name text not null check (table_name in ('companies', 'contacts', 'opportunities')),
  fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (owner_id, table_name)
);

alter table public.detail_view_settings enable row level security;

create policy "owner_select_detail_view_settings" on public.detail_view_settings
  for select using (auth.uid() = owner_id);
create policy "owner_insert_detail_view_settings" on public.detail_view_settings
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_detail_view_settings" on public.detail_view_settings
  for update using (auth.uid() = owner_id);
create policy "owner_delete_detail_view_settings" on public.detail_view_settings
  for delete using (auth.uid() = owner_id);
