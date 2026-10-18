-- Uravu clean database schema (v2).
-- Run once in Supabase Dashboard -> SQL Editor -> New query.
-- This uses uravu_* tables so it does not destructively alter existing tables.
-- All family-tree data is database-backed; no browser cache is used for tree data.

create table if not exists public.uravu_family_trees (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 100),
  description text not null default '',
  language text not null default 'en' check (language in ('en', 'ta')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.uravu_people (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references public.uravu_family_trees(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  tamil_name text,
  gender text check (gender is null or gender in ('male', 'female', 'other')),
  birth_date date,
  death_date date,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (death_date is null or birth_date is null or death_date >= birth_date)
);

create table if not exists public.uravu_relationships (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references public.uravu_family_trees(id) on delete cascade,
  person_id uuid not null references public.uravu_people(id) on delete cascade,
  related_person_id uuid not null references public.uravu_people(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('parent', 'spouse')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (person_id <> related_person_id)
);

create table if not exists public.uravu_tree_members (
  tree_id uuid not null references public.uravu_family_trees(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'admin', 'member', 'viewer')),
  person_id uuid references public.uravu_people(id) on delete set null,
  display_name text not null default 'Family member',
  avatar_url text,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tree_id, user_id)
);

create table if not exists public.uravu_access_requests (
  id uuid primary key default gen_random_uuid(),
  tree_id uuid not null references public.uravu_family_trees(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('join', 'role_change', 'link')),
  requested_role text not null default 'viewer' check (requested_role in ('viewer', 'member', 'admin')),
  requested_person_id uuid references public.uravu_people(id) on delete set null,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  display_name text not null default 'Family member',
  avatar_url text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists uravu_people_tree_idx on public.uravu_people(tree_id, full_name);
create index if not exists uravu_relationships_tree_idx on public.uravu_relationships(tree_id);
create index if not exists uravu_members_user_idx on public.uravu_tree_members(user_id, tree_id);
create index if not exists uravu_requests_tree_status_idx on public.uravu_access_requests(tree_id, status, created_at desc);
create unique index if not exists uravu_one_person_per_tree_member
  on public.uravu_tree_members(tree_id, person_id) where person_id is not null;
create unique index if not exists uravu_relationship_once
  on public.uravu_relationships(tree_id, person_id, related_person_id, relationship_type);
create unique index if not exists uravu_one_pending_request_per_user_tree
  on public.uravu_access_requests(tree_id, user_id) where status = 'pending';

create or replace function public.uravu_is_tree_member(p_tree_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $
  select exists (
    select 1 from public.uravu_tree_members m
    where m.tree_id = p_tree_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.uravu_has_tree_role(p_tree_id uuid, p_roles text[])
returns boolean
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $
  select exists (
    select 1 from public.uravu_tree_members m
    where m.tree_id = p_tree_id
      and m.user_id = auth.uid()
      and m.role = any(p_roles)
  );
$$;

create or replace function public.uravu_touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists uravu_trees_touch_updated_at on public.uravu_family_trees;
create trigger uravu_trees_touch_updated_at before update on public.uravu_family_trees
for each row execute function public.uravu_touch_updated_at();
drop trigger if exists uravu_people_touch_updated_at on public.uravu_people;
create trigger uravu_people_touch_updated_at before update on public.uravu_people
for each row execute function public.uravu_touch_updated_at();
drop trigger if exists uravu_members_touch_updated_at on public.uravu_tree_members;
create trigger uravu_members_touch_updated_at before update on public.uravu_tree_members
for each row execute function public.uravu_touch_updated_at();

create or replace function public.uravu_create_tree(
  p_name text,
  p_description text default '',
  p_language text default 'en'
)
returns uuid
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_tree_id uuid;
  v_name text := btrim(coalesce(p_name, ''));
  v_display_name text;
  v_avatar text;
begin
  if v_user is null then raise exception 'Sign in before creating a family tree.'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'Tree name must be between 2 and 100 characters.';
  end if;
  if coalesce(p_language, 'en') not in ('en', 'ta') then
    raise exception 'Choose English or Tamil as the primary language.';
  end if;

  select coalesce(nullif(u.raw_user_meta_data->>'full_name',''),
                  nullif(u.raw_user_meta_data->>'name',''),
                  nullif(u.raw_user_meta_data->>'user_name',''),
                  nullif(u.email,''), 'Family owner'),
         coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
    into v_display_name, v_avatar
  from auth.users u where u.id = v_user;

  insert into public.uravu_family_trees(name, description, language, created_by)
  values (v_name, left(coalesce(p_description, ''), 500), coalesce(p_language, 'en'), v_user)
  returning id into v_tree_id;

  insert into public.uravu_tree_members(tree_id, user_id, role, display_name, avatar_url)
  values (v_tree_id, v_user, 'owner', coalesce(v_display_name, 'Family owner'), v_avatar);

  return v_tree_id;
end;
$$;

create or replace function public.uravu_request_tree_access(
  p_tree_id uuid,
  p_message text default '',
  p_requested_role text default 'viewer',
  p_requested_person_id uuid default null
)
returns uuid
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_type text;
  v_display_name text;
  v_avatar text;
  v_request_id uuid;
begin
  if v_user is null then raise exception 'Sign in before making a request.'; end if;
  if p_requested_role is null or p_requested_role not in ('viewer', 'member', 'admin') then
    raise exception 'The requested role must be viewer, member, or admin.';
  end if;
  if not exists(select 1 from public.uravu_family_trees t where t.id = p_tree_id) then
    raise exception 'Family tree not found.';
  end if;
  if p_requested_person_id is not null and not exists(
    select 1 from public.uravu_people p where p.id=p_requested_person_id and p.tree_id=p_tree_id
  ) then raise exception 'The selected family member is not in this tree.'; end if;

  select m.role into v_role from public.uravu_tree_members m
  where m.tree_id=p_tree_id and m.user_id=v_user;

  if v_role is null then
    v_type := 'join';
  elsif p_requested_person_id is not null and p_requested_role = v_role then
    v_type := 'link';
  elsif p_requested_role <> v_role then
    v_type := 'role_change';
  elsif p_requested_person_id is not null then
    v_type := 'link';
  else
    raise exception 'Choose a different role or a family member to link to.';
  end if;

  select coalesce(nullif(u.raw_user_meta_data->>'full_name',''),
                  nullif(u.raw_user_meta_data->>'name',''),
                  nullif(u.raw_user_meta_data->>'user_name',''),
                  nullif(u.email,''), 'Family member'),
         coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
    into v_display_name, v_avatar
  from auth.users u where u.id = v_user;

  select r.id into v_request_id from public.uravu_access_requests r
  where r.tree_id=p_tree_id and r.user_id=v_user and r.status='pending'
  limit 1;

  if v_request_id is not null then
    update public.uravu_access_requests
    set request_type=v_type, requested_role=p_requested_role,
        requested_person_id=p_requested_person_id,
        message=left(coalesce(p_message,''),1000),
        display_name=coalesce(v_display_name,'Family member'),
        avatar_url=v_avatar, created_at=now()
    where id=v_request_id;
    return v_request_id;
  end if;

  insert into public.uravu_access_requests(
    tree_id,user_id,request_type,requested_role,requested_person_id,message,display_name,avatar_url
  ) values (
    p_tree_id,v_user,v_type,p_requested_role,p_requested_person_id,left(coalesce(p_message,''),1000),
    coalesce(v_display_name,'Family member'),v_avatar
  ) returning id into v_request_id;
  return v_request_id;
end;
$$;

create or replace function public.uravu_review_tree_request(
  p_request_id uuid,
  p_decision text,
  p_role text default 'viewer'
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_req public.uravu_access_requests%rowtype;
  v_reviewer_role text;
  v_current_role text;
begin
  if v_user is null then raise exception 'Sign in before reviewing requests.'; end if;
  if p_decision is null or p_decision not in ('approve','reject') then raise exception 'Decision must be approve or reject.'; end if;
  if p_role is null or p_role not in ('viewer','member','admin') then raise exception 'Invalid assigned role.'; end if;

  select * into v_req from public.uravu_access_requests r where r.id=p_request_id for update;
  if not found then raise exception 'Request not found.'; end if;
  if v_req.status <> 'pending' then raise exception 'This request has already been reviewed.'; end if;
  if v_req.user_id = v_user then raise exception 'You cannot review your own request.'; end if;

  select m.role into v_reviewer_role from public.uravu_tree_members m
  where m.tree_id=v_req.tree_id and m.user_id=v_user;
  if coalesce(v_reviewer_role,'') not in ('owner','admin') then
    raise exception 'Only the tree owner or an admin can review requests.';
  end if;
  if p_role='admin' and v_reviewer_role <> 'owner' then
    raise exception 'Only the tree owner can grant admin access.';
  end if;

  if p_decision='reject' then
    update public.uravu_access_requests set status='rejected', reviewed_by=v_user, reviewed_at=now()
    where id=p_request_id;
    return;
  end if;

  if v_req.requested_person_id is not null and not exists(
    select 1 from public.uravu_people p
    where p.id=v_req.requested_person_id and p.tree_id=v_req.tree_id
  ) then raise exception 'The requested family member no longer exists in this tree.'; end if;
  if v_req.requested_person_id is not null and exists(
    select 1 from public.uravu_tree_members m
    where m.tree_id=v_req.tree_id and m.person_id=v_req.requested_person_id and m.user_id<>v_req.user_id
  ) then raise exception 'That family entry is already assigned to another account. Choose an unassigned entry.'; end if;

  select m.role into v_current_role from public.uravu_tree_members m
  where m.tree_id=v_req.tree_id and m.user_id=v_req.user_id;

  if v_current_role is null then
    insert into public.uravu_tree_members(
      tree_id,user_id,role,person_id,display_name,avatar_url
    ) values (
      v_req.tree_id,v_req.user_id,p_role,v_req.requested_person_id,
      v_req.display_name,v_req.avatar_url
    );
  else
    if v_current_role='owner' and p_role<>'owner' then
      raise exception 'The tree owner role cannot be changed here.';
    end if;
    update public.uravu_tree_members
    set role=case when v_req.request_type='link' then role else p_role end,
        person_id=coalesce(v_req.requested_person_id, person_id),
        display_name=v_req.display_name,
        avatar_url=v_req.avatar_url
    where tree_id=v_req.tree_id and user_id=v_req.user_id;
  end if;

  update public.uravu_access_requests set status='approved', reviewed_by=v_user, reviewed_at=now()
  where id=p_request_id;
end;
$$;

create or replace function public.uravu_assign_member_person(
  p_tree_id uuid,
  p_user_id uuid,
  p_person_id uuid
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Sign in before managing members.'; end if;
  if not public.uravu_has_tree_role(p_tree_id, array['owner','admin']) then
    raise exception 'Only the tree owner or an admin can assign family entries.';
  end if;
  if not exists(select 1 from public.uravu_tree_members m where m.tree_id=p_tree_id and m.user_id=p_user_id) then
    raise exception 'That account is not a member of this tree.';
  end if;
  if p_person_id is not null and not exists(
    select 1 from public.uravu_people p where p.id=p_person_id and p.tree_id=p_tree_id
  ) then raise exception 'The selected family entry is not in this tree.'; end if;
  if p_person_id is not null and exists(
    select 1 from public.uravu_tree_members m
    where m.tree_id=p_tree_id and m.person_id=p_person_id and m.user_id<>p_user_id
  ) then raise exception 'That family entry is already linked to another account. Unlink it first.'; end if;

  update public.uravu_tree_members set person_id=p_person_id
  where tree_id=p_tree_id and user_id=p_user_id;
end;
$$;

create or replace function public.uravu_set_member_role(
  p_tree_id uuid,
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_actor_role text;
  v_target_role text;
begin
  if auth.uid() is null then raise exception 'Sign in before managing roles.'; end if;
  if p_role not in ('admin','member','viewer') then raise exception 'Invalid member role.'; end if;

  select m.role into v_actor_role from public.uravu_tree_members m
  where m.tree_id=p_tree_id and m.user_id=auth.uid();
  if coalesce(v_actor_role,'') not in ('owner','admin') then
    raise exception 'Only the tree owner or an admin can change roles.';
  end if;
  select m.role into v_target_role from public.uravu_tree_members m
  where m.tree_id=p_tree_id and m.user_id=p_user_id;
  if v_target_role is null then raise exception 'Member not found.'; end if;
  if v_target_role='owner' then raise exception 'The tree owner role cannot be changed here.'; end if;
  if p_role='admin' and v_actor_role<>'owner' then
    raise exception 'Only the tree owner can grant admin access.';
  end if;
  if v_actor_role='admin' and v_target_role='admin' then
    raise exception 'Admins cannot change another admin role.';
  end if;
  update public.uravu_tree_members set role=p_role
  where tree_id=p_tree_id and user_id=p_user_id;
end;
$$;

create or replace function public.uravu_link_people(
  p_tree_id uuid,
  p_person_id uuid,
  p_related_person_id uuid,
  p_relationship_type text
)
returns uuid
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
declare
  v_a uuid := p_person_id;
  v_b uuid := p_related_person_id;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in before editing a family tree.'; end if;
  if not public.uravu_has_tree_role(p_tree_id, array['owner','admin']) then
    raise exception 'Only the tree owner or an admin can edit family connections.';
  end if;
  if p_relationship_type is null or p_relationship_type not in ('parent_of','child_of','spouse_of') then
    raise exception 'Choose a valid family relationship.';
  end if;
  if p_person_id=p_related_person_id then raise exception 'A person cannot be connected to themselves.'; end if;
  if not exists(select 1 from public.uravu_people p where p.id=p_person_id and p.tree_id=p_tree_id)
     or not exists(select 1 from public.uravu_people p where p.id=p_related_person_id and p.tree_id=p_tree_id) then
    raise exception 'Both family members must belong to this tree.';
  end if;

  if p_relationship_type='child_of' then
    v_a := p_related_person_id; v_b := p_person_id;
  elsif p_relationship_type='spouse_of' and v_b::text < v_a::text then
    v_a := p_related_person_id; v_b := p_person_id;
  end if;

  -- Prevent a parent-child edge from introducing a cycle into the ancestry graph.
  if p_relationship_type <> 'spouse_of' then
    if exists (
      with recursive descendants(person_id) as (
        select v_b
        union
        select r.related_person_id
        from public.uravu_relationships r
        join descendants d on r.person_id=d.person_id
        where r.tree_id=p_tree_id and r.relationship_type='parent'
      )
      select 1 from descendants where person_id=v_a
    ) then
      raise exception 'That connection would create a family-tree cycle. Check the parent and child selection.';
    end if;
  end if;

  insert into public.uravu_relationships(tree_id,person_id,related_person_id,relationship_type,created_by)
  values (p_tree_id,v_a,v_b,case when p_relationship_type='spouse_of' then 'spouse' else 'parent' end,auth.uid())
  on conflict (tree_id,person_id,related_person_id,relationship_type) do update set relationship_type=excluded.relationship_type
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.uravu_delete_tree(p_tree_id uuid)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Sign in before deleting a tree.'; end if;
  if not public.uravu_has_tree_role(p_tree_id, array['owner']) then
    raise exception 'Only the tree owner can delete this family tree.';
  end if;
  delete from public.uravu_family_trees where id=p_tree_id;
end;
$$;

alter table public.uravu_family_trees enable row level security;
alter table public.uravu_people enable row level security;
alter table public.uravu_relationships enable row level security;
alter table public.uravu_tree_members enable row level security;
alter table public.uravu_access_requests enable row level security;

drop policy if exists uravu_trees_select_auth on public.uravu_family_trees;
create policy uravu_trees_select_auth on public.uravu_family_trees
for select to authenticated using (auth.uid() is not null);
drop policy if exists uravu_trees_update_admin on public.uravu_family_trees;
create policy uravu_trees_update_admin on public.uravu_family_trees
for update to authenticated using (public.uravu_has_tree_role(id,array['owner','admin']))
with check (public.uravu_has_tree_role(id,array['owner','admin']));
drop policy if exists uravu_trees_delete_owner on public.uravu_family_trees;
create policy uravu_trees_delete_owner on public.uravu_family_trees
for delete to authenticated using (public.uravu_has_tree_role(id,array['owner']));

drop policy if exists uravu_people_select_members on public.uravu_people;
create policy uravu_people_select_members on public.uravu_people
for select to authenticated using (public.uravu_is_tree_member(tree_id));
drop policy if exists uravu_people_insert_admin on public.uravu_people;
create policy uravu_people_insert_admin on public.uravu_people
for insert to authenticated with check (
  created_by=auth.uid() and public.uravu_has_tree_role(tree_id,array['owner','admin'])
);
drop policy if exists uravu_people_update_admin on public.uravu_people;
create policy uravu_people_update_admin on public.uravu_people
for update to authenticated using (public.uravu_has_tree_role(tree_id,array['owner','admin']))
with check (public.uravu_has_tree_role(tree_id,array['owner','admin']));
drop policy if exists uravu_people_delete_admin on public.uravu_people;
create policy uravu_people_delete_admin on public.uravu_people
for delete to authenticated using (public.uravu_has_tree_role(tree_id,array['owner','admin']));

drop policy if exists uravu_relationships_select_members on public.uravu_relationships;
create policy uravu_relationships_select_members on public.uravu_relationships
for select to authenticated using (public.uravu_is_tree_member(tree_id));
drop policy if exists uravu_relationships_delete_admin on public.uravu_relationships;
create policy uravu_relationships_delete_admin on public.uravu_relationships
for delete to authenticated using (public.uravu_has_tree_role(tree_id,array['owner','admin']));

drop policy if exists uravu_members_select_tree_or_self on public.uravu_tree_members;
create policy uravu_members_select_tree_or_self on public.uravu_tree_members
for select to authenticated using (
  user_id=auth.uid() or public.uravu_is_tree_member(tree_id)
);

drop policy if exists uravu_requests_select_self_or_admin on public.uravu_access_requests;
create policy uravu_requests_select_self_or_admin on public.uravu_access_requests
for select to authenticated using (
  user_id=auth.uid() or public.uravu_has_tree_role(tree_id,array['owner','admin'])
);

revoke all on public.uravu_family_trees from anon, authenticated;
revoke all on public.uravu_people from anon, authenticated;
revoke all on public.uravu_relationships from anon, authenticated;
revoke all on public.uravu_tree_members from anon, authenticated;
revoke all on public.uravu_access_requests from anon, authenticated;

grant select on public.uravu_family_trees to authenticated;
grant update, delete on public.uravu_family_trees to authenticated;
grant select, insert, update, delete on public.uravu_people to authenticated;
grant select, delete on public.uravu_relationships to authenticated;
grant select (tree_id,user_id,role,person_id,display_name,avatar_url,joined_at,updated_at)
  on public.uravu_tree_members to authenticated;
grant select (id,tree_id,user_id,request_type,requested_role,requested_person_id,message,status,display_name,avatar_url,reviewed_by,reviewed_at,created_at)
  on public.uravu_access_requests to authenticated;

revoke all on function public.uravu_create_tree(text,text,text) from public, anon, authenticated;
revoke all on function public.uravu_request_tree_access(uuid,text,text,uuid) from public, anon, authenticated;
revoke all on function public.uravu_review_tree_request(uuid,text,text) from public, anon, authenticated;
revoke all on function public.uravu_assign_member_person(uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.uravu_set_member_role(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.uravu_link_people(uuid,uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.uravu_delete_tree(uuid) from public, anon, authenticated;
revoke all on function public.uravu_is_tree_member(uuid) from public, anon, authenticated;
revoke all on function public.uravu_has_tree_role(uuid,text[]) from public, anon, authenticated;

grant execute on function public.uravu_create_tree(text,text,text) to authenticated;
grant execute on function public.uravu_request_tree_access(uuid,text,text,uuid) to authenticated;
grant execute on function public.uravu_review_tree_request(uuid,text,text) to authenticated;
grant execute on function public.uravu_assign_member_person(uuid,uuid,uuid) to authenticated;
grant execute on function public.uravu_set_member_role(uuid,uuid,text) to authenticated;
grant execute on function public.uravu_link_people(uuid,uuid,uuid,text) to authenticated;
grant execute on function public.uravu_delete_tree(uuid) to authenticated;
grant execute on function public.uravu_is_tree_member(uuid) to authenticated;
grant execute on function public.uravu_has_tree_role(uuid,text[]) to authenticated;

-- The app has no cache table. RLS and these grants control all persisted family data.
