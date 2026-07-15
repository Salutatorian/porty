CREATE TABLE IF NOT EXISTS public.portfolio_photo_suppressions (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_photo_suppressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY portfolio_photo_suppressions_public_read
  ON public.portfolio_photo_suppressions
  FOR SELECT
  USING (true);
