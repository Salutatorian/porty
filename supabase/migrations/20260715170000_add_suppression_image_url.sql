ALTER TABLE public.portfolio_photo_suppressions
  ADD COLUMN IF NOT EXISTS image_url text;
