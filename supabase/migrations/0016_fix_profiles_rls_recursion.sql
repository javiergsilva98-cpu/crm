-- Las políticas de "profiles" definidas en 0002 consultaban la propia
-- tabla `profiles` dentro de su condición (para comprobar si el usuario es
-- admin), lo que provoca "infinite recursion detected in policy for
-- relation profiles" en Postgres: evaluar la política vuelve a disparar la
-- política. Se sustituye por la función is_admin(), que al ser
-- security definer no reevalúa RLS y no tiene ese problema.

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_admin_only" on public.profiles;
create policy "profiles_update_admin_only" on public.profiles
  for update using (public.is_admin());
