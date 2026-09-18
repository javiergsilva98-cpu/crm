-- Votaciones del club: la directiva (presidente y cargos del consejo)
-- crea votaciones con varias opciones, públicas o anónimas. Cada socio
-- vota una vez. Los recuentos se calculan con una función
-- security definer para que el total sea correcto también en las
-- votaciones anónimas, sin revelar quién votó qué a quien no deba.

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  description text,
  is_anonymous boolean not null default false,
  status text not null default 'abierta' check (status in ('abierta', 'cerrada')),
  created_by_member_id uuid references public.members (id) on delete set null,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.vote_options (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes (id) on delete cascade,
  label text not null,
  position integer not null default 0
);

create table public.vote_casts (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes (id) on delete cascade,
  option_id uuid not null references public.vote_options (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  voted_at timestamptz not null default now(),
  unique (vote_id, member_id)
);

create index vote_options_vote_id_idx on public.vote_options (vote_id);
create index vote_casts_vote_id_idx on public.vote_casts (vote_id);
create index vote_casts_member_id_idx on public.vote_casts (member_id);

-- Recuento por opción. security definer: en una votación anónima, un
-- socio normal no puede leer vote_casts de otros (RLS abajo), pero
-- necesita ver el total agregado. Esta función sí lo puede calcular
-- porque corre con permisos elevados, y solo devuelve sumas, nunca
-- quién votó qué.
create function public.vote_results(p_vote_id uuid)
returns table (option_id uuid, label text, votes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select vo.id, vo.label, count(vc.id)
  from public.vote_options vo
  left join public.vote_casts vc on vc.option_id = vo.id
  where vo.vote_id = p_vote_id
  group by vo.id, vo.label, vo.position
  order by vo.position;
$$;

alter table public.votes enable row level security;
alter table public.vote_options enable row level security;
alter table public.vote_casts enable row level security;

-- Cualquier socio autenticado ve las votaciones y sus opciones.
create policy "votes_select" on public.votes
  for select using (auth.uid() is not null);
create policy "vote_options_select" on public.vote_options
  for select using (auth.uid() is not null);

-- Solo la directiva (admin, presidente y cargos del consejo) crea,
-- edita y cierra votaciones.
create policy "votes_write" on public.votes
  for all using (public.current_role() in ('admin', 'presidente', 'secretario', 'tesorero', 'bodeguero'))
  with check (public.current_role() in ('admin', 'presidente', 'secretario', 'tesorero', 'bodeguero'));
create policy "vote_options_write" on public.vote_options
  for all using (public.current_role() in ('admin', 'presidente', 'secretario', 'tesorero', 'bodeguero'))
  with check (public.current_role() in ('admin', 'presidente', 'secretario', 'tesorero', 'bodeguero'));

-- Lectura de vote_casts: la directiva ve todo (auditoría); cualquiera
-- ve su propio voto; y en una votación PÚBLICA (no anónima) cualquiera
-- ve todos los votos. En una votación anónima, un socio normal solo ve
-- el suyo (el recuento agregado se obtiene con vote_results()).
create policy "vote_casts_select" on public.vote_casts
  for select using (
    public.current_role() in ('admin', 'presidente', 'secretario', 'tesorero', 'bodeguero')
    or member_id = (select member_id from public.profiles where id = auth.uid())
    or exists (select 1 from public.votes v where v.id = vote_casts.vote_id and v.is_anonymous = false)
  );

-- Cualquier socio vota una vez, mientras la votación esté abierta, y
-- solo en su propio nombre.
create policy "vote_casts_insert" on public.vote_casts
  for insert with check (
    member_id = (select member_id from public.profiles where id = auth.uid())
    and exists (select 1 from public.votes v where v.id = vote_id and v.status = 'abierta')
  );
