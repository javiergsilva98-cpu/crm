-- Fase 5 de 9: votaciones con fecha límite opcional (cierre automático
-- y resultado visible para todos), categoría "express" y creación
-- restringida a presidencia y secretaría.

alter table public.votes
  add column deadline timestamptz,
  add column category text not null default 'normal' check (category in ('normal', 'express')),
  add column auto_closed boolean not null default false;

-- Cierra por sistema las votaciones cuya fecha límite ya pasó. No hay
-- cron en este despliegue, así que se llama de forma perezosa (al
-- cargar /votaciones y el Panel) en vez de exactamente en el segundo en
-- que vence — para un club de este tamaño es más que suficiente y evita
-- depender de pg_cron u otro job externo.
create function public.close_expired_votes()
returns void
language sql
security definer
set search_path = public
as $$
  update public.votes
  set status = 'cerrada', auto_closed = true
  where status = 'abierta' and deadline is not null and deadline <= now();
$$;

-- Antes solo importaba el status; ahora también hay que respetar la
-- fecha límite aunque el status en la fila todavía no se haya
-- refrescado (por ejemplo, si nadie ha visitado /votaciones desde que
-- venció).
drop policy "vote_casts_insert" on public.vote_casts;
create policy "vote_casts_insert" on public.vote_casts
  for insert with check (
    member_id = (select member_id from public.profiles where id = auth.uid())
    and exists (
      select 1 from public.votes v
      where v.id = vote_id and v.status = 'abierta' and (v.deadline is null or v.deadline > now())
    )
  );

-- Crear una votación nueva pasa a ser cosa solo de presidencia y
-- secretaría (admin incluido, como en el resto de la app). Cerrar una
-- ya creada sigue siendo cosa de toda la directiva, como hasta ahora.
drop policy "votes_write" on public.votes;
create policy "votes_insert" on public.votes
  for insert with check (public.current_role() in ('admin', 'presidente', 'secretario'));
create policy "votes_update" on public.votes
  for update using (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero'))
  with check (public.current_role() in ('admin', 'presidente', 'vicepresidente', 'secretario', 'tesorero', 'bodeguero'));

drop policy "vote_options_write" on public.vote_options;
create policy "vote_options_insert" on public.vote_options
  for insert with check (public.current_role() in ('admin', 'presidente', 'secretario'));
