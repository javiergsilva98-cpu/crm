-- Esquema inicial de CLUB 26: socios, invitados, consumos, tesorería,
-- inventario, eventos y documentación. Diseñado para RLS por rol desde
-- el principio, aunque en esta fase el único usuario real es la demo.

-- ---------------------------------------------------------------------
-- members: ficha de socios
-- ---------------------------------------------------------------------
create table public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  club_role text not null default 'socio'
    check (club_role in ('presidente', 'secretario', 'tesorero', 'bodeguero', 'socio')),
  status text not null default 'activo' check (status in ('activo', 'baja')),
  key_number text,
  joined_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- events: eventos del club (referenciado por treasury_movements)
-- ---------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  responsible_member_id uuid references public.members (id) on delete set null,
  event_date date not null default current_date,
  total_cost numeric(10, 2) not null default 0,
  charge_status text not null default 'pendiente'
    check (charge_status in ('pendiente', 'parcial', 'cobrado')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- guests: invitados (fuera de alcance el control de límites por ahora)
-- ---------------------------------------------------------------------
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  host_member_id uuid not null references public.members (id) on delete cascade,
  visit_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- profiles: perfil de autenticación, vinculado 1:1 a auth.users
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'socio'
    check (role in ('presidente', 'secretario', 'tesorero', 'bodeguero', 'socio')),
  member_id uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Crea automáticamente el perfil cuando se registra un usuario en Supabase Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'socio');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Devuelve el rol del usuario autenticado (o null si no tiene perfil).
create function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- menu_items: carta de bebidas / aperitivos
-- ---------------------------------------------------------------------
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('bebida', 'aperitivo')),
  price numeric(6, 2) not null check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- consumptions: consumo de socios (deuda propia, no mueve tesorería)
-- ---------------------------------------------------------------------
create table public.consumptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(6, 2) not null,
  consumed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- treasury_movements: caja del club
