-- Ageing por etapa y última modificación para el pipeline: `stage_entered_at`
-- se resetea solo cuando cambia `stage` (para calcular cuánto lleva ahí),
-- `updated_at` se toca en cualquier cambio (incluida una nota de actividad).

alter table public.opportunities
  add column if not exists stage_entered_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.touch_opportunity_stage()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' or new.stage is distinct from old.stage then
    new.stage_entered_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists opportunities_touch_stage on public.opportunities;
create trigger opportunities_touch_stage
  before insert or update on public.opportunities
  for each row execute function public.touch_opportunity_stage();

-- Añadir una nota/actividad sobre una oportunidad también cuenta como
-- modificación (mismo criterio que ya existe para contactos).
create or replace function public.touch_opportunity_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.opportunity_id is not null then
    update public.opportunities
    set updated_at = now()
    where id = new.opportunity_id;
  end if;
  return new;
end;
$$;

drop trigger if exists activities_touch_opportunity on public.activities;
create trigger activities_touch_opportunity
  after insert on public.activities
  for each row execute function public.touch_opportunity_activity();
