-- Fase 4 de 9: precio de venta calculado automáticamente a partir del
-- coste y un margen global configurable, con salvaguarda de margen
-- mínimo e historial de cambios de precio visible para cualquier socio.

-- ---------------------------------------------------------------------
-- 1. Margen global (editable por admin/presidente/vicepresidente/
--    tesorero, igual que el resto de club_settings) + margen mínimo de
--    seguridad.
-- ---------------------------------------------------------------------
alter table public.club_settings
  add column sale_margin_pct numeric(6, 2) not null default 30 check (sale_margin_pct >= 0),
  add column min_margin_pct numeric(6, 2) not null default 15 check (min_margin_pct >= 0);

-- ---------------------------------------------------------------------
-- 2. menu_items: coste actual (copia del de inventory_items, para que
--    cualquier socio lo vea sin exponerle el stock — menu_items_select
--    ya es "cualquier autenticado", inventory_items_select no) y marca
--    de "requiere revisión de precio".
-- ---------------------------------------------------------------------
alter table public.menu_items
  add column current_cost numeric(10, 2) not null default 0,
  add column needs_price_review boolean not null default false;

-- Deja el coste visible ya sincronizado con lo que hay en bodega para
-- los artículos existentes (solo lectura, no toca el precio: el precio
-- solo se recalcula con una reposición nueva o un cambio de margen, no
-- retroactivamente al aplicar esta migración).
update public.menu_items mi
set current_cost = ii.current_cost
from public.inventory_items ii
where mi.inventory_item_id = ii.id;

-- ---------------------------------------------------------------------
-- 3. Historial de precios: quién/qué lo cambió, coste y precio antes y
--    después. Visible para cualquier socio (auditoría social del
--    requisito 5), solo el sistema escribe en ella.
-- ---------------------------------------------------------------------
create table public.menu_item_price_history (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  changed_at timestamptz not null default now(),
  old_cost numeric(10, 2),
  new_cost numeric(10, 2) not null,
  old_price numeric(6, 2),
  new_price numeric(6, 2) not null,
  margin_pct_applied numeric(6, 2),
  needs_review boolean not null default false
);

create index menu_item_price_history_menu_item_id_idx on public.menu_item_price_history (menu_item_id);

alter table public.menu_item_price_history enable row level security;
create policy "menu_item_price_history_select" on public.menu_item_price_history
  for select using (auth.uid() is not null);
-- Sin políticas de insert: solo escriben las funciones SECURITY DEFINER
-- de abajo.

