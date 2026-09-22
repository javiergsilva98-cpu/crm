-- El fichaje (abrir/cerrar el local, "estoy en el local", ceder
-- responsabilidad) resolvía siempre "quién eres" a partir de
-- profiles.member_id de la cuenta real autenticada. Eso funciona para
-- una cuenta real futura de un socio concreto, pero en la demo actual
-- toda la app corre sobre una única cuenta compartida (sin
-- profiles.member_id propio o siempre el mismo), así que el fichaje no
-- "reconocía" a nadie y era imposible probar el flujo de abrir/estar
-- presente cambiando de socio con el selector "Viendo como" (como sí
-- se puede hacer en Consumiciones o Tesorería).
--
-- Se añade un parámetro opcional p_member_id a cada función: si se
-- indica, se usa ese socio en vez de current_member_id() — pero solo
-- si coincide con el propio socio de la cuenta o si quien llama tiene
-- un rol de gestión (mismo criterio que ya usa consumptions_insert
-- para dejar registrar consumos en nombre de otro socio). Así una
-- cuenta real de socio normal, el día de mañana, seguirá sin poder
-- suplantar a otro.

create or replace function public.club_open(p_member_id uuid default null)
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
  if p_member_id is not null and p_member_id is distinct from v_member_id then
    if public.current_role() not in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero') then
      raise exception 'No puedes fichar en nombre de otro socio.';
    end if;
    v_member_id := p_member_id;
  end if;
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

create or replace function public.club_close(p_member_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_is_open boolean;
  v_responsible_id uuid;
  v_can_manage boolean;
begin
  v_member_id := public.current_member_id();
  v_can_manage := public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero');
  if p_member_id is not null and p_member_id is distinct from v_member_id then
    if not v_can_manage then
      raise exception 'No puedes fichar en nombre de otro socio.';
    end if;
    v_member_id := p_member_id;
  end if;

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

create or replace function public.club_checkin(p_member_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
begin
  v_member_id := public.current_member_id();
  if p_member_id is not null and p_member_id is distinct from v_member_id then
    if public.current_role() not in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero') then
      raise exception 'No puedes fichar en nombre de otro socio.';
    end if;
    v_member_id := p_member_id;
  end if;
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

create or replace function public.club_checkout(p_member_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
begin
  v_member_id := public.current_member_id();
  if p_member_id is not null and p_member_id is distinct from v_member_id then
    if public.current_role() not in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero') then
      raise exception 'No puedes fichar en nombre de otro socio.';
    end if;
    v_member_id := p_member_id;
  end if;
  update public.presence
  set checked_out_at = now()
  where member_id = v_member_id and checked_out_at is null;
end;
$$;

create or replace function public.transfer_responsibility(p_to_member_id uuid, p_member_id uuid default null)
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
  if p_member_id is not null and p_member_id is distinct from v_member_id then
    if public.current_role() not in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero') then
      raise exception 'No puedes fichar en nombre de otro socio.';
    end if;
    v_member_id := p_member_id;
  end if;
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

create or replace function public.accept_responsibility(p_transfer_id uuid, p_member_id uuid default null)
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
  if p_member_id is not null and p_member_id is distinct from v_member_id then
    if public.current_role() not in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero') then
      raise exception 'No puedes fichar en nombre de otro socio.';
    end if;
    v_member_id := p_member_id;
  end if;
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

create or replace function public.reject_responsibility(p_transfer_id uuid, p_member_id uuid default null)
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
  if p_member_id is not null and p_member_id is distinct from v_member_id then
    if public.current_role() not in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero') then
      raise exception 'No puedes fichar en nombre de otro socio.';
    end if;
    v_member_id := p_member_id;
  end if;
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
