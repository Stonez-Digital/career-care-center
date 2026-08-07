/* Idempotent production repair for roles, profile integrity, and mentor assignments. */

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'intern', 'mentor', 'volunteer')) NOT VALID;
UPDATE public.profiles SET role = 'intern' WHERE role = 'student';
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_role_check;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'intern';

CREATE TABLE IF NOT EXISTS public.mentor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  mentee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mentor_assignments_different_users CHECK (mentor_id <> mentee_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS mentor_assignments_one_active_mentor_per_mentee
  ON public.mentor_assignments (mentee_id) WHERE is_active;
CREATE INDEX IF NOT EXISTS mentor_assignments_mentor_idx ON public.mentor_assignments (mentor_id);
CREATE INDEX IF NOT EXISTS mentor_assignments_mentee_idx ON public.mentor_assignments (mentee_id);

ALTER TABLE public.mentor_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mentor_assignments_participant_read" ON public.mentor_assignments;
CREATE POLICY "mentor_assignments_participant_read" ON public.mentor_assignments FOR SELECT
  TO authenticated USING (auth.uid() = mentor_id OR auth.uid() = mentee_id OR public.is_admin());
DROP POLICY IF EXISTS "mentor_assignments_admin_write" ON public.mentor_assignments;
CREATE POLICY "mentor_assignments_admin_write" ON public.mentor_assignments FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Prevent duplicate applications while preserving existing records. The index
-- is partial so anonymous rows without an email/program are not conflated.
DO $$
BEGIN
  IF to_regclass('public.applications_user_program_unique') IS NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.applications
      WHERE user_id IS NOT NULL AND program_id IS NOT NULL
      GROUP BY user_id, program_id HAVING count(*) > 1
    ) THEN
      CREATE UNIQUE INDEX applications_user_program_unique
        ON public.applications (user_id, program_id)
        WHERE user_id IS NOT NULL AND program_id IS NOT NULL;
    ELSE
      RAISE WARNING 'applications_user_program_unique skipped: duplicate production records require review';
    END IF;
  END IF;

  IF to_regclass('public.event_registrations_user_event_unique') IS NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.event_registrations
      GROUP BY user_id, event_id HAVING count(*) > 1
    ) THEN
      CREATE UNIQUE INDEX event_registrations_user_event_unique
        ON public.event_registrations (user_id, event_id);
    ELSE
      RAISE WARNING 'event_registrations_user_event_unique skipped: duplicate production records require review';
    END IF;
  END IF;
END $$;
