-- Kenzim Phase 2: accounts, roles/permissions, identity verification.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

create extension if not exists pgcrypto;

-- ============ TABLES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  username text unique check (username ~ '^[a-z0-9_]{3,24}$'),
  avatar_url text,
  phone text check (phone ~ '^\+?[0-9]{8,15}$'),
  city_zw text,
  bio text check (char_length(bio) <= 280),
  status text not null default 'new' check (status in ('new','pending','verified','suspended')),
  is_senior_member boolean not null default false,
  paid_through date,
  birthday date,
  birthday_opt_in boolean not null default false,
  directory_visible boolean not null default true,
  contact_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  is_system boolean not null default false
);
create table public.permissions (
  key text primary key,
  description text not null
);
create table public.role_permissions (
  role_id uuid references public.roles(id) on delete cascade,
  permission_key text references public.permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);
create table public.user_roles (
  user_id uuid references public.profiles(id) on delete cascade,
  role_id uuid references public.roles(id) on delete cascade,
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table public.identity_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  doc_type text not null check (doc_type in ('passport','kenyan_id')),
  id_number_enc text,
  photo_path text,
  status text not null default 'submitted' check (status in ('submitted','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  photo_deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.employment (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  occupation text, employer text, work_city text, work_phone text
);
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('kenya_contact','zimbabwe_next_of_kin')),
  full_name text not null,
  relationship text,
  phone text not null,
  address text
);
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  relationship text not null,
  birth_date date,
  anniversary_date date,
  birthday_opt_in boolean not null default false
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  subject_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index on public.identity_submissions (user_id);
create index on public.identity_submissions (status);
create index on public.emergency_contacts (user_id);
create index on public.family_members (user_id);
create index on public.user_roles (user_id);

-- ============ HELPER FUNCTIONS ============
create or replace function public.has_permission(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    left join public.role_permissions rp on rp.role_id = r.id
    where ur.user_id = auth.uid()
      and (r.key = 'super_admin' or rp.permission_key = p)
  );
$$;

create or replace function public.is_verified() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and status = 'verified');
$$;

-- Auto-create a profile for every new sign-up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'New member'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Members cannot edit their own status, badge or dues date
create or replace function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if; -- SQL editor / service role
  if new.status is distinct from old.status
     and not (public.has_permission('members.verify')
              or public.has_permission('identity.review')
              or public.has_permission('members.suspend')) then
    raise exception 'Not allowed to change status';
  end if;
  if new.is_senior_member is distinct from old.is_senior_member
     and not public.has_permission('roles.assign') then
    raise exception 'Not allowed to change the Trusted badge';
  end if;
  if new.paid_through is distinct from old.paid_through
     and not public.has_permission('dues.record') then
    raise exception 'Not allowed to change paid-through date';
  end if;
  return new;
end;
$$;
create trigger protect_profile before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Never remove the last Super Admin
create or replace function public.keep_one_super_admin() returns trigger
language plpgsql security definer set search_path = public as $$
declare sa uuid;
begin
  select id into sa from public.roles where key = 'super_admin';
  if old.role_id = sa and (select count(*) from public.user_roles where role_id = sa) <= 1 then
    raise exception 'Cannot remove the last Super Admin';
  end if;
  return old;
end;
$$;
create trigger keep_super_admin before delete on public.user_roles
  for each row execute function public.keep_one_super_admin();

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.identity_submissions enable row level security;
alter table public.employment enable row level security;
alter table public.emergency_contacts enable row level security;
alter table public.family_members enable row level security;
alter table public.audit_log enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.has_permission('members.verify')
  or public.has_permission('members.read_private')
  or (status = 'verified' and directory_visible and public.is_verified())
);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_update_staff on public.profiles for update to authenticated
  using (public.has_permission('members.verify') or public.has_permission('members.suspend') or public.has_permission('roles.assign'))
  with check (true);

-- roles & permissions: everyone signed in can read; only roles.assign writes
create policy roles_read on public.roles for select to authenticated using (true);
create policy permissions_read on public.permissions for select to authenticated using (true);
create policy role_perms_read on public.role_permissions for select to authenticated using (true);
create policy roles_write on public.roles for all to authenticated
  using (public.has_permission('roles.assign')) with check (public.has_permission('roles.assign'));
create policy role_perms_write on public.role_permissions for all to authenticated
  using (public.has_permission('roles.assign')) with check (public.has_permission('roles.assign'));
create policy user_roles_read on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_permission('roles.assign'));
create policy user_roles_write on public.user_roles for all to authenticated
  using (public.has_permission('roles.assign')) with check (public.has_permission('roles.assign'));

-- identity: members see their own status; reviewers see all. All writes go through
-- the server (service role), so there are deliberately no insert/update/delete policies.
create policy identity_select on public.identity_submissions for select to authenticated
  using (user_id = auth.uid() or public.has_permission('identity.review'));

-- private details: owner, plus staff with members.read_private (read only)
create policy employment_own on public.employment for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy employment_staff on public.employment for select to authenticated
  using (public.has_permission('members.read_private'));
create policy emergency_own on public.emergency_contacts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy emergency_staff on public.emergency_contacts for select to authenticated
  using (public.has_permission('members.read_private'));
create policy family_own on public.family_members for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy family_staff on public.family_members for select to authenticated
  using (public.has_permission('members.read_private'));

-- audit log: readable with audit.read; written only by the server; never edited
create policy audit_read on public.audit_log for select to authenticated
  using (public.has_permission('audit.read'));

-- ============ SEED PERMISSIONS & ROLES ============
insert into public.permissions (key, description) values
  ('news.publish','Post news and announcements'),
  ('events.manage','Create and edit events'),
  ('members.verify','Approve or reject members'),
  ('members.read_private','View employment, emergency and family details'),
  ('members.suspend','Suspend members'),
  ('identity.review','View ID documents during review'),
  ('identity.download','Download an ID document (logged)'),
  ('roles.assign','Assign roles and the Trusted badge'),
  ('audit.read','View the audit log'),
  ('dues.record','Record and void dues payments'),
  ('dues.view','View dues and overdue lists'),
  ('dues.configure','Set dues amounts'),
  ('catalog.manage','Manage retailers, products and fees'),
  ('orders.manage','Manage goods orders'),
  ('merch.manage','Manage merchandise pre-orders'),
  ('places.manage','Manage tourism places'),
  ('info.manage','Manage tourism and trade articles'),
  ('messages.moderate','Review reported messages');

insert into public.roles (key, name, is_system) values
  ('super_admin','Super Admin', true),
  ('treasurer','Treasurer', true),
  ('secretary','Secretary', true),
  ('tourist_guide','Tourist Guide', true),
  ('moderator','Moderator', true);

insert into public.role_permissions (role_id, permission_key)
select r.id, p.k from public.roles r
join (values
  ('treasurer','dues.record'),('treasurer','dues.view'),('treasurer','dues.configure'),
  ('treasurer','orders.manage'),('treasurer','merch.manage'),('treasurer','catalog.manage'),
  ('secretary','news.publish'),('secretary','events.manage'),
  ('secretary','members.read_private'),('secretary','members.verify'),
  ('tourist_guide','places.manage'),('tourist_guide','info.manage'),
  ('moderator','messages.moderate'),('moderator','members.suspend')
) as p(role_key, k) on p.role_key = r.key;

-- ============ STORAGE: private bucket for ID photos ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('id-documents','id-documents', false, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Members may upload only into their own folder. Nobody can read, update or delete
-- through the browser; the server signs short-lived links for reviewers.
create policy id_docs_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'id-documents' and (storage.foldername(name))[1] = auth.uid()::text);
