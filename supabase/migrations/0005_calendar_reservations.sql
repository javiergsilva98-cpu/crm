-- Convierte "events" en el calendario del club: eventos organizados por
-- la directiva y solicitudes de reserva del local por parte de
-- cualquier socio, con quién abre y quién cierra por seguridad.

alter table public.events
  add column end_date date,
  add column kind text not null default 'evento' check (kind in ('evento', 'reserva')),
  add column status text not null default 'confirmado' check (status in ('pendiente', 'confirmado', 'rechazado')),
  add column opens_member_id uuid references public.members (id) on delete set null,
  add column closes_member_id uuid references public.members (id) on delete set null,
  add column requested_by_member_id uuid references public.members (id) on delete set null,
  add column notes text;

create index events_requested_by_member_id_idx on public.events (requested_by_member_id);

-- El calendario lo puede ver cualquier socio autenticado (incluye
-- quién abre/cierra, información de seguridad relevante para todos).
drop policy "events_select" on public.events;
create policy "events_select" on public.events
  for select using (auth.uid() is not null);

-- Gestión (admin/presidente/secretario/tesorero) crea y edita cualquier
-- entrada. Un socio solo puede crear SU solicitud de reserva pendiente,
-- nunca eventos confirmados ni tocar entradas ajenas.
drop policy "events_write" on public.events;

create policy "events_insert" on public.events
  for insert with check (
    public.current_role() in ('admin', 'presidente', 'secretario', 'tesorero')
    or (
      kind = 'reserva'
      and status = 'pendiente'
      and requested_by_member_id = (select member_id from public.profiles where id = auth.uid())
    )
  );

create policy "events_update" on public.events
  for update using (public.current_role() in ('admin', 'presidente', 'secretario', 'tesorero'))
  with check (public.current_role() in ('admin', 'presidente', 'secretario', 'tesorero'));
