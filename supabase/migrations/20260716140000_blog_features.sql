ALTER TABLE public.portfolio_blogs
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.portfolio_blog_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid NOT NULL REFERENCES public.portfolio_blogs(id) ON DELETE CASCADE,
  visitor_key text NOT NULL,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blog_id, visitor_key),
  UNIQUE (blog_id, ip_hash)
);

CREATE INDEX IF NOT EXISTS portfolio_blog_likes_blog_id_idx
  ON public.portfolio_blog_likes (blog_id);

ALTER TABLE public.portfolio_blog_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY portfolio_blog_likes_public_read ON public.portfolio_blog_likes
  FOR SELECT
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'portfolio_blogs'
      AND policyname = 'portfolio_blogs_public_read'
  ) THEN
    CREATE POLICY portfolio_blogs_public_read ON public.portfolio_blogs
      FOR SELECT
      USING (status = 'published');
  END IF;
END $$;

INSERT INTO public.portfolio_blogs (
  slug,
  title,
  subtitle,
  excerpt,
  content_json,
  content_html,
  status,
  is_featured,
  published_at,
  updated_at
)
SELECT
  'test-test-test',
  'test test test',
  'A placeholder post to preview the Medium-style layout.',
  'test test test test test test test test test test.',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"test test test test test test test test test test test test."}]}]}'::jsonb,
  '<p>test test test test test test test test test test test test.</p>',
  'published',
  true,
  now() - interval '3 days',
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.portfolio_blogs WHERE slug = 'test-test-test'
);
