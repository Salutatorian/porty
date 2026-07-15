# Admin studio setup

## 1. Environment

Copy `env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (production: `https://thegreaterengine.xyz`)
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard → Settings → API → service_role)
- `ADMIN_EMAIL` (your login email)

### Supabase redirect URLs (required for Google login)

This portfolio shares a Supabase project with [Papernhớ](https://www.papernho.com/). Papernhớ may be the **Site URL**, but you must also allow the portfolio callback or OAuth will send you back to Papernhớ after sign-in.

In [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/wiqllmjrzmnrsqcgixoz/auth/url-configuration), add these **Redirect URLs**:

- `https://thegreaterengine.xyz/**`
- `http://localhost:3000/**`
- `https://*-salutatorians-projects.vercel.app/**`

Keep Papernhớ URLs in the list too (e.g. `https://www.papernho.com/**`). See [Supabase redirect URL docs](https://supabase.com/docs/guides/auth/redirect-urls).

### Vercel

Add the same four variables in **Vercel → Project → Settings → Environment Variables** for Production. Without the Supabase URL and anon key, the deployed site can fail in middleware or fall back to demo content only.

## 2. Create your admin user

In Supabase Dashboard → Authentication → Users → Add user:

- Email: same as `ADMIN_EMAIL`
- Password: your choice

## 3. Hidden entry

On the homepage, **press and hold the theme toggle (moon/sun) for ~1.2 seconds** to open `/admin`.

## 4. What you can manage

| Section | Route | Notes |
|--------|-------|-------|
| Projects | `/admin/projects` | Paste GitHub or project URL → Import → edit → publish |
| Photos | `/admin/media/photos` | Upload image + title, location, description, etc. |
| Books | `/admin/media/books` | Title, author, status, cover URL |
| Movies | `/admin/media/movies` | Title, year, director, status, poster URL |
| Blogs | `/admin/blogs` | Title, subtitle, rich text (bold/italic/underline) |

Public pages read from Supabase when content exists. If the database is empty, they fall back to the local demo data in `src/lib/projects.ts` and `src/lib/media-items.ts`.

## 5. Storage

Photo uploads go to the `portfolio` Supabase Storage bucket.
