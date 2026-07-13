-- Invitaciones: un admin genera un enlace con un rol asignado; al
-- registrarse con ese enlace, el nuevo usuario recibe ese rol automáticamente.

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  role text not null default 'user' check (role in ('admin', 'user')),
  created_by uuid not null references auth.users (id) on delete cascade,
  used_by uuid references auth.users (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invites enable row level security;

-- Solo los admins gestionan (crean, ven, borran) invitaciones.
create policy "admin_manage_invites" on public.invites
  for all using (public.is_admin()) with check (public.is_admin());

-- Consume una invitación: asigna el rol al usuario autenticado y marca la
-- invitación como usada. security definer para poder actualizar el propio
-- rol en `profiles`, algo que un usuario normal no puede hacer directamente.
create or replace function public.consume_invite(invite_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from public.invites where id = invite_id and used_by is null;
  if v_role is null then
    return;
  end if;

  update public.invites set used_by = auth.uid(), used_at = now()
  where id = invite_id and used_by is null;

  update public.profiles set role = v_role where id = auth.uid();
end;
$$;

grant execute on function public.consume_invite(uuid) to authenticated;
