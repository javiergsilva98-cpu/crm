-- Campos de contacts del Excel HubSpot Prioridad 2 (+ los triviales de
-- Prioridad 3 sin dependencias externas). Los que son "calculado" en
-- HubSpot (nº de negocios asociados, ingresos totales...) NO se guardan
-- aquí como columna — se calculan al vuelo donde se muestran, para no
-- arrastrar un dato duplicado que se pueda desincronizar.

alter table public.contacts
  add column if not exists ciudad text,
  add column if not exists estado_region text,
  add column if not exists codigo_postal text,
  add column if not exists pais_region text,
  add column if not exists direccion text,
  add column if not exists cargo text,
  add column if not exists industria text,
  add column if not exists url_sitio_web text,
  add column if not exists url_linkedin text,
  add column if not exists mensaje text,
  add column if not exists correos_electronicos_adicionales text,
  add column if not exists contacto_sin_gestionar boolean not null default true,
  add column if not exists fuente_registro text
    check (fuente_registro in ('manual', 'importacion', 'formulario_web')),
  add column if not exists base_juridica_tratamiento_datos text
    check (base_juridica_tratamiento_datos in (
      'consentimiento', 'ejecucion_contrato', 'obligacion_legal',
      'interes_vital', 'interes_publico', 'interes_legitimo'
    )),
  add column if not exists desglose_ultima_fuente_1 text,
  add column if not exists desglose_ultima_fuente_2 text,
  add column if not exists fecha_ultima_fuente_trafico timestamptz,
  add column if not exists primera_conversion text,
  add column if not exists fecha_primera_conversion timestamptz,
  add column if not exists conversion_reciente text,
  add column if not exists fecha_conversion_reciente timestamptz,
  add column if not exists fecha_siguiente_actividad timestamptz,
  add column if not exists direccion_correo_no_valida boolean not null default false,
  add column if not exists fecha_cierre_se_hizo_cliente timestamptz;

-- "¿Contacto sin gestionar?": true hasta la primera vez que se edita el
-- contacto (mismo trigger que ya toca `ultimo_contacto` en cualquier
-- guardado, ver 0012/0027). Se apaga sola, no hace falta tocarla a mano.
create or replace function public.touch_contact_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.ultimo_contacto := now();
  new.last_activity_by := auth.uid();
  new.fecha_ultima_modificacion := now();
  if tg_op = 'UPDATE' then
    new.contacto_sin_gestionar := false;
  end if;
  return new;
end;
$$;

-- Última fuente de tráfico y fecha en que se hizo cliente: se
-- actualizan solas al cambiar los campos de origen, sin depender de
-- que la aplicación recuerde tocarlas.
create or replace function public.touch_contact_source_and_lifecycle()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.ultima_fuente_trafico is distinct from old.ultima_fuente_trafico then
    new.fecha_ultima_fuente_trafico := now();
  end if;
  if new.etapa_ciclo_vida = 'cliente' and old.etapa_ciclo_vida is distinct from 'cliente'
     and new.fecha_cierre_se_hizo_cliente is null then
    new.fecha_cierre_se_hizo_cliente := now();
  end if;
  return new;
end;
$$;

drop trigger if exists contacts_touch_source_lifecycle on public.contacts;
create trigger contacts_touch_source_lifecycle
  before update on public.contacts
  for each row execute function public.touch_contact_source_and_lifecycle();

-- submit_form (0013, redefinida en 0027/0028) también marca la fuente del
-- registro y la primera/última conversión con el nombre del formulario.
create or replace function public.submit_form(p_form_id uuid, p_data jsonb, p_source_url text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
  v_form_name text;
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
  select owner_id, name into v_owner, v_form_name from public.forms where id = p_form_id;
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
    source_url, fuente_trafico_original, fuente_registro,
    primera_conversion, fecha_primera_conversion, conversion_reciente, fecha_conversion_reciente,
    notes
  )
  values (
    v_owner, v_full_name, v_email, v_phone, v_company_id,
    p_source_url, 'otro', 'formulario_web',
    v_form_name, now(), v_form_name, now(),
    nullif(trim(v_notes), '')
  )
  returning id into v_contact_id;

  insert into public.form_submissions (form_id, data, contact_id, source_url)
  values (p_form_id, p_data, v_contact_id, p_source_url);
end;
$$;
