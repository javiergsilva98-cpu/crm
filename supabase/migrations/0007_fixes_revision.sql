-- Correcciones de una revisión de código completa:
--
-- 1. "Saldo del club" en /tesoreria se calculaba sumando localmente las
--    filas que el rol actual podía leer por RLS. Para presidente/tesorero
--    es correcto (ven todo), pero el día que un socio real tenga su
--    propio login, RLS solo le deja ver sus propios movimientos, y esa
--    suma parcial se mostraría como si fuera el saldo de todo el club.
--    club_balance() calcula el total real sin depender de qué filas
--    puede ver quien pregunta.
--
-- 2. Nada impedía que un voto se insertara con un option_id de OTRA
--    votación (el formulario nunca lo comprobaba, ni la política RLS,
--    ni una constraint). El trigger de abajo lo bloquea a nivel de base
--    de datos.
--
-- 3. Se podía marcar un consumo de un artículo ya desactivado de la
--    carta si la petición llegaba después de que alguien lo desactivara
--    (la comprobación de "active" solo existía en el cliente).

create function public.club_balance()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    sum(case when movement_type in ('cuota', 'ingreso') then amount else -amount end),
    0
  )
  from public.treasury_movements;
$$;

create function public.check_vote_cast_option()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.vote_options
    where id = new.option_id and vote_id = new.vote_id
  ) then
    raise exception 'La opción elegida no pertenece a esta votación.';
  end if;
  return new;
end;
$$;

create trigger check_vote_cast_option_matches
  before insert on public.vote_casts
  for each row execute function public.check_vote_cast_option();

drop policy "consumptions_insert" on public.consumptions;
create policy "consumptions_insert" on public.consumptions
  for insert with check (
    (
      public.current_role() in ('admin', 'presidente', 'tesorero')
      or member_id = (select member_id from public.profiles where id = auth.uid())
    )
    and exists (
      select 1 from public.menu_items mi where mi.id = menu_item_id and mi.active = true
    )
  );
