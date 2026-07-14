-- Formularios públicos: se personalizan visualmente en el CRM y se
-- embeben en la web del cliente. Los envíos crean contactos automáticamente
-- sin necesidad de que quien rellena el formulario tenga sesión, por eso
-- se resuelven con una función security definer en vez de RLS normal.

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  fields jsonb not null default '[]'::jsonb,
  meta_pixel_id text,
  google_ads_conversion_id text,
  google_ads_conversion_label text,
  created_at timestamptz not null default now()
);

alter table public.forms enable row level security;

create policy "owner_select_forms" on public.forms
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_forms" on public.forms
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_forms" on public.forms
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_forms" on public.forms
  for delete using (auth.uid() = owner_id or public.is_admin());

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  source_url text,
  created_at timestamptz not null default now()
);

create index if not exists form_submissions_form_id_idx on public.form_submissions (form_id);

alter table public.form_submissions enable row level security;

create policy "owner_select_form_submissions" on public.form_submissions
  for select using (
    exists (
      select 1 from public.forms f
      where f.id = form_id and (f.owner_id = auth.uid() or public.is_admin())
    )
  );

-- Recibe un envío público (sin sesión) y da de alta el contacto. security
-- definer: el remitente anónimo no tiene permisos propios sobre `contacts`.
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
    where owner_id = v_owner and lower(name) = lower(v_company_name)
    limit 1;
  end if;

  for v_key, v_value in select * from jsonb_each_text(p_data)
  loop
    if v_key not in ('full_name', 'email', 'phone', 'company') and v_value is not null and v_value <> '' then
      v_notes := v_notes || v_key || ': ' || v_value || E'\n';
    end if;
  end loop;

  insert into public.contacts (owner_id, full_name, email, phone, company_id, source_url, source, notes)
  values (v_owner, v_full_name, v_email, v_phone, v_company_id, p_source_url, 'otro', nullif(trim(v_notes), ''))
  returning id into v_contact_id;

  insert into public.form_submissions (form_id, data, contact_id, source_url)
  values (p_form_id, p_data, v_contact_id, p_source_url);
end;
$$;

grant execute on function public.submit_form(uuid, jsonb, text) to anon, authenticated;
