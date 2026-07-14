# Porty migration

The previous static site is preserved on the **`legacy`** branch in this repo.

- **Current site:** Next.js portfolio (`main`)
- **Old site backup:** `legacy` branch (full HTML/CSS/JS version)

## What carries over

- **Supabase content** (photos, music, projects, blogs) lives in your Supabase project — not in git. Uploading new code does not delete it.
- **Static fallbacks** in `src/lib/` and `public/audio/` are included in this repo.
- **Environment:** set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `ADMIN_EMAIL` in Vercel (or `.env.local` locally).

## View the old site locally

```bash
git fetch origin legacy
git worktree add ../porty-legacy legacy
cd ../porty-legacy
npm install
npm start
```
