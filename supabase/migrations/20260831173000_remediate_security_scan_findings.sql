/* Close validated authorization, public-insert, abuse-control, and storage gaps. */

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.id = auth.uid()
      AND p.is_suspended = false
      AND p.role IN ('admin', 'super_admin')
      AND (u.raw_app_meta_data ->> 'role') = p.role
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Public intake may create a row, but may never choose staff-owned state.
DROP POLICY IF EXISTS "applications_insert" ON public.applications;
-- The supported application path is submit-application, which constructs the
-- row with service-role authority after validating and pinning its state.

DROP POLICY IF EXISTS "volunteers_insert_public" ON public.volunteers;
DROP POLICY IF EXISTS "volunteers_insert_authenticated" ON public.volunteers;
CREATE POLICY "volunteers_insert_public"
ON public.volunteers FOR INSERT TO anon
WITH CHECK (user_id IS NULL AND status = 'pending');
CREATE POLICY "volunteers_insert_authenticated"
ON public.volunteers FOR INSERT TO authenticated
WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND status = 'pending');

DROP POLICY IF EXISTS "contact_messages_insert_public" ON public.contact_messages;
-- The supported contact path is contact-form. Removing direct public INSERT
-- prevents bypassing its validation, body bound, rate limit, and notification
-- behavior.

DROP POLICY IF EXISTS "donations_insert_public" ON public.donations;
-- Donations are recorded only by the service-role process-donation function;
-- the live direct-transfer form does not write this table.

DROP POLICY IF EXISTS "testimonials_insert_public" ON public.testimonials;
CREATE POLICY "testimonials_insert_public"
ON public.testimonials FOR INSERT TO anon, authenticated
WITH CHECK (
  length(trim(quote)) > 0
  AND length(trim(name)) > 0
  AND approved = false
  AND is_featured = false
);

DROP POLICY IF EXISTS "partners_insert_public" ON public.partners;
CREATE POLICY "partners_insert_public"
ON public.partners FOR INSERT TO anon, authenticated
WITH CHECK (
  length(trim(name)) > 0
  AND length(trim(email)) > 0
  AND email LIKE '%@%'
  AND is_featured = false
  AND logo_url IS NULL
  AND website IS NULL
  AND category IS NULL
);

-- Partnership requests contain submitter PII and are an admin-only queue.
DROP POLICY IF EXISTS "partners_select_public" ON public.partners;
DROP POLICY IF EXISTS "partners_admin_read" ON public.partners;
CREATE POLICY "partners_admin_read"
ON public.partners FOR SELECT TO authenticated
USING (public.is_admin());

-- Atomic, fixed-window limiter used only by service-role Edge Functions.
CREATE TABLE IF NOT EXISTS public.edge_request_limits (
  scope text NOT NULL,
  client_key text NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count > 0),
  PRIMARY KEY (scope, client_key)
);
ALTER TABLE public.edge_request_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.edge_request_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.edge_request_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_edge_request_limit(
  requested_scope text,
  requested_client_key text,
  requested_limit integer,
  requested_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_count integer;
BEGIN
  IF auth.role() <> 'service_role'
     OR requested_scope !~ '^[a-z0-9_-]{1,64}$'
     OR requested_client_key !~ '^[a-f0-9]{64}$'
     OR requested_limit < 1 OR requested_limit > 1000
     OR requested_window_seconds < 1 OR requested_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate-limit request';
  END IF;

  INSERT INTO public.edge_request_limits AS limits
    (scope, client_key, window_started_at, request_count)
  VALUES (requested_scope, requested_client_key, now(), 1)
  ON CONFLICT (scope, client_key) DO UPDATE SET
    window_started_at = CASE
      WHEN limits.window_started_at <= now() - make_interval(secs => requested_window_seconds)
      THEN now() ELSE limits.window_started_at END,
    request_count = CASE
      WHEN limits.window_started_at <= now() - make_interval(secs => requested_window_seconds)
      THEN 1 ELSE limits.request_count + 1 END
  RETURNING request_count INTO current_count;

  RETURN current_count <= requested_limit;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consume_edge_request_limit(text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_edge_request_limit(text, text, integer, integer)
  TO service_role;

-- One overwriteable avatar per user prevents unbounded object accumulation.
DROP POLICY IF EXISTS "profile_media_insert_own" ON storage.objects;
CREATE POLICY "profile_media_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND name = auth.uid()::text || '/avatar'
);

-- Storage upsert checks SELECT as well as INSERT/UPDATE. Keep that visibility
-- limited to the caller's single canonical avatar (and active admins).
DROP POLICY IF EXISTS "profile_media_select_own_or_admin" ON storage.objects;
CREATE POLICY "profile_media_select_own_or_admin"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'profile-images'
  AND (
    name = auth.uid()::text || '/avatar'
    OR public.is_admin()
  )
);

DROP POLICY IF EXISTS "profile_media_update_own_or_admin" ON storage.objects;
CREATE POLICY "profile_media_update_own_or_admin"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-images'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
)
WITH CHECK (
  bucket_id = 'profile-images'
  AND (
    name = auth.uid()::text || '/avatar'
    OR public.is_admin()
  )
);

DELETE FROM public.edge_request_limits
WHERE window_started_at < now() - interval '1 day';

NOTIFY pgrst, 'reload schema';
