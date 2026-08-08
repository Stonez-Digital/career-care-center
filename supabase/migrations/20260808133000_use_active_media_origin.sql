/*
  The installed production app is served from career-care-center.vercel.app.
  The custom .com.ng domain currently resolves to a different host and returns
  HTML for media paths, so database-hosted absolute media URLs must use the
  active Vercel origin until DNS is moved to this Vercel project.
*/

UPDATE public.events
SET image_url = replace(
  image_url,
  'https://careercarecenter.com.ng/media/',
  'https://career-care-center.vercel.app/media/'
)
WHERE image_url LIKE 'https://careercarecenter.com.ng/media/%';

UPDATE public.blog_posts
SET cover_image_url = replace(
  cover_image_url,
  'https://careercarecenter.com.ng/media/',
  'https://career-care-center.vercel.app/media/'
)
WHERE cover_image_url LIKE 'https://careercarecenter.com.ng/media/%';

UPDATE public.resources
SET cover_image_url = replace(
  cover_image_url,
  'https://careercarecenter.com.ng/media/',
  'https://career-care-center.vercel.app/media/'
)
WHERE cover_image_url LIKE 'https://careercarecenter.com.ng/media/%';
