-- Auditoría: cierra un hueco menor en protect_profile_columns (0009) y
-- añade índices que faltaban en columnas usadas en filtros habituales.

-- profiles_update_self permite a cualquiera actualizar su propia fila;
-- el trigger de 0009 ya protegía role y member_id, pero no email, que
-- se desincronizaría del email real de auth.users si alguien lo tocara.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if new.role is distinct from old.role and public.current_role() not in ('admin', 'presidente') then
      raise exception 'No tienes permiso para cambiar el rol.';
    end if;
    if new.member_id is distinct from old.member_id and public.current_role() not in ('admin', 'presidente') then
      raise exception 'No tienes permiso para cambiar el socio vinculado.';
    end if;
    if new.email is distinct from old.email and public.current_role() not in ('admin', 'presidente') then
      raise exception 'No tienes permiso para cambiar el email.';
    end if;
  end if;
  return new;
end;
$$;

create index if not exists treasury_movements_type_idx on public.treasury_movements (movement_type);
create index if not exists treasury_movements_date_idx on public.treasury_movements (movement_date);
create index if not exists consumptions_consumed_at_idx on public.consumptions (consumed_at);
create index if not exists events_event_date_idx on public.events (event_date);
create index if not exists events_status_idx on public.events (status);
create index if not exists members_status_idx on public.members (status);
