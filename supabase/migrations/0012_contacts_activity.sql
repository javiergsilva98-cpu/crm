-- URL de origen y seguimiento de última actividad por contacto: se
-- actualiza solo cada vez que se edita el contacto o se le añade una
-- nota/actividad, y guarda quién hizo ese último cambio.

alter table public.contacts
  add column if not exists source_url text,
  add column if not exists last_activity_at timestamptz not null default now(),
  add column if not exists last_activity_by uuid references auth.users (id) on delete set null;

create or replace function public.touch_contact_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.last_activity_at := now();
  new.last_activity_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists contacts_touch_activity on public.contacts;
create trigger contacts_touch_activity
  before insert or update on public.contacts
  for each row execute function public.touch_contact_activity();

-- Añadir una nota/actividad sobre un contacto también cuenta como actividad.
create or replace function public.touch_contact_activity_from_activities()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.contact_id is not null then
    update public.contacts
    set last_activity_at = now(), last_activity_by = auth.uid()
    where id = new.contact_id;
  end if;
  return new;
end;
$$;

drop trigger if exists activities_touch_contact on public.activities;
create trigger activities_touch_contact
  after insert on public.activities
  for each row execute function public.touch_contact_activity_from_activities();
