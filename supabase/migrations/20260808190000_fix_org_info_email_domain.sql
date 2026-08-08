UPDATE public.site_settings
SET value = 'info@careercarecenter.com.ng',
    updated_at = now()
WHERE key = 'org_email'
  AND value = 'info@careercarecenter.com';
