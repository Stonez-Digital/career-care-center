INSERT INTO public.site_settings (key, value)
VALUES ('social_whatsapp', 'https://chat.whatsapp.com/Gop8Ftd0qwI7ylmgsIN6bN?s=cl&p=a&ilr=4')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
