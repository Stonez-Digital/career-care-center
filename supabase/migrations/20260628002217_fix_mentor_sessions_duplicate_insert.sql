/*
# Fix mentor_sessions duplicate INSERT policy

Two conflicting INSERT policies exist. Drop the narrower one and keep
the broader one that allows mentor, mentee, or admin to insert.
*/

DROP POLICY IF EXISTS "sessions_insert_mentee" ON mentor_sessions;
