-- Uravu: restrict deleting family-member records to the tree owner.
-- Run in Supabase Dashboard -> SQL Editor for an existing Uravu database.
-- Members can still add records and update existing records; this does not change saved data.

begin;

drop policy if exists uravu_people_delete_admin on public.uravu_people;
drop policy if exists uravu_people_delete_editor on public.uravu_people;
drop policy if exists uravu_people_delete_owner on public.uravu_people;

create policy uravu_people_delete_owner on public.uravu_people
for delete to authenticated
using (public.uravu_has_tree_role(tree_id, array['owner']));

commit;
