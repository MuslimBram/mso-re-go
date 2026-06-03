
DROP POLICY IF EXISTS "Public read tour panoramas" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload own tour panoramas" ON storage.objects;
DROP POLICY IF EXISTS "Auth update own tour panoramas" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete own tour panoramas" ON storage.objects;

CREATE POLICY "Public read tour panoramas"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('tour-panoramas', 'tour-media'));

CREATE POLICY "Auth upload own tour panoramas"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('tour-panoramas', 'tour-media')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Auth update own tour panoramas"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('tour-panoramas', 'tour-media')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Auth delete own tour panoramas"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('tour-panoramas', 'tour-media')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
