-- El trigger genérico de auditoría (record_audit_entry, 0012) asume que
-- la columna "id" de la tabla auditada es siempre uuid, para meterla en
-- audit_log.row_id (uuid). Pero club_settings (0017) y club_status
-- (0023) son tablas "singleton" con id boolean (siempre una sola fila,
-- id = true). Al actualizarlas — por ejemplo al abrir/cerrar el local
-- en Fichaje, o al cambiar el margen en Ajustes — el trigger intentaba
-- guardar ese booleano en una columna uuid y fallaba con "column
-- row_id is of type uuid but expression is of type boolean".
--
-- Se hace el trigger tolerante: si el id de la fila no es un uuid
-- válido (caso de las tablas singleton), guarda row_id = null en vez
-- de reventar — el resto de la auditoría (tabla, acción, quién, datos
-- antes/después) se sigue registrando igual.
create or replace function public.record_audit_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_email text;
  v_row_id uuid;
begin
  select email into v_actor_email from public.profiles where id = auth.uid();

  begin
    v_row_id := (case when TG_OP = 'DELETE' then old.id else new.id end)::text::uuid;
  exception when others then
    v_row_id := null;
  end;

  insert into public.audit_log (table_name, row_id, action, actor_id, actor_email, old_data, new_data)
  values (
    TG_TABLE_NAME,
    v_row_id,
    lower(TG_OP),
    auth.uid(),
    v_actor_email,
    case when TG_OP in ('update', 'delete') then to_jsonb(old) else null end,
    case when TG_OP in ('update', 'insert') then to_jsonb(new) else null end
  );

  return case when TG_OP = 'DELETE' then old else new end;
end;
$$;
