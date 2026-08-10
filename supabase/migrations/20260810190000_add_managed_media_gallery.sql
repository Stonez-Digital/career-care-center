-- Administrator-managed public image and video gallery.
CREATE TABLE IF NOT EXISTS public.media_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 160),
  description text,
  media_url text NOT NULL UNIQUE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url text,
  alt_text text,
  source_url text,
  is_published boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0 CHECK (display_order >= 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_gallery_public_order_idx
  ON public.media_gallery (is_published, display_order, created_at DESC);

ALTER TABLE public.media_gallery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_gallery_public_read" ON public.media_gallery;
CREATE POLICY "media_gallery_public_read"
ON public.media_gallery FOR SELECT TO anon, authenticated
USING (is_published OR public.is_admin());

DROP POLICY IF EXISTS "media_gallery_admin_insert" ON public.media_gallery;
CREATE POLICY "media_gallery_admin_insert"
ON public.media_gallery FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "media_gallery_admin_update" ON public.media_gallery;
CREATE POLICY "media_gallery_admin_update"
ON public.media_gallery FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "media_gallery_admin_delete" ON public.media_gallery;
CREATE POLICY "media_gallery_admin_delete"
ON public.media_gallery FOR DELETE TO authenticated
USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.touch_media_gallery_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS media_gallery_touch_updated_at ON public.media_gallery;
CREATE TRIGGER media_gallery_touch_updated_at
BEFORE UPDATE ON public.media_gallery
FOR EACH ROW EXECUTE FUNCTION public.touch_media_gallery_updated_at();

INSERT INTO public.media_gallery
  (title, description, media_url, media_type, alt_text, source_url, display_order)
VALUES
  ('Smarter Skills for a Smarter Future - Workshop 2.0', 'Official event announcement for the World Youth Skills Day 2026 workshop in Asaba.', '/media/events/smarter-skills-workshop-2.jpg', 'image', 'Smarter Skills for a Smarter Future Workshop 2.0 event announcement', 'https://www.facebook.com/careercarecenter', 10),
  ('Workshop 2.0 Event Reminder', 'Event details and registration reminder for the two-day skills workshop.', '/media/events/workshop-2-reminder.jpg', 'image', 'Workshop 2.0 registration reminder', 'https://www.facebook.com/careercarecenter', 20),
  ('Workshop Speaker Spotlight', 'Speaker media published as part of the Workshop 2.0 campaign.', '/media/events/workshop-2-speaker.jpg', 'image', 'Workshop 2.0 speaker spotlight', 'https://www.facebook.com/careercarecenter', 30),
  ('Workshop 2.0 Countdown', 'Official countdown media leading up to the July 2026 event.', '/media/events/workshop-2-countdown.jpg', 'image', 'Workshop 2.0 countdown announcement', 'https://www.facebook.com/careercarecenter', 40),
  ('Remote Work Ready Webinar', 'Skills for the Global Talent Market virtual webinar announcement.', '/media/events/remote-work-ready.jpg', 'image', 'Remote Work Ready webinar announcement', 'https://ng.linkedin.com/company/careercarecenter-youthdevelopmentinitiative', 50),
  ('Remote Work Ready - Event Day', 'Official event-day reminder for the April 2026 virtual webinar.', '/media/events/remote-work-ready-day.jpg', 'image', 'Remote Work Ready webinar event-day reminder', 'https://ng.linkedin.com/company/careercarecenter-youthdevelopmentinitiative', 60),
  ('Career Acceleration Speakers', 'Speaker and facilitator spotlight from a Career Care acceleration programme.', '/media/events/career-acceleration-speakers.jpg', 'image', 'Career acceleration programme speakers', 'https://ng.linkedin.com/company/careercarecenter-youthdevelopmentinitiative', 70)
ON CONFLICT (media_url) DO NOTHING;

NOTIFY pgrst, 'reload schema';
