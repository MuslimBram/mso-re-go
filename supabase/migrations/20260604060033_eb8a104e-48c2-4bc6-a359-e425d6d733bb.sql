-- POI table (Attractions / Businesses) — Google Places auto + manual override
CREATE TABLE public.tour_pois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL,
  scene_id uuid,
  source text NOT NULL DEFAULT 'manual',
  google_place_id text,
  category text NOT NULL,
  name text NOT NULL,
  description text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  rating double precision,
  photo_url text,
  website text,
  phone text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  manual_override boolean NOT NULL DEFAULT false,
  hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tour_id, google_place_id)
);

GRANT SELECT ON public.tour_pois TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_pois TO authenticated;
GRANT ALL ON public.tour_pois TO service_role;

ALTER TABLE public.tour_pois ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view POIs of published tours"
  ON public.tour_pois FOR SELECT
  USING (
    hidden = false AND EXISTS (
      SELECT 1 FROM public.tours t
      WHERE t.id = tour_pois.tour_id
        AND (t.published = true OR public.has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Owners view own POIs"
  ON public.tour_pois FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_pois.tour_id AND t.created_by = auth.uid()));

CREATE POLICY "Owners manage own POIs"
  ON public.tour_pois FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_pois.tour_id AND t.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_pois.tour_id AND t.created_by = auth.uid()));

CREATE POLICY "Admins manage all POIs"
  ON public.tour_pois FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_tour_pois_updated_at
  BEFORE UPDATE ON public.tour_pois
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX tour_pois_tour_id_idx ON public.tour_pois (tour_id);
CREATE INDEX tour_pois_category_idx ON public.tour_pois (category);

-- Tour routes / itineraries
CREATE TABLE public.tour_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  scene_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_minutes integer,
  difficulty text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tour_routes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_routes TO authenticated;
GRANT ALL ON public.tour_routes TO service_role;

ALTER TABLE public.tour_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view routes of published tours"
  ON public.tour_routes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tours t
    WHERE t.id = tour_routes.tour_id
      AND (t.published = true OR public.has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Owners manage own routes"
  ON public.tour_routes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_routes.tour_id AND t.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_routes.tour_id AND t.created_by = auth.uid()));

CREATE POLICY "Admins manage all routes"
  ON public.tour_routes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_tour_routes_updated_at
  BEFORE UPDATE ON public.tour_routes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX tour_routes_tour_id_idx ON public.tour_routes (tour_id);

-- Hotspot metadata extension
ALTER TABLE public.tour_hotspots
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Per-scene AI guide context
ALTER TABLE public.tour_scenes
  ADD COLUMN IF NOT EXISTS ai_context text,
  ADD COLUMN IF NOT EXISTS ai_topics text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ai_cache jsonb,
  ADD COLUMN IF NOT EXISTS ai_cache_updated_at timestamptz;
