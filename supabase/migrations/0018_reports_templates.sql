-- Informes como plantilla de equipo: igual que table_views (0009), un
-- informe puede ser personal (solo lo ve su dueño) o plantilla (lo ve
-- cualquier usuario, pero solo el dueño puede editarlo o borrarlo).

alter table public.reports add column if not exists is_template boolean not null default false;

drop policy if exists "owner_select_reports" on public.reports;
create policy "owner_select_reports" on public.reports
  for select using (auth.uid() = owner_id or is_template or public.is_admin());
