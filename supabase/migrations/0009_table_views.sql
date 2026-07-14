-- Vistas guardadas: columnas visibles + filtros, por tabla. Pueden ser
-- personales (solo el creador) o plantillas visibles para todo el equipo.

create table if not exists public.table_views (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  table_name text not null
    check (table_name in ('companies', 'contacts', 'opportunities', 'invoices', 'expenses')),
  name text not null,
  is_template boolean not null default false,
  filters jsonb not null default '{}'::jsonb,
  visible_columns jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists table_views_table_name_idx on public.table_views (table_name);

alter table public.table_views enable row level security;

create policy "select_own_or_template_views" on public.table_views
  for select using (auth.uid() = owner_id or is_template or public.is_admin());
create policy "owner_insert_views" on public.table_views
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_views" on public.table_views
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_views" on public.table_views
  for delete using (auth.uid() = owner_id or public.is_admin());
