-- Catálogo de servicios: para no escribir a mano el concepto y el precio
-- cada vez que se factura algo recurrente. Se aplican como línea de
-- factura desde Configuración > Servicios.

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  unit_price numeric(12, 2) not null default 0,
  tax_rate numeric(5, 2) not null default 21,
  created_at timestamptz not null default now()
);

alter table public.services enable row level security;

create policy "owner_select_services" on public.services
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_services" on public.services
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_services" on public.services
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_services" on public.services
  for delete using (auth.uid() = owner_id or public.is_admin());
