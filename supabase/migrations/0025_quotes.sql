-- Presupuestos: mismo patrón que facturas (cabecera + líneas), con estado
-- propio y la posibilidad de convertirse en factura al aceptarse. Cada
-- presupuesto puede usar una plantilla visual (logo + colores + textos).

create table if not exists public.quote_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  logo_path text,
  primary_color text not null default '#4A5B33',
  secondary_color text not null default '#C1653F',
  header_text text,
  footer_text text,
  created_at timestamptz not null default now()
);

alter table public.quote_templates enable row level security;

create policy "owner_select_quote_templates" on public.quote_templates
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_quote_templates" on public.quote_templates
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_quote_templates" on public.quote_templates
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_quote_templates" on public.quote_templates
  for delete using (auth.uid() = owner_id or public.is_admin());

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete restrict,
  contact_id uuid references public.contacts (id) on delete set null,
  opportunity_id uuid references public.opportunities (id) on delete set null,
  template_id uuid references public.quote_templates (id) on delete set null,
  converted_invoice_id uuid references public.invoices (id) on delete set null,
  quote_number text not null,
  issue_date date not null default current_date,
  valid_until date,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  tax_rate numeric(5, 2) not null default 21,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, quote_number)
);

create index if not exists quotes_company_id_idx on public.quotes (company_id);
create index if not exists quotes_opportunity_id_idx on public.quotes (opportunity_id);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  description text not null,
  quantity numeric(10, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists quote_items_quote_id_idx on public.quote_items (quote_id);

alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

create policy "owner_select_quotes" on public.quotes
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_quotes" on public.quotes
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_quotes" on public.quotes
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_quotes" on public.quotes
  for delete using (auth.uid() = owner_id or public.is_admin());

create policy "owner_select_quote_items" on public.quote_items
  for select using (
    exists (select 1 from public.quotes q where q.id = quote_id and (q.owner_id = auth.uid() or public.is_admin()))
  );
create policy "owner_insert_quote_items" on public.quote_items
  for insert with check (
    exists (select 1 from public.quotes q where q.id = quote_id and q.owner_id = auth.uid())
  );
create policy "owner_update_quote_items" on public.quote_items
  for update using (
    exists (select 1 from public.quotes q where q.id = quote_id and (q.owner_id = auth.uid() or public.is_admin()))
  );
create policy "owner_delete_quote_items" on public.quote_items
  for delete using (
    exists (select 1 from public.quotes q where q.id = quote_id and (q.owner_id = auth.uid() or public.is_admin()))
  );

-- Logos de plantilla: bucket público de solo lectura (para que se vean en
-- el PDF sin depender de sesión), escritura solo en la carpeta del propio
-- usuario ({user_id}/...). Límite de 2 MB y solo imágenes, para que el
-- almacenamiento no crezca sin control con archivos grandes o de otro tipo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('quote-logos', 'quote-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "quote_logos_public_read" on storage.objects
  for select using (bucket_id = 'quote-logos');
create policy "quote_logos_owner_insert" on storage.objects
  for insert with check (bucket_id = 'quote-logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "quote_logos_owner_update" on storage.objects
  for update using (bucket_id = 'quote-logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "quote_logos_owner_delete" on storage.objects
  for delete using (bucket_id = 'quote-logos' and (storage.foldername(name))[1] = auth.uid()::text);
