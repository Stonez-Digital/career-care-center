-- Distinguish a new member's first dashboard visit from later sign-ins.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_seen_dashboard_welcome boolean NOT NULL DEFAULT false;

-- Established accounts should continue to receive "Welcome back". Preserve a
-- first welcome for recently created accounts that have not started activity.
UPDATE public.profiles AS profile
SET has_seen_dashboard_welcome = true
WHERE profile.created_at < now() - interval '7 days'
   OR EXISTS (
     SELECT 1 FROM public.applications application
     WHERE application.user_id = profile.id
   )
   OR EXISTS (
     SELECT 1 FROM public.event_registrations registration
     WHERE registration.user_id = profile.id
   );

COMMENT ON COLUMN public.profiles.has_seen_dashboard_welcome IS
  'False until the member opens their dashboard for the first time.';

NOTIFY pgrst, 'reload schema';
