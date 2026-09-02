/* Super-admin-only login activity with a 90-day retention window. */

CREATE OR REPLACE FUNCTION public.is_super_admin()
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
      AND p.role = 'super_admin'
      AND (u.raw_app_meta_data ->> 'role') = 'super_admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.login_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text,
  portal text NOT NULL CHECK (portal IN ('user', 'admin')),
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.login_activity FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.login_activity TO authenticated;
GRANT ALL ON TABLE public.login_activity TO service_role;

DROP POLICY IF EXISTS "login_activity_super_admin_read" ON public.login_activity;
CREATE POLICY "login_activity_super_admin_read"
ON public.login_activity FOR SELECT TO authenticated
USING (public.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_login_activity_created_at
  ON public.login_activity (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_activity_user_id_created_at
  ON public.login_activity (user_id, created_at DESC);

-- Bound sensitive network/device history even if application cleanup is delayed.
DELETE FROM public.login_activity WHERE created_at < now() - interval '90 days';

NOTIFY pgrst, 'reload schema';
