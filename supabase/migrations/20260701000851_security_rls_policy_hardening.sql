/*
# Security Hardening Part 2: RLS Policy Hardening

Replaces permissive `WITH CHECK (true)` INSERT policies with proper validation.
Adds missing public SELECT policies for content tables.
*/

-- 1. contact_messages INSERT
DROP POLICY IF EXISTS "contact_messages_insert_public" ON public.contact_messages;
CREATE POLICY "contact_messages_insert_public"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(name))    > 0 AND
  length(trim(email))   > 0 AND
  email LIKE '%@%'      AND
  length(trim(message)) > 0
);

-- 2. donations INSERT
DROP POLICY IF EXISTS "donations_insert_public" ON public.donations;
CREATE POLICY "donations_insert_public"
ON public.donations FOR INSERT
TO anon, authenticated
WITH CHECK (
  amount > 0 AND
  currency IN ('NGN', 'USD', 'GBP', 'EUR') AND
  frequency IN ('one_time', 'monthly', 'yearly') AND
  status = 'pending'
);

-- 3. newsletter_subscribers INSERT
DROP POLICY IF EXISTS "newsletter_insert_public" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_insert_public"
ON public.newsletter_subscribers FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(email)) > 0 AND
  email LIKE '%@%.%'
);

-- 4. testimonials INSERT (columns: name, role, quote)
DROP POLICY IF EXISTS "testimonials_insert_public" ON public.testimonials;
CREATE POLICY "testimonials_insert_public"
ON public.testimonials FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(quote)) > 0 AND
  length(trim(name))  > 0
);

-- 5. partners INSERT
DROP POLICY IF EXISTS "partners_insert_public" ON public.partners;
CREATE POLICY "partners_insert_public"
ON public.partners FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(name))  > 0 AND
  length(trim(email)) > 0 AND
  email LIKE '%@%'
);

-- 6. blog_posts SELECT (published only for anon)
DROP POLICY IF EXISTS "blog_posts_select_published" ON public.blog_posts;
CREATE POLICY "blog_posts_select_published"
ON public.blog_posts FOR SELECT
TO anon, authenticated
USING (published = true OR is_admin());

-- 7. events SELECT (public)
DROP POLICY IF EXISTS "events_select_public" ON public.events;
CREATE POLICY "events_select_public"
ON public.events FOR SELECT
TO anon, authenticated
USING (true);

-- 8. programs SELECT (public)
DROP POLICY IF EXISTS "programs_select_public" ON public.programs;
CREATE POLICY "programs_select_public"
ON public.programs FOR SELECT
TO anon, authenticated
USING (true);

-- 9. resources SELECT (authenticated)
DROP POLICY IF EXISTS "resources_select_authenticated" ON public.resources;
CREATE POLICY "resources_select_authenticated"
ON public.resources FOR SELECT
TO authenticated
USING (true);

-- 10. testimonials SELECT (approved only for anon)
DROP POLICY IF EXISTS "testimonials_select_approved" ON public.testimonials;
CREATE POLICY "testimonials_select_approved"
ON public.testimonials FOR SELECT
TO anon, authenticated
USING (approved = true OR is_admin());
