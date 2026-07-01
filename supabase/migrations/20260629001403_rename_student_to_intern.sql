/*
# Rename 'student' role to 'intern' across the database

Updates all profiles with role='student' to role='intern'
and updates JWT metadata accordingly.
*/

-- Update profiles table
UPDATE profiles SET role = 'intern' WHERE role = 'student';

-- Update JWT metadata in auth.users
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"intern"'
)
WHERE raw_app_meta_data->>'role' = 'student';
