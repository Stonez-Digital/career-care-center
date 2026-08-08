/*
  Replace legacy event listings with the current, verified Career Care event.

  Source:
  https://ng.linkedin.com/company/careercarecenter-youthdevelopmentinitiative

  LinkedIn confirms the title, two-day schedule, daily start time, venue,
  free admission, and registration requirement below.
*/

DELETE FROM public.events;

INSERT INTO public.events (
  title,
  description,
  event_date,
  location,
  image_url,
  capacity,
  is_virtual
) VALUES (
  'Smarter Skills for a Smarter Future – Workshop 2.0',
  'A free two-day workshop for students, graduates, young professionals, entrepreneurs, educators, and career-development enthusiasts, held in celebration of World Youth Skills Day 2026 and Career Care''s second anniversary. Participants gain practical, future-ready skills and insights into career advancement, leadership, innovation, AI, data analytics, and opportunities in the digital economy. Registration is required.',
  '2026-07-14 09:00:00+01',
  'Federal College of Education (Technical), Asaba, Delta State',
  'https://media.licdn.com/dms/image/v2/D4E22AQGrM2VsoPcSCg/feedshare-shrink_480/B4EZ9BUOqmJMAk-/0/1783507250053?e=2147483647&v=beta&t=aLcCJMLUuU69e2AT0bQHGe7oV-xfZaE0FU5EWAtI9PA',
  300,
  false
);
