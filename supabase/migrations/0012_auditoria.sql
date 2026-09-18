-- Auditoría a nivel de base de datos: registra automáticamente altas,
-- bajas y cambios en las tablas sensibles (socios, tesorería,
-- inventario, consumos, cuentas), sin depender de que cada Server
-- Action se acuerde de loguear. Solo lectura para admin/presidencia/
-- tesorería; nadie puede editar ni borrar el histórico desde la app.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id uuid,
  action text not null check (action in ('insert', 'update', 'delete')),
  actor_id uuid references public.profiles (id) on delete set null,
  actor_email text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_at_idx on public.audit_log (created_at desc);
create index audit_log_table_name_idx on public.audit_log (table_name);

alter table public.audit_log enable row level security;

create policy "audit_log_select" on public.audit_log
  for select using (public.current_role() in ('admin', 'presidente', 'tesorero'));

-- Sin políticas de insert/update/delete: solo puede escribir el trigger
-- (SECURITY DEFINER, como club_balance() y vote_results()), nunca la app.

create function public.record_audit_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_email text;
begin
  select email into v_actor_email from public.profiles where id = auth.uid();

  insert into public.audit_log (table_name, row_id, action, actor_id, actor_email, old_data, new_data)
  values (
    TG_TABLE_NAME,
    coalesce((case when TG_OP = 'DELETE' then old.id else new.id end), null),
    lower(TG_OP),
    auth.uid(),
    v_actor_email,
    case when TG_OP in ('update', 'delete') then to_jsonb(old) else null end,
    case when TG_OP in ('update', 'insert') then to_jsonb(new) else null end
  );

  return case when TG_OP = 'DELETE' then old else new end;
end;
$$;

create trigger audit_members
  after insert or update or delete on public.members
  for each row execute function public.record_audit_entry();

create trigger audit_treasury_movements
  after insert or update or delete on public.treasury_movements
  for each row execute function public.record_audit_entry();

create trigger audit_inventory_items
  after update on public.inventory_items
  for each row execute function public.record_audit_entry();

create trigger audit_inventory_restocks
  after insert or delete on public.inventory_restocks
  for each row execute function public.record_audit_entry();

create trigger audit_consumptions
  after insert or delete on public.consumptions
  for each row execute function public.record_audit_entry();

create trigger audit_menu_items
  after insert or update on public.menu_items
  for each row execute function public.record_audit_entry();

create trigger audit_profiles
  after update on public.profiles
  for each row execute function public.record_audit_entry();

-- Las Server Actions de /usuarios y /socios que crean o gestionan
-- cuentas usan el cliente con la service role key (necesario para
-- llamar a auth.admin.*), que no lleva el JWT de quien lo pidió — para
-- esas operaciones auth.uid() dentro del trigger sale null. Esta
-- función se llama en su lugar desde el cliente normal (con sesión) de
-- la propia Server Action, así queda registrado quién lo hizo de
-- verdad. Cualquier usuario autenticado puede llamarla (solo escribe
-- metadatos de auditoría, nunca datos reales).
create function public.log_audit_event(
  p_table_name text,
  p_row_id uuid,
  p_action text,
  p_new_data jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_email text;
begin
  select email into v_actor_email from public.profiles where id = auth.uid();

  insert into public.audit_log (table_name, row_id, action, actor_id, actor_email, new_data)
  values (p_table_name, p_row_id, p_action, auth.uid(), v_actor_email, p_new_data);
end;
$$;
