/*
# Fix infinite recursion in RLS policies

## Root cause
Policies on `profiles` (and 17 other tables) use:
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
This queries `profiles` while evaluating a `profiles` RLS policy → infinite recursion.

## Fix
1. Create a SECURITY DEFINER function `is_admin()` that reads the user's role
   from `auth.users.raw_app_meta_data` (JWT claims) instead of the `profiles` table.
   SECURITY DEFINER runs with the function owner's privileges, bypassing RLS,
   so it does NOT trigger recursion.
2. Drop ALL existing policies on every table that references `profiles`.
3. Recreate safe policies using `is_admin()` instead of `EXISTS (SELECT ... FROM profiles ...)`.
*/

-- ============================================================================
-- 1. CREATE SECURITY DEFINER HELPER FUNCTIONS
-- ============================================================================

-- is_admin(): returns true if the current user has the 'admin' role
-- Uses auth.users.raw_app_meta_data (JWT claims) instead of profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (auth.users.raw_app_meta_data ->> 'role') = 'admin',
    false
  )
  FROM auth.users
  WHERE auth.users.id = auth.uid();
$$;

-- get_user_role(): returns the current user's role from JWT claims
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    auth.users.raw_app_meta_data ->> 'role',
    'student'
  )
  FROM auth.users
  WHERE auth.users.id = auth.uid();
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- ============================================================================
-- 2. PROFILES TABLE — Drop and recreate all policies
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Users can read their own profile; admins can read all
CREATE POLICY "profiles_select_own_or_admin" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR public.is_admin());

-- Users can insert their own profile (on signup)
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Users can update their own profile; admins can update all
CREATE POLICY "profiles_update_own_or_admin" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Admins can delete profiles
CREATE POLICY "profiles_admin_delete" ON profiles FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- 3. APPLICATIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "applications_select_own_or_admin" ON applications;
DROP POLICY IF EXISTS "applications_admin_update" ON applications;
DROP POLICY IF EXISTS "applications_admin_delete" ON applications;
DROP POLICY IF EXISTS "applications_insert_own" ON applications;

CREATE POLICY "applications_select_own_or_admin" ON applications FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "applications_insert_own" ON applications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "applications_admin_update" ON applications FOR UPDATE
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "applications_admin_delete" ON applications FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- 4. APPLICATION_STATUS_LOGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "logs_select_own_or_admin" ON application_status_logs;
DROP POLICY IF EXISTS "logs_admin_insert" ON application_status_logs;

CREATE POLICY "logs_select_own_or_admin" ON application_status_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM applications a WHERE a.id = application_status_logs.application_id AND a.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "logs_admin_insert" ON application_status_logs FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- ============================================================================
-- 5. ADMIN_NOTES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "admin_notes_read" ON admin_notes;
DROP POLICY IF EXISTS "admin_notes_insert" ON admin_notes;
DROP POLICY IF EXISTS "admin_notes_delete" ON admin_notes;

CREATE POLICY "admin_notes_read" ON admin_notes FOR SELECT
  TO authenticated USING (public.is_admin());

CREATE POLICY "admin_notes_insert" ON admin_notes FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "admin_notes_delete" ON admin_notes FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- 6. VOLUNTEERS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "volunteers_select_own_or_admin" ON volunteers;
DROP POLICY IF EXISTS "volunteers_admin_update" ON volunteers;
DROP POLICY IF EXISTS "volunteers_admin_delete" ON volunteers;
DROP POLICY IF EXISTS "volunteers_insert_own" ON volunteers;

CREATE POLICY "volunteers_select_own_or_admin" ON volunteers FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "volunteers_insert_own" ON volunteers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "volunteers_admin_update" ON volunteers FOR UPDATE
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "volunteers_admin_delete" ON volunteers FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- 7. EVENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "events_select_public" ON events;
DROP POLICY IF EXISTS "events_admin_write" ON events;

CREATE POLICY "events_select_public" ON events FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "events_admin_write" ON events FOR ALL
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 8. EVENT_REGISTRATIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "registrations_select_own_or_admin" ON event_registrations;
DROP POLICY IF EXISTS "registrations_insert_own" ON event_registrations;
DROP POLICY IF EXISTS "registrations_admin_update" ON event_registrations;
DROP POLICY IF EXISTS "registrations_admin_delete" ON event_registrations;

CREATE POLICY "registrations_select_own_or_admin" ON event_registrations FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "registrations_insert_own" ON event_registrations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "registrations_admin_update" ON event_registrations FOR UPDATE
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "registrations_admin_delete" ON event_registrations FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- 9. BLOG_POSTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "blog_select_published_or_admin" ON blog_posts;
DROP POLICY IF EXISTS "blog_admin_write" ON blog_posts;

CREATE POLICY "blog_select_published_or_admin" ON blog_posts FOR SELECT
  TO anon, authenticated USING (published = true OR public.is_admin());

CREATE POLICY "blog_admin_write" ON blog_posts FOR ALL
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 10. TESTIMONIALS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "testimonials_select_approved_or_admin" ON testimonials;
DROP POLICY IF EXISTS "testimonials_admin_update" ON testimonials;
DROP POLICY IF EXISTS "testimonials_admin_delete" ON testimonials;
DROP POLICY IF EXISTS "testimonials_insert_public" ON testimonials;

