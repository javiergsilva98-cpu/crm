-- Modo avanzado de informes: varias métricas por informe (con color),
-- tipo de visualización (barras, líneas, circular, tabla o tarjeta KPI),
-- comparación con el periodo anterior, y la posibilidad de fijar un
-- informe como pantalla de inicio.

alter table public.reports
  add column if not exists chart_type text not null default 'bar'
    check (chart_type in ('bar', 'line', 'pie', 'table', 'kpi_card')),
  add column if not exists series jsonb not null default '[]'::jsonb,
  add column if not exists compare_previous boolean not null default false,
  add column if not exists is_home boolean not null default false;

alter table public.reports alter column metric drop not null;

-- Migra los informes ya creados (una sola métrica) al nuevo formato.
update public.reports
set series = jsonb_build_array(jsonb_build_object('metric', metric, 'color', '#4A5B33'))
where series = '[]'::jsonb and metric is not null;

-- Como mucho un informe marcado como inicio por usuario.
create unique index if not exists reports_one_home_per_owner
  on public.reports (owner_id) where (is_home);
