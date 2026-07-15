-- Cierra el registro público: a partir de ahora, para crear una cuenta
-- hace falta una invitación válida y sin usar (salvo la primera cuenta
-- del proyecto, que sigue quedando como admin de arranque). La
-- invitación se consume atómicamente dentro del propio trigger, en vez
-- de depender de una llamada aparte desde el cliente después del alta.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_invite_id uuid;
  v_role text;
  v_is_first boolean;
begin
  select count(*) = 0 into v_is_first from public.profiles;

  if v_is_first then
    v_role := 'admin';
  else
    v_invite_id := nullif(new.raw_user_meta_data->>'invite_id', '')::uuid;
    if v_invite_id is null then
      raise exception 'Se requiere una invitación válida para registrarse.';
    end if;

    select role into v_role from public.invites where id = v_invite_id and used_by is null;
    if v_role is null then
      raise exception 'La invitación no es válida o ya fue utilizada.';
    end if;

    update public.invites set used_by = new.id, used_at = now() where id = v_invite_id;
  end if;

  insert into public.profiles (id, email, role) values (new.id, new.email, v_role);
  return new;
end;
$$;
