-- =========================
-- 360° EXPLORER MODULE
-- =========================

-- 1) TOURS
CREATE TABLE public.tours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  category TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tours TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tours TO authenticated;
GRANT ALL ON public.tours TO service_role;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published tours"
  ON public.tours FOR SELECT
  USING (published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage tours"
  ON public.tours FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) TOUR SCENES
CREATE TABLE public.tour_scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  panorama_url TEXT,
  source TEXT NOT NULL DEFAULT 'upload', -- 'upload' | 'streetview'
  street_view_pano_id TEXT,
  street_view_lat DOUBLE PRECISION,
  street_view_lng DOUBLE PRECISION,
  initial_yaw DOUBLE PRECISION NOT NULL DEFAULT 0,
  initial_pitch DOUBLE PRECISION NOT NULL DEFAULT 0,
  initial_fov DOUBLE PRECISION NOT NULL DEFAULT 90,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tour_scenes_tour_id ON public.tour_scenes(tour_id);
GRANT SELECT ON public.tour_scenes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_scenes TO authenticated;
GRANT ALL ON public.tour_scenes TO service_role;
ALTER TABLE public.tour_scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view scenes of published tours"
  ON public.tour_scenes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_id AND (t.published = true OR has_role(auth.uid(), 'admin'::app_role)))
  );

CREATE POLICY "Admins manage scenes"
  ON public.tour_scenes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3) HOTSPOTS
CREATE TABLE public.tour_hotspots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scene_id UUID NOT NULL REFERENCES public.tour_scenes(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info', -- info|audio|video|image|product|link|scene
  yaw DOUBLE PRECISION NOT NULL DEFAULT 0,
  pitch DOUBLE PRECISION NOT NULL DEFAULT 0,
  title TEXT,
  body TEXT,
  media_url TEXT,
  link_url TEXT,
  target_scene_id UUID REFERENCES public.tour_scenes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tour_hotspots_scene_id ON public.tour_hotspots(scene_id);
GRANT SELECT ON public.tour_hotspots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_hotspots TO authenticated;
GRANT ALL ON public.tour_hotspots TO service_role;
ALTER TABLE public.tour_hotspots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view hotspots of published tours"
  ON public.tour_hotspots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tour_scenes s
      JOIN public.tours t ON t.id = s.tour_id
      WHERE s.id = scene_id AND (t.published = true OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Admins manage hotspots"
  ON public.tour_hotspots FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4) TOUR MEDIA
CREATE TABLE public.tour_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'gallery', -- gallery|audio|video
  url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tour_media_tour_id ON public.tour_media(tour_id);
GRANT SELECT ON public.tour_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_media TO authenticated;
GRANT ALL ON public.tour_media TO service_role;
ALTER TABLE public.tour_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view media of published tours"
  ON public.tour_media FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.tours t WHERE t.id = tour_id AND (t.published = true OR has_role(auth.uid(), 'admin'::app_role)))
  );

CREATE POLICY "Admins manage media"
  ON public.tour_media FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5) SHOWCASE PRODUCTS
CREATE TABLE public.showcase_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sketchfab_url TEXT,
  model_url TEXT,
  thumbnail_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.showcase_products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.showcase_products TO authenticated;
GRANT ALL ON public.showcase_products TO service_role;
ALTER TABLE public.showcase_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view published products"
  ON public.showcase_products FOR SELECT
  USING (published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage products"
  ON public.showcase_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- timestamp trigger function (reuse pattern)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_tours_updated_at BEFORE UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_showcase_products_updated_at BEFORE UPDATE ON public.showcase_products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();