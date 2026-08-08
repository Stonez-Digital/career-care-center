INSERT INTO public.site_settings (key, value)
VALUES ('social_whatsapp', 'https://wa.me/2348068775767')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
