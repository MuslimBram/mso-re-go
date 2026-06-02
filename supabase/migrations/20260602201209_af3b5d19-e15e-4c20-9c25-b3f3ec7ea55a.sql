-- Public read for 360 explorer buckets (acts like public buckets but bypasses workspace policy)
CREATE POLICY "Public read tour panoramas"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tour-panoramas');

CREATE POLICY "Public read tour media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tour-media');

CREATE POLICY "Public read showcase models"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'showcase-models');

-- Admin write
CREATE POLICY "Admins write tour panoramas"
  ON storage.objects FOR ALL
  USING (bucket_id = 'tour-panoramas' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'tour-panoramas' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins write tour media"
  ON storage.objects FOR ALL
  USING (bucket_id = 'tour-media' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'tour-media' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins write showcase models"
  ON storage.objects FOR ALL
  USING (bucket_id = 'showcase-models' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'showcase-models' AND has_role(auth.uid(), 'admin'::app_role));