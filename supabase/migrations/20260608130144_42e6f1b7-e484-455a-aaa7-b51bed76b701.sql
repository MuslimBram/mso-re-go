
REVOKE SELECT ON public.tour_scenes FROM anon;
GRANT SELECT (
  id, tour_id, name, panorama_url, source,
  street_view_pano_id, street_view_lat, street_view_lng,
  initial_yaw, initial_pitch, initial_fov, order_index,
  created_at, gsv_pano_id, gsv_url, gsv_upload_time, gsv_thumbnail,
  heading, floor, floor_name, privacy_approved, local_published,
  gsv_status, gsv_attempt_count, gsv_last_synced_at,
  ai_topics, ai_cache_updated_at
) ON public.tour_scenes TO anon;

REVOKE SELECT ON public.gsv_publish_queue FROM authenticated;
GRANT SELECT (
  id, scene_id, action, status, attempt_count,
  requested_by, reviewed_by, created_at, updated_at
) ON public.gsv_publish_queue TO authenticated;

CREATE POLICY "Admins delete suggestion photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'suggestion-photos' AND public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.place_suggestions
  ADD CONSTRAINT place_suggestions_contact_len CHECK (contact IS NULL OR length(contact) <= 200);
