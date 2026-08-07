/* Add Microsoft Teams meeting support to assigned mentorship sessions. */

ALTER TABLE public.mentor_sessions
  ADD COLUMN IF NOT EXISTS meeting_url text;

ALTER TABLE public.mentor_sessions
  DROP CONSTRAINT IF EXISTS mentor_sessions_meeting_url_check;

ALTER TABLE public.mentor_sessions
  ADD CONSTRAINT mentor_sessions_meeting_url_check CHECK (
    meeting_url IS NULL OR
    meeting_url ~* '^https://([a-z0-9-]+\.)?(teams\.microsoft\.com|teams\.live\.com)/'
  );

DROP POLICY IF EXISTS "sessions_admin_delete" ON public.mentor_sessions;
CREATE POLICY "sessions_admin_delete"
ON public.mentor_sessions FOR DELETE
TO authenticated
USING (public.is_admin());
