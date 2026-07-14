-- Informes personalizables: cada usuario guarda qué métrica quiere ver
-- y con qué rango de fechas.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  metric text not null
    check (metric in (
      'opportunities_by_stage',
      'opportunities_by_month',
      'invoices_by_month',
      'expenses_by_category',
      'expenses_by_month',
      'contacts_by_source',
      'companies_by_month'
    )),
  date_from date,
  date_to date,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "owner_select_reports" on public.reports
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_reports" on public.reports
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_reports" on public.reports
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_reports" on public.reports
  for delete using (auth.uid() = owner_id or public.is_admin());
