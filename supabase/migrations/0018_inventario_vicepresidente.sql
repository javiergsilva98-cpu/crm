-- Fase 3 de 9: separa Inventario (stock, coste, precio de venta — solo
-- gestión) de Consumiciones (que ya seguía las reglas de la Fase 1), y
-- añade conteo físico. De paso se da de alta el rol "vicepresidente"
-- (no existía todavía), con el mismo nivel de acceso que "presidente"
-- en todas las políticas, igual que se hizo con "admin" en 0002.

-- ---------------------------------------------------------------------
-- 1. Rol vicepresidente: roles válidos + guardas de cambio de cuenta.
-- ---------------------------------------------------------------------
alter table public.members drop constraint members_club_role_check;
alter table public.members add constraint members_club_role_check
  check (club_role in ('presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero', 'socio'));

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero', 'socio'));

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if new.role is distinct from old.role and public.current_role() not in ('admin', 'presidente', 'vicepresidente') then
      raise exception 'No tienes permiso para cambiar el rol.';
    end if;
    if new.member_id is distinct from old.member_id and public.current_role() not in ('admin', 'presidente', 'vicepresidente') then
      raise exception 'No tienes permiso para cambiar el socio vinculado.';
    end if;
    if new.email is distinct from old.email and public.current_role() not in ('admin', 'presidente', 'vicepresidente') then
      raise exception 'No tienes permiso para cambiar el email.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.record_shared_consumption(
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
     and public.current_role() not in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero')
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

-- Políticas existentes: añade vicepresidente donde ya estaba presidente,
-- con el mismo nivel de acceso.
drop policy "members_select" on public.members;
create policy "members_select" on public.members
  for select using (
    public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero')
    or id = (select member_id from public.profiles where id = auth.uid())
  );
drop policy "members_write" on public.members;
create policy "members_write" on public.members
  for all using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario'));

drop policy "events_insert" on public.events;
create policy "events_insert" on public.events
  for insert with check (
    public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero')
    or (
      kind = 'reserva'
      and status = 'pendiente'
      and requested_by_member_id = (select member_id from public.profiles where id = auth.uid())
    )
  );
drop policy "events_update" on public.events;
create policy "events_update" on public.events
  for update using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero'));

drop policy "guests_select" on public.guests;
create policy "guests_select" on public.guests
  for select using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario'));
drop policy "guests_write" on public.guests;
create policy "guests_write" on public.guests
  for all using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario'));

drop policy "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.current_role() in ('admin', 'presidente', 'vicepresidente'));

drop policy "menu_items_write" on public.menu_items;
create policy "menu_items_write" on public.menu_items
  for all using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero'));

drop policy "consumptions_select" on public.consumptions;
create policy "consumptions_select" on public.consumptions
  for select using (
    public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero')
    or member_id = (select member_id from public.profiles where id = auth.uid())
  );
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
  );

drop policy "treasury_movements_select" on public.treasury_movements;
create policy "treasury_movements_select" on public.treasury_movements
  for select using (
    public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero')
    or member_id = (select member_id from public.profiles where id = auth.uid())
    or movement_type = 'compra_grande'
  );
drop policy "treasury_movements_write" on public.treasury_movements;
create policy "treasury_movements_write" on public.treasury_movements
  for all using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero'));

drop policy "inventory_items_select" on public.inventory_items;
create policy "inventory_items_select" on public.inventory_items
  for select using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero'));
drop policy "inventory_items_write" on public.inventory_items;
create policy "inventory_items_write" on public.inventory_items
  for all using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'bodeguero'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'bodeguero'));

drop policy "inventory_restocks_select" on public.inventory_restocks;
create policy "inventory_restocks_select" on public.inventory_restocks
  for select using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero'));
-- La reposición pasa a estar también disponible para tesorero (además de
-- admin/presidencia/bodeguero), tal y como pide la Fase 3.
drop policy "inventory_restocks_insert" on public.inventory_restocks;
create policy "inventory_restocks_insert" on public.inventory_restocks
  for insert with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero'));

drop policy "documents_select" on public.documents;
create policy "documents_select" on public.documents
  for select using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario'));
drop policy "documents_write" on public.documents;
create policy "documents_write" on public.documents
  for all using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario'));

drop policy "votes_write" on public.votes;
create policy "votes_write" on public.votes
  for all using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero'));
drop policy "vote_options_write" on public.vote_options;
create policy "vote_options_write" on public.vote_options
  for all using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero'));
drop policy "vote_casts_select" on public.vote_casts;
create policy "vote_casts_select" on public.vote_casts
  for select using (
    public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero')
    or member_id = (select member_id from public.profiles where id = auth.uid())
    or exists (select 1 from public.votes v where v.id = vote_casts.vote_id and v.is_anonymous = false)
  );

