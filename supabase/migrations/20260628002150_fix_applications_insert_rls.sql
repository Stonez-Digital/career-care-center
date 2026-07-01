/*
# Fix applications INSERT policy for unauthenticated users

The form allows submissions from non-logged-in users (user_id = null).
The previous policy `WITH CHECK (auth.uid() = user_id OR is_admin())` fails when:
  - auth.uid() is null (anon user)
  - user_id is null
  - because NULL = NULL evaluates to NULL, not TRUE in SQL

Fix: Drop all existing INSERT policies and create a single permissive one
that handles both authenticated and anonymous applicants.
*/

-- Drop both conflicting INSERT policies
DROP POLICY IF EXISTS "applications_insert_own" ON applications;
DROP POLICY IF EXISTS "applications_insert_public" ON applications;

-- Single INSERT policy: authenticated users must match their own user_id,
-- unauthenticated users (anon) can insert with null user_id.
CREATE POLICY "applications_insert" ON applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Authenticated: user_id must match the logged-in user OR be null
    -- Anon: user_id must be null (they have no uid)
    user_id IS NULL
    OR user_id = auth.uid()
    OR public.is_admin()
  );
