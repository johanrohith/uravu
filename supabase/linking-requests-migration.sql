-- Uravu: allow an assigned Member to link an unlinked account and review link requests.
-- Run this once in Supabase SQL Editor after member-permissions-migration.sql.
-- The Owner retains sole authority to reassign or unlink an already-linked account.

begin;

create or replace function public.uravu_review_tree_request(
  p_request_id uuid,
  p_decision text,
  p_role text default 'member'
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
  if p_role is distinct from 'member' then raise exception 'The only available membership role is member.'; end if;

  select * into v_req from public.uravu_access_requests r where r.id=p_request_id for update;
  if not found then raise exception 'Request not found.'; end if;
  if v_req.status <> 'pending' then raise exception 'This request has already been reviewed.'; end if;
  if v_req.user_id = v_user then raise exception 'You cannot review your own request.'; end if;

  select m.role into v_reviewer_role from public.uravu_tree_members m
  where m.tree_id=v_req.tree_id and m.user_id=v_user;
  if not public.uravu_can_edit_tree(v_req.tree_id) then
    raise exception 'Only the tree owner or a member linked to a family record can review requests.';
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
declare
  v_actor_role text;
  v_target_role text;
  v_target_person uuid;
begin
  if auth.uid() is null then raise exception 'Sign in before managing member links.'; end if;
  select m.role into v_actor_role from public.uravu_tree_members m
  where m.tree_id=p_tree_id and m.user_id=auth.uid();

  if not public.uravu_can_edit_tree(p_tree_id) then
    raise exception 'Only the owner or a member linked to a family record can link accounts.';
  end if;

  select m.role, m.person_id into v_target_role, v_target_person
  from public.uravu_tree_members m
  where m.tree_id=p_tree_id and m.user_id=p_user_id;
  if v_target_role is null then raise exception 'That account is not a member of this tree.'; end if;
  if v_target_role='owner' and v_actor_role <> 'owner' then
    raise exception 'Only the tree owner can change the owner account link.';
  end if;
  if v_actor_role <> 'owner' and v_target_person is not null
     and v_target_person is distinct from p_person_id then
    raise exception 'Only the tree owner can change or remove an existing account link.';
  end if;
  if v_actor_role <> 'owner' and p_person_id is null and v_target_person is not null then
    raise exception 'Only the tree owner can unlink an account.';
  end if;
  if p_person_id is not null and not exists(
    select 1 from public.uravu_people p where p.id=p_person_id and p.tree_id=p_tree_id
  ) then raise exception 'The selected family entry is not in this tree.'; end if;
  if p_person_id is not null and exists(
    select 1 from public.uravu_tree_members m
    where m.tree_id=p_tree_id and m.person_id=p_person_id and m.user_id<>p_user_id
  ) then raise exception 'That family entry is already linked to another account.'; end if;

  update public.uravu_tree_members set person_id=p_person_id
  where tree_id=p_tree_id and user_id=p_user_id;
end;
$$;

revoke all on function public.uravu_review_tree_request(uuid,text,text) from public, anon, authenticated;
revoke all on function public.uravu_assign_member_person(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.uravu_review_tree_request(uuid,text,text) to authenticated;
grant execute on function public.uravu_assign_member_person(uuid,uuid,uuid) to authenticated;

commit;
