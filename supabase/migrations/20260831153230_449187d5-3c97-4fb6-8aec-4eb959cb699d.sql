CREATE TABLE public.style_examples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.style_examples TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.style_examples TO authenticated;
GRANT ALL ON public.style_examples TO service_role;

ALTER TABLE public.style_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view style examples"
  ON public.style_examples FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add style examples"
  ON public.style_examples FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read style example images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'style-examples');

CREATE POLICY "Anyone can upload style example images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'style-examples');