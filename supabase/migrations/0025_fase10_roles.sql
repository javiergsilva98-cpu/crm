-- Fase 10 de 10: consolidación de roles y permisos. Alinea las
-- políticas RLS (la aplicación real) con la matriz acordada:
--   - Tesorero puede editar inventario a fondo, no solo reponer.
--   - Secretario deja de gestionar socios, calendario, invitados,
--     documentos generales y el cierre de votaciones — queda al mismo
--     nivel que un socio normal, salvo crear votaciones (que ya era
--     solo suyo junto a presidencia desde la Fase 5 y no cambia aquí).
-- El resto de la matriz (vicepresidencia, bodeguero, admin/presidente)
-- ya estaba correcta y no se toca.

-- ---------------------------------------------------------------------
-- 1. Inventario: tesorero se suma a quien puede editarlo a fondo (dar
--    de alta artículos, tocar el umbral de aviso, contar físicamente),
--    no solo registrar reposiciones (que ya podía).
-- ---------------------------------------------------------------------
drop policy "inventory_items_write" on public.inventory_items;
create policy "inventory_items_write" on public.inventory_items
  for all using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero'));

drop policy "inventory_counts_insert" on public.inventory_counts;
create policy "inventory_counts_insert" on public.inventory_counts
  for insert with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero'));

drop policy "inventory_count_lines_insert" on public.inventory_count_lines;
create policy "inventory_count_lines_insert" on public.inventory_count_lines
  for insert with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero'));

create or replace function public.create_inventory_item(
  p_name text,
  p_unit text,
  p_category text,
  p_stock_mode text,
  p_quantity numeric,
  p_cost numeric,
  p_low_stock_threshold integer default 5,
  p_responsible_member_id uuid default null,
  p_receipt_photo_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
  v_menu_item_id uuid;
  v_unit_cost numeric;
  v_margin numeric;
  v_guest_margin numeric;
  v_min_margin numeric;
  v_needs_review boolean;
  v_price numeric;
  v_guest_price numeric;
begin
  if public.current_role() not in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero') then
    raise exception 'No tienes permiso para dar de alta artículos de bodega.';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Indica un nombre.';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Indica una cantidad inicial válida.';
  end if;
  if p_cost is null or p_cost <= 0 then
    raise exception 'Indica el coste del pedido para poder calcular el precio de venta.';
  end if;

  insert into public.inventory_items (name, unit, low_stock_threshold)
  values (p_name, coalesce(nullif(trim(p_unit), ''), 'ud'), coalesce(p_low_stock_threshold, 5))
  returning id into v_item_id;

  insert into public.inventory_restocks (inventory_item_id, quantity, cost, responsible_member_id, receipt_photo_url)
  values (v_item_id, p_quantity, p_cost, p_responsible_member_id, p_receipt_photo_url);

  v_unit_cost := round(p_cost / p_quantity, 2);
  select sale_margin_pct, guest_margin_pct, min_margin_pct
    into v_margin, v_guest_margin, v_min_margin
    from public.club_settings limit 1;
  v_needs_review := v_margin is null or v_guest_margin is null
    or v_margin < coalesce(v_min_margin, 0) or v_guest_margin < coalesce(v_min_margin, 0);
  v_price := case when v_needs_review then v_unit_cost else round(v_unit_cost * (1 + v_margin / 100), 2) end;
  v_guest_price := case when v_needs_review then v_unit_cost else round(v_unit_cost * (1 + v_guest_margin / 100), 2) end;

  insert into public.menu_items
    (name, category, price, guest_price, inventory_item_id, stock_mode, current_cost, needs_price_review)
  values (p_name, p_category, v_price, v_guest_price, v_item_id, coalesce(p_stock_mode, 'unit'), v_unit_cost, v_needs_review)
  returning id into v_menu_item_id;

  insert into public.menu_item_price_history
    (menu_item_id, old_cost, new_cost, old_price, new_price, margin_pct_applied,
     old_guest_price, new_guest_price, guest_margin_pct_applied, needs_review, receipt_photo_url)
  values (v_menu_item_id, null, v_unit_cost, null, v_price, v_margin, null, v_guest_price, v_guest_margin, v_needs_review, p_receipt_photo_url);

  return v_item_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Secretario deja de gestionar socios: pasa a ver solo su propia
--    ficha, como cualquier socio.
-- ---------------------------------------------------------------------
drop policy "members_select" on public.members;
create policy "members_select" on public.members
  for select using (
    public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero')
    or id = (select member_id from public.profiles where id = auth.uid())
  );
drop policy "members_write" on public.members;
create policy "members_write" on public.members
  for all using (public.current_role() in ('admin', 'presidente', 'vicepresidente'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente'));

-- ---------------------------------------------------------------------
-- 3. Secretario deja de gestionar el calendario (eventos generales y
--    aprobación de reservas) e invitados: puede solicitar una reserva
--    como cualquier socio, ya cubierto por la rama de "reserva propia
--    pendiente" que sigue abierta a cualquier socio en events_insert.
-- ---------------------------------------------------------------------
drop policy "events_insert" on public.events;
create policy "events_insert" on public.events
  for insert with check (
    public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero')
    or (
      kind = 'reserva'
      and status = 'pendiente'
      and requested_by_member_id = (select member_id from public.profiles where id = auth.uid())
    )
  );
drop policy "events_update" on public.events;
create policy "events_update" on public.events
  for update using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero'));

drop policy "guests_select" on public.guests;
create policy "guests_select" on public.guests
  for select using (public.current_role() in ('admin', 'presidente', 'vicepresidente'));
drop policy "guests_write" on public.guests;
create policy "guests_write" on public.guests
  for all using (public.current_role() in ('admin', 'presidente', 'vicepresidente'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente'));

-- ---------------------------------------------------------------------
-- 4. Secretario deja de gestionar la carpeta general de documentos:
--    pasa a verla en solo lectura, como cualquier socio.
-- ---------------------------------------------------------------------
drop policy "documents_insert" on public.documents;
create policy "documents_insert" on public.documents
  for insert with check (
    (folder = 'general' and public.current_role() in ('admin', 'presidente', 'vicepresidente'))
    or (folder = 'privado' and public.current_role() in ('admin', 'presidente', 'tesorero'))
  );
drop policy "documents_update" on public.documents;
create policy "documents_update" on public.documents
  for update using (
    (folder = 'general' and public.current_role() in ('admin', 'presidente', 'vicepresidente'))
    or (folder = 'privado' and public.current_role() in ('admin', 'presidente', 'tesorero'))
  )
  with check (
    (folder = 'general' and public.current_role() in ('admin', 'presidente', 'vicepresidente'))
    or (folder = 'privado' and public.current_role() in ('admin', 'presidente', 'tesorero'))
  );
drop policy "documents_delete" on public.documents;
create policy "documents_delete" on public.documents
  for delete using (
    (folder = 'general' and public.current_role() in ('admin', 'presidente', 'vicepresidente'))
    or (folder = 'privado' and public.current_role() in ('admin', 'presidente', 'tesorero'))
  );

-- ---------------------------------------------------------------------
-- 5. Secretario deja de poder cerrar/gestionar votaciones: se queda
--    solo con crearlas (votes_insert/vote_options_insert, sin cambios
--    desde la Fase 5).
-- ---------------------------------------------------------------------
drop policy "votes_update" on public.votes;
create policy "votes_update" on public.votes
  for update using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero'));
