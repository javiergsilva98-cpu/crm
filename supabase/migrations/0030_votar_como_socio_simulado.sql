-- Mismo problema que ya se arregló en Fichaje (0027): la política
-- "vote_casts_insert" exige member_id = el socio real al que está
-- enlazada la cuenta que ha iniciado sesión (current_member_id()), pero
-- las pantallas de la demo dejan "actuar como" un socio distinto
-- mediante la cookie demo_member_id. Para la cuenta demo compartida
-- (rol real fijo en profiles), votar como un socio simulado distinto
-- fallaba la RLS en silencio — no dejaba votar a admin/presidencia/
-- tesorería salvo que coincidiera por casualidad con su propio enlace.
--
-- Se sustituye el insert directo en vote_casts por una función
-- (mismo patrón que club_open/club_checkin) que admite un
-- p_member_id opcional: solo se puede votar "en nombre de" otro socio
-- si el rol real de quien llama es de gestión, igual que ya se exige
-- para fichar por otro.
create or replace function public.cast_vote(p_vote_id uuid, p_option_id uuid, p_member_id uuid default null)
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
      raise exception 'No puedes votar en nombre de otro socio.';
    end if;
    v_member_id := p_member_id;
  end if;
  if v_member_id is null then
    raise exception 'No se pudo identificar tu ficha de socio.';
  end if;

  if not exists (
    select 1 from public.votes v
    where v.id = p_vote_id and v.status = 'abierta' and (v.deadline is null or v.deadline > now())
  ) then
    raise exception 'Esta votación ya no está abierta.';
  end if;

  insert into public.vote_casts (vote_id, option_id, member_id)
  values (p_vote_id, p_option_id, v_member_id);
end;
$$;
