-- Datos fiscales: los tuyos propios (para emitir facturas) y los de tus
-- clientes (empresas y contactos, por si el cliente es autónomo sin
-- empresa asociada).

-- 1) Tus propios datos fiscales (uno por usuario) --------------------------

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  legal_name text,
  tax_id text,
  address text,
  postal_code text,
  city text,
  province text,
  country text default 'España',
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_settings enable row level security;

create policy "owner_select_business_settings" on public.business_settings
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_business_settings" on public.business_settings
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_business_settings" on public.business_settings
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_business_settings" on public.business_settings
  for delete using (auth.uid() = owner_id or public.is_admin());

-- 2) Datos fiscales de clientes (empresas y contactos autónomos) ----------

alter table public.companies
  add column if not exists tax_id text,
  add column if not exists fiscal_address text;

alter table public.contacts
  add column if not exists tax_id text,
  add column if not exists fiscal_address text;