-- ---------------------------------------------------------------------
-- 4. Cálculo del precio: coste × (1 + margen%), salvo que el margen
--    configurado esté por debajo del mínimo de seguridad, en cuyo caso
--    NO se toca el precio y el artículo queda "pendiente de revisión"
--    (pensado para resolverse con una votación express, Fase 5) en vez
--    de aplicar un margen insuficiente sin que nadie se entere.
-- ---------------------------------------------------------------------
create function public.apply_menu_item_pricing(p_menu_item_id uuid, p_new_cost numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_margin numeric;
  v_min_margin numeric;
  v_old_cost numeric;
  v_old_price numeric;
  v_new_price numeric;
  v_needs_review boolean;
begin
  select sale_margin_pct, min_margin_pct into v_margin, v_min_margin from public.club_settings limit 1;
  select current_cost, price into v_old_cost, v_old_price from public.menu_items where id = p_menu_item_id;

  v_needs_review := v_margin is null or v_margin < coalesce(v_min_margin, 0);

  if v_needs_review then
    update public.menu_items
    set current_cost = p_new_cost, needs_price_review = true
    where id = p_menu_item_id;

    if v_old_cost is distinct from p_new_cost then
      insert into public.menu_item_price_history
        (menu_item_id, old_cost, new_cost, old_price, new_price, margin_pct_applied, needs_review)
      values (p_menu_item_id, v_old_cost, p_new_cost, v_old_price, v_old_price, v_margin, true);
    end if;
    return;
  end if;

  v_new_price := round(p_new_cost * (1 + v_margin / 100), 2);

  update public.menu_items
  set current_cost = p_new_cost, price = v_new_price, needs_price_review = false
  where id = p_menu_item_id;

  if v_old_price is distinct from v_new_price or v_old_cost is distinct from p_new_cost then
    insert into public.menu_item_price_history
      (menu_item_id, old_cost, new_cost, old_price, new_price, margin_pct_applied, needs_review)
    values (p_menu_item_id, v_old_cost, p_new_cost, v_old_price, v_new_price, v_margin, false);
  end if;
end;
$$;

create function public.recalculate_menu_prices_for_inventory_item(p_inventory_item_id uuid, p_new_cost numeric)
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
    perform public.apply_menu_item_pricing(r.id, p_new_cost);
  end loop;
end;
$$;

-- Recalcula el precio de un artículo de carta ya vinculado a bodega, a
-- partir del coste actual del artículo de bodega (para cuando se crea o
-- se vuelve a vincular un artículo de carta desde Consumiciones).
create function public.set_menu_item_price_from_cost(p_menu_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inventory_item_id uuid;
  v_cost numeric;
begin
  select inventory_item_id into v_inventory_item_id from public.menu_items where id = p_menu_item_id;
  if v_inventory_item_id is null then
    raise exception 'El artículo debe estar vinculado a un artículo de bodega para calcular su precio.';
  end if;
  select current_cost into v_cost from public.inventory_items where id = v_inventory_item_id;
  perform public.apply_menu_item_pricing(p_menu_item_id, coalesce(v_cost, 0));
end;
$$;

-- Si cambia el margen global (o el mínimo de seguridad), recalcula
-- todos los precios de la carta vinculada a bodega con el coste que ya
-- tenían — es el único caso en el que el precio se toca sin que haya
-- habido una reposición nueva.
create function public.reapply_pricing_on_margin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  if new.sale_margin_pct is distinct from old.sale_margin_pct
     or new.min_margin_pct is distinct from old.min_margin_pct then
    for r in select id, current_cost from public.menu_items where inventory_item_id is not null and active = true
    loop
      perform public.apply_menu_item_pricing(r.id, r.current_cost);
    end loop;
  end if;
  return new;
end;
$$;

create trigger on_club_settings_margin_change
  after update on public.club_settings
  for each row execute function public.reapply_pricing_on_margin_change();

-- apply_inventory_restock ahora, además de sumar stock y fijar el coste
-- unitario del artículo de bodega, recalcula el precio de venta de la
-- carta vinculada con ese coste nuevo.
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
    perform public.recalculate_menu_prices_for_inventory_item(new.inventory_item_id, v_unit_cost);
  end if;

  return new;
end;
$$;

-- create_inventory_item: el precio de venta ya no se introduce a mano,
-- se calcula con el margen configurado a partir del coste del primer
-- pedido (o queda pendiente de revisión si el margen no llega al
-- mínimo de seguridad).
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
  v_min_margin numeric;
  v_needs_review boolean;
  v_price numeric;
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
  -- el trigger on_inventory_restock ya deja inventory_items.current_cost
  -- actualizado (coste del pedido / cantidad).

  v_unit_cost := round(p_cost / p_quantity, 2);
  select sale_margin_pct, min_margin_pct into v_margin, v_min_margin from public.club_settings limit 1;
  v_needs_review := v_margin is null or v_margin < coalesce(v_min_margin, 0);
  v_price := case when v_needs_review then v_unit_cost else round(v_unit_cost * (1 + v_margin / 100), 2) end;

  insert into public.menu_items (name, category, price, inventory_item_id, stock_mode, current_cost, needs_price_review)
  values (p_name, p_category, v_price, v_item_id, coalesce(p_stock_mode, 'unit'), v_unit_cost, v_needs_review)
  returning id into v_menu_item_id;

  insert into public.menu_item_price_history
    (menu_item_id, old_cost, new_cost, old_price, new_price, margin_pct_applied, needs_review)
  values (v_menu_item_id, null, v_unit_cost, null, v_price, v_margin, v_needs_review);

  return v_item_id;
end;
$$;
