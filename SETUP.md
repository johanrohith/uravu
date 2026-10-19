# Uravu setup

Uravu stores family trees, records, relationships and membership assignments in Supabase. Sign-in uses Google OAuth.

## 1. Database setup

For a **new Supabase project**, open the [Supabase SQL Editor](https://supabase.com/dashboard/project/rtecswdjrwgsiwaonekf/sql/new), open [supabase/schema.sql](./supabase/schema.sql), paste the entire file and run it.

For an **existing Uravu database**, apply any outstanding legacy migrations first, then run the [Single-tree and linking migration](./supabase/single-tree-linking-migration.sql). This designates the existing family tree as the one main tree, renames it to **Uravugal**, and updates the record-linking and edit permissions. The migration preserves existing people and relationships; it does not delete extra historical tree rows. Do not rerun the full schema on an existing database.

For a fresh database, run [supabase/schema.sql](./supabase/schema.sql) first, then run [supabase/single-tree-linking-migration.sql](./supabase/single-tree-linking-migration.sql). If needed, apply the partial-dates migration before using partial dates.

## 2. Google sign-in

In Supabase Authentication settings:
- Enable the Google provider and enter the OAuth Client ID and Client Secret from Google Cloud.
- Callback URL: `https://rtecswdjrwgsiwaonekf.supabase.co/auth/v1/callback`
- Site URL: `https://johanrohith.me/uravu/`
- Redirect URL allow list: `https://johanrohith.me/uravu/**`

Never commit the Google OAuth Client Secret or a Supabase service-role key. `supabase-config.js` should contain only the public/publishable Supabase key.

## 3. Membership and linking

- There is one private family tree for the entire app: **Uravugal** (shown as **உறவுகள்** when Tamil is selected).
- Signing in is required to view the tree. Accounts are linked to family records through a request and confirmation by a member who is already linked to a record.
- If no existing record represents the signed-in person, they can create one self-record and add connections. Until a link is confirmed, they can edit only that self-record.
- Linked members can edit unlinked records and relationships, but no member can edit another account-linked record.
- The Member list displays linked accounts and their corresponding people; Linking Requests contains only record-link requests. There are no tree-creation, tree-closing, or access-request flows.

## 4. Open the updated app

After GitHub Pages deploys the latest commit, visit `https://johanrohith.me/uravu/clear-cache.html` once to clear the old app cache. This preserves the Google sign-in session.

## Troubleshooting

If a current database rejects a linking action, check that the migrations above have been applied in order. If Google login reports an OAuth redirect error, confirm the callback URL and redirect allow list exactly.
