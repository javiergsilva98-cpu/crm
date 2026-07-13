-- Perfiles de usuario, roles, notas/actividades, tareas y etiquetas.

-- 1) Perfiles y roles ------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (
    auth.uid() = id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "profiles_update_admin_only" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Crea automáticamente un perfil al registrarse. El primer usuario del
-- proyecto queda como admin; el resto entra como user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case when (select count(*) from public.profiles) = 0 then 'admin' else 'user' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Crea el perfil de los usuarios que ya existían antes de esta migración.
insert into public.profiles (id, email, role)
select id, email, case when not exists (select 1 from public.profiles) then 'admin' else 'user' end
from auth.users
on conflict (id) do nothing;

-- Helper: ¿el usuario actual es admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- 2) Acceso de administradores a los datos existentes -----------------------

create policy "admin_full_access_companies" on public.companies
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin_full_access_contacts" on public.contacts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin_full_access_opportunities" on public.opportunities
  for all using (public.is_admin()) with check (public.is_admin());

-- 3) Actividades / notas -----------------------------------------------------

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete cascade,
  opportunity_id uuid references public.opportunities (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists activities_company_id_idx on public.activities (company_id);
create index if not exists activities_contact_id_idx on public.activities (contact_id);
create index if not exists activities_opportunity_id_idx on public.activities (opportunity_id);

alter table public.activities enable row level security;

create policy "owner_select_activities" on public.activities
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_activities" on public.activities
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_activities" on public.activities
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_activities" on public.activities
  for delete using (auth.uid() = owner_id or public.is_admin());

-- 4) Tareas -------------------------------------------------------------------

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete cascade,
  opportunity_id uuid references public.opportunities (id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists tasks_due_date_idx on public.tasks (due_date);

alter table public.tasks enable row level security;

create policy "owner_select_tasks" on public.tasks
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_tasks" on public.tasks
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_tasks" on public.tasks
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_tasks" on public.tasks
  for delete using (auth.uid() = owner_id or public.is_admin());

-- 5) Etiquetas ------------------------------------------------------------------

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#6b7280',
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

alter table public.tags enable row level security;

create policy "owner_select_tags" on public.tags
  for select using (auth.uid() = owner_id or public.is_admin());
create policy "owner_insert_tags" on public.tags
  for insert with check (auth.uid() = owner_id);
create policy "owner_update_tags" on public.tags
  for update using (auth.uid() = owner_id or public.is_admin());
create policy "owner_delete_tags" on public.tags
  for delete using (auth.uid() = owner_id or public.is_admin());

-- Vínculo genérico etiqueta <-> empresa/contacto.
create table if not exists public.taggables (
  tag_id uuid not null references public.tags (id) on delete cascade,
  company_id uuid references public.companies (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete cascade,
  primary key (tag_id, company_id, contact_id)
);

alter table public.taggables enable row level security;

create policy "owner_select_taggables" on public.taggables
  for select using (
    exists (
      select 1 from public.tags t
      where t.id = tag_id and (t.owner_id = auth.uid() or public.is_admin())
    )
  );
create policy "owner_insert_taggables" on public.taggables
  for insert with check (
    exists (select 1 from public.tags t where t.id = tag_id and t.owner_id = auth.uid())
  );
create policy "owner_delete_taggables" on public.taggables
  for delete using (
    exists (
      select 1 from public.tags t
      where t.id = tag_id and (t.owner_id = auth.uid() or public.is_admin())
    )
  );
