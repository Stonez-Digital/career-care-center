/*
  Audit and repair identity, role, and mentorship relationships.

  public.profiles is the application identity table and must be the target of
  every application-level user relationship. auth.users remains the account
  owner and authentication source.
*/

-- 1. Guarantee one application profile per authentication account and keep
-- immutable identity fields synchronized.
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  users.id,
  users.email,
  users.raw_user_meta_data ->> 'full_name',
  CASE
    WHEN users.raw_app_meta_data ->> 'role' IN ('super_admin', 'admin', 'intern', 'mentor', 'volunteer')
      THEN users.raw_app_meta_data ->> 'role'
    WHEN users.raw_user_meta_data ->> 'role' IN ('intern', 'mentor', 'volunteer')
      THEN users.raw_user_meta_data ->> 'role'
    ELSE 'intern'
  END
FROM auth.users AS users
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);

-- A mentor profile is authoritative evidence that this account is a mentor,
-- except for protected administrator accounts.
UPDATE public.profiles AS profile
SET role = 'mentor'
FROM public.mentor_profiles AS mentor_profile
WHERE mentor_profile.user_id = profile.id
  AND profile.role NOT IN ('admin', 'super_admin', 'mentor');

UPDATE public.profiles AS profile
SET role = 'mentor'
WHERE profile.role NOT IN ('admin', 'super_admin', 'mentor')
  AND (
    EXISTS (SELECT 1 FROM public.mentor_assignments WHERE mentor_id = profile.id)
    OR EXISTS (SELECT 1 FROM public.mentor_sessions WHERE mentor_id = profile.id)
  );

UPDATE public.profiles AS profile
SET role = 'intern'
WHERE profile.role NOT IN ('admin', 'super_admin', 'intern')
  AND (
    EXISTS (SELECT 1 FROM public.mentor_assignments WHERE mentee_id = profile.id)
    OR EXISTS (SELECT 1 FROM public.mentor_sessions WHERE mentee_id = profile.id)
  )
  AND NOT EXISTS (SELECT 1 FROM public.mentor_profiles WHERE user_id = profile.id)
  AND NOT EXISTS (SELECT 1 FROM public.mentor_assignments WHERE mentor_id = profile.id)
  AND NOT EXISTS (SELECT 1 FROM public.mentor_sessions WHERE mentor_id = profile.id);

-- Keep JWT authorization metadata aligned with the application profile.
UPDATE auth.users AS users
SET raw_app_meta_data = jsonb_set(
  COALESCE(users.raw_app_meta_data, '{}'::jsonb),
  '{role}',
  to_jsonb(profile.role),
  true
)
FROM public.profiles AS profile
WHERE profile.id = users.id
  AND users.raw_app_meta_data ->> 'role' IS DISTINCT FROM profile.role;

-- 2. Repoint mentorship entities from auth.users to public.profiles. Reuse
-- the canonical constraint names expected by PostgREST relationship embeds.
ALTER TABLE public.mentor_profiles
  DROP CONSTRAINT IF EXISTS mentor_profiles_user_id_fkey;
ALTER TABLE public.mentor_profiles
  ADD CONSTRAINT mentor_profiles_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS mentor_profiles_user_id_unique
  ON public.mentor_profiles (user_id);

ALTER TABLE public.mentor_sessions
  DROP CONSTRAINT IF EXISTS mentor_sessions_mentor_id_fkey;
ALTER TABLE public.mentor_sessions
  DROP CONSTRAINT IF EXISTS mentor_sessions_mentee_id_fkey;
ALTER TABLE public.mentor_sessions
  ADD CONSTRAINT mentor_sessions_mentor_id_fkey
  FOREIGN KEY (mentor_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.mentor_sessions
  ADD CONSTRAINT mentor_sessions_mentee_id_fkey
  FOREIGN KEY (mentee_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.mentor_sessions
  DROP CONSTRAINT IF EXISTS mentor_sessions_different_users;
ALTER TABLE public.mentor_sessions
  ADD CONSTRAINT mentor_sessions_different_users CHECK (mentor_id <> mentee_id);

-- 3. Validate the semantic role relationship for assignments and sessions.
CREATE OR REPLACE FUNCTION public.validate_mentorship_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  mentor_role text;
  mentee_role text;
BEGIN
  SELECT role INTO mentor_role FROM public.profiles WHERE id = NEW.mentor_id;
  SELECT role INTO mentee_role FROM public.profiles WHERE id = NEW.mentee_id;

  IF mentor_role IS DISTINCT FROM 'mentor' THEN
    RAISE EXCEPTION 'Mentor account must have the mentor role';
  END IF;

  IF mentee_role IS DISTINCT FROM 'intern' THEN
    RAISE EXCEPTION 'Mentee account must have the intern role';
  END IF;

  IF NEW.mentor_id = NEW.mentee_id THEN
    RAISE EXCEPTION 'Mentor and mentee must be different users';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_mentorship_roles() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_mentorship_roles() TO service_role;

DROP TRIGGER IF EXISTS validate_mentor_assignment_roles ON public.mentor_assignments;
CREATE TRIGGER validate_mentor_assignment_roles
BEFORE INSERT OR UPDATE OF mentor_id, mentee_id
ON public.mentor_assignments
FOR EACH ROW EXECUTE FUNCTION public.validate_mentorship_roles();

DROP TRIGGER IF EXISTS validate_mentor_session_roles ON public.mentor_sessions;
CREATE TRIGGER validate_mentor_session_roles
BEFORE INSERT OR UPDATE OF mentor_id, mentee_id
ON public.mentor_sessions
FOR EACH ROW EXECUTE FUNCTION public.validate_mentorship_roles();

-- 4. Record session pairings as assignments when this does not conflict with
-- an existing active mentor relationship. This repairs historical sessions
-- without changing an intentional current assignment.
INSERT INTO public.mentor_assignments (mentor_id, mentee_id, assigned_by, is_active)
SELECT DISTINCT session.mentor_id, session.mentee_id, NULL::uuid, true
FROM public.mentor_sessions AS session
JOIN public.profiles AS mentor ON mentor.id = session.mentor_id AND mentor.role = 'mentor'
JOIN public.profiles AS mentee ON mentee.id = session.mentee_id AND mentee.role = 'intern'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.mentor_assignments AS assignment
  WHERE assignment.mentee_id = session.mentee_id
    AND assignment.is_active
)
ON CONFLICT DO NOTHING;

-- Ask PostgREST to expose the repaired foreign-key relationships immediately.
NOTIFY pgrst, 'reload schema';
