-- Uravu single shared tree + account-to-record linking permissions.
-- Run once in Supabase SQL Editor after the existing Uravu schema and prior migrations.
-- This preserves existing trees, people and relationships; only one existing tree is designated main.

begin;

alter table public.uravu_family_trees
  add column if not exists is_main boolean not null default false;

-- Keep one existing family tree as the shared Uravugal tree. Prefer the requested
-- original name, then an already-renamed Uravugal tree, then the oldest tree.
update public.uravu_family_trees set is_main = false;
with chosen as (
  select id
  from public.uravu_family_trees
  order by
    case
      when name = 'ஞானமுத்து நாடார் குடும்பம்' then 0
      when lower(name) = 'uravugal' then 1
      else 2
    end,
    created_at asc,
    id asc
  limit 1
)
update public.uravu_family_trees t
set is_main = true,
    name = 'Uravugal',
    description = case when nullif(btrim(t.description), '') is null
      then 'One shared family tree across generations.'
      else t.description end,
    updated_at = now()
from chosen
where t.id = chosen.id;

create unique index if not exists uravu_only_one_main_tree
  on public.uravu_family_trees(is_main) where is_main;

alter table public.uravu_people
  add column if not exists is_self_record boolean not null default false;

create unique index if not exists uravu_one_self_record_per_creator
  on public.uravu_people(tree_id, created_by)
  where is_self_record = true;

create or replace function public.uravu_main_tree_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select t.id from public.uravu_family_trees t
  where t.is_main = true
  limit 1;
$$;

-- Keep the creator's account linked only when the existing record name exactly
-- matches the OAuth display name. No ambiguous people are guessed or assigned.
update public.uravu_tree_members m
set person_id = p.id,
    updated_at = now()
from public.uravu_people p
where m.tree_id = public.uravu_main_tree_id()
  and p.tree_id = m.tree_id
  and m.user_id = (select t.created_by from public.uravu_family_trees t where t.id = m.tree_id)
  and m.person_id is null
  and lower(btrim(p.full_name)) = lower(btrim(m.display_name))
  and (select count(*) from public.uravu_people same_name
       where same_name.tree_id = p.tree_id
         and lower(btrim(same_name.full_name)) = lower(btrim(m.display_name))) = 1
  and not exists (
    select 1 from public.uravu_tree_members other_member
    where other_member.tree_id = p.tree_id
      and other_member.person_id = p.id
      and other_member.user_id <> m.user_id
  );

-- Pending join requests do not belong in the single-tree version.
update public.uravu_access_requests
set status = 'rejected',
    reviewed_at = now(),
    message = concat_ws(E'\n', nullif(message, ''),
      'Closed: Uravu now accepts family-record linking requests only.')
where status = 'pending'
  and request_type = 'join';

create or replace function public.uravu_can_edit_tree(p_tree_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.uravu_tree_members m
    where m.tree_id = p_tree_id
      and m.user_id = auth.uid()
      and m.person_id is not null
      and p_tree_id = public.uravu_main_tree_id()
  );
$;

