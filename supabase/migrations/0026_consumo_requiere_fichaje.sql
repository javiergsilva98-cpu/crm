-- Si no estás fichado en el local, no puedes pedir consumiciones: tanto
-- el insert directo (markConsumption) como el reparto compartido
-- (record_shared_consumption) exigen ahora que el socio para el que se
-- registra el consumo tenga una presencia activa en `presence`
-- (checked_out_at is null) — el mismo fichaje de la Fase 8 ("Estoy en
-- el local"). Aplica también a admin/presidente/vicepresidente/
-- tesorero cuando registran un consumo para otro socio: la regla es
-- sobre quien consume, no sobre quien lo teclea.

drop policy "consumptions_insert" on public.consumptions;
create policy "consumptions_insert" on public.consumptions
  for insert with check (
    (
      public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero')
      or member_id = (select member_id from public.profiles where id = auth.uid())
    )
    and exists (
      select 1 from public.menu_items mi where mi.id = menu_item_id and mi.active = true
    )
    and exists (
      select 1 from public.presence p
      where p.member_id = consumptions.member_id and p.checked_out_at is null
    )
  );

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
  v_missing_member text;
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

  select m.full_name into v_missing_member
  from unnest(p_member_ids) as ids(member_id)
  join public.members m on m.id = ids.member_id
  where not exists (
    select 1 from public.presence p where p.member_id = ids.member_id and p.checked_out_at is null
  )
  limit 1;
  if v_missing_member is not null then
    raise exception '% no está fichado en el local — no se puede repartir un consumo con quien no está dentro.', v_missing_member;
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
