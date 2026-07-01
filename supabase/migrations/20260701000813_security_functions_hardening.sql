/*
# Security Hardening Part 1: Database Functions

## Summary
- Recreate all SECURITY DEFINER functions with empty search_path to prevent
  search_path injection (Supabase Security Advisor requirement).
- Revoke EXECUTE from PUBLIC and anon on all three functions.
- Update handle_new_user default role from 'student' to 'intern'.
- Fix handle_new_user to upsert (update on conflict) so re-registration works.
- Update profiles role column default to 'intern'.
*/

-- ============================================================
-- 1. handle_new_user: fix search_path, role default, upsert
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'intern')
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email     = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      role      = COALESCE(EXCLUDED.role, public.profiles.role);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ============================================================
-- 2. is_admin: fix search_path, restrict access
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (auth.users.raw_app_meta_data ->> 'role') = 'admin',
    false
  )
  FROM auth.users
  WHERE auth.users.id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- ============================================================
-- 3. get_user_role: fix search_path, restrict access, fix default role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    auth.users.raw_app_meta_data ->> 'role',
    'intern'
  )
  FROM auth.users
  WHERE auth.users.id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_role() TO service_role;

-- ============================================================
-- 4. Fix profiles table role default
-- ============================================================
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'intern';
