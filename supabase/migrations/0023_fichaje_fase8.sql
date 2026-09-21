-- Fase 8 de 10: fichaje (club abierto/cerrado) con cesión de
-- responsabilidad. Siempre debe quedar claro quién es responsable de
-- cerrar el local, y ese rol solo cambia de persona si la nueva
-- persona lo acepta explícitamente.

create function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select member_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 1. club_status: switch general, singleton igual que club_settings.
--    Guarda también el nombre del responsable en claro (denormalizado
--    de members, igual que se hizo con menu_items.current_cost en la
--    Fase 4) porque members_select no deja ver a cualquier socio el
--    nombre de cualquier otro, y el responsable tiene que ser visible
--    para todo el club.
-- ---------------------------------------------------------------------
create table public.club_status (
  id boolean primary key default true,
  check (id),
  is_open boolean not null default false,
  responsible_member_id uuid references public.members (id) on delete set null,
  responsible_member_name text,
  opened_by_member_id uuid references public.members (id) on delete set null,
  opened_at timestamptz,
  closed_at timestamptz
);
insert into public.club_status (id) values (true);

alter table public.club_status enable row level security;
create policy "club_status_select" on public.club_status
  for select using (auth.uid() is not null);
-- Sin policy de escritura: solo las funciones de abajo.

create trigger club_status_audit
  after update on public.club_status
  for each row execute function public.record_audit_entry();

-- ---------------------------------------------------------------------
-- 2. presence: fichaje personal, independiente del switch general.
--    checked_out_at nulo = sigue dentro.
-- ---------------------------------------------------------------------
create table public.presence (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  member_name text not null,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz
);
create index presence_member_id_idx on public.presence (member_id);
create index presence_active_idx on public.presence (checked_out_at) where checked_out_at is null;

alter table public.presence enable row level security;

-- Requisito 4: la lista de quién está dentro solo la ve, entre socios,
-- quien tenga su propio fichaje activo en este momento; la directiva
-- con acceso a auditoría la ve siempre (el dato queda registrado igual
-- aunque el socio de a pie no pueda consultarlo si no está fichado).
create policy "presence_select" on public.presence
  for select using (
    public.current_role() in ('admin', 'presidente', 'tesorero')
    or exists (
      select 1 from public.presence p2
      where p2.member_id = public.current_member_id() and p2.checked_out_at is null
    )
  );

-- ---------------------------------------------------------------------
-- 3. responsibility_transfers: cada cesión, aceptada o no, queda como
--    fila permanente (es a la vez la invitación pendiente y el
--    historial del requisito 8).
-- ---------------------------------------------------------------------
create table public.responsibility_transfers (
  id uuid primary key default gen_random_uuid(),
  from_member_id uuid not null references public.members (id) on delete cascade,
  from_member_name text not null,
  to_member_id uuid not null references public.members (id) on delete cascade,
  to_member_name text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'aceptada', 'rechazada', 'cancelada')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
create index responsibility_transfers_to_member_idx on public.responsibility_transfers (to_member_id, status);

alter table public.responsibility_transfers enable row level security;
create policy "responsibility_transfers_select" on public.responsibility_transfers
  for select using (
    public.current_role() in ('admin', 'presidente', 'tesorero')
    or from_member_id = public.current_member_id()
    or to_member_id = public.current_member_id()
  );

create trigger responsibility_transfers_audit
  after insert or update on public.responsibility_transfers
  for each row execute function public.record_audit_entry();

-- ---------------------------------------------------------------------
-- 4. club_status_log: apertura y cierre (las cesiones ya quedan en
--    responsibility_transfers). Solo consultable por admin, presidencia
--    y tesorería, tal cual pide el requisito 8 — no se amplía a
--    vicepresidencia por mirroring, es la lista literal que se dio.
-- ---------------------------------------------------------------------
create table public.club_status_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('apertura', 'cierre')),
  actor_member_id uuid references public.members (id) on delete set null,
  actor_member_name text,
  created_at timestamptz not null default now(),
  detail text
);

alter table public.club_status_log enable row level security;
create policy "club_status_log_select" on public.club_status_log
  for select using (public.current_role() in ('admin', 'presidente', 'tesorero'));

-- ---------------------------------------------------------------------
-- 5. Funciones: todo pasa por aquí, nunca por insert/update directo
--    desde el cliente.
-- ---------------------------------------------------------------------

-- "He abierto": pone el switch a abierto, te hace responsable de
-- apertura y cierre, y te ficha a ti automáticamente (quien pulsa esto
-- está, por definición, en el local).
create function public.club_open()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_member_name text;
begin
  v_member_id := public.current_member_id();
  if v_member_id is null then
    raise exception 'No se pudo identificar tu ficha de socio.';
  end if;

  if (select is_open from public.club_status where id = true) then
    raise exception 'El local ya está abierto.';
  end if;

  select full_name into v_member_name from public.members where id = v_member_id;

  update public.club_status
  set is_open = true,
      responsible_member_id = v_member_id,
      responsible_member_name = v_member_name,
      opened_by_member_id = v_member_id,
      opened_at = now(),
      closed_at = null
  where id = true;

  insert into public.presence (member_id, member_name)
  select v_member_id, v_member_name
  where not exists (
    select 1 from public.presence where member_id = v_member_id and checked_out_at is null
  );

  insert into public.club_status_log (event_type, actor_member_id, actor_member_name)
  values ('apertura', v_member_id, v_member_name);
