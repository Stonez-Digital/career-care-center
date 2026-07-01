/*
# Career Care Center (CCC) — Core Platform Schema

## Overview
Creates the complete database schema for the CCC digital platform: a Nigerian
nonprofit youth empowerment platform serving students, graduates, job seekers,
volunteers, mentors, sponsors, donors, partners, and administrators.

## New Tables (16 total)
1. `profiles` — extends auth.users with role, name, phone, avatar, location, bio.
2. `programs` — CCC programs (Career Coaching, Mentorship, etc.) with benefits & requirements.
3. `events` — events with date, location, capacity, virtual flag.
4. `event_registrations` — user registrations for events.
5. `applications` — program applications with full applicant info + status workflow.
6. `application_status_logs` — audit trail of status changes per application.
7. `volunteers` — volunteer applications with skills, availability, status.
8. `blog_posts` — blog articles with slug, excerpt, content, cover image, publish flag.
9. `testimonials` — success stories with name, role, quote, rating, approval flag.
10. `resources` — learning hub resources (PDF/video/article) by category with download count.
11. `notifications` — per-user notifications (event reminders, application updates, etc.).
12. `donations` — donor records with amount, frequency, status (future payment integration).
13. `partners` — partnership inquiries.
14. `mentor_profiles` — mentor expertise, industry, availability.
15. `mentor_sessions` — scheduled mentor-mentee sessions with status.
16. `resource_bookmarks` — user bookmarks for resources.

## Security (RLS)
- RLS enabled on every table.
- Public content (programs, events, published blog posts, approved testimonials) is readable
  by anon + authenticated so the public website works without sign-in.
- User-owned data (profiles, event_registrations, applications, notifications, bookmarks,
  mentor_profiles, mentor_sessions) is owner-scoped via auth.uid().
- Admin-only writes (managing programs, events, blog, testimonials, volunteers, donations,
  partners) are restricted to users with role = 'admin' in their profile.
- Volunteer applications and program applications can be submitted by anon (public forms)
  but managed (update/delete) by admin only.

## Notes
- `profiles.id` references `auth.users.id` with ON DELETE CASCADE.
- `applications.user_id` and `volunteers.user_id` are nullable so anonymous public
  form submissions work; when a logged-in user applies, their id is stored.
- All owner columns default to auth.uid() where the row is created by an authenticated user.
- Status enums use CHECK constraints for data integrity.
*/

-- ============================================================================
-- 1. PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('admin','student','mentor','volunteer')),
  avatar_url text,
  location text,
  bio text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. PROGRAMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  benefits text[] NOT NULL DEFAULT '{}',
  requirements text[] NOT NULL DEFAULT '{}',
  duration text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "programs_select_public" ON programs;
CREATE POLICY "programs_select_public" ON programs FOR SELECT
  TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "programs_admin_write" ON programs;
CREATE POLICY "programs_admin_write" ON programs FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 3. EVENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  event_date timestamptz NOT NULL,
  location text NOT NULL,
  image_url text,
  capacity int,
  is_virtual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_public" ON events;
CREATE POLICY "events_select_public" ON events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "events_admin_write" ON events;
CREATE POLICY "events_admin_write" ON events FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 4. EVENT_REGISTRATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "registrations_select_own_or_admin" ON event_registrations;
CREATE POLICY "registrations_select_own_or_admin" ON event_registrations FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "registrations_insert_own" ON event_registrations;
CREATE POLICY "registrations_insert_own" ON event_registrations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "registrations_delete_own" ON event_registrations;
CREATE POLICY "registrations_delete_own" ON event_registrations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "registrations_admin_update" ON event_registrations;
CREATE POLICY "registrations_admin_update" ON event_registrations FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 5. APPLICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  gender text,
  date_of_birth date,
  institution text,
  occupation text,
  program_id uuid REFERENCES programs(id) ON DELETE SET NULL,
  motivation text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "applications_select_own_or_admin" ON applications;
CREATE POLICY "applications_select_own_or_admin" ON applications FOR SELECT
  TO anon, authenticated USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "applications_insert_public" ON applications;
CREATE POLICY "applications_insert_public" ON applications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "applications_admin_update" ON applications;
CREATE POLICY "applications_admin_update" ON applications FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "applications_admin_delete" ON applications;
CREATE POLICY "applications_admin_delete" ON applications FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 6. APPLICATION_STATUS_LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS application_status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending','under_review','approved','rejected')),
  note text,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE application_status_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "logs_select_own_or_admin" ON application_status_logs;
CREATE POLICY "logs_select_own_or_admin" ON application_status_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM applications a WHERE a.id = application_id AND a.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "logs_admin_insert" ON application_status_logs;
CREATE POLICY "logs_admin_insert" ON application_status_logs FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 7. VOLUNTEERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  skills text[] NOT NULL DEFAULT '{}',
  availability text,
  location text,
  motivation text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "volunteers_select_own_or_admin" ON volunteers;
