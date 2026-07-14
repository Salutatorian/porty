# Admin studio setup

## 1. Environment

Copy `env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard → Settings → API → service_role)
- `ADMIN_EMAIL` (your login email)

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
