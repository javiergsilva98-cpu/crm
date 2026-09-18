-- Soporte para dar de alta a un socio con su cuenta de acceso en el
-- mismo paso: contraseña provisional que el club entrega a mano, y
-- obligación de cambiarla antes de poder usar el resto de la app.

alter table public.profiles
  add column must_change_password boolean not null default false;

-- Evita duplicados de número de llave/socio ahora que se asigna en
-- automático (el siguiente número disponible).
alter table public.members
  add constraint members_key_number_unique unique (key_number);

-- profiles_update_self ya permitía a cualquier usuario actualizar su
-- propia fila sin restringir columnas: sin este trigger, alguien podría
-- subirse el rol o cambiar a qué socio está vinculado su cuenta. Se
-- permite el cambio de columnas sensibles solo a admin/presidencia, o
-- cuando la actualización la hace el service role (sin sesión de usuario,
-- como las Server Actions de /usuarios y /socios).
create function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if new.role is distinct from old.role and public.current_role() not in ('admin', 'presidente') then
      raise exception 'No tienes permiso para cambiar el rol.';
    end if;
    if new.member_id is distinct from old.member_id and public.current_role() not in ('admin', 'presidente') then
      raise exception 'No tienes permiso para cambiar el socio vinculado.';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_profile_columns_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_columns();
