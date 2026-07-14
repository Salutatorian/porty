-- Single-row store for WHOOP refresh token (rotates on each OAuth refresh).
-- Only accessible via service role — no RLS policies for anon/auth users.
create table if not exists public.whoop_token (
  id text primary key default 'default',
  refresh_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.whoop_token enable row level security;
