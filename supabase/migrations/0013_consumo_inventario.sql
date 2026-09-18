-- Vincula cada artículo de la carta con su artículo de bodega, para que
-- marcar una consumición descuente stock automáticamente.
--
-- Dos modos:
--  - 'unit' (por defecto): cada consumición resta su `quantity` del
--    artículo de bodega vinculado (cañas, latas, botellines — todo lo
--    que se sirve individual, 1 a 1).
--  - 'shared': para artículos que se abren y se reparten entre varios
--    socios (una botella de vino o sangría). No se usa el flujo normal
--    de marcar consumo; se reparte el coste entre los socios elegidos y
--    se descuenta 1 solo artículo de bodega por la botella entera.

alter table public.menu_items
  add column inventory_item_id uuid references public.inventory_items (id) on delete set null,
  add column stock_mode text not null default 'unit' check (stock_mode in ('unit', 'shared'));

create index menu_items_inventory_item_id_idx on public.menu_items (inventory_item_id);

-- Descuenta stock cuando se marca una consumición normal ('unit'). Las
-- consumiciones compartidas ('shared') se insertan siempre a través de
-- record_shared_consumption(), que ya descuenta el stock ella misma —
-- por eso aquí se ignoran, para no restar dos veces.
create function public.apply_consumption_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inventory_item_id uuid;
  v_stock_mode text;
begin
  select inventory_item_id, stock_mode into v_inventory_item_id, v_stock_mode
  from public.menu_items where id = new.menu_item_id;

  if v_inventory_item_id is not null and v_stock_mode = 'unit' then
    update public.inventory_items
    set current_stock = current_stock - new.quantity
    where id = v_inventory_item_id;
  end if;

  return new;
end;
$$;

create trigger on_consumption_stock
  after insert on public.consumptions
  for each row execute function public.apply_consumption_stock();

-- Reparte una consumición "compartida" (p. ej. una botella) entre varios
-- socios a partes iguales, e inserta una fila de consumo por cada uno
-- (para que el saldo individual de cada socio lo refleje), descontando
-- una sola unidad del artículo de bodega vinculado.
create function public.record_shared_consumption(
  p_menu_item_id uuid,
  p_member_ids uuid[],
  p_consumed_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price numeric(6, 2);
  v_active boolean;
  v_stock_mode text;
  v_inventory_item_id uuid;
  v_count integer;
  v_unit_price numeric(6, 2);
begin
  select price, active, stock_mode, inventory_item_id
    into v_price, v_active, v_stock_mode, v_inventory_item_id
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
     and public.current_role() not in ('admin', 'presidente', 'tesorero', 'bodeguero')
     and not exists (
       select 1 from public.profiles
       where id = auth.uid() and member_id = any(p_member_ids)
     )
  then
    raise exception 'Solo puedes repartir un consumo compartido si formas parte de él.';
  end if;

  v_unit_price := round(v_price / v_count, 2);

  insert into public.consumptions (member_id, menu_item_id, quantity, unit_price, consumed_at)
  select m, p_menu_item_id, 1, v_unit_price, p_consumed_at
  from unnest(p_member_ids) as m;

  if v_inventory_item_id is not null then
    update public.inventory_items
    set current_stock = current_stock - 1
    where id = v_inventory_item_id;
  end if;
end;
$$;
