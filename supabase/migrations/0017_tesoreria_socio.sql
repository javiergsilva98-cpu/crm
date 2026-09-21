-- Fase 2 de 9: pantalla de tesorería del socio.
--
-- 1. club_settings: fila única con los fondos reservados/comprometidos
--    (ej. dinero ya apartado para el seguro) que NO cuentan como caja
--    disponible. Gestionado por tesorería.
-- 2. club_available_balance(): saldo del club (club_balance()) menos esos
--    fondos reservados — es la cifra de "caja disponible" que ve
--    cualquier socio, sin exponer el detalle de qué hay reservado y por
--    qué (eso queda para tesorería en /tesoreria).
-- 3. Las compras "grandes" (movement_type = 'compra_grande') pasan a ser
--    visibles para cualquier socio como capa de transparencia de gastos
--    importantes, igual que ya lo son las últimas consumiciones del club.

create table public.club_settings (
  id boolean primary key default true check (id),
  reserved_funds numeric(10, 2) not null default 0 check (reserved_funds >= 0),
  reserved_note text,
  updated_at timestamptz not null default now()
);

insert into public.club_settings (id) values (true);

alter table public.club_settings enable row level security;

create policy "club_settings_select" on public.club_settings
  for select using (auth.uid() is not null);

create policy "club_settings_write" on public.club_settings
  for update using (public.current_role() in ('admin', 'presidente', 'tesorero'))
  with check (public.current_role() in ('admin', 'presidente', 'tesorero'));

create trigger club_settings_audit
  after update on public.club_settings
  for each row execute function public.record_audit_entry();

create function public.club_available_balance()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select public.club_balance() - coalesce((select reserved_funds from public.club_settings limit 1), 0);
$$;

drop policy "treasury_movements_select" on public.treasury_movements;
create policy "treasury_movements_select" on public.treasury_movements
  for select using (
    public.current_role() in ('admin', 'presidente', 'tesorero')
    or member_id = (select member_id from public.profiles where id = auth.uid())
    or movement_type = 'compra_grande'
  );
