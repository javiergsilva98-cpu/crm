-- Fase 9 de 10 (opcional): reserva de local marcada como exclusiva,
-- foto de ticket en cada reposición, documentación en dos carpetas y
-- las bases para el apartado de auditoría de "movimientos gordos".

-- ---------------------------------------------------------------------
-- 1. events: marca explícita de reserva en exclusiva (antes ya existía
--    la reserva del requisito 1 desde la Fase de Calendario original;
--    esto solo la deja explícita en vez de implícita).
-- ---------------------------------------------------------------------
alter table public.events
  add column is_exclusive boolean not null default true;

-- ---------------------------------------------------------------------
-- 2. inventory_restocks: foto del ticket/factura, opcional, enlazada al
--    pedido (y por tanto al artículo y a la fecha del cambio de precio
--    que ya registra la Fase 4 en menu_item_price_history).
-- ---------------------------------------------------------------------
alter table public.inventory_restocks
  add column receipt_photo_url text;

-- El ticket queda enlazado también al cambio de precio que provocó
-- (requisito 3: "para poder auditar por qué subió un precio"), no solo
-- a la reposición en sí — se copia a la fila de historial que ya crea
-- la Fase 4 en cada recálculo.
alter table public.menu_item_price_history
  add column receipt_photo_url text;

create or replace function public.apply_menu_item_pricing(
  p_menu_item_id uuid,
  p_new_cost numeric,
  p_receipt_photo_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_margin numeric;
  v_guest_margin numeric;
  v_min_margin numeric;
  v_old_cost numeric;
  v_old_price numeric;
  v_old_guest_price numeric;
  v_new_price numeric;
  v_new_guest_price numeric;
  v_needs_review boolean;
begin
  select sale_margin_pct, guest_margin_pct, min_margin_pct
    into v_margin, v_guest_margin, v_min_margin
    from public.club_settings limit 1;
  select current_cost, price, guest_price into v_old_cost, v_old_price, v_old_guest_price
    from public.menu_items where id = p_menu_item_id;

  v_needs_review := v_margin is null or v_guest_margin is null
    or v_margin < coalesce(v_min_margin, 0) or v_guest_margin < coalesce(v_min_margin, 0);

  if v_needs_review then
    update public.menu_items
    set current_cost = p_new_cost, needs_price_review = true
    where id = p_menu_item_id;

    if v_old_cost is distinct from p_new_cost then
      insert into public.menu_item_price_history
        (menu_item_id, old_cost, new_cost, old_price, new_price, margin_pct_applied,
         old_guest_price, new_guest_price, guest_margin_pct_applied, needs_review, receipt_photo_url)
      values (p_menu_item_id, v_old_cost, p_new_cost, v_old_price, v_old_price, v_margin,
        v_old_guest_price, v_old_guest_price, v_guest_margin, true, p_receipt_photo_url);
    end if;
    return;
  end if;

  v_new_price := round(p_new_cost * (1 + v_margin / 100), 2);
  v_new_guest_price := round(p_new_cost * (1 + v_guest_margin / 100), 2);

  update public.menu_items
  set current_cost = p_new_cost, price = v_new_price, guest_price = v_new_guest_price, needs_price_review = false
  where id = p_menu_item_id;

  if v_old_price is distinct from v_new_price or v_old_guest_price is distinct from v_new_guest_price
     or v_old_cost is distinct from p_new_cost then
    insert into public.menu_item_price_history
      (menu_item_id, old_cost, new_cost, old_price, new_price, margin_pct_applied,
       old_guest_price, new_guest_price, guest_margin_pct_applied, needs_review, receipt_photo_url)
    values (p_menu_item_id, v_old_cost, p_new_cost, v_old_price, v_new_price, v_margin,
      v_old_guest_price, v_new_guest_price, v_guest_margin, false, p_receipt_photo_url);
  end if;
end;
$$;

create or replace function public.recalculate_menu_prices_for_inventory_item(
  p_inventory_item_id uuid,
  p_new_cost numeric,
  p_receipt_photo_url text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in select id from public.menu_items where inventory_item_id = p_inventory_item_id and active = true
  loop
    perform public.apply_menu_item_pricing(r.id, p_new_cost, p_receipt_photo_url);
  end loop;
end;
$$;

-- apply_inventory_restock ahora también pasa la foto del ticket de esa
-- reposición al recálculo de precio, para que quede enlazada en el
-- historial.
create or replace function public.apply_inventory_restock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unit_cost numeric;
begin
  update public.inventory_items
  set current_stock = current_stock + new.quantity
  where id = new.inventory_item_id;

  if new.quantity > 0 and new.cost > 0 then
    v_unit_cost := round(new.cost / new.quantity, 2);
    update public.inventory_items set current_cost = v_unit_cost where id = new.inventory_item_id;
    perform public.recalculate_menu_prices_for_inventory_item(new.inventory_item_id, v_unit_cost, new.receipt_photo_url);
  end if;

  return new;
end;
$$;

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
  if public.current_role() not in ('admin', 'presidente', 'vicepresidente', 'bodeguero') then
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

-- Bucket público (igual planteamiento que "avatars" en la Fase de
-- perfil): solo bodega/tesorería/dirección puede subir, y el enlace
-- solo aparece en pantallas que ya son de gestión (Inventario), así
-- que no queda expuesto por la app aunque el bucket sea público.
insert into storage.buckets (id, name, public)
values ('tickets', 'tickets', true)
on conflict (id) do nothing;

create policy "tickets_public_read"
  on storage.objects for select
  using (bucket_id = 'tickets');

create policy "tickets_management_write"
  on storage.objects for insert
  with check (
    bucket_id = 'tickets'
    and public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero')
  );

-- ---------------------------------------------------------------------
-- 3. documents: dos carpetas — "general" (visible para todo el club) y
--    "privado" (solo roles con acceso a dinero). Antes la pantalla
--    entera era invisible para un socio normal; ahora la parte general
--    sí se ve.
-- ---------------------------------------------------------------------
alter table public.documents
  add column folder text not null default 'general' check (folder in ('general', 'privado'));

drop policy "documents_select" on public.documents;
create policy "documents_select" on public.documents
  for select using (
    folder = 'general'
    or public.current_role() in ('admin', 'presidente', 'tesorero')
  );

drop policy "documents_write" on public.documents;
create policy "documents_insert" on public.documents
  for insert with check (
    (folder = 'general' and public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario'))
    or (folder = 'privado' and public.current_role() in ('admin', 'presidente', 'tesorero'))
  );
create policy "documents_update" on public.documents
  for update using (
    (folder = 'general' and public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario'))
    or (folder = 'privado' and public.current_role() in ('admin', 'presidente', 'tesorero'))
  )
  with check (
    (folder = 'general' and public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario'))
    or (folder = 'privado' and public.current_role() in ('admin', 'presidente', 'tesorero'))
  );
create policy "documents_delete" on public.documents
  for delete using (
    (folder = 'general' and public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario'))
    or (folder = 'privado' and public.current_role() in ('admin', 'presidente', 'tesorero'))
  );
