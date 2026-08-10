/*
  Restore a verified Career Care event found on the official LinkedIn page.
  Source: https://ng.linkedin.com/company/careercarecenter-youthdevelopmentinitiative
*/

INSERT INTO public.events (
  title,
  description,
  event_date,
  location,
  image_url,
  capacity,
  is_virtual
)
SELECT
  'Remote Work Ready: Skills for the Global Talent Market',
  'A virtual Career Care webinar for students, early professionals, nursing mothers, and hybrid workers. The session covered high-demand technology and non-technology roles, earning in foreign currencies, building a 90-day global-employability roadmap, digital tools, and a strong professional online presence.',
  '2026-04-18 10:00:00+01',
  'Virtual',
  'https://careercarecenter.com.ng/media/events/remote-work-ready-day.jpg',
  200,
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.events
  WHERE title ILIKE 'Remote Work Ready:%'
    AND event_date = '2026-04-18 10:00:00+01'
);
