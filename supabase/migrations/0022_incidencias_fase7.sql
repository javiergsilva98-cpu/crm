-- Fase 7 de 10: pestaña de incidencias de verdad (la Fase 1 solo dejaba
-- reportar una consumición mal registrada; esto abre el tipo, añade
-- descripción/categoría/fecha, gestión de estado por la directiva y,
-- si se aprueba una incidencia de consumición, corrige el registro
-- original sin borrarlo.

-- ---------------------------------------------------------------------
-- 1. Campos nuevos: descripción libre, categoría (para el filtro del
--    requisito 6), fecha del hecho (puede no coincidir con
--    created_at si se reporta más tarde) y referencia opcional a
--    consumición / producto de inventario / evento (para "quién
--    fichó" ese día, vía quién abrió/cerró).
-- ---------------------------------------------------------------------
alter table public.incidencias rename column referencia_id to referencia_consumicion_id;
alter table public.incidencias
  rename constraint incidencias_referencia_id_fkey to incidencias_referencia_consumicion_id_fkey;
alter table public.incidencias
  add column referencia_producto_id uuid references public.inventory_items (id) on delete set null,
  add column referencia_evento_id uuid references public.events (id) on delete set null,
  add column descripcion text not null default '',
  add column categoria text not null default 'otro'
    check (categoria in ('rotura', 'falta_material', 'convivencia', 'consumicion_incorrecta', 'producto', 'fichaje', 'otro')),
  add column fecha_incidencia date not null default current_date,
  add column resolucion_notas text,
  add column decision text check (decision in ('aprobada', 'rechazada')),
  add column resuelta_por_member_id uuid references public.members (id) on delete set null,
  add column resuelta_at timestamptz;

-- El "tipo" original queda absorbido por "categoria" (mismo propósito,
-- ahora con más opciones); migra el dato existente antes de quitarlo.
update public.incidencias set categoria = 'consumicion_incorrecta' where tipo = 'consumicion_incorrecta';
alter table public.incidencias drop column tipo;

-- Estados: pendiente / en_revision / resuelta (antes era
-- pendiente/revisada/descartada). "revisada" y "descartada" pasan a
-- "resuelta" (ya no hay estado intermedio sin decisión).
update public.incidencias set estado = 'resuelta' where estado in ('revisada', 'descartada');
alter table public.incidencias drop constraint incidencias_estado_check;
alter table public.incidencias add constraint incidencias_estado_check
  check (estado in ('pendiente', 'en_revision', 'resuelta'));

create index incidencias_categoria_idx on public.incidencias (categoria);

-- ---------------------------------------------------------------------
-- 2. consumptions: marca de corrección cuando una incidencia de tipo
--    "consumicion_incorrecta" se aprueba. No se borra ni se reescribe
--    el precio de la venta original: se guarda aparte y se pone el
--    cargo a 0 para que deje de contar en el saldo del socio.
-- ---------------------------------------------------------------------
alter table public.consumptions
  add column corrected boolean not null default false,
  add column original_unit_price numeric(6, 2),
  add column corrected_by_incidencia_id uuid references public.incidencias (id) on delete set null;

-- ---------------------------------------------------------------------
-- 3. RLS: el listado pasa a ser transparente para todo el club
--    (requisito 1 y 6); reportar sigue abierto a cualquier socio como
--    hasta ahora; cambiar el estado es solo de presidencia, tesorería
--    y bodeguero (más admin, como en el resto de la app) — el bodeguero
--    entra porque muchas incidencias serán de bodega/inventario.
-- ---------------------------------------------------------------------
drop policy "incidencias_select" on public.incidencias;
create policy "incidencias_select" on public.incidencias
  for select using (auth.uid() is not null);

drop policy "incidencias_insert" on public.incidencias;
create policy "incidencias_insert" on public.incidencias
  for insert with check (
    public.current_role() in ('admin', 'presidente', 'vicepresidente', 'tesorero', 'bodeguero')
    or reportado_por_member_id = (select member_id from public.profiles where id = auth.uid())
  );

-- Sin policy de update directa: cambiar el estado pasa siempre por
-- resolve_incidencia() más abajo, que valida el rol y, si aplica,
-- corrige la consumición original en la misma transacción.

create trigger incidencias_audit_update
  after update on public.incidencias
  for each row execute function public.record_audit_entry();

create trigger consumptions_audit_update
  after update on public.consumptions
  for each row execute function public.record_audit_entry();

-- ---------------------------------------------------------------------
-- 4. resolve_incidencia: cambia el estado de una incidencia y, si se
--    aprueba una de consumición vinculada, corrige esa consumición
--    (queda marcada, con su precio original a mano, en vez de borrarla
--    o reescribirla directamente).
-- ---------------------------------------------------------------------
create function public.resolve_incidencia(
  p_incidencia_id uuid,
  p_estado text,
  p_decision text default null,
  p_notas text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_categoria text;
  v_referencia_consumicion_id uuid;
begin
  if public.current_role() not in ('admin', 'presidente', 'tesorero', 'bodeguero') then
    raise exception 'No tienes permiso para cambiar el estado de una incidencia.';
  end if;
  if p_estado not in ('pendiente', 'en_revision', 'resuelta') then
    raise exception 'Estado no válido.';
  end if;
  if p_estado = 'resuelta' and p_decision not in ('aprobada', 'rechazada') then
    raise exception 'Indica si la incidencia se aprueba o se rechaza.';
  end if;

  select categoria, referencia_consumicion_id into v_categoria, v_referencia_consumicion_id
  from public.incidencias where id = p_incidencia_id;

  if v_categoria is null then
    raise exception 'Incidencia no encontrada.';
  end if;

  select member_id into v_member_id from public.profiles where id = auth.uid();

  update public.incidencias
  set estado = p_estado,
      decision = case when p_estado = 'resuelta' then p_decision else null end,
      resolucion_notas = coalesce(p_notas, resolucion_notas),
      resuelta_por_member_id = case when p_estado = 'resuelta' then v_member_id else null end,
      resuelta_at = case when p_estado = 'resuelta' then now() else null end
  where id = p_incidencia_id;

  if p_estado = 'resuelta' and p_decision = 'aprobada'
     and v_categoria = 'consumicion_incorrecta' and v_referencia_consumicion_id is not null then
    update public.consumptions
    set corrected = true,
        original_unit_price = unit_price,
        unit_price = 0,
        corrected_by_incidencia_id = p_incidencia_id
    where id = v_referencia_consumicion_id and corrected = false;
  end if;
end;
$$;
