-- Uravu: replace admin/viewer roles with Owner/Member and allow assigned members to edit.
-- Run once in Supabase Dashboard -> SQL Editor for an existing Uravu database.
-- Existing family records and relationship links are preserved.

begin;

-- Normalize old roles without changing which user owns a tree.
alter table public.uravu_tree_members
  alter column role set default 'member';
alter table public.uravu_tree_members
  drop constraint if exists uravu_tree_members_role_check;

update public.uravu_tree_members
set role = 'member'
where role <> 'owner';

alter table public.uravu_tree_members
  add constraint uravu_tree_members_role_check check (role in ('owner', 'member'));

-- There are no longer multiple requested roles: every approved account is a member.
alter table public.uravu_access_requests
  alter column requested_role set default 'member';
alter table public.uravu_access_requests
  drop constraint if exists uravu_access_requests_requested_role_check;

update public.uravu_access_requests set requested_role = 'member';

-- Pending role-only changes no longer apply. A pending request that names a record
-- becomes a record-link request; role-only requests are marked rejected.
update public.uravu_access_requests
set request_type = 'link', requested_role = 'member'
where status = 'pending'
  and request_type = 'role_change'
  and requested_person_id is not null;

update public.uravu_access_requests
set status = 'rejected',
    reviewed_at = now(),
    message = concat_ws(E'\n', nullif(message, ''), 'Automatically closed: Uravu now uses Owner and Member roles.')
where status = 'pending'
  and request_type = 'role_change'
  and requested_person_id is null;

alter table public.uravu_access_requests
  add constraint uravu_access_requests_requested_role_check check (requested_role = 'member');

-- Owners can always edit. A Member gets edit/review permission only after their
-- account has been linked to a family record by the owner.
create or replace function public.uravu_can_edit_tree(p_tree_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $function$
  select exists (
    select 1
    from public.uravu_tree_members m
    where m.tree_id = p_tree_id
      and m.user_id = auth.uid()
      and (
        m.role = 'owner'
        or (m.role = 'member' and m.person_id is not null)
      )
  );
$function$;

create or replace function public.uravu_request_tree_access(
  p_tree_id uuid,
  p_message text default '',
  p_requested_role text default 'member',
  p_requested_person_id uuid default null
)
returns uuid
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_user uuid := auth.uid();
  v_role text;
  v_type text;
  v_display_name text;
  v_avatar text;
  v_request_id uuid;
begin
  if v_user is null then raise exception 'Sign in before making a request.'; end if;
  if p_requested_role is distinct from 'member' then
    raise exception 'The only available membership role is member.';
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
  elsif v_role = 'owner' then
    raise exception 'The tree owner should use Manage members to link their own family entry.';
  elsif p_requested_person_id is not null then
    v_type := 'link';
  else
    raise exception 'Select a family record to request assignment.';
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
    set request_type=v_type, requested_role='member',
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
    p_tree_id,v_user,v_type,'member',p_requested_person_id,left(coalesce(p_message,''),1000),
    coalesce(v_display_name,'Family member'),v_avatar
  ) returning id into v_request_id;
  return v_request_id;
end;
$function$;

create or replace function public.uravu_review_tree_request(
  p_request_id uuid,
  p_decision text,
  p_role text default 'member'
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_user uuid := auth.uid();
  v_req public.uravu_access_requests%rowtype;
  v_reviewer_role text;
  v_current_role text;
begin
  if v_user is null then raise exception 'Sign in before reviewing requests.'; end if;
  if p_decision is null or p_decision not in ('approve','reject') then
    raise exception 'Decision must be approve or reject.';
  end if;
  if p_role is distinct from 'member' then
    raise exception 'The only available membership role is member.';
  end if;

  select * into v_req from public.uravu_access_requests r where r.id=p_request_id for update;
  if not found then raise exception 'Request not found.'; end if;
  if v_req.status <> 'pending' then raise exception 'This request has already been reviewed.'; end if;
  if v_req.user_id = v_user then raise exception 'You cannot review your own request.'; end if;
  select m.role into v_reviewer_role from public.uravu_tree_members m
  where m.tree_id=v_req.tree_id and m.user_id=v_user;
  if not public.uravu_can_edit_tree(v_req.tree_id) then
    raise exception 'Only the tree owner or a member linked to a family record can review requests.';
  end if;
  if v_reviewer_role <> 'owner'
     and (v_req.request_type <> 'join' or v_req.requested_person_id is not null) then
    raise exception 'Only the tree owner can review family-record assignment requests.';
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
      v_req.tree_id,v_req.user_id,'member',v_req.requested_person_id,
      v_req.display_name,v_req.avatar_url
    );
  else
    if v_current_role='owner' then
      raise exception 'The tree owner role cannot be changed here.';
    end if;
    update public.uravu_tree_members
    set role='member',
        person_id=coalesce(v_req.requested_person_id, person_id),
        display_name=v_req.display_name,
        avatar_url=v_req.avatar_url
    where tree_id=v_req.tree_id and user_id=v_req.user_id;
  end if;

  update public.uravu_access_requests set status='approved', reviewed_by=v_user, reviewed_at=now()
  where id=p_request_id;
