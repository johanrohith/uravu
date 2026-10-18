# Uravu setup

Uravu stores family trees, records, relationships and membership assignments in Supabase. Sign-in uses Google OAuth.

## 1. Database setup

For a **new Supabase project**, open the [Supabase SQL Editor](https://supabase.com/dashboard/project/rtecswdjrwgsiwaonekf/sql/new), open [supabase/schema.sql](./supabase/schema.sql), paste the entire file and run it.

For an **existing Uravu database**, run the migrations in this order if they have not already been applied:

1. [Partial dates migration](./supabase/partial-dates-migration.sql) — enables partial birthdays, partial death dates and a deceased status when the date is unknown.
2. [Owner and Member permissions migration](./supabase/member-permissions-migration.sql) — replaces the earlier roles with Owner and Member and enables editing for Members whose accounts are linked to family records.
3. [Linking requests migration](./supabase/linking-requests-migration.sql) — use this if the Owner and Member migration was already applied before this linking update. It lets assigned Members link **unlinked** accounts to available records and review linking requests. Only the Owner can change or remove an existing account assignment.

These migrations preserve existing people and family relationships. Do not rerun the full schema on an existing database.

## 2. Google sign-in

In Supabase Authentication settings:
- Enable the Google provider and enter the OAuth Client ID and Client Secret from Google Cloud.
- Callback URL: `https://rtecswdjrwgsiwaonekf.supabase.co/auth/v1/callback`
- Site URL: `https://johanrohith.me/uravu/`
- Redirect URL allow list: `https://johanrohith.me/uravu/**`

Never commit the Google OAuth Client Secret or a Supabase service-role key. `supabase-config.js` should contain only the public/publishable Supabase key.

## 3. Membership and linking

- The person who creates the tree is its **Owner**.
- Other people request access. The Owner or a Member linked to a family record can review requests to join.
- An unlinked Member can request to connect their account to an existing, unassigned family record.
- The Owner or a linked Member can link an unlinked account to an available record from **Member accounts**. If the person does not yet have a record, create it in the family editor first, then link the account.
- The Owner alone can reassign or unlink an already-linked account and delete the tree.
- There are no Admin or Viewer roles. Unlinked Members can view records and request a link; linked Members can maintain the family tree.

## 4. Open the updated app

After GitHub Pages deploys the latest commit, visit `https://johanrohith.me/uravu/clear-cache.html` once to clear the old app cache. This preserves the Google sign-in session.

## Troubleshooting

If a current database rejects a linking action, check that the migrations above have been applied in order. If Google login reports an OAuth redirect error, confirm the callback URL and redirect allow list exactly.
