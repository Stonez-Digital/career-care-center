/* Persist volunteer schedule preferences without overloading profile fields. */

CREATE TABLE IF NOT EXISTS public.volunteer_availability (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  slots text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.volunteer_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "volunteer_availability_select_own_or_admin" ON public.volunteer_availability;
CREATE POLICY "volunteer_availability_select_own_or_admin"
ON public.volunteer_availability FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "volunteer_availability_insert_own" ON public.volunteer_availability;
CREATE POLICY "volunteer_availability_insert_own"
ON public.volunteer_availability FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "volunteer_availability_update_own_or_admin" ON public.volunteer_availability;
CREATE POLICY "volunteer_availability_update_own_or_admin"
ON public.volunteer_availability FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

GRANT SELECT, INSERT, UPDATE ON public.volunteer_availability TO authenticated;
