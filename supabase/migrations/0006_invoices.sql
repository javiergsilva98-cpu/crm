-- Facturas: cabecera + líneas, vinculadas por id a empresa, contacto y
-- oportunidad, para poder cruzar datos de negocio más adelante.

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete restrict,
  contact_id uuid references public.contacts (id) on delete set null,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date,
  status text not null default 'draft'
    check (status in ('draft', 'issued', 'paid', 'cancelled')),
  tax_rate numeric(5, 2) not null default 21,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, invoice_number)
);

create index if not exists invoices_company_id_idx on public.invoices (company_id);
create index if not exists invoices_opportunity_id_idx on public.invoices (opportunity_id);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

create policy "owner_select_invoices" on public.invoices
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_invoices" on public.invoices
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_invoices" on public.invoices
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_invoices" on public.invoices
  for delete using (auth.uid() = owner_id or public.is_admin());

create policy "owner_select_invoice_items" on public.invoice_items
  for select using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and (i.owner_id = auth.uid() or public.is_admin())
    )
  );
create policy "owner_insert_invoice_items" on public.invoice_items
  for insert with check (
    exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())
  );
create policy "owner_update_invoice_items" on public.invoice_items
  for update using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and (i.owner_id = auth.uid() or public.is_admin())
    )
  );
create policy "owner_delete_invoice_items" on public.invoice_items
  for delete using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and (i.owner_id = auth.uid() or public.is_admin())
    )
  );