CREATE POLICY "volunteers_select_own_or_admin" ON volunteers FOR SELECT
  TO authenticated USING (
    (user_id IS NOT NULL AND auth.uid() = user_id)
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "volunteers_insert_public" ON volunteers;
CREATE POLICY "volunteers_insert_public" ON volunteers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "volunteers_admin_update" ON volunteers;
CREATE POLICY "volunteers_admin_update" ON volunteers FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "volunteers_admin_delete" ON volunteers;
CREATE POLICY "volunteers_admin_delete" ON volunteers FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 8. BLOG_POSTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL,
  content text NOT NULL,
  cover_image_url text,
  author text NOT NULL DEFAULT 'CCC Team',
  category text NOT NULL DEFAULT 'General',
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blog_select_published_or_admin" ON blog_posts;
CREATE POLICY "blog_select_published_or_admin" ON blog_posts FOR SELECT
  TO anon, authenticated USING (published = true OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "blog_admin_write" ON blog_posts;
CREATE POLICY "blog_admin_write" ON blog_posts FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 9. TESTIMONIALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  quote text NOT NULL,
  image_url text,
  rating int NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "testimonials_select_approved_or_admin" ON testimonials;
CREATE POLICY "testimonials_select_approved_or_admin" ON testimonials FOR SELECT
  TO anon, authenticated USING (approved = true OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "testimonials_insert_public" ON testimonials;
CREATE POLICY "testimonials_insert_public" ON testimonials FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "testimonials_admin_update" ON testimonials;
CREATE POLICY "testimonials_admin_update" ON testimonials FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "testimonials_admin_delete" ON testimonials;
CREATE POLICY "testimonials_admin_delete" ON testimonials FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 10. RESOURCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  type text NOT NULL CHECK (type IN ('pdf','video','article')),
  url text NOT NULL,
  cover_image_url text,
  duration text,
  downloads int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resources_select_public" ON resources;
CREATE POLICY "resources_select_public" ON resources FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "resources_admin_write" ON resources;
CREATE POLICY "resources_admin_write" ON resources FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 11. NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_admin_insert" ON notifications;
CREATE POLICY "notifications_admin_insert" ON notifications FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 12. DONATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name text NOT NULL,
  donor_email text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'NGN',
  frequency text NOT NULL DEFAULT 'one_time' CHECK (frequency IN ('one_time','monthly','yearly')),
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "donations_insert_public" ON donations;
CREATE POLICY "donations_insert_public" ON donations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "donations_admin_read" ON donations;
CREATE POLICY "donations_admin_read" ON donations FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "donations_admin_update" ON donations;
CREATE POLICY "donations_admin_update" ON donations FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 13. PARTNERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  organization text,
  partnership_type text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partners_insert_public" ON partners;
CREATE POLICY "partners_insert_public" ON partners FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "partners_admin_read" ON partners;
CREATE POLICY "partners_admin_read" ON partners FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "partners_admin_delete" ON partners;
CREATE POLICY "partners_admin_delete" ON partners FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 14. MENTOR_PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  expertise text[] NOT NULL DEFAULT '{}',
  industry text,
  bio text,
  availability text,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentor_profiles_select_all" ON mentor_profiles;
CREATE POLICY "mentor_profiles_select_all" ON mentor_profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "mentor_profiles_insert_own" ON mentor_profiles;
CREATE POLICY "mentor_profiles_insert_own" ON mentor_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mentor_profiles_update_own_or_admin" ON mentor_profiles;
CREATE POLICY "mentor_profiles_update_own_or_admin" ON mentor_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 15. MENTOR_SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  topic text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_select_participants" ON mentor_sessions;
CREATE POLICY "sessions_select_participants" ON mentor_sessions FOR SELECT
  TO authenticated USING (auth.uid() = mentor_id OR auth.uid() = mentee_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "sessions_insert_mentee" ON mentor_sessions;
CREATE POLICY "sessions_insert_mentee" ON mentor_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = mentee_id);

DROP POLICY IF EXISTS "sessions_update_participants" ON mentor_sessions;
CREATE POLICY "sessions_update_participants" ON mentor_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = mentor_id OR auth.uid() = mentee_id)
  WITH CHECK (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- ============================================================================
-- 16. RESOURCE_BOOKMARKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS resource_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_id)
);
ALTER TABLE resource_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bookmarks_select_own" ON resource_bookmarks;
CREATE POLICY "bookmarks_select_own" ON resource_bookmarks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_insert_own" ON resource_bookmarks;
CREATE POLICY "bookmarks_insert_own" ON resource_bookmarks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_delete_own" ON resource_bookmarks;
CREATE POLICY "bookmarks_delete_own" ON resource_bookmarks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published, published_at);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_mentor ON mentor_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_mentee ON mentor_sessions(mentee_id);

-- ============================================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'student'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
