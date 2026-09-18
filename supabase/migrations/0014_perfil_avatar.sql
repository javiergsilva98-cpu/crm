-- Perfil de socio: cada usuario puede editar su propio nombre visible y
-- subir una foto de perfil. Como `members_write` solo deja escribir a
-- admin/presidente/secretario, exponemos una función SECURITY DEFINER
-- que solo puede tocar la ficha del propio socio (via profiles.member_id)
-- y solo esas dos columnas.

alter table public.members add column if not exists avatar_url text;

create or replace function public.update_own_member_profile(
  p_full_name text,
  p_avatar_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
begin
  select member_id into v_member_id from public.profiles where id = auth.uid();

  if v_member_id is null then
    raise exception 'No hay un socio vinculado a esta cuenta.';
  end if;

  update public.members
  set
    full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
    avatar_url = p_avatar_url
  where id = v_member_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Storage: bucket público de avatares, cada usuario solo puede escribir
-- dentro de su propia carpeta (prefijo = su auth uid).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
