/*
  Assign the initial operational admin accounts after their Auth users exist.
  This migration is intentionally idempotent so profile and JWT roles remain
  synchronized if it is replayed in another environment.
*/

INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data ->> 'full_name', 'admin'
FROM auth.users
WHERE lower(email) = 'careercareplace@gmail.com'
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = EXCLUDED.role;

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb,
  true
)
WHERE lower(email) = 'careercareplace@gmail.com';

INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data ->> 'full_name', 'super_admin'
FROM auth.users
WHERE lower(email) = 'onojamondayojonugba@gmail.com'
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    role = EXCLUDED.role;

UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"super_admin"'::jsonb,
  true
)
WHERE lower(email) = 'onojamondayojonugba@gmail.com';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = 'careercareplace@gmail.com'
      AND raw_app_meta_data ->> 'role' = 'admin'
  ) THEN
    RAISE EXCEPTION 'Initial admin Auth account is missing or was not assigned';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = 'onojamondayojonugba@gmail.com'
      AND raw_app_meta_data ->> 'role' = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Initial super-admin Auth account is missing or was not assigned';
  END IF;
END
$$;
