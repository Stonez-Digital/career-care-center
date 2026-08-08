/*
  Restore public content visibility and replace obsolete WordPress media
  hotlinks with Career Care assets hosted by this application.

  The old wp-content URLs now return the SPA HTML document instead of image
  bytes, so browsers reject them as graphics. The local assets were sourced
  from Career Care's official LinkedIn page.
*/

-- Public policies must not invoke is_admin(), because EXECUTE is correctly
-- unavailable to anon. Keep public and privileged SELECT policies separate.
DROP POLICY IF EXISTS "blog_select_published_or_admin" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_select_published" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_select_public" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_select_admin" ON public.blog_posts;

CREATE POLICY "blog_posts_select_public"
ON public.blog_posts FOR SELECT
TO anon, authenticated
USING (published = true);

CREATE POLICY "blog_posts_select_admin"
ON public.blog_posts FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "testimonials_select_approved_or_admin" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_select_approved" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_select_public" ON public.testimonials;
DROP POLICY IF EXISTS "testimonials_select_admin" ON public.testimonials;

CREATE POLICY "testimonials_select_public"
ON public.testimonials FOR SELECT
TO anon, authenticated
USING (approved = true);

CREATE POLICY "testimonials_select_admin"
ON public.testimonials FOR SELECT
TO authenticated
USING (public.is_admin());

-- Use stable app-hosted media instead of the retired WordPress asset paths.
UPDATE public.events
SET image_url = 'https://careercarecenter.com.ng/media/events/workshop-2-reminder.jpg'
WHERE title ILIKE '%Smarter Skills%Workshop 2.0%';

UPDATE public.blog_posts
SET cover_image_url = CASE
  WHEN title ILIKE '%career acceleration%' OR title ILIKE '%remote work%'
    THEN 'https://careercarecenter.com.ng/media/events/workshop-2-speaker.jpg'
  WHEN title ILIKE '%smarter skills%' OR title ILIKE '%thank you%' OR title ILIKE '%birthday%'
    THEN 'https://careercarecenter.com.ng/media/events/workshop-2-reminder.jpg'
  ELSE 'https://careercarecenter.com.ng/media/events/workshop-2-countdown.jpg'
END
WHERE cover_image_url LIKE 'https://careercarecenter.com.ng/wp-content/%';

UPDATE public.resources
SET cover_image_url = CASE
  WHEN title ILIKE '%problem-solving%' OR title ILIKE '%career acceleration%' OR title ILIKE '%CV writing%'
    THEN 'https://careercarecenter.com.ng/media/events/workshop-2-speaker.jpg'
  WHEN title ILIKE '%smarter skills%'
    THEN 'https://careercarecenter.com.ng/media/events/workshop-2-reminder.jpg'
  ELSE 'https://careercarecenter.com.ng/media/events/workshop-2-countdown.jpg'
END
WHERE cover_image_url LIKE 'https://careercarecenter.com.ng/wp-content/%';
