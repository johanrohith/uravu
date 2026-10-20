alter table public.uravu_people
  add column if not exists birth_order integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'uravu_people_birth_order_check'
      and conrelid = 'public.uravu_people'::regclass
  ) then
    alter table public.uravu_people
      add constraint uravu_people_birth_order_check
      check (birth_order is null or birth_order between 1 and 999);
  end if;
end;
$$;
