-- Gastos: para llevar el control de lo que se deduce, opcionalmente
-- vinculado a una empresa (si el gasto es de un cliente/proyecto concreto).

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  description text not null,
  category text not null default 'otros'
    check (category in ('suministros', 'material', 'software', 'transporte', 'dietas', 'alquiler', 'otros')),
  amount numeric(12, 2) not null default 0,
  tax_rate numeric(5, 2) not null default 21,
  expense_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists expenses_company_id_idx on public.expenses (company_id);
create index if not exists expenses_expense_date_idx on public.expenses (expense_date);

alter table public.expenses enable row level security;

create policy "owner_select_expenses" on public.expenses
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_expenses" on public.expenses
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_expenses" on public.expenses
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_expenses" on public.expenses
  for delete using (auth.uid() = owner_id or public.is_admin());
