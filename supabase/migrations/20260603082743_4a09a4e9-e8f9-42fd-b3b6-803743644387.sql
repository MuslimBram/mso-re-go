-- Phase A: schema for AI privacy scan + Street View publishing pipeline

-- 1) Extend tour_scenes with GSV + privacy fields
ALTER TABLE public.tour_scenes
  ADD COLUMN IF NOT EXISTS gsv_pano_id text,
  ADD COLUMN IF NOT EXISTS gsv_url text,
  ADD COLUMN IF NOT EXISTS gsv_upload_time timestamptz,
  ADD COLUMN IF NOT EXISTS gsv_thumbnail text,
  ADD COLUMN IF NOT EXISTS heading double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS floor integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS floor_name text,
  ADD COLUMN IF NOT EXISTS privacy_scan jsonb,
  ADD COLUMN IF NOT EXISTS privacy_approved boolean NOT NULL DEFAULT false;

-- 2) gsv_connections: anchor/target graph between scenes
CREATE TABLE IF NOT EXISTS public.gsv_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_scene_id uuid NOT NULL REFERENCES public.tour_scenes(id) ON DELETE CASCADE,
  to_scene_id uuid NOT NULL REFERENCES public.tour_scenes(id) ON DELETE CASCADE,
  gsv_anchor_pano text,
  gsv_target_pano text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_scene_id, to_scene_id)
);

GRANT SELECT ON public.gsv_connections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gsv_connections TO authenticated;
GRANT ALL ON public.gsv_connections TO service_role;

ALTER TABLE public.gsv_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view connections of published tours"
  ON public.gsv_connections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tour_scenes s
    JOIN public.tours t ON t.id = s.tour_id
    WHERE s.id = gsv_connections.from_scene_id
      AND (t.published = true OR public.has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Owners manage own connections"
  ON public.gsv_connections FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tour_scenes s
    JOIN public.tours t ON t.id = s.tour_id
    WHERE s.id = gsv_connections.from_scene_id
      AND t.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tour_scenes s
    JOIN public.tours t ON t.id = s.tour_id
    WHERE s.id = gsv_connections.from_scene_id
      AND t.created_by = auth.uid()
  ));

CREATE POLICY "Admins manage connections"
  ON public.gsv_connections FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) gsv_publish_queue: review pipeline for central account publishing
CREATE TABLE IF NOT EXISTS public.gsv_publish_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id uuid NOT NULL REFERENCES public.tour_scenes(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review','approved','publishing','published','rejected')),
  requested_by uuid,
  reviewed_by uuid,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gsv_publish_queue TO authenticated;
GRANT ALL ON public.gsv_publish_queue TO service_role;

ALTER TABLE public.gsv_publish_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own queue items"
  ON public.gsv_publish_queue FOR SELECT
  TO authenticated
  USING (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tour_scenes s
      JOIN public.tours t ON t.id = s.tour_id
      WHERE s.id = gsv_publish_queue.scene_id AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Owners insert own queue items"
  ON public.gsv_publish_queue FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.tour_scenes s
      JOIN public.tours t ON t.id = s.tour_id
      WHERE s.id = gsv_publish_queue.scene_id AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins manage queue"
  ON public.gsv_publish_queue FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_gsv_queue_updated_at
  BEFORE UPDATE ON public.gsv_publish_queue
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();