CREATE TABLE IF NOT EXISTS public.portfolio_music (
  id text PRIMARY KEY,
  title text NOT NULL,
  artist text NOT NULL DEFAULT 'Joshua',
  audio_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_music ENABLE ROW LEVEL SECURITY;

CREATE POLICY portfolio_music_public_read ON public.portfolio_music
  FOR SELECT
  USING (published = true);
