-- Production media buckets and least-privilege object policies.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('profile-images', 'profile-images', true, 5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('resource-media', 'resource-media', true, 52428800,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "profile_media_insert_own" ON storage.objects;
CREATE POLICY "profile_media_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "profile_media_update_own_or_admin" ON storage.objects;
CREATE POLICY "profile_media_update_own_or_admin"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-images'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
)
WITH CHECK (
  bucket_id = 'profile-images'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

DROP POLICY IF EXISTS "profile_media_delete_own_or_admin" ON storage.objects;
CREATE POLICY "profile_media_delete_own_or_admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-images'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

DROP POLICY IF EXISTS "resource_media_admin_insert" ON storage.objects;
CREATE POLICY "resource_media_admin_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'resource-media' AND public.is_admin());

DROP POLICY IF EXISTS "resource_media_admin_update" ON storage.objects;
CREATE POLICY "resource_media_admin_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'resource-media' AND public.is_admin())
WITH CHECK (bucket_id = 'resource-media' AND public.is_admin());

DROP POLICY IF EXISTS "resource_media_admin_delete" ON storage.objects;
CREATE POLICY "resource_media_admin_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'resource-media' AND public.is_admin());
