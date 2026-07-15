-- Separa el nombre del contacto en nombre y apellidos. full_name pasa a
-- ser una columna generada (nombre + apellidos) para que todo lo que ya
-- lee full_name (tablas, facturas, formularios) siga funcionando sin
-- cambios, mostrando el nombre completo como antes.

alter table public.contacts
  add column if not exists first_name text,
  add column if not exists last_name text;

-- Reparto heurístico del texto libre que ya había en full_name: la primera
-- palabra pasa a nombre, el resto a apellidos. Con nombres compuestos o
-- varios apellidos puede no acertar del todo — revisable a mano después.
update public.contacts
set first_name = split_part(trim(full_name), ' ', 1),
    last_name = nullif(trim(substring(trim(full_name) from length(split_part(trim(full_name), ' ', 1)) + 1)), '')
where first_name is null;

update public.contacts set first_name = '' where first_name is null;
alter table public.contacts alter column first_name set not null;
alter table public.contacts alter column first_name set default '';

alter table public.contacts drop column full_name;
alter table public.contacts
  add column full_name text generated always as (trim(both ' ' from (first_name || ' ' || coalesce(last_name, '')))) stored;

-- El formulario público seguía enviando un único "full_name": se reparte
-- con la misma heurística de arriba antes de insertar el contacto.
create or replace function public.submit_form(p_form_id uuid, p_data jsonb, p_source_url text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_owner uuid;
  v_full_name text;
  v_first_name text;
  v_last_name text;
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

  v_first_name := split_part(v_full_name, ' ', 1);
  v_last_name := nullif(trim(substring(v_full_name from length(v_first_name) + 1)), '');

  if v_company_name is not null then
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

  insert into public.contacts (owner_id, first_name, last_name, email, phone, company_id, source_url, source, notes)
  values (v_owner, v_first_name, v_last_name, v_email, v_phone, v_company_id, p_source_url, 'otro', nullif(trim(v_notes), ''))
  returning id into v_contact_id;

  insert into public.form_submissions (form_id, data, contact_id, source_url)
  values (p_form_id, p_data, v_contact_id, p_source_url);
end;
$$;
