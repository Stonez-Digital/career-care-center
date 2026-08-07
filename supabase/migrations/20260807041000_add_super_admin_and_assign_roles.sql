/* Add the protected super-admin role and assign the requested operational accounts. */

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'intern', 'mentor', 'volunteer')) NOT VALID;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_role_check;

-- Super admins inherit all existing admin RLS permissions.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (auth.users.raw_app_meta_data ->> 'role') IN ('admin', 'super_admin'),
    false
  )
  FROM auth.users
  WHERE auth.users.id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_privileged_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Trusted backend operations use the service-role JWT and are validated by
  -- their Edge Function before reaching this trigger.
  IF current_user IN ('postgres', 'supabase_admin') OR auth.role() = 'service_role' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  SELECT raw_app_meta_data ->> 'role' INTO caller_role
  FROM auth.users WHERE id = auth.uid();

  IF OLD.role = 'super_admin' AND caller_role <> 'super_admin' THEN
    RAISE EXCEPTION 'Only a super administrator can modify a super administrator';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role AND caller_role <> 'super_admin' THEN
    RAISE EXCEPTION 'Only a super administrator can change account roles';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS enforce_privileged_profile_changes_trigger ON public.profiles;
CREATE TRIGGER enforce_privileged_profile_changes_trigger
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_privileged_profile_changes();

-- Keep both the profile row and JWT authorization metadata in sync.
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE lower(email) = 'careercareplace@gmail.com'
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', '"admin"'::jsonb, true)
WHERE lower(email) = 'careercareplace@gmail.com';

INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE lower(email) = 'onojamondayojonugba@gmail.com'
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', '"super_admin"'::jsonb, true)
WHERE lower(email) = 'onojamondayojonugba@gmail.com';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = 'careercareplace@gmail.com') THEN
    RAISE WARNING 'Admin assignment skipped: careercareplace@gmail.com does not have an Auth account yet';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = 'onojamondayojonugba@gmail.com') THEN
    RAISE WARNING 'Super-admin assignment skipped: onojamondayojonugba@gmail.com does not have an Auth account yet';
  END IF;
END $$;