create or replace function public.uravu_can_edit_person(p_tree_id uuid, p_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    p_tree_id = public.uravu_main_tree_id()
    and auth.uid() is not null
    and (
      -- Every linked member may maintain their own record.
      exists (
        select 1 from public.uravu_tree_members mine
        where mine.tree_id = p_tree_id
          and mine.user_id = auth.uid()
          and mine.person_id = p_person_id
      )
      -- An unlinked account may maintain only the one self-record it created.
      or exists (
        select 1 from public.uravu_people own_person
        where own_person.id = p_person_id
          and own_person.tree_id = p_tree_id
          and own_person.created_by = auth.uid()
          and own_person.is_self_record = true
          and not exists (
            select 1 from public.uravu_tree_members assigned
            where assigned.tree_id = p_tree_id
              and assigned.person_id = own_person.id
          )
      )
      -- A linked member may edit other records only while those records are unlinked.
      or (
        exists (
          select 1 from public.uravu_tree_members mine
          where mine.tree_id = p_tree_id
            and mine.user_id = auth.uid()
            and mine.person_id is not null
        )
        and exists (
          select 1 from public.uravu_people target
          where target.id = p_person_id and target.tree_id = p_tree_id
        )
        and not exists (
          select 1 from public.uravu_tree_members assigned
          where assigned.tree_id = p_tree_id
            and assigned.person_id = p_person_id
        )
      )
    );
$$;

-- Requests only link accounts to a particular, unassigned family record.
create or replace function public.uravu_request_tree_access(
  p_tree_id uuid,
  p_message text default '',
  p_requested_role text default 'member',
  p_requested_person_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user uuid := auth.uid();
  v_existing_membership public.uravu_tree_members%rowtype;
  v_person public.uravu_people%rowtype;
  v_display_name text;
  v_avatar text;
  v_request_id uuid;
begin
  if v_user is null then raise exception 'Sign in before requesting a family-record link.'; end if;
  if p_tree_id is distinct from public.uravu_main_tree_id() then
    raise exception 'Uravu uses one shared family tree.';
  end if;
  if p_requested_role is distinct from 'member' then
    raise exception 'Membership permissions are determined by your record link.';
  end if;
  if p_requested_person_id is null then
    raise exception 'Choose the family record you want to link to your account.';
  end if;

  select * into v_person
  from public.uravu_people p
  where p.id = p_requested_person_id and p.tree_id = p_tree_id;
  if not found then raise exception 'The selected family record is not in Uravugal.'; end if;
  if exists (
    select 1 from public.uravu_tree_members assigned
    where assigned.tree_id = p_tree_id and assigned.person_id = p_requested_person_id
      and assigned.user_id <> v_user
  ) then raise exception 'That family record is already linked to an account.'; end if;

  select * into v_existing_membership
  from public.uravu_tree_members m
  where m.tree_id = p_tree_id and m.user_id = v_user;

  if v_existing_membership.person_id is not null then
    raise exception 'Your account is already linked to a family record.';
  end if;

  -- A person without a membership row can initially request only their own new
  -- self-record. An existing unlinked membership can request an unassigned record.
  if v_existing_membership.user_id is null then
    if not (v_person.created_by = v_user and v_person.is_self_record) then
      raise exception 'Create your own family record first, or sign in with an existing family account.';
    end if;
  end if;

  select coalesce(
      nullif(u.raw_user_meta_data->>'full_name',''),
      nullif(u.raw_user_meta_data->>'name',''),
      nullif(u.raw_user_meta_data->>'user_name',''),
      nullif(u.email,''), 'Family member'
    ),
    coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
  into v_display_name, v_avatar
  from auth.users u where u.id = v_user;

  select r.id into v_request_id
  from public.uravu_access_requests r
  where r.tree_id = p_tree_id and r.user_id = v_user and r.status = 'pending'
  limit 1;

  if v_request_id is not null then
    update public.uravu_access_requests
    set request_type = 'link', requested_role = 'member',
        requested_person_id = p_requested_person_id,
        message = left(coalesce(p_message, ''), 1000),
        display_name = coalesce(v_display_name, 'Family member'),
        avatar_url = v_avatar, created_at = now()
    where id = v_request_id;
    return v_request_id;
  end if;

  insert into public.uravu_access_requests(
    tree_id, user_id, request_type, requested_role, requested_person_id,
    message, display_name, avatar_url
  ) values (
    p_tree_id, v_user, 'link', 'member', p_requested_person_id,
    left(coalesce(p_message, ''), 1000), coalesce(v_display_name, 'Family member'), v_avatar
  ) returning id into v_request_id;

  return v_request_id;
end;
$$;

create or replace function public.uravu_review_tree_request(
  p_request_id uuid,
  p_decision text,
  p_role text default 'member'
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user uuid := auth.uid();
  v_req public.uravu_access_requests%rowtype;
  v_person public.uravu_people%rowtype;
begin
  if v_user is null then raise exception 'Sign in before reviewing requests.'; end if;
  if p_decision not in ('approve','reject') then raise exception 'Decision must be approve or reject.'; end if;
  if p_role is distinct from 'member' then raise exception 'Membership permissions are determined by the linked record.'; end if;

  if not exists (
    select 1 from public.uravu_tree_members reviewer
    where reviewer.tree_id = public.uravu_main_tree_id()
      and reviewer.user_id = v_user and reviewer.person_id is not null
  ) then
    raise exception 'Only a member already linked to a family record can review linking requests.';
  end if;

  select * into v_req
  from public.uravu_access_requests r
  where r.id = p_request_id
  for update;
  if not found then raise exception 'Linking request not found.'; end if;
  if v_req.tree_id is distinct from public.uravu_main_tree_id()
     or v_req.request_type <> 'link' then
    raise exception 'Only Uravugal family-record linking requests can be reviewed.';
  end if;
  if v_req.status <> 'pending' then raise exception 'This request has already been reviewed.'; end if;
  if v_req.user_id = v_user then raise exception 'You cannot review your own request.'; end if;

  if p_decision = 'reject' then
    update public.uravu_access_requests
    set status = 'rejected', reviewed_by = v_user, reviewed_at = now()
    where id = p_request_id;
    return;
  end if;

  if v_req.requested_person_id is null then
    raise exception 'The request does not identify a family record.';
  end if;

  select * into v_person from public.uravu_people p
  where p.id = v_req.requested_person_id and p.tree_id = v_req.tree_id
  for update;
  if not found then raise exception 'The requested family record no longer exists.'; end if;

  if exists (
    select 1 from public.uravu_tree_members assigned
    where assigned.tree_id = v_req.tree_id and assigned.person_id = v_person.id
      and assigned.user_id <> v_req.user_id
  ) then raise exception 'That family record is already linked to another account.'; end if;

  if exists (
    select 1 from public.uravu_tree_members requester
    where requester.tree_id = v_req.tree_id and requester.user_id = v_req.user_id
      and requester.person_id is not null
  ) then raise exception 'This account is already linked to a family record.'; end if;

  insert into public.uravu_tree_members(
    tree_id, user_id, role, person_id, display_name, avatar_url
  ) values (
    v_req.tree_id, v_req.user_id, 'member', v_person.id,
    v_req.display_name, v_req.avatar_url
  )
  on conflict (tree_id, user_id) do update
    set role = 'member', person_id = excluded.person_id,
        display_name = excluded.display_name, avatar_url = excluded.avatar_url,
        updated_at = now();

  update public.uravu_access_requests
  set status = 'approved', reviewed_by = v_user, reviewed_at = now()
  where id = p_request_id;
end;
$$;

-- An unlinked user may connect their own new record to existing relatives.
-- A linked member may update relationships elsewhere in the shared tree.
create or replace function public.uravu_link_people(
  p_tree_id uuid,
  p_person_id uuid,
  p_related_person_id uuid,
  p_relationship_type text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_a uuid := p_person_id;
  v_b uuid := p_related_person_id;
  v_id uuid;
  v_has_linked_account boolean;
  v_owns_endpoint boolean;
begin
  if auth.uid() is null then raise exception 'Sign in before editing family connections.'; end if;
  if p_tree_id is distinct from public.uravu_main_tree_id() then
    raise exception 'Uravu uses one shared family tree.';
  end if;
  select exists (
    select 1 from public.uravu_tree_members m
    where m.tree_id = p_tree_id and m.user_id = auth.uid() and m.person_id is not null
  ) into v_has_linked_account;
  select exists (
    select 1 from public.uravu_people p
    where p.tree_id = p_tree_id and p.created_by = auth.uid()
      and p.is_self_record = true
      and p.id in (p_person_id, p_related_person_id)
      and not exists (
        select 1 from public.uravu_tree_members m
        where m.tree_id = p_tree_id and m.person_id = p.id
      )
  ) into v_owns_endpoint;
  if not v_has_linked_account and not v_owns_endpoint then
    raise exception 'Link your account or connect your own new family record.';
  end if;
  if p_relationship_type is null or p_relationship_type not in ('parent_of','child_of','spouse_of') then
    raise exception 'Choose a valid family relationship.';
  end if;
  if p_person_id = p_related_person_id then raise exception 'A person cannot be connected to themselves.'; end if;
  if not exists(select 1 from public.uravu_people p where p.id=p_person_id and p.tree_id=p_tree_id)
     or not exists(select 1 from public.uravu_people p where p.id=p_related_person_id and p.tree_id=p_tree_id) then
    raise exception 'Both family members must belong to the shared tree.';
  end if;

  if p_relationship_type = 'child_of' then
    v_a := p_related_person_id; v_b := p_person_id;
  elsif p_relationship_type = 'spouse_of' and v_b::text < v_a::text then
    v_a := p_related_person_id; v_b := p_person_id;
  end if;

  if p_relationship_type <> 'spouse_of' then
    if exists (
      with recursive descendants(person_id) as (
        select v_b
        union
        select r.related_person_id
        from public.uravu_relationships r
        join descendants d on r.person_id = d.person_id
        where r.tree_id = p_tree_id and r.relationship_type = 'parent'
      )
      select 1 from descendants where person_id = v_a
    ) then
      raise exception 'That connection would create a family-tree cycle. Check the parent and child selection.';
    end if;
  end if;

  insert into public.uravu_relationships(tree_id,person_id,related_person_id,relationship_type,created_by)
  values (p_tree_id, v_a, v_b,
    case when p_relationship_type = 'spouse_of' then 'spouse' else 'parent' end, auth.uid())
  on conflict (tree_id, person_id, related_person_id, relationship_type)
  do update set relationship_type = excluded.relationship_type
  returning id into v_id;
  return v_id;
end;
$$;

-- Public database API intentionally has no tree-creation, tree-deletion, member-role
-- editor or direct member-assignment path in the single-tree version.
create or replace function public.uravu_create_tree(
  p_name text,
  p_description text default '',
  p_language text default 'en'
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  raise exception 'Uravu uses one shared family tree. Creating another tree is disabled.';
end;
$$;

-- Policies: signed-in accounts can see the single tree, but edit rights are per-record.
drop policy if exists uravu_trees_select_auth on public.uravu_family_trees;
create policy uravu_trees_select_auth on public.uravu_family_trees
for select to authenticated
using (auth.uid() is not null and id = public.uravu_main_tree_id());

drop policy if exists uravu_people_select_members on public.uravu_people;
drop policy if exists uravu_people_select_main on public.uravu_people;
create policy uravu_people_select_main on public.uravu_people
for select to authenticated
using (auth.uid() is not null and tree_id = public.uravu_main_tree_id());

drop policy if exists uravu_people_insert_admin on public.uravu_people;
drop policy if exists uravu_people_insert_editor on public.uravu_people;
drop policy if exists uravu_people_insert_main on public.uravu_people;
create policy uravu_people_insert_main on public.uravu_people
for insert to authenticated
with check (
  public.uravu_people.tree_id = public.uravu_main_tree_id()
  and public.uravu_people.created_by = auth.uid()
  and (
    (
      public.uravu_people.is_self_record = true
      and not exists (
        select 1 from public.uravu_tree_members m
        where m.tree_id = public.uravu_people.tree_id
          and m.user_id = auth.uid() and m.person_id is not null
      )
      and not exists (
        select 1 from public.uravu_people own
        where own.tree_id = public.uravu_people.tree_id
          and own.created_by = auth.uid() and own.is_self_record = true
      )
    )
    or (
      public.uravu_people.is_self_record = false
      and exists (
        select 1 from public.uravu_tree_members m
        where m.tree_id = public.uravu_people.tree_id
          and m.user_id = auth.uid() and m.person_id is not null
      )
    )
  )
);

drop policy if exists uravu_people_update_admin on public.uravu_people;
drop policy if exists uravu_people_update_editor on public.uravu_people;
drop policy if exists uravu_people_update_main on public.uravu_people;
create policy uravu_people_update_main on public.uravu_people
for update to authenticated
using (public.uravu_can_edit_person(tree_id, id))
with check (public.uravu_can_edit_person(tree_id, id));

drop policy if exists uravu_people_delete_admin on public.uravu_people;
drop policy if exists uravu_people_delete_editor on public.uravu_people;
drop policy if exists uravu_people_delete_owner on public.uravu_people;
drop policy if exists uravu_people_delete_main_unlinked on public.uravu_people;
create policy uravu_people_delete_main_unlinked on public.uravu_people
for delete to authenticated
using (
  public.uravu_can_edit_person(public.uravu_people.tree_id, public.uravu_people.id)
  and not exists (
    select 1 from public.uravu_tree_members assigned
    where assigned.tree_id = public.uravu_people.tree_id
      and assigned.person_id = public.uravu_people.id
  )
);

drop policy if exists uravu_relationships_select_members on public.uravu_relationships;
drop policy if exists uravu_relationships_select_main on public.uravu_relationships;
create policy uravu_relationships_select_main on public.uravu_relationships
for select to authenticated
using (auth.uid() is not null and tree_id = public.uravu_main_tree_id());

drop policy if exists uravu_relationships_delete_admin on public.uravu_relationships;
drop policy if exists uravu_relationships_delete_editor on public.uravu_relationships;
drop policy if exists uravu_relationships_delete_linked on public.uravu_relationships;
create policy uravu_relationships_delete_linked on public.uravu_relationships
for delete to authenticated
using (
  public.uravu_relationships.tree_id = public.uravu_main_tree_id()
  and (
    exists (
      select 1 from public.uravu_tree_members m
      where m.tree_id = public.uravu_relationships.tree_id
        and m.user_id = auth.uid() and m.person_id is not null
    )
    or exists (
      select 1 from public.uravu_people self_record
      where self_record.tree_id = public.uravu_relationships.tree_id
        and self_record.created_by = auth.uid()
        and self_record.is_self_record = true
        and self_record.id in (public.uravu_relationships.person_id, public.uravu_relationships.related_person_id)
        and not exists (
          select 1 from public.uravu_tree_members assigned
          where assigned.tree_id = self_record.tree_id and assigned.person_id = self_record.id
        )
    )
  )
);

drop policy if exists uravu_members_select_tree_or_self on public.uravu_tree_members;
drop policy if exists uravu_members_select_main on public.uravu_tree_members;
create policy uravu_members_select_main on public.uravu_tree_members
for select to authenticated
using (auth.uid() is not null and tree_id = public.uravu_main_tree_id());

drop policy if exists uravu_requests_select_self_or_admin on public.uravu_access_requests;
drop policy if exists uravu_requests_select_self_or_editor on public.uravu_access_requests;
drop policy if exists uravu_requests_select_main_linking on public.uravu_access_requests;
create policy uravu_requests_select_main_linking on public.uravu_access_requests
for select to authenticated
using (
  auth.uid() is not null
  and tree_id = public.uravu_main_tree_id()
  and request_type = 'link'
  and status = 'pending'
);

revoke all on public.uravu_family_trees from anon, authenticated;
revoke all on public.uravu_people from anon, authenticated;
revoke all on public.uravu_relationships from anon, authenticated;
revoke all on public.uravu_tree_members from anon, authenticated;
revoke all on public.uravu_access_requests from anon, authenticated;

grant select on public.uravu_family_trees to authenticated;
grant select, delete on public.uravu_people to authenticated;
-- Keep identity and policy fields immutable through the public data API.
grant insert (
  tree_id, full_name, tamil_name, gender, birth_date, birth_date_text,
  death_date, death_date_text, is_deceased, notes, created_by, is_self_record
) on public.uravu_people to authenticated;
grant update (
  full_name, tamil_name, gender, birth_date, birth_date_text,
  death_date, death_date_text, is_deceased, notes
) on public.uravu_people to authenticated;
grant select, delete on public.uravu_relationships to authenticated;
grant select (tree_id,user_id,role,person_id,display_name,avatar_url,joined_at,updated_at)
  on public.uravu_tree_members to authenticated;
grant select (id,tree_id,user_id,request_type,requested_role,requested_person_id,message,status,display_name,avatar_url,reviewed_by,reviewed_at,created_at)
  on public.uravu_access_requests to authenticated;

revoke all on function public.uravu_create_tree(text,text,text) from public, anon, authenticated;
revoke all on function public.uravu_delete_tree(uuid) from public, anon, authenticated;
revoke all on function public.uravu_assign_member_person(uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.uravu_set_member_role(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.uravu_main_tree_id() from public, anon;
revoke all on function public.uravu_can_edit_person(uuid,uuid) from public, anon;
grant execute on function public.uravu_main_tree_id() to authenticated;
grant execute on function public.uravu_can_edit_person(uuid,uuid) to authenticated;

commit;
