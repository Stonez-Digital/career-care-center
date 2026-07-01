/*
# Admin Dashboard Extension Tables

Adds tables needed for the production-grade admin dashboard:
1. contact_messages — public contact form submissions
2. site_settings — key/value store for organization settings
3. audit_logs — admin action audit trail
4. newsletter_subscribers — email subscribers
5. admin_notes — internal notes on applications

Also adds columns to existing tables:
- partners: logo_url, website, category, is_featured (for partner management)
- testimonials: is_featured (for homepage featuring)
- blog_posts: meta_title, meta_description, is_draft (for SEO and scheduling)
- profiles: is_suspended (for account suspension)
*/

-- ============================================================================
-- 1. CONTACT_MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread','read','archived','replied')),
  admin_reply text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_messages_insert_public" ON contact_messages;
CREATE POLICY "contact_messages_insert_public" ON contact_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "contact_messages_admin_read" ON contact_messages;
CREATE POLICY "contact_messages_admin_read" ON contact_messages FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "contact_messages_admin_update" ON contact_messages;
CREATE POLICY "contact_messages_admin_update" ON contact_messages FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "contact_messages_admin_delete" ON contact_messages;
CREATE POLICY "contact_messages_admin_delete" ON contact_messages FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 2. SITE_SETTINGS (key/value store)
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_select_public" ON site_settings;
CREATE POLICY "site_settings_select_public" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "site_settings_admin_write" ON site_settings;
CREATE POLICY "site_settings_admin_write" ON site_settings FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 3. AUDIT_LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_read" ON audit_logs;
CREATE POLICY "audit_logs_admin_read" ON audit_logs FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "audit_logs_admin_insert" ON audit_logs;
CREATE POLICY "audit_logs_admin_insert" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 4. NEWSLETTER_SUBSCRIBERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_insert_public" ON newsletter_subscribers;
CREATE POLICY "newsletter_insert_public" ON newsletter_subscribers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_admin_read" ON newsletter_subscribers;
CREATE POLICY "newsletter_admin_read" ON newsletter_subscribers FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "newsletter_admin_update" ON newsletter_subscribers;
CREATE POLICY "newsletter_admin_update" ON newsletter_subscribers FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "newsletter_admin_delete" ON newsletter_subscribers;
CREATE POLICY "newsletter_admin_delete" ON newsletter_subscribers FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 5. ADMIN_NOTES (internal notes on applications)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_notes_read" ON admin_notes;
CREATE POLICY "admin_notes_read" ON admin_notes FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "admin_notes_insert" ON admin_notes;
CREATE POLICY "admin_notes_insert" ON admin_notes FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "admin_notes_delete" ON admin_notes;
CREATE POLICY "admin_notes_delete" ON admin_notes FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- ============================================================================
-- 6. ADD COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Partners: add management columns
ALTER TABLE partners ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Allow public read of partners (for public website)
DROP POLICY IF EXISTS "partners_select_public" ON partners;
CREATE POLICY "partners_select_public" ON partners FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "partners_admin_write" ON partners;
CREATE POLICY "partners_admin_write" ON partners FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Testimonials: add is_featured
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- Blog posts: add SEO and scheduling fields
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_title text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false;

-- Profiles: add suspended flag
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

-- ============================================================================
-- 7. INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notes_application ON admin_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

-- ============================================================================
-- 8. SEED DEFAULT SITE SETTINGS
-- ============================================================================
INSERT INTO site_settings (key, value) VALUES
  ('org_name', 'Career Care Center For Youth Development Initiative'),
  ('org_tagline', 'We Care For Your Career'),
  ('org_email', 'info@careercarecenter.com'),
  ('org_phone', '+234 815 124 6752'),
  ('org_address', 'Maryland, Lagos, Nigeria'),
  ('org_website', 'https://careercarecenter.com.ng'),
  ('social_facebook', 'https://www.facebook.com/careercarecenter'),
  ('social_instagram', 'https://www.instagram.com/careercarecenter'),
  ('social_linkedin', 'https://ng.linkedin.com/company/careercarecenter-youthdevelopmentinitiative'),
  ('hero_title', 'We Care For Your Career'),
  ('hero_subtitle', 'We Nurture Talents For Greater Purposes'),
  ('hero_description', 'We equip talents with the skills, networks, knowledge, opportunities and tools needed to navigate the professional world and excel in their chosen career.'),
  ('footer_text', 'Empowering Nigerian youth for career success through mentorship, career guidance, employability training, entrepreneurship support, and skills development.'),
  ('seo_meta_title', 'Career Care Center For Youth Development Initiative | We Care For Your Career'),
  ('seo_meta_description', 'Career Care Center For Youth Development Initiative is a Nigerian nonprofit empowering youth through career coaching, mentorship, internship support, employability training, entrepreneurship, and skills development.')
ON CONFLICT (key) DO NOTHING;
