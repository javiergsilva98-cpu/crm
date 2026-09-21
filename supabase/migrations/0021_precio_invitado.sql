-- Fase 6 de 10: modo invitados en Consumiciones. Reutiliza el cálculo
-- automático de precios de la Fase 4 (mismo margen mínimo de
-- seguridad, misma tabla de historial) en vez de duplicar la lógica.

-- ---------------------------------------------------------------------
-- 1. Margen de invitado, configurable igual que el de socio (Fase 4).
--    Valor inicial 50%, votable en asamblea como el resto de márgenes.
-- ---------------------------------------------------------------------
alter table public.club_settings
  add column guest_margin_pct numeric(6, 2) not null default 50 check (guest_margin_pct >= 0);

-- ---------------------------------------------------------------------
-- 2. menu_items: segundo precio, calculado con el mismo coste que el
--    precio de socio pero con el margen de invitado.
-- ---------------------------------------------------------------------
alter table public.menu_items
  add column guest_price numeric(6, 2) not null default 0;

update public.menu_items
set guest_price = round(current_cost * (1 + (select guest_margin_pct from public.club_settings limit 1) / 100), 2)
where current_cost > 0;

-- ---------------------------------------------------------------------
-- 3. consumptions: traza si la línea fue a precio de socio o de
--    invitado, para tesorería (Fase 2) y auditoría.
-- ---------------------------------------------------------------------
alter table public.consumptions
  add column is_guest boolean not null default false;

-- ---------------------------------------------------------------------
-- 4. Historial de precios: añade las columnas de invitado en paralelo a
--    las de socio que ya existían (misma fila, mismo evento de cambio
--    de coste o de margen).
-- ---------------------------------------------------------------------
alter table public.menu_item_price_history
  add column old_guest_price numeric(6, 2),
  add column new_guest_price numeric(6, 2),
  add column guest_margin_pct_applied numeric(6, 2);

-- ---------------------------------------------------------------------
-- 5. apply_menu_item_pricing: se extiende (no se duplica) para calcular
--    también el precio de invitado con el mismo coste, usando el mismo
--    margen mínimo de seguridad como salvaguarda para ambos precios.
-- ---------------------------------------------------------------------
create or replace function public.apply_menu_item_pricing(p_menu_item_id uuid, p_new_cost numeric)
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
         old_guest_price, new_guest_price, guest_margin_pct_applied, needs_review)
      values (p_menu_item_id, v_old_cost, p_new_cost, v_old_price, v_old_price, v_margin,
        v_old_guest_price, v_old_guest_price, v_guest_margin, true);
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
       old_guest_price, new_guest_price, guest_margin_pct_applied, needs_review)
    values (p_menu_item_id, v_old_cost, p_new_cost, v_old_price, v_new_price, v_margin,
      v_old_guest_price, v_new_guest_price, v_guest_margin, false);
  end if;
end;
$$;

-- El margen de invitado también dispara un recálculo general, igual que
-- el de socio y el mínimo de seguridad.
create or replace function public.reapply_pricing_on_margin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if new.sale_margin_pct is distinct from old.sale_margin_pct
     or new.guest_margin_pct is distinct from old.guest_margin_pct
     or new.min_margin_pct is distinct from old.min_margin_pct then
    for r in select id, current_cost from public.menu_items where inventory_item_id is not null and active = true
    loop
      perform public.apply_menu_item_pricing(r.id, r.current_cost);
    end loop;
  end if;
  return new;
end;
$$;

-- create_inventory_item: calcula también el precio de invitado al dar
-- de alta un artículo nuevo, con la misma salvaguarda de margen mínimo.
create or replace function public.create_inventory_item(
  p_name text,
  p_unit text,
  p_category text,
  p_stock_mode text,
  p_quantity numeric,
  p_cost numeric,
  p_low_stock_threshold integer default 5,
  p_responsible_member_id uuid default null
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

  insert into public.inventory_restocks (inventory_item_id, quantity, cost, responsible_member_id)
  values (v_item_id, p_quantity, p_cost, p_responsible_member_id);

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
     old_guest_price, new_guest_price, guest_margin_pct_applied, needs_review)
  values (v_menu_item_id, null, v_unit_cost, null, v_price, v_margin, null, v_guest_price, v_guest_margin, v_needs_review);

  return v_item_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. record_shared_consumption: admite indicar si el reparto es para
--    invitados (usa guest_price y marca is_guest en cada línea) además
--    de aceptar quién lo reporta, como hasta ahora.
-- ---------------------------------------------------------------------
create or replace function public.record_shared_consumption(
  p_menu_item_id uuid,
  p_member_ids uuid[],
  p_consumed_at timestamptz default now(),
  p_is_guest boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price numeric(6, 2);
  v_guest_price numeric(6, 2);
  v_active boolean;
  v_stock_mode text;
  v_inventory_item_id uuid;
  v_count integer;
  v_unit_price numeric(6, 2);
begin
  select price, guest_price, active, stock_mode, inventory_item_id
    into v_price, v_guest_price, v_active, v_stock_mode, v_inventory_item_id
    from public.menu_items where id = p_menu_item_id;

  if v_price is null or v_active is not true then
    raise exception 'Artículo no disponible.';
  end if;
  if v_stock_mode <> 'shared' then
    raise exception 'Este artículo no admite consumo compartido.';
  end if;

  v_count := coalesce(array_length(p_member_ids, 1), 0);
  if v_count < 2 then
    raise exception 'Selecciona al menos dos socios para repartir.';
  end if;

  if auth.uid() is not null
     and public.current_role() not in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero')
     and not exists (
       select 1 from public.profiles
       where id = auth.uid() and member_id = any(p_member_ids)
     )
  then
    raise exception 'Solo puedes repartir un consumo compartido si formas parte de él.';
  end if;

  v_unit_price := round((case when p_is_guest then coalesce(v_guest_price, v_price) else v_price end) / v_count, 2);

  insert into public.consumptions (member_id, menu_item_id, quantity, unit_price, consumed_at, is_guest)
  select m, p_menu_item_id, 1, v_unit_price, p_consumed_at, coalesce(p_is_guest, false)
  from unnest(p_member_ids) as m;

  if v_inventory_item_id is not null then
    update public.inventory_items
    set current_stock = current_stock - 1
    where id = v_inventory_item_id;
  end if;
end;
$$;
