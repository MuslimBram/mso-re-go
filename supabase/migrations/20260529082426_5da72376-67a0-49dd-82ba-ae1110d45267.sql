
ALTER TABLE public.place_suggestions
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS link_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('suggestion-photos', 'suggestion-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read suggestion photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'suggestion-photos');

CREATE POLICY "Anyone upload suggestion photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'suggestion-photos');
