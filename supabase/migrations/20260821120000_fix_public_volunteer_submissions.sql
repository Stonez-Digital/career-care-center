/*
 * Volunteer applications are public. Keep the anonymous insert path free of
 * privileged helper functions: PostgreSQL does not guarantee OR short-circuit
 * evaluation, so referencing is_admin() can fail before a valid public insert.
 */

DROP POLICY IF EXISTS "volunteers_insert" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_insert_own" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_insert_public" ON public.volunteers;

CREATE POLICY "volunteers_insert_public"
ON public.volunteers FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

CREATE POLICY "volunteers_insert_authenticated"
ON public.volunteers FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