end;
$function$;

create or replace function public.uravu_assign_member_person(
  p_tree_id uuid,
  p_user_id uuid,
  p_person_id uuid
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $function$
begin
  if auth.uid() is null then raise exception 'Sign in before managing members.'; end if;
  if not public.uravu_has_tree_role(p_tree_id, array['owner']) then
    raise exception 'Only the tree owner can assign family entries.';
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
$function$;

create or replace function public.uravu_set_member_role(
  p_tree_id uuid,
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_actor_role text;
  v_target_role text;
begin
  if auth.uid() is null then raise exception 'Sign in before managing roles.'; end if;
  if p_role is distinct from 'member' then
    raise exception 'The only available member role is member.';
  end if;

  select m.role into v_actor_role from public.uravu_tree_members m
  where m.tree_id=p_tree_id and m.user_id=auth.uid();
  if coalesce(v_actor_role,'') <> 'owner' then
    raise exception 'Only the tree owner can manage member accounts.';
  end if;
  select m.role into v_target_role from public.uravu_tree_members m
  where m.tree_id=p_tree_id and m.user_id=p_user_id;
  if v_target_role is null then raise exception 'Member not found.'; end if;
  if v_target_role='owner' then raise exception 'The tree owner role cannot be changed here.'; end if;
  update public.uravu_tree_members set role='member'
  where tree_id=p_tree_id and user_id=p_user_id;
end;
$function$;

create or replace function public.uravu_link_people(
  p_tree_id uuid,
  p_person_id uuid,
  p_related_person_id uuid,
  p_relationship_type text
)
returns uuid
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $function$
declare
  v_a uuid := p_person_id;
  v_b uuid := p_related_person_id;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Sign in before editing a family tree.'; end if;
  if not public.uravu_can_edit_tree(p_tree_id) then
    raise exception 'Only the owner or a member linked to a family record can edit family connections.';
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
$function$;

-- Apply edit permissions at the table level as well as inside RPCs.
drop policy if exists uravu_trees_update_admin on public.uravu_family_trees;
drop policy if exists uravu_trees_update_owner on public.uravu_family_trees;
create policy uravu_trees_update_owner on public.uravu_family_trees
for update to authenticated using (public.uravu_has_tree_role(id,array['owner']))
with check (public.uravu_has_tree_role(id,array['owner']));

drop policy if exists uravu_people_insert_admin on public.uravu_people;
drop policy if exists uravu_people_insert_editor on public.uravu_people;
create policy uravu_people_insert_editor on public.uravu_people
for insert to authenticated with check (
  created_by=auth.uid() and public.uravu_can_edit_tree(tree_id)
);

drop policy if exists uravu_people_update_admin on public.uravu_people;
drop policy if exists uravu_people_update_editor on public.uravu_people;
create policy uravu_people_update_editor on public.uravu_people
for update to authenticated using (public.uravu_can_edit_tree(tree_id))
with check (public.uravu_can_edit_tree(tree_id));

drop policy if exists uravu_people_delete_admin on public.uravu_people;
drop policy if exists uravu_people_delete_editor on public.uravu_people;
create policy uravu_people_delete_editor on public.uravu_people
for delete to authenticated using (public.uravu_can_edit_tree(tree_id));

drop policy if exists uravu_relationships_delete_admin on public.uravu_relationships;
drop policy if exists uravu_relationships_delete_editor on public.uravu_relationships;
create policy uravu_relationships_delete_editor on public.uravu_relationships
for delete to authenticated using (public.uravu_can_edit_tree(tree_id));

drop policy if exists uravu_requests_select_self_or_admin on public.uravu_access_requests;
drop policy if exists uravu_requests_select_self_or_editor on public.uravu_access_requests;
create policy uravu_requests_select_self_or_editor on public.uravu_access_requests
for select to authenticated using (
  user_id=auth.uid() or public.uravu_can_edit_tree(tree_id)
);

revoke all on function public.uravu_can_edit_tree(uuid) from public, anon, authenticated;
grant execute on function public.uravu_can_edit_tree(uuid) to authenticated;

revoke all on function public.uravu_request_tree_access(uuid,text,text,uuid) from public, anon, authenticated;
revoke all on function public.uravu_review_tree_request(uuid,text,text) from public, anon, authenticated;
revoke all on function public.uravu_assign_member_person(uuid,uuid,uuid) from public, anon, authenticated;
revoke all on function public.uravu_set_member_role(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.uravu_link_people(uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.uravu_request_tree_access(uuid,text,text,uuid) to authenticated;
grant execute on function public.uravu_review_tree_request(uuid,text,text) to authenticated;
grant execute on function public.uravu_assign_member_person(uuid,uuid,uuid) to authenticated;
grant execute on function public.uravu_set_member_role(uuid,uuid,text) to authenticated;
grant execute on function public.uravu_link_people(uuid,uuid,uuid,text) to authenticated;

commit;
