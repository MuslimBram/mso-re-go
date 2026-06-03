
-- Allow any authenticated visitor to create and manage their own tours,
-- while keeping admin full control and public read for published tours.

-- TOURS: auto-set created_by on insert
CREATE OR REPLACE FUNCTION public.set_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tours_set_created_by ON public.tours;
CREATE TRIGGER tours_set_created_by
BEFORE INSERT ON public.tours
FOR EACH ROW EXECUTE FUNCTION public.set_created_by();

-- Owner policies on tours
CREATE POLICY "Owners view own tours"
  ON public.tours FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Auth users create own tours"
  ON public.tours FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "Owners update own tours"
  ON public.tours FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners delete own tours"
  ON public.tours FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- SCENES: owner can manage scenes of own tours
CREATE POLICY "Owners view own scenes"
  ON public.tour_scenes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_scenes.tour_id AND t.created_by = auth.uid()));

CREATE POLICY "Owners insert own scenes"
  ON public.tour_scenes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_scenes.tour_id AND t.created_by = auth.uid()));

CREATE POLICY "Owners update own scenes"
  ON public.tour_scenes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_scenes.tour_id AND t.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_scenes.tour_id AND t.created_by = auth.uid()));

CREATE POLICY "Owners delete own scenes"
  ON public.tour_scenes FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_scenes.tour_id AND t.created_by = auth.uid()));

-- HOTSPOTS: owner can manage hotspots of own tours
CREATE POLICY "Owners view own hotspots"
  ON public.tour_hotspots FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tour_scenes s
    JOIN public.tours t ON t.id = s.tour_id
    WHERE s.id = tour_hotspots.scene_id AND t.created_by = auth.uid()
  ));

CREATE POLICY "Owners insert own hotspots"
  ON public.tour_hotspots FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tour_scenes s
    JOIN public.tours t ON t.id = s.tour_id
    WHERE s.id = tour_hotspots.scene_id AND t.created_by = auth.uid()
  ));

CREATE POLICY "Owners update own hotspots"
  ON public.tour_hotspots FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tour_scenes s
    JOIN public.tours t ON t.id = s.tour_id
    WHERE s.id = tour_hotspots.scene_id AND t.created_by = auth.uid()
  ));

CREATE POLICY "Owners delete own hotspots"
  ON public.tour_hotspots FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tour_scenes s
    JOIN public.tours t ON t.id = s.tour_id
    WHERE s.id = tour_hotspots.scene_id AND t.created_by = auth.uid()
  ));

-- MEDIA: same pattern
CREATE POLICY "Owners view own media"
  ON public.tour_media FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_media.tour_id AND t.created_by = auth.uid()));

CREATE POLICY "Owners insert own media"
  ON public.tour_media FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_media.tour_id AND t.created_by = auth.uid()));

CREATE POLICY "Owners update own media"
  ON public.tour_media FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_media.tour_id AND t.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_media.tour_id AND t.created_by = auth.uid()));

CREATE POLICY "Owners delete own media"
  ON public.tour_media FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_media.tour_id AND t.created_by = auth.uid()));
