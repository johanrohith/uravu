-- Uravu: partial birth/death dates and deceased-with-unknown-date support.
-- Run this once in Supabase Dashboard -> SQL Editor for an existing Uravu database.
-- Safe to run more than once.

begin;

alter table public.uravu_people
  add column if not exists birth_date_text text;

alter table public.uravu_people
  add column if not exists death_date_text text;

alter table public.uravu_people
  add column if not exists is_deceased boolean not null default false;

update public.uravu_people
set birth_date_text = coalesce(birth_date_text, to_char(birth_date, 'YYYY-MM-DD'))
where birth_date is not null and birth_date_text is null;

update public.uravu_people
set death_date_text = coalesce(death_date_text, to_char(death_date, 'YYYY-MM-DD')),
    is_deceased = true
where death_date is not null;

commit;
