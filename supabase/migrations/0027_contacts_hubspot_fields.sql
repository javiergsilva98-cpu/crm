-- Alinea los nombres de columna de contacts con el Excel de campos HubSpot
-- (Prioridad 1) y añade los que todavía no existían. Postgres actualiza solo
-- las referencias internas (índices, check constraints, la columna generada
-- full_name, RLS) al renombrar — no hace falta recrearlas.

alter table public.contacts rename column first_name to nombre;
alter table public.contacts rename column last_name to apellido;
alter table public.contacts rename column email to correo_electronico;
alter table public.contacts rename column phone to numero_telefono;
alter table public.contacts rename column created_at to fecha_creacion;
alter table public.contacts rename column company_id to empresa_principal_asociada;
alter table public.contacts rename column source to fuente_trafico_original;
alter table public.contacts rename column source_detail to desglose_fuente_original_1;
alter table public.contacts rename column last_activity_at to ultimo_contacto;

alter table public.contacts
  add column if not exists numero_telefono_movil text,
  add column if not exists nombre_empresa text,
  add column if not exists fecha_ultima_modificacion timestamptz not null default now(),
  add column if not exists etapa_ciclo_vida text
    check (etapa_ciclo_vida in ('suscriptor', 'lead', 'mql', 'sql', 'oportunidad', 'cliente')),
  add column if not exists estado_lead text
    check (estado_lead in ('nuevo', 'abierto', 'en_progreso', 'descartado')),
  add column if not exists desglose_fuente_original_2 text,
  add column if not exists ultima_fuente_trafico text
    check (ultima_fuente_trafico in ('instagram', 'google', 'whatsapp', 'referido', 'tiktok', 'otro')),
  add column if not exists id_clic_google_ads_gclid text,
  add column if not exists id_clic_facebook_fbclid text,
  add column if not exists cancelacion_suscripcion_todos_correos boolean not null default false;

-- Los triggers de actividad (0012) referenciaban last_activity_at/by por
-- nombre de columna en plpgsql: hay que redefinir las funciones con el
-- nombre nuevo (el rename de columna no reescribe cuerpos de función).
create or replace function public.touch_contact_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.ultimo_contacto := now();
  new.last_activity_by := auth.uid();
  new.fecha_ultima_modificacion := now();
  return new;
end;
$$;

create or replace function public.touch_contact_activity_from_activities()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.contact_id is not null then
    update public.contacts
    set ultimo_contacto = now(), last_activity_by = auth.uid()
    where id = new.contact_id;
  end if;
  return new;
end;
$$;

-- submit_form (0013) inserta por lista explícita de columnas: hay que
-- redefinirla con los nombres nuevos. Los nombres de las claves del JSON
-- que envía el HTML embebido (full_name/email/phone/company) no cambian —
-- son claves de payload, no columnas.
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
    -- En esta migración `companies.name` todavía no se ha renombrado (eso
    -- ocurre en la siguiente migración, que vuelve a redefinir esta función).
    select id into v_company_id from public.companies
    where owner_id = v_owner and lower(name) = lower(v_company_name)
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
