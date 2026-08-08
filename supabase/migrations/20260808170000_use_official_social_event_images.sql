/*
  Use stable, app-hosted copies of event graphics published by Career Care
  Center's official LinkedIn account:
  https://ng.linkedin.com/company/careercarecenter-youthdevelopmentinitiative
*/

UPDATE public.events
SET image_url = CASE
  WHEN title ILIKE '%career acceleration%' OR title ILIKE '%remote work%'
    THEN 'https://careercarecenter.com.ng/media/events/remote-work-ready-day.jpg'
  WHEN title ILIKE '%smarter skills%'
    THEN 'https://careercarecenter.com.ng/media/events/smarter-skills-workshop-2.jpg'
  ELSE image_url
END
WHERE title ILIKE '%career acceleration%'
   OR title ILIKE '%remote work%'
   OR title ILIKE '%smarter skills%';
