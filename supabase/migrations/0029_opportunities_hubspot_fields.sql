-- Alinea los nombres de columna de opportunities con el Excel de campos
-- HubSpot (Prioridad 1) y añade los que todavía no existían. "Pipeline"
-- (multipipeline) se deja fuera a propósito — es un proyecto aparte, no un
-- campo suelto. "Está cerrado ganado/perdido" se implementan como columnas
-- generadas a partir de etapa_negocio, no como flags manuales redundantes.

alter table public.opportunities rename column title to nombre_negocio;
alter table public.opportunities rename column stage to etapa_negocio;
alter table public.opportunities rename column created_at to fecha_creacion;
alter table public.opportunities rename column amount to cantidad;
alter table public.opportunities rename column updated_at to fecha_ultima_modificacion;
alter table public.opportunities rename column company_id to empresa_asociada_principal;

alter table public.opportunities
  add column if not exists fecha_cierre timestamptz,
  add column if not exists ultimo_contacto timestamptz,
  add column if not exists fuente_trafico_original text
    check (fuente_trafico_original in ('instagram', 'google', 'whatsapp', 'referido', 'tiktok', 'otro')),
  add column if not exists desglose_fuente_original_1 text,
  add column if not exists desglose_fuente_original_2 text,
  add column if not exists esta_cerrado_ganado boolean generated always as (etapa_negocio = 'ganado') stored,
  add column if not exists esta_cerrado_perdido boolean generated always as (etapa_negocio = 'perdido') stored;

-- El trigger de ageing/última modificación (0026) referenciaba las columnas
-- por su nombre anterior: hay que redefinirlo con los nombres nuevos.
create or replace function public.touch_opportunity_stage()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.fecha_ultima_modificacion := now();
  if tg_op = 'INSERT' or new.etapa_negocio is distinct from old.etapa_negocio then
    new.stage_entered_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.touch_opportunity_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.opportunity_id is not null then
    update public.opportunities
    set fecha_ultima_modificacion = now(), ultimo_contacto = now()
    where id = new.opportunity_id;
  end if;
  return new;
end;
$$;
