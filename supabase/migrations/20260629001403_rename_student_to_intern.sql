/*
# Rename 'student' role to 'intern' across the database

Updates all profiles with role='student' to role='intern'
and updates JWT metadata accordingly.
*/

-- Replace the legacy CHECK constraint before writing the new role value.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'intern', 'mentor', 'volunteer')) NOT VALID;

-- Update profiles table
UPDATE profiles SET role = 'intern' WHERE role = 'student';

ALTER TABLE profiles VALIDATE CONSTRAINT profiles_role_check;

-- Update JWT metadata in auth.users
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"intern"'
)
WHERE raw_app_meta_data->>'role' = 'student';
