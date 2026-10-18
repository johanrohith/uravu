# Uravu setup (clean database-backed version)

The application source now reads family trees from Supabase. It does not include or store demo family members in the app, browser cookies, or a tree cache.

## 1. Install the clean database schema

Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/rtecswdjrwgsiwaonekf/sql/new). Open [supabase/schema.sql](./supabase/schema.sql) from this repository, copy the whole file into a new SQL query, then click **Run**.

This migration creates the new uravu_* tables and their Row Level Security policies and server-side role-management functions. It does not drop or overwrite the older tables from the prototype. The app uses only the new tables.

## 2. Confirm Google sign-in settings

In Supabase Authentication settings:
- Google provider must be enabled and contain the OAuth Client ID and Client Secret from Google Cloud.
- The Supabase callback URL is https://rtecswdjrwgsiwaonekf.supabase.co/auth/v1/callback.
- The site URL should be https://johanrohith.me/uravu/.
- Add https://johanrohith.me/uravu/** to the redirect URL allow list.

Never put the Google OAuth Client Secret or a Supabase service-role key in this repository. supabase-config.js should contain only the public/publishable Supabase key.

## 3. Clear the old prototype cache once

After GitHub Pages has deployed the latest commit, open:

https://johanrohith.me/uravu/clear-cache.html

It clears Uravu's old Cache Storage and unregisters the old cache-first service worker, then redirects to the app. It intentionally preserves the Supabase Google-auth session. The new app loads versioned paths (app-v2.js, styles-v2.css) and never caches family-tree data in the browser.

## 4. Use the app

1. Sign in with Google.
2. Choose **Create a family tree** to create a tree and become its owner, or request access to a tree in **Find a family tree**.
3. A tree owner or admin reviews join requests and chooses the role to assign.
4. Owner/admin users can add family entries and their relationships, change eligible member roles, and directly assign or unlink a member's account from a family entry.
5. Only the owner can grant admin access. An admin cannot promote another admin or take ownership.

## What is persisted

Supabase is the source of truth for trees, people, relationships, roles, memberships and requests. The browser's Supabase client persists the sign-in session using its standard auth storage; the app does not write family data to cookies, local storage or Cache Storage.

## Troubleshooting

If the dashboard says the database schema is missing, step 1 has not completed successfully. Return to the SQL Editor, run the entire supabase/schema.sql, and refresh Uravu. If Google login returns an OAuth redirect error, compare the callback URL and redirect allow list in step 2 exactly.
