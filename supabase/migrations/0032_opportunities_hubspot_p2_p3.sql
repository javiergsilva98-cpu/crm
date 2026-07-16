-- Campos de opportunities del Excel HubSpot Prioridad 2 (+ triviales de
-- Prioridad 3). "Fecha de entrada en etapa actual" ya existe como
-- `stage_entered_at` (0026) y "última fecha de actividad" ya existe como
-- `ultimo_contacto` (0029) — no se duplican.

alter table public.opportunities
  add column if not exists tipo_negocio text
    check (tipo_negocio in ('nuevo_negocio', 'negocio_existente')),
  add column if not exists siguiente_paso text,
  add column if not exists fuente_registro text not null default 'manual'
    check (fuente_registro in ('manual', 'importacion')),
  add column if not exists probabilidad_negocio numeric(5, 2) not null default 10,
  add column if not exists motivo_cierre_perdido text,
  add column if not exists motivo_cierre_ganado text,
  add column if not exists ultima_fuente_trafico text
    check (ultima_fuente_trafico in ('instagram', 'google', 'whatsapp', 'referido', 'tiktok', 'otro')),
  add column if not exists desglose_ultima_fuente_1 text,
  add column if not exists desglose_ultima_fuente_2 text,
  add column if not exists descripcion_negocio text,
  add column if not exists prioridad text
    check (prioridad in ('baja', 'media', 'alta')),
  add column if not exists categoria_prevision text
    check (categoria_prevision in ('pipeline', 'mejor_caso', 'comprometido', 'omitido', 'cerrado')),
  add column if not exists ingresos_recurrentes_mensuales_mrr numeric(12, 2);

alter table public.opportunities
  add column if not exists valor_ponderado numeric generated always as (cantidad * probabilidad_negocio / 100) stored;

-- La probabilidad se autoajusta según la etapa, igual que en HubSpot —
-- salvo que el usuario la haya fijado a mano en un valor distinto del que
-- le tocaría por etapa (para permitir el ajuste manual sin que se
-- sobrescriba solo en el siguiente guardado).
create or replace function public.touch_opportunity_stage()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_default_probability numeric;
begin
  new.fecha_ultima_modificacion := now();
  if tg_op = 'INSERT' or new.etapa_negocio is distinct from old.etapa_negocio then
    new.stage_entered_at := now();

    v_default_probability := case new.etapa_negocio
      when 'nuevo' then 10
      when 'calificado' then 25
      when 'propuesta' then 50
      when 'negociacion' then 75
      when 'ganado' then 100
      when 'perdido' then 0
      else new.probabilidad_negocio
    end;

    if tg_op = 'INSERT' or new.probabilidad_negocio = old.probabilidad_negocio then
      new.probabilidad_negocio := v_default_probability;
    end if;
  end if;
  return new;
end;
$$;