-- ---------------------------------------------------------------------
create table public.treasury_movements (
  id uuid primary key default gen_random_uuid(),
  movement_type text not null
    check (movement_type in ('cuota', 'compra_ordinaria', 'compra_evento', 'compra_grande', 'urgencia', 'ingreso')),
  amount numeric(10, 2) not null check (amount >= 0),
  movement_date date not null default current_date,
  description text,
  member_id uuid references public.members (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- inventory_items / inventory_restocks: bodega
-- ---------------------------------------------------------------------
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null default 'ud',
  current_stock numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.inventory_restocks (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items (id) on delete cascade,
  quantity numeric(10, 2) not null check (quantity > 0),
  cost numeric(10, 2) not null default 0,
  restocked_at date not null default current_date,
  responsible_member_id uuid references public.members (id) on delete set null,
  created_at timestamptz not null default now()
);

create function public.apply_inventory_restock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inventory_items
  set current_stock = current_stock + new.quantity
  where id = new.inventory_item_id;
  return new;
end;
$$;

create trigger on_inventory_restock
  after insert on public.inventory_restocks
  for each row execute function public.apply_inventory_restock();

-- ---------------------------------------------------------------------
-- documents: documentación (placeholder, sin almacenamiento real todavía)
-- ---------------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  doc_type text not null default 'otro' check (doc_type in ('acta', 'normativa', 'contrato', 'otro')),
  reference_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index guests_host_member_id_idx on public.guests (host_member_id);
create index profiles_member_id_idx on public.profiles (member_id);
create index consumptions_member_id_idx on public.consumptions (member_id);
create index consumptions_menu_item_id_idx on public.consumptions (menu_item_id);
create index treasury_movements_member_id_idx on public.treasury_movements (member_id);
create index treasury_movements_event_id_idx on public.treasury_movements (event_id);
create index inventory_restocks_item_id_idx on public.inventory_restocks (inventory_item_id);
create index events_responsible_member_id_idx on public.events (responsible_member_id);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.members enable row level security;
alter table public.events enable row level security;
alter table public.guests enable row level security;
alter table public.profiles enable row level security;
alter table public.menu_items enable row level security;
alter table public.consumptions enable row level security;
alter table public.treasury_movements enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_restocks enable row level security;
alter table public.documents enable row level security;

-- members: gestión (presidente/secretario) ve todo; tesorero ve todo para
-- calcular saldos; bodeguero y socio solo su propia ficha.
create policy "members_select" on public.members
  for select using (
    public.current_role() in ('presidente', 'secretario', 'tesorero')
    or id = (select member_id from public.profiles where id = auth.uid())
  );
create policy "members_write" on public.members
  for all using (public.current_role() in ('presidente', 'secretario'))
  with check (public.current_role() in ('presidente', 'secretario'));

-- events: presidente/secretario/tesorero.
create policy "events_select" on public.events
  for select using (public.current_role() in ('presidente', 'secretario', 'tesorero'));
create policy "events_write" on public.events
  for all using (public.current_role() in ('presidente', 'secretario', 'tesorero'))
  with check (public.current_role() in ('presidente', 'secretario', 'tesorero'));

-- guests: presidente/secretario.
create policy "guests_select" on public.guests
  for select using (public.current_role() in ('presidente', 'secretario'));
create policy "guests_write" on public.guests
  for all using (public.current_role() in ('presidente', 'secretario'))
  with check (public.current_role() in ('presidente', 'secretario'));

-- profiles: cada usuario ve el suyo; presidente ve todos.
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.current_role() = 'presidente');
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- menu_items: lectura para cualquier socio autenticado; escritura para
-- quien fija precios y gestiona la carta.
create policy "menu_items_select" on public.menu_items
  for select using (auth.uid() is not null);
create policy "menu_items_write" on public.menu_items
  for all using (public.current_role() in ('presidente', 'tesorero', 'bodeguero'))
  with check (public.current_role() in ('presidente', 'tesorero', 'bodeguero'));

-- consumptions: gestión ve todo; el socio solo lo suyo (lectura y alta).
create policy "consumptions_select" on public.consumptions
  for select using (
    public.current_role() in ('presidente', 'tesorero')
    or member_id = (select member_id from public.profiles where id = auth.uid())
  );
create policy "consumptions_insert" on public.consumptions
  for insert with check (
    public.current_role() in ('presidente', 'tesorero')
    or member_id = (select member_id from public.profiles where id = auth.uid())
  );

-- treasury_movements: presidente/tesorero ven y registran todo; el socio
-- solo ve sus propios movimientos (secretario y bodeguero no ven dinero).
create policy "treasury_movements_select" on public.treasury_movements
  for select using (
    public.current_role() in ('presidente', 'tesorero')
    or member_id = (select member_id from public.profiles where id = auth.uid())
  );
create policy "treasury_movements_write" on public.treasury_movements
  for all using (public.current_role() in ('presidente', 'tesorero'))
  with check (public.current_role() in ('presidente', 'tesorero'));

-- inventory_items / inventory_restocks: bodeguero y presidente gestionan;
-- tesorero solo lectura (los costes son dinero).
create policy "inventory_items_select" on public.inventory_items
  for select using (public.current_role() in ('presidente', 'tesorero', 'bodeguero'));
create policy "inventory_items_write" on public.inventory_items
  for all using (public.current_role() in ('presidente', 'bodeguero'))
  with check (public.current_role() in ('presidente', 'bodeguero'));

create policy "inventory_restocks_select" on public.inventory_restocks
  for select using (public.current_role() in ('presidente', 'tesorero', 'bodeguero'));
create policy "inventory_restocks_insert" on public.inventory_restocks
  for insert with check (public.current_role() in ('presidente', 'bodeguero'));

-- documents: presidente/secretario.
create policy "documents_select" on public.documents
  for select using (public.current_role() in ('presidente', 'secretario'));
create policy "documents_write" on public.documents
  for all using (public.current_role() in ('presidente', 'secretario'))
  with check (public.current_role() in ('presidente', 'secretario'));
