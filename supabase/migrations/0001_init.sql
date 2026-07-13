-- Esquema inicial del CRM: empresas, contactos y oportunidades.

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  website text,
  industry text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  title text not null,
  stage text not null default 'nuevo'
    check (stage in ('nuevo', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido')),
  amount numeric(12, 2) default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists contacts_company_id_idx on public.contacts (company_id);
create index if not exists opportunities_company_id_idx on public.opportunities (company_id);
create index if not exists opportunities_contact_id_idx on public.opportunities (contact_id);

alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.opportunities enable row level security;

create policy "owner_select_companies" on public.companies
  for select using (auth.uid() = owner_id);
create policy "owner_insert_companies" on public.companies
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_companies" on public.companies
  for update using (auth.uid() = owner_id);
create policy "owner_delete_companies" on public.companies
  for delete using (auth.uid() = owner_id);

create policy "owner_select_contacts" on public.contacts
  for select using (auth.uid() = owner_id);
create policy "owner_insert_contacts" on public.contacts
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_contacts" on public.contacts
  for update using (auth.uid() = owner_id);
create policy "owner_delete_contacts" on public.contacts
  for delete using (auth.uid() = owner_id);

create policy "owner_select_opportunities" on public.opportunities
  for select using (auth.uid() = owner_id);
create policy "owner_insert_opportunities" on public.opportunities
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_opportunities" on public.opportunities
  for update using (auth.uid() = owner_id);
create policy "owner_delete_opportunities" on public.opportunities
  for delete using (auth.uid() = owner_id);
