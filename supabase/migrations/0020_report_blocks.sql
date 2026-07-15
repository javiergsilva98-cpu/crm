-- Un informe deja de ser una única gráfica: ahora agrupa varias gráficas
-- ("bloques"), cada una con su propio tipo de visualización y métricas,
-- para poder montar un informe completo (ej. ventas + gastos + pipeline)
-- en un solo sitio. El rango de fechas y la plantilla de equipo siguen
-- siendo del informe entero, compartidos por todos sus bloques.

alter table public.reports
  add column if not exists blocks jsonb not null default '[]'::jsonb;

-- Migra los informes existentes (una sola gráfica) a un bloque único.
update public.reports
set blocks = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'title', null,
    'chart_type', chart_type,
    'series', series
  )
)
where blocks = '[]'::jsonb and series is not null and series != '[]'::jsonb;
