/* Admins schedule sessions; participants can view their counterpart's basic profile. */

DROP POLICY IF EXISTS "sessions_insert_participants" ON public.mentor_sessions;
CREATE POLICY "sessions_admin_insert" ON public.mentor_sessions FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "sessions_update_participants" ON public.mentor_sessions;
CREATE POLICY "sessions_admin_update" ON public.mentor_sessions FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_admin_or_session_participant" ON public.profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.mentor_sessions session
      WHERE (session.mentor_id = auth.uid() AND session.mentee_id = profiles.id)
         OR (session.mentee_id = auth.uid() AND session.mentor_id = profiles.id)
    )
  );
