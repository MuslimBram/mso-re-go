-- Phase D: GSV-independent publishing architecture

ALTER TABLE public.tour_scenes
  ADD COLUMN IF NOT EXISTS local_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS gsv_status text NOT NULL DEFAULT 'not_published',
  ADD COLUMN IF NOT EXISTS gsv_last_error text,
  ADD COLUMN IF NOT EXISTS gsv_attempt_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gsv_last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS content_hash text;

ALTER TABLE public.tour_scenes
  DROP CONSTRAINT IF EXISTS tour_scenes_gsv_status_check;
ALTER TABLE public.tour_scenes
  ADD CONSTRAINT tour_scenes_gsv_status_check CHECK (gsv_status IN (
    'not_published','pending_review','approved','publishing',
    'published','failed','rejected','unpublished','unpublished_remote','stale'
  ));

ALTER TABLE public.gsv_publish_queue
  ADD COLUMN IF NOT EXISTS action text NOT NULL DEFAULT 'publish',
  ADD COLUMN IF NOT EXISTS attempt_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text;

ALTER TABLE public.gsv_publish_queue
  DROP CONSTRAINT IF EXISTS gsv_publish_queue_action_check;
ALTER TABLE public.gsv_publish_queue
  ADD CONSTRAINT gsv_publish_queue_action_check CHECK (action IN ('publish','unpublish','republish'));

ALTER TABLE public.gsv_publish_queue
  DROP CONSTRAINT IF EXISTS gsv_publish_queue_status_check;
ALTER TABLE public.gsv_publish_queue
  ADD CONSTRAINT gsv_publish_queue_status_check CHECK (status IN (
    'pending_review','approved','publishing','published','failed','rejected','cancelled','unpublished'
  ));

-- touch updated_at on queue
DROP TRIGGER IF EXISTS gsv_publish_queue_touch ON public.gsv_publish_queue;
CREATE TRIGGER gsv_publish_queue_touch
  BEFORE UPDATE ON public.gsv_publish_queue
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_gsv_queue_status ON public.gsv_publish_queue(status);
CREATE INDEX IF NOT EXISTS idx_tour_scenes_gsv_status ON public.tour_scenes(gsv_status);