-- Añade el rol supremo 'admin': mismo acceso que presidente en todas las
-- políticas de RLS, pensado para configuración futura del club además de
-- la gestión operativa del día a día.

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'presidente', 'secretario', 'tesorero', 'bodeguero', 'socio'));

drop policy "members_select" on public.members;
create policy "members_select" on public.members
  for select using (
    public.current_role() in ('admin', 'presidente', 'secretario', 'tesorero')
    or id = (select member_id from public.profiles where id = auth.uid())
  );
drop policy "members_write" on public.members;
create policy "members_write" on public.members
  for all using (public.current_role() in ('admin', 'presidente', 'secretario'))
  with check (public.current_role() in ('admin', 'presidente', 'secretario'));

drop policy "events_select" on public.events;
create policy "events_select" on public.events
  for select using (public.current_role() in ('admin', 'presidente', 'secretario', 'tesorero'));
drop policy "events_write" on public.events;
create policy "events_write" on public.events
  for all using (public.current_role() in ('admin', 'presidente', 'secretario', 'tesorero'))
  with check (public.current_role() in ('admin', 'presidente', 'secretario', 'tesorero'));

drop policy "guests_select" on public.guests;
create policy "guests_select" on public.guests
  for select using (public.current_role() in ('admin', 'presidente', 'secretario'));
drop policy "guests_write" on public.guests;
create policy "guests_write" on public.guests
  for all using (public.current_role() in ('admin', 'presidente', 'secretario'))
  with check (public.current_role() in ('admin', 'presidente', 'secretario'));

drop policy "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.current_role() in ('admin', 'presidente'));

drop policy "menu_items_write" on public.menu_items;
create policy "menu_items_write" on public.menu_items
  for all using (public.current_role() in ('admin', 'presidente', 'tesorero', 'bodeguero'))
  with check (public.current_role() in ('admin', 'presidente', 'tesorero', 'bodeguero'));

drop policy "consumptions_select" on public.consumptions;
create policy "consumptions_select" on public.consumptions
  for select using (
    public.current_role() in ('admin', 'presidente', 'tesorero')
    or member_id = (select member_id from public.profiles where id = auth.uid())
  );
drop policy "consumptions_insert" on public.consumptions;
create policy "consumptions_insert" on public.consumptions
  for insert with check (
    public.current_role() in ('admin', 'presidente', 'tesorero')
    or member_id = (select member_id from public.profiles where id = auth.uid())
  );

drop policy "treasury_movements_select" on public.treasury_movements;
create policy "treasury_movements_select" on public.treasury_movements
  for select using (
    public.current_role() in ('admin', 'presidente', 'tesorero')
    or member_id = (select member_id from public.profiles where id = auth.uid())
  );
drop policy "treasury_movements_write" on public.treasury_movements;
create policy "treasury_movements_write" on public.treasury_movements
  for all using (public.current_role() in ('admin', 'presidente', 'tesorero'))
  with check (public.current_role() in ('admin', 'presidente', 'tesorero'));

drop policy "inventory_items_select" on public.inventory_items;
create policy "inventory_items_select" on public.inventory_items
  for select using (public.current_role() in ('admin', 'presidente', 'tesorero', 'bodeguero'));
drop policy "inventory_items_write" on public.inventory_items;
create policy "inventory_items_write" on public.inventory_items
  for all using (public.current_role() in ('admin', 'presidente', 'bodeguero'))
  with check (public.current_role() in ('admin', 'presidente', 'bodeguero'));

drop policy "inventory_restocks_select" on public.inventory_restocks;
create policy "inventory_restocks_select" on public.inventory_restocks
  for select using (public.current_role() in ('admin', 'presidente', 'tesorero', 'bodeguero'));
drop policy "inventory_restocks_insert" on public.inventory_restocks;
create policy "inventory_restocks_insert" on public.inventory_restocks
  for insert with check (public.current_role() in ('admin', 'presidente', 'bodeguero'));

drop policy "documents_select" on public.documents;
create policy "documents_select" on public.documents
  for select using (public.current_role() in ('admin', 'presidente', 'secretario'));
drop policy "documents_write" on public.documents;
create policy "documents_write" on public.documents
  for all using (public.current_role() in ('admin', 'presidente', 'secretario'))
  with check (public.current_role() in ('admin', 'presidente', 'secretario'));
