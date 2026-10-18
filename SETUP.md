# Uravu setup

Uravu stores family trees, records, connections and membership assignments in Supabase. Google sign-in is used for accounts; family data is not stored in browser cache.

## 1. Database

For a **new Supabase project**, open the [Supabase SQL Editor](https://supabase.com/dashboard/project/rtecswdjrwgsiwaonekf/sql/new), open [supabase/schema.sql](./supabase/schema.sql), paste the whole file and run it.

For an **existing Uravu database**, run these additive migrations in the SQL Editor:

1. [Partial dates migration](./supabase/partial-dates-migration.sql) — if you have not already run it. It enables year-only/month-only birth dates and a deceased status even when the death date is unknown.
2. [Owner and Member permissions migration](./supabase/member-permissions-migration.sql) — run once to replace the previous role model with **Owner** and **Member**, convert existing memberships, and install the updated server-side permissions.

Do not rerun the entire schema merely to change roles; use the migration above for an existing database. These migrations preserve existing people and relationship links.

## 2. Google sign-in

In Supabase Authentication settings:
- Enable the Google provider and enter the OAuth Client ID and Client Secret from Google Cloud.
- Supabase callback URL: `https://rtecswdjrwgsiwaonekf.supabase.co/auth/v1/callback`
- Site URL: `https://johanrohith.me/uravu/`
- Redirect URL allow list: `https://johanrohith.me/uravu/**`

Never put the Google OAuth Client Secret or a Supabase service-role key in this repository. `supabase-config.js` must contain only the public/publishable Supabase key.

## 3. Membership and permissions

- The tree creator is the **Owner**.
- Other accounts request access. The owner can approve the request and assign a family record, or approve access first and assign a record later.
- A **Member with no assigned family record is view-only** and can request a record assignment.
- Once the owner links a Member's account to a family record, that Member can add/edit/delete family records, update connections, and approve or reject new membership (join) requests.
- Only the Owner can assign or unlink member accounts, approve family-record assignment/link requests, and delete the tree.
- There is no Admin or Viewer role.

These permissions are enforced by Supabase Row Level Security and server-side functions, not just by hiding buttons.

## 4. Clear the old app cache

After GitHub Pages deploys the latest version, open:

`https://johanrohith.me/uravu/clear-cache.html`

It clears Uravu's old Cache Storage and unregisters the old cache-first service worker, while preserving the Google-auth session.

## Troubleshooting

If the app reports a database permission error after a code update, check that the existing-database migrations above have been run successfully. If Google login reports an OAuth redirect error, check the callback URL and redirect allow list exactly.
