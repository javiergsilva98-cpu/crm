-- Fase 1 del flujo de confirmación de pedidos: una vez registrada, una
-- consumición no se puede editar ni borrar (ya era así por RLS: no existe
-- policy de update/delete en consumptions, así que solo el service role
-- podría tocarla, y la app nunca lo usa para esto). En su lugar, el socio
-- puede reportar una incidencia sobre un pedido que no reconoce.

create table public.incidencias (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'consumicion_incorrecta' check (tipo in ('consumicion_incorrecta')),
  referencia_id uuid references public.consumptions (id) on delete set null,
  reportado_por_member_id uuid not null references public.members (id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'revisada', 'descartada')),
  created_at timestamptz not null default now()
);

create index incidencias_referencia_id_idx on public.incidencias (referencia_id);
create index incidencias_estado_idx on public.incidencias (estado);

alter table public.incidencias enable row level security;

-- Cualquier socio ve las suyas; la directiva (con acceso a tesorería) las
-- ve todas, igual que el resto de tablas sensibles de la app.
create policy "incidencias_select" on public.incidencias
  for select using (
    public.current_role() in ('admin', 'presidente', 'tesorero')
    or reportado_por_member_id = (select member_id from public.profiles where id = auth.uid())
  );

create policy "incidencias_insert" on public.incidencias
  for insert with check (
    public.current_role() in ('admin', 'presidente', 'tesorero')
    or reportado_por_member_id = (select member_id from public.profiles where id = auth.uid())
  );

-- Sin policy de update/delete: una vez creada, la incidencia también
-- queda inmutable por ahora (la gestión de estado llega con la Fase 6).

create trigger incidencias_audit
  after insert on public.incidencias
  for each row execute function public.record_audit_entry();
