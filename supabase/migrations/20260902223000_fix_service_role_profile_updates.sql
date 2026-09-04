/* Allow validated service-role functions to update protected profile fields. */

CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Edge Functions authenticate and authorize callers before using the
  -- service role. Database migrations run as a trusted database owner.
  IF current_user IN ('postgres', 'supabase_admin') OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NOT public.is_admin() THEN
    NEW.id := OLD.id;
    NEW.email := OLD.email;
    NEW.role := OLD.role;
    NEW.is_suspended := OLD.is_suspended;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_profile_fields() FROM PUBLIC, anon, authenticated;

-- Auth app metadata is the trusted role source. Repair any split state caused
-- by the previous trigger behavior, including the account reported here.
UPDATE public.profiles AS profile
SET role = auth_user.raw_app_meta_data ->> 'role'
FROM auth.users AS auth_user
WHERE auth_user.id = profile.id
  AND (auth_user.raw_app_meta_data ->> 'role') IN ('super_admin', 'admin', 'intern', 'mentor', 'volunteer')
  AND profile.role IS DISTINCT FROM (auth_user.raw_app_meta_data ->> 'role');

NOTIFY pgrst, 'reload schema';