drop policy "audit_log_select" on public.audit_log;
create policy "audit_log_select" on public.audit_log
  for select using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero'));

drop policy "incidencias_select" on public.incidencias;
create policy "incidencias_select" on public.incidencias
  for select using (
    public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero')
    or reportado_por_member_id = (select member_id from public.profiles where id = auth.uid())
  );
drop policy "incidencias_insert" on public.incidencias;
create policy "incidencias_insert" on public.incidencias
  for insert with check (
    public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero')
    or reportado_por_member_id = (select member_id from public.profiles where id = auth.uid())
  );

drop policy "club_settings_write" on public.club_settings;
create policy "club_settings_write" on public.club_settings
  for update using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero'));

-- ---------------------------------------------------------------------
-- 2. Inventario: coste actual por artículo (para la pantalla de
--    Inventario, separada de Consumiciones). Se recalcula solo con cada
--    reposición: coste del pedido / cantidad repuesta.
-- ---------------------------------------------------------------------
alter table public.inventory_items
  add column current_cost numeric(10, 2) not null default 0;

create or replace function public.apply_inventory_restock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inventory_items
  set current_stock = current_stock + new.quantity,
      current_cost = case
        when new.quantity > 0 and new.cost > 0 then round(new.cost / new.quantity, 2)
        else current_cost
      end
  where id = new.inventory_item_id;
  return new;
end;
$$;

-- Alta de un artículo de bodega nuevo (Fase 3, requisito 3): crea el
-- artículo de inventario, su primera reposición y el artículo de carta
-- vinculado en una sola operación atómica. El precio de venta se
-- introduce a mano por ahora (el cálculo automático a partir del coste
-- es la Fase 4).
create function public.create_inventory_item(
  p_name text,
  p_unit text,
  p_category text,
  p_stock_mode text,
  p_quantity numeric,
  p_cost numeric,
  p_sale_price numeric,
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
  if p_sale_price is null or p_sale_price <= 0 then
    raise exception 'Indica un precio de venta válido.';
  end if;

  insert into public.inventory_items (name, unit, low_stock_threshold)
  values (p_name, coalesce(nullif(trim(p_unit), ''), 'ud'), coalesce(p_low_stock_threshold, 5))
  returning id into v_item_id;

  insert into public.inventory_restocks (inventory_item_id, quantity, cost, responsible_member_id)
  values (v_item_id, p_quantity, coalesce(p_cost, 0), p_responsible_member_id);

  insert into public.menu_items (name, category, price, inventory_item_id, stock_mode)
  values (p_name, p_category, p_sale_price, v_item_id, coalesce(p_stock_mode, 'unit'));

  return v_item_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Conteo físico: el bodeguero introduce la cantidad real de cada
--    artículo (ej. antes de un fin de semana de fiestas); se compara
--    con el stock teórico y, al guardar, el stock se ajusta a lo
--    contado (para que quede corregido y el conteo sirva de verdad).
-- ---------------------------------------------------------------------
create table public.inventory_counts (
  id uuid primary key default gen_random_uuid(),
  counted_by_member_id uuid references public.members (id) on delete set null,
  counted_at timestamptz not null default now(),
  notes text
);

create table public.inventory_count_lines (
  id uuid primary key default gen_random_uuid(),
  count_id uuid not null references public.inventory_counts (id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items (id) on delete cascade,
  expected_stock numeric(10, 2) not null,
  actual_stock numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index inventory_count_lines_count_id_idx on public.inventory_count_lines (count_id);
create index inventory_count_lines_inventory_item_id_idx on public.inventory_count_lines (inventory_item_id);

create function public.apply_inventory_count_line()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inventory_items
  set current_stock = new.actual_stock
  where id = new.inventory_item_id;
  return new;
end;
$$;

create trigger on_inventory_count_line
  after insert on public.inventory_count_lines
  for each row execute function public.apply_inventory_count_line();

alter table public.inventory_counts enable row level security;
alter table public.inventory_count_lines enable row level security;

create policy "inventory_counts_select" on public.inventory_counts
  for select using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero'));
create policy "inventory_counts_insert" on public.inventory_counts
  for insert with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'bodeguero'));

create policy "inventory_count_lines_select" on public.inventory_count_lines
  for select using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero'));
create policy "inventory_count_lines_insert" on public.inventory_count_lines
  for insert with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'bodeguero'));

create trigger inventory_counts_audit
  after insert on public.inventory_counts
  for each row execute function public.record_audit_entry();
create trigger inventory_count_lines_audit
  after insert on public.inventory_count_lines
  for each row execute function public.record_audit_entry();