CREATE POLICY "testimonials_select_approved_or_admin" ON testimonials FOR SELECT
  TO anon, authenticated USING (approved = true OR public.is_admin());

CREATE POLICY "testimonials_insert_public" ON testimonials FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "testimonials_admin_update" ON testimonials FOR UPDATE
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "testimonials_admin_delete" ON testimonials FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- 11. RESOURCES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "resources_select_public" ON resources;
DROP POLICY IF EXISTS "resources_admin_write" ON resources;

CREATE POLICY "resources_select_public" ON resources FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "resources_admin_write" ON resources FOR ALL
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 12. NOTIFICATIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_admin_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;

CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 13. DONATIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "donations_select_public" ON donations;
DROP POLICY IF EXISTS "donations_insert_public" ON donations;
DROP POLICY IF EXISTS "donations_admin_read" ON donations;
DROP POLICY IF EXISTS "donations_admin_update" ON donations;

CREATE POLICY "donations_select_public" ON donations FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "donations_insert_public" ON donations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "donations_admin_read" ON donations FOR SELECT
  TO authenticated USING (public.is_admin());

CREATE POLICY "donations_admin_update" ON donations FOR UPDATE
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 14. PARTNERS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "partners_select_public" ON partners;
DROP POLICY IF EXISTS "partners_admin_write" ON partners;
DROP POLICY IF EXISTS "partners_admin_read" ON partners;
DROP POLICY IF EXISTS "partners_admin_delete" ON partners;
DROP POLICY IF EXISTS "partners_insert_public" ON partners;

CREATE POLICY "partners_select_public" ON partners FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "partners_insert_public" ON partners FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "partners_admin_write" ON partners FOR ALL
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 15. PROGRAMS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "programs_select_public" ON programs;
DROP POLICY IF EXISTS "programs_admin_write" ON programs;

CREATE POLICY "programs_select_public" ON programs FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "programs_admin_write" ON programs FOR ALL
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 16. CONTACT_MESSAGES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "contact_messages_insert_public" ON contact_messages;
DROP POLICY IF EXISTS "contact_messages_admin_read" ON contact_messages;
DROP POLICY IF EXISTS "contact_messages_admin_update" ON contact_messages;
DROP POLICY IF EXISTS "contact_messages_admin_delete" ON contact_messages;

CREATE POLICY "contact_messages_insert_public" ON contact_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "contact_messages_admin_read" ON contact_messages FOR SELECT
  TO authenticated USING (public.is_admin());

CREATE POLICY "contact_messages_admin_update" ON contact_messages FOR UPDATE
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "contact_messages_admin_delete" ON contact_messages FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- 17. SITE_SETTINGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "site_settings_select_public" ON site_settings;
DROP POLICY IF EXISTS "site_settings_admin_write" ON site_settings;

CREATE POLICY "site_settings_select_public" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "site_settings_admin_write" ON site_settings FOR ALL
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 18. AUDIT_LOGS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "audit_logs_admin_read" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_insert" ON audit_logs;

CREATE POLICY "audit_logs_admin_read" ON audit_logs FOR SELECT
  TO authenticated USING (public.is_admin());

CREATE POLICY "audit_logs_admin_insert" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- ============================================================================
-- 19. NEWSLETTER_SUBSCRIBERS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "newsletter_insert_public" ON newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_admin_read" ON newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_admin_update" ON newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_admin_delete" ON newsletter_subscribers;

CREATE POLICY "newsletter_insert_public" ON newsletter_subscribers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "newsletter_admin_read" ON newsletter_subscribers FOR SELECT
  TO authenticated USING (public.is_admin());

CREATE POLICY "newsletter_admin_update" ON newsletter_subscribers FOR UPDATE
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "newsletter_admin_delete" ON newsletter_subscribers FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- 20. MENTOR_PROFILES TABLE
-- ============================================================================
DROP POLICY IF EXISTS "mentor_profiles_select_all" ON mentor_profiles;
DROP POLICY IF EXISTS "mentor_profiles_insert_own" ON mentor_profiles;
DROP POLICY IF EXISTS "mentor_profiles_update_own_or_admin" ON mentor_profiles;

CREATE POLICY "mentor_profiles_select_all" ON mentor_profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "mentor_profiles_insert_own" ON mentor_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "mentor_profiles_update_own_or_admin" ON mentor_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- ============================================================================
-- 21. MENTOR_SESSIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "sessions_select_participants" ON mentor_sessions;
DROP POLICY IF EXISTS "sessions_insert_participants" ON mentor_sessions;
DROP POLICY IF EXISTS "sessions_update_participants" ON mentor_sessions;

CREATE POLICY "sessions_select_participants" ON mentor_sessions FOR SELECT
  TO authenticated USING (auth.uid() = mentor_id OR auth.uid() = mentee_id OR public.is_admin());

CREATE POLICY "sessions_insert_participants" ON mentor_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentee_id OR public.is_admin());

CREATE POLICY "sessions_update_participants" ON mentor_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = mentor_id OR auth.uid() = mentee_id OR public.is_admin())
  WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentee_id OR public.is_admin());