end;
$$;

-- Cierra el local. Solo puede hacerlo el responsable actual (o
-- admin/presidente como salvaguarda operativa, igual que en el resto
-- de la app) — deliberadamente disponible aunque queden socios
-- fichados dentro (requisito 6 y 9). Cancela cualquier cesión
-- pendiente, porque ya no tiene sentido aceptarla.
create function public.club_close()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_is_open boolean;
  v_responsible_id uuid;
begin
  v_member_id := public.current_member_id();
  select is_open, responsible_member_id into v_is_open, v_responsible_id
    from public.club_status where id = true;

  if not coalesce(v_is_open, false) then
    raise exception 'El local ya está cerrado.';
  end if;
  if v_member_id is distinct from v_responsible_id
     and public.current_role() not in ('admin', 'presidente') then
    raise exception 'Solo el responsable actual puede cerrar el local.';
  end if;

  update public.club_status
  set is_open = false,
      responsible_member_id = null,
      responsible_member_name = null,
      closed_at = now()
  where id = true;

  update public.responsibility_transfers
  set status = 'cancelada', responded_at = now()
  where status = 'pendiente';

  insert into public.club_status_log (event_type, actor_member_id, actor_member_name)
  select 'cierre', v_member_id, full_name from public.members where id = v_member_id;
end;
$$;

-- Fichaje personal: "Estoy en el local" / "Me voy". Requiere que el
-- club esté abierto (si nadie lo ha abierto en la app, no tiene
-- sentido fichar presencia individual todavía).
create function public.club_checkin()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
begin
  v_member_id := public.current_member_id();
  if v_member_id is null then
    raise exception 'No se pudo identificar tu ficha de socio.';
  end if;
  if not coalesce((select is_open from public.club_status where id = true), false) then
    raise exception 'El local está cerrado. Ábrelo primero si acabas de llegar.';
  end if;
  if exists (select 1 from public.presence where member_id = v_member_id and checked_out_at is null) then
    raise exception 'Ya estás fichado como presente.';
  end if;

  insert into public.presence (member_id, member_name)
  select v_member_id, full_name from public.members where id = v_member_id;
end;
$$;

create function public.club_checkout()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
begin
  v_member_id := public.current_member_id();
  update public.presence
  set checked_out_at = now()
  where member_id = v_member_id and checked_out_at is null;
end;
$$;

-- Cede la responsabilidad de cierre a otro socio presente. Mientras no
-- la acepte, el responsable sigue siendo quien la cede.
create function public.transfer_responsibility(p_to_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_member_name text;
  v_to_name text;
begin
  v_member_id := public.current_member_id();
  if v_member_id is distinct from (select responsible_member_id from public.club_status where id = true)
     and public.current_role() not in ('admin', 'presidente') then
    raise exception 'Solo el responsable actual puede ceder la responsabilidad.';
  end if;
  if p_to_member_id = v_member_id then
    raise exception 'Elige a otro socio, no a ti mismo.';
  end if;
  if not exists (select 1 from public.presence where member_id = p_to_member_id and checked_out_at is null) then
    raise exception 'Solo puedes ceder la responsabilidad a alguien que esté fichado como presente ahora mismo.';
  end if;

  select full_name into v_member_name from public.members where id = v_member_id;
  select full_name into v_to_name from public.members where id = p_to_member_id;

  update public.responsibility_transfers
  set status = 'cancelada', responded_at = now()
  where status = 'pendiente' and from_member_id = v_member_id;

  insert into public.responsibility_transfers (from_member_id, from_member_name, to_member_id, to_member_name)
  values (v_member_id, v_member_name, p_to_member_id, v_to_name);
end;
$$;

create function public.accept_responsibility(p_transfer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_to_member_id uuid;
  v_status text;
  v_to_name text;
begin
  v_member_id := public.current_member_id();
  select to_member_id, status, to_member_name into v_to_member_id, v_status, v_to_name
    from public.responsibility_transfers where id = p_transfer_id;

  if v_to_member_id is null then
    raise exception 'Cesión no encontrada.';
  end if;
  if v_member_id is distinct from v_to_member_id then
    raise exception 'Esta cesión no es para ti.';
  end if;
  if v_status <> 'pendiente' then
    raise exception 'Esta cesión ya no está pendiente.';
  end if;

  update public.responsibility_transfers
  set status = 'aceptada', responded_at = now()
  where id = p_transfer_id;

  update public.club_status
  set responsible_member_id = v_to_member_id, responsible_member_name = v_to_name
  where id = true;
end;
$$;

create function public.reject_responsibility(p_transfer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_to_member_id uuid;
  v_status text;
begin
  v_member_id := public.current_member_id();
  select to_member_id, status into v_to_member_id, v_status
    from public.responsibility_transfers where id = p_transfer_id;

  if v_to_member_id is null then
    raise exception 'Cesión no encontrada.';
  end if;
  if v_member_id is distinct from v_to_member_id then
    raise exception 'Esta cesión no es para ti.';
  end if;
  if v_status <> 'pendiente' then
    raise exception 'Esta cesión ya no está pendiente.';
  end if;

  update public.responsibility_transfers
  set status = 'rechazada', responded_at = now()
  where id = p_transfer_id;
end;
$$;
