-- Alinea los nombres de columna de companies con el Excel de campos HubSpot
-- (Prioridad 1) y añade los que todavía no existían.

alter table public.companies rename column name to nombre_empresa;
alter table public.companies rename column website to nombre_dominio_empresa;
alter table public.companies rename column created_at to fecha_creacion;

alter table public.companies
  add column if not exists numero_telefono text,
  add column if not exists fecha_ultima_modificacion timestamptz not null default now(),
  add column if not exists etapa_ciclo_vida text
    check (etapa_ciclo_vida in ('suscriptor', 'lead', 'mql', 'sql', 'oportunidad', 'cliente')),
  add column if not exists ultimo_contacto timestamptz;

create or replace function public.touch_company_modified()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.fecha_ultima_modificacion := now();
  return new;
end;
$$;

drop trigger if exists companies_touch_modified on public.companies;
create trigger companies_touch_modified
  before update on public.companies
  for each row execute function public.touch_company_modified();

create or replace function public.touch_company_last_contact()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.company_id is not null then
    update public.companies set ultimo_contacto = now() where id = new.company_id;
  end if;
  return new;
end;
$$;

drop trigger if exists activities_touch_company on public.activities;
create trigger activities_touch_company
  after insert on public.activities
  for each row execute function public.touch_company_last_contact();

-- submit_form (redefinida en 0027 con los nombres nuevos de contacts) usaba
-- companies.name para el emparejamiento por nombre de empresa; ahora que
-- companies.name pasa a llamarse nombre_empresa, hay que redefinirla otra vez.
create or replace function public.submit_form(p_form_id uuid, p_data jsonb, p_source_url text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
  v_full_name text;
  v_email text;
  v_phone text;
  v_company_name text;
  v_company_id uuid;
  v_contact_id uuid;
  v_notes text := '';
  v_key text;
  v_value text;
begin
  select owner_id into v_owner from public.forms where id = p_form_id;
  if v_owner is null then
    return;
  end if;

  v_full_name := nullif(trim(p_data->>'full_name'), '');
  v_email := nullif(trim(p_data->>'email'), '');
  v_phone := nullif(trim(p_data->>'phone'), '');
  v_company_name := nullif(trim(p_data->>'company'), '');

  if v_full_name is null then
    return;
  end if;

  if v_company_name is not null then
    select id into v_company_id from public.companies
    where owner_id = v_owner and lower(nombre_empresa) = lower(v_company_name)
    limit 1;
  end if;

  for v_key, v_value in select * from jsonb_each_text(p_data)
  loop
    if v_key not in ('full_name', 'email', 'phone', 'company') and v_value is not null and v_value <> '' then
      v_notes := v_notes || v_key || ': ' || v_value || E'\n';
    end if;
  end loop;

  insert into public.contacts (
    owner_id, full_name, correo_electronico, numero_telefono, empresa_principal_asociada,
    source_url, fuente_trafico_original, notes
  )
  values (
    v_owner, v_full_name, v_email, v_phone, v_company_id,
    p_source_url, 'otro', nullif(trim(v_notes), '')
  )
  returning id into v_contact_id;

  insert into public.form_submissions (form_id, data, contact_id, source_url)
  values (p_form_id, p_data, v_contact_id, p_source_url);
end;
$$;
