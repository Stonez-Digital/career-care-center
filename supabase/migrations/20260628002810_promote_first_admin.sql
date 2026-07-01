/*
# Promote first user to admin role

This promotes an existing user to the 'admin' role so they can access
the Admin Portal at /admin. This is the secure way to create the first
admin — no public admin registration is exposed.

To promote additional admins, run:
  UPDATE profiles SET role = 'admin' WHERE email = 'target@example.com';
  Then update the JWT metadata:
  UPDATE auth.users SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}', '"admin"'
  ) WHERE email = 'target@example.com';
*/

-- Promote the first registered user to admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'onojamondayojonugba@gmail.com';

-- Update JWT metadata so is_admin() function returns true
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'onojamondayojonugba@gmail.com';
