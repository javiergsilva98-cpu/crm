-- Campos de companies del Excel HubSpot Prioridad 2 (+ triviales de
-- Prioridad 3). Los contadores calculados (nº de contactos/negocios
-- asociados, negocios abiertos, ingresos totales, negocio más reciente)
-- NO se guardan como columna — se calculan al vuelo en la ficha de empresa.

alter table public.companies
  add column if not exists direccion text,
  add column if not exists direccion_2 text,
  add column if not exists ciudad text,
  add column if not exists estado_region text,
  add column if not exists codigo_postal text,
  add column if not exists pais_region text,
  add column if not exists descripcion text,
  add column if not exists industria text,
  add column if not exists ingresos_anuales numeric(14, 2),
  add column if not exists numero_empleados integer,
  add column if not exists pagina_empresa_linkedin text,
  add column if not exists tipo text
    check (tipo in ('prospecto', 'partner', 'revendedor', 'proveedor', 'otro')),
  add column if not exists fuente_registro text not null default 'manual'
    check (fuente_registro in ('manual', 'importacion')),
  add column if not exists estado_oportunidad_venta text
    check (estado_oportunidad_venta in ('nuevo', 'abierto', 'en_progreso', 'descartado')),
  add column if not exists fecha_cierre_se_hizo_cliente timestamptz,
  add column if not exists fuente_trafico_original text
    check (fuente_trafico_original in ('instagram', 'google', 'whatsapp', 'referido', 'tiktok', 'otro')),
  add column if not exists ultima_fuente_trafico text
    check (ultima_fuente_trafico in ('instagram', 'google', 'whatsapp', 'referido', 'tiktok', 'otro')),
  add column if not exists desglose_fuente_original_1 text,
  add column if not exists desglose_fuente_original_2 text,
  add column if not exists datos_ultima_fuente_1 text,
  add column if not exists datos_ultima_fuente_2 text,
  add column if not exists fecha_ultima_fuente_trafico timestamptz,
  add column if not exists primera_conversion text,
  add column if not exists fecha_primera_conversion timestamptz,
  add column if not exists conversion_reciente text,
  add column if not exists fecha_conversion_reciente timestamptz;

-- Fecha en que se hizo cliente, y fecha de última fuente: igual criterio
-- que en contacts (0030).
create or replace function public.touch_company_source_and_lifecycle()
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

drop trigger if exists companies_touch_source_lifecycle on public.companies;
create trigger companies_touch_source_lifecycle
  before update on public.companies
  for each row execute function public.touch_company_source_and_lifecycle();

-- Fuente de tráfico original de la empresa: heredada del primer contacto
-- que se le asocia (igual que en HubSpot), solo si la empresa todavía no
-- tiene una propia.
create or replace function public.inherit_company_source_from_contact()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.empresa_principal_asociada is not null and new.fuente_trafico_original is not null then
    update public.companies
    set fuente_trafico_original = new.fuente_trafico_original
    where id = new.empresa_principal_asociada and fuente_trafico_original is null;
  end if;
  return new;
end;
$$;

drop trigger if exists contacts_inherit_company_source on public.contacts;
create trigger contacts_inherit_company_source
  after insert or update on public.contacts
  for each row execute function public.inherit_company_source_from_contact();
