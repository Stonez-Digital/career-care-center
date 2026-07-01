/*
# Fix volunteers INSERT policy for unauthenticated users

Same issue as applications: two conflicting INSERT policies.
The volunteer form allows unauthenticated submissions (no user_id sent).
Drop both and create a single permissive INSERT policy.
*/

DROP POLICY IF EXISTS "volunteers_insert_own" ON volunteers;
DROP POLICY IF EXISTS "volunteers_insert_public" ON volunteers;

CREATE POLICY "volunteers_insert" ON volunteers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NULL
    OR user_id = auth.uid()
    OR public.is_admin()
  );
