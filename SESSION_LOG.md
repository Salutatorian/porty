# Porty Session Log

Shared progress log so MacBook + desktop stay aligned after `git pull`.

## 2026-05-02 (UTC+10)

### Session Summary
- Installed project dependencies (`npm install`) after `npm` became available.
- Simplified homepage intro (removed purple avatar/profile block, moved to minimal text-first intro).
- Restored infinite side-to-side stack marquee section after accidental removal.
- Updated hero intro text to:
  - `Joshua Waldo`
  - `learning full stack dev`
  - `<blank>` placeholder for future bio text.
- Dock updates:
  - Added Books + Movies back into dock flow.
  - Added Search + Theme as dock actions.
  - Hid top-right Search/Theme controls to keep these in dock.
  - Fixed tooltip stacking issues and standardized to one readable dock tooltip layer.
- Stack marquee visual:
  - Removed white container background behind marquee to keep layout but cleaner transparent look.
- Added GitHub contributions feature:
  - New API route `GET /api/github-contributions` via `api/github-contributions.js`.
  - New client renderer `github-contributions.js`.
  - New homepage section with interactive hover tooltips and Less→More legend.
- Added “Connect with me” section with dark monochrome icons (no brand colors), reusing existing links:
  - Email, GitHub, LinkedIn, Instagram, Strava, Resume.

### Files Added
- `SESSION_LOG.md`
- `api/github-contributions.js`
- `github-contributions.js`

### Files Updated
- `PORTY_CONTEXT.md`
- `index.html`
- `styles.css`
- `dock-nav.js`
- `script.js`
- `command-palette.js`
- `server.js`

### Next Start Checklist
- Restart local server after route changes:
  - `npm run dev`
- Verify:
  - `/api/github-contributions?user=Salutatorian&range=rolling` returns JSON.
  - GitHub heatmap section loads.
  - Connect links are correct (user to confirm final URLs).

### Update — contributions window
- Default fetch is **`range=rolling`** (last **365 days** of **public** contributions from GitHub’s graph), not calendar year only — better once repos are public.
- Calendar year still available: `?range=calendar&year=2025`.

---

## 2026-05-02 — Contact / stack / email (follow-up)

### Session Summary
- **Connect / social:** CSS grid layout for social pills (`socialLinks` / `socialLink`), responsive columns + narrow horizontal scroll fallback; Strava icon aligned with header asset.
- **Contact:** Rebuilt as two-column **contact card** (intro + Copy email + Book a meeting on Cal.com `josh-allen-v1jqpl`; compact form on the right). Extra bottom padding so fixed dock does not cover actions.
- **Public email:** Prefers `contactjoshuawaldo@gmail.com`; Copy button uses same.
- **Portfolio hero:** Removed redundant GitHub / LinkedIn / Resume pill row (duplicated Connect section).
- **Tech stack marquee:** Simple Icons URLs use single monochrome hex (`2f2a25`); dark mode uses invert filter on rasterized CDN icons.
- **Contact delivery:** Replaced `mailto:` submit with **`POST /api/contact`** using **Resend** (`api/contact.js`). Secrets via **`RESEND_API_KEY`** (and optional `RESEND_FROM`, `CONTACT_TO_EMAIL`). Wired in **`server.js`** and **`vercel.json`** (`api/contact.js`).
- **`admin/index.html`:** Help mailto updated to contact inbox.
- **`env.example`:** Documents Resend variables.

### Operational note (Resend testing)
- With **`onboarding@resend.dev`**, Resend only delivers **to your Resend-account email** until a domain is verified. Set **`CONTACT_TO_EMAIL`** accordingly locally/Vercel, or verify a domain and update **`RESEND_FROM`**.

### Files Added
- `api/contact.js`

### Files Updated (high level)
- `index.html`, `styles.css`, `server.js`, `vercel.json`, `package.json`, `package-lock.json`, `env.example`, `admin/index.html`, `SESSION_LOG.md`

### Next Start Checklist
- Local: `.env.local` with **`RESEND_API_KEY`** (never commit). Restart **`npm run dev`** after env changes.
- Vercel (when deployed): set **`RESEND_API_KEY`**, **`CONTACT_TO_EMAIL`**, optional **`RESEND_FROM`** in project env.

### Agent convention
- Cursor rule **`.cursor/rules/session-log.mdc`** (`alwaysApply`): substantive repo changes should update this file (`SESSION_LOG.md`) in the same batch so pushes always carry a current log.

---

## 2026-05-02 — Contact: two cards + optional email

### Session Summary
- **Contact section only:** Two side-by-side cards on desktop (stack on mobile): **form card** (left) + **“Let’s talk” / Book a call** bento-style card (right). Removed visible inbox, intro blurb, and Copy email to avoid clutter.
- **Form:** Name, optional email, subject, message. Client + API require **name, subject, message** only. **`/api/contact`** sends to **`contactjoshuawaldo@gmail.com`**; **`replyTo`** only when a valid email is provided. No `mailto`.
- **Booking card:** Placeholder **`https://cal.com/YOURUSERNAME`** with HTML comment to replace; warm-beige / purple-glow theming; **`contact-booking-card.js`** + **GSAP** (CDN) for subtle particles, spotlight, border glow, click pulse; **tilt off**; **`prefers-reduced-motion`** disables canvas/animation.
- **Dependencies:** `gsap` in `package.json` (booking card only; form has no GSAP).

### Files Added
- `contact-booking-card.js`

### Files Updated
- `index.html`, `styles.css`, `api/contact.js`, `package.json`, `package-lock.json`, `SESSION_LOG.md`

---

## 2026-05-02 — Connect: icon-only social row

### Session Summary
- **“Connect with me” row only:** Icon-only **72×72** rounded cards, **28px** SVGs, **6 columns** desktop / **3 columns** at `max-width: 720px`. Removed label `<span>`s (no ellipsis). **`aria-label`** + **`title`** on each link; custom **`::after`** tooltip from `aria-label` on hover/focus; dark theme uses a light tooltip chip.

### Files Updated
- `index.html`, `styles.css`, `SESSION_LOG.md`

---

## 2026-05-02 — Booking card: React Bits–style PixelCard (esbuild)

### Session Summary
- **Book a call card only:** Replaced GSAP “MagicBento” canvas with a **React `PixelCard`** (canvas grid shimmer on hover/focus, **`prefers-reduced-motion`** disables animation intensity). Theme-aware **`colors`** via `BookingCard` + MutationObserver (warm beige/amber light; purple-blue dark).
- **Static site:** Not Next/shadcn — **`booking-pixel.js`** is an **esbuild IIFE** bundle (`npm run build:booking`). Mount: `#booking-pixel-root` beside contact form; **`booking-pixel.js`** loaded with **`defer`**.
- **Removed:** `contact-booking-card.js`, GSAP CDN script, **`gsap`** npm dependency.

### Files Added
- `src/booking/PixelCard.jsx`, `src/booking/BookingCard.jsx`, `src/booking/booking-entry.jsx`, `booking-pixel.js` (built bundle — rebuild after editing JSX)

### Files Updated
- `index.html`, `styles.css`, `package.json`, `package-lock.json`, `SESSION_LOG.md`

### Files Removed
- `contact-booking-card.js`

---

## 2026-05-02 — GitHub contributions: fix stuck loading

### Session Summary
- **Root cause:** `github-contributions.js` used an **undefined `user`** in the fetch URL (ReferenceError before `fetch`), so the promise **`.catch` never ran** and the stat stayed on **“Loading contributions...”**
- **Fix:** Read **`data-user`** from `#github-contrib-grid` (default **`Salutatorian`**), **async/await** with **`try` / `catch` / `finally`**, **stale-request** guard via **`requestGeneration`**, error copy **“Could not load GitHub contributions.”**, **`console.error`** + optional **`[github-contrib debug]`** logs (toggle **`GH_CONTRIB_DEBUG`**).
- **API** remains **`GET /api/github-contributions`** (server-side fetch to GitHub—no browser CORS to GitHub).

### Files Updated
- `github-contributions.js`, `SESSION_LOG.md`

---

## 2026-05-02 — Contact grid: equal-height cards

### Session Summary
- **`.contactGrid`:** `1.2fr / 0.9fr`, **`align-items: stretch`** (unchanged intent); **`.contactFormCard`** **`height: 100%`**.
- **`.contactBookingMount`:** flex column, **`height: 100%`**, **`min-height: 0`**; inner **`.bookingPixelCard`** **`flex: 1`**, **`display: flex`**, **`flex-direction: column`** so the Pixel canvas layer + content fill the row height.
- **Booking content:** **`bookingPixelBlock--top` / `--middle` / `--bottom`** — eyebrow top, title + copy centered in **`flex: 1`** middle, button anchored bottom; rebuilt **`booking-pixel.js`**.

### Files Updated
- `styles.css`, `src/booking/BookingCard.jsx`, `booking-pixel.js`, `SESSION_LOG.md`

---

## 2026-05-02 — GitHub contributions: GraphQL + GITHUB_TOKEN

### Session Summary
- **`GET /api/github-contributions`** now uses **GitHub GraphQL** `contributionsCollection` / `contributionCalendar` (same data as the profile graph), not HTML/SVG scraping.
- **Env:** **`GITHUB_TOKEN`** required — if missing, **503** with **`{ "error": "Missing GITHUB_TOKEN" }`** (no silent all-zero grid).
- **Response:** `total` / `totalContributions` from GitHub, **`weeks`** mapped to `{ date, count, level, color, weekday }` for the existing heatmap UI.
- **Client:** fetches **`?username=`** (still accepts `user=`), **debug logs** for URL, status, and payload summary; **error** line shows API message (e.g. missing token) up to 220 chars.
- **`env.example`:** documents **`GITHUB_TOKEN`**; **`vercel.json`:** `maxDuration` for this function.

### Files Updated
- `api/github-contributions.js`, `github-contributions.js`, `env.example`, `vercel.json`, `SESSION_LOG.md`

---

## 2026-05-02 — Dock simplify + Media hub

### Session Summary
- **Sidebar / dock:** Reduced items to **Home → Media → Tools → Training → Search → Theme** on every site-shell page (mobile menu trimmed to **home, media, writing, tools, training, admin**).
- **Removed from dock:** Portfolio, About, Writing, and separate Books/Movies/Photos/Videos entries (those routes remain reachable).
- **New `media.html`:** Hub with four cards linking to `/books`, `/movies`, `/photos`, `/videos`; matching typography (`portfolio-eyebrow`, dot font, cards).
- **`dock-nav.js`:** Updated labels and separators (**after Media**, **after Training**).
- **`styles.css`:** `/media` dock icon (Images-style SVG); removed unused per-href dock rules for removed dock targets; **media hub** layout styles; **`site-shell--media`** width rule.
- **`app-router.js`:** Active nav highlights **media** on `/media` and on books/movies/photos/videos subpages.
- **`command-palette.js`:** **Media** entry added near top of Pages.
- **`vercel.json`:** `/media` redirect + rewrite.
- **Homepage stack card “Media”** now links to **`/media`** instead of **`/photos`**.

### Files Added
- `media.html`

### Files Updated
- `index.html`, `*.html` (site-shell pages + writing posts), `styles.css`, `dock-nav.js`, `app-router.js`, `command-palette.js`, `vercel.json`, `SESSION_LOG.md`

---

## 2026-05-02 — Dock tooltip: hide on click

### Session Summary
- **`dock-nav.js`:** Tooltip is **hover-only** (removed `focus` → show tooltip). On **`pointerdown`** / **`mousedown`** / **`click`** (capture): dismiss tooltip and **`blur()`** the activated link so focus does not keep the label visible; Search/Theme behavior preserved.

### Files Updated
- `dock-nav.js`, `SESSION_LOG.md`

---

## 2026-05-02 — Hero → content: soft fade only (revert overlap)

### Session Summary
- Reverted the hero/page overlap (it pulled the content block up and produced a tan rectangle over the hero).
- **Removed:** `hero-transition-mist` markup, scroll-linked `--hero-blend-progress` JS, and the `.page-home--portfolio` negative-margin / padding-top / solid-background overlap rule.
- **Kept:** `--page-surface` / `--page-surface-rgb` tokens (light/dark/reading).
- **Kept (simpler):** `.hero.alpine-hero::after` 160px gradient fade into `var(--page-surface)` — no layout movement, hero copy untouched.

### Files Updated
- `index.html`, `styles.css`, `SESSION_LOG.md`

---

## 2026-05-02 — Tech marquee: linked pills

### Session Summary
- Each stack pill is now **`<a class="tech-pill">`** to official docs/home (**target="_blank"**, **`rel="noopener noreferrer"`**). Minimal **hover/focus** styles for anchors.

### Files Updated
- `index.html`, `styles.css`, `SESSION_LOG.md`

---

## 2026-05-02 — Homepage hero: remove tagline

### Session Summary
- Removed the hero **`<p class="heroSubtitle">`** line (“teaching, training, writing, and building things that matter.”).

### Files Updated
- `index.html`, `SESSION_LOG.md`

---

## 2026-05-02 — Portfolio section labels: larger + remove stack h2

### Session Summary
- Removed **“Tools I reach for”** (`h2`) from the tech stack section; **`stack`** eyebrow keeps **`id="stack-title"`** for **aria-labelledby**.
- Enlarged **`.portfolio-eyebrow`** (section titles like projects / explore / stack) via **`clamp(13px, 1.15vw, 16px)`** and slightly tighter letter-spacing.

### Files Updated
- `index.html`, `styles.css`, `SESSION_LOG.md`

---

## 2026-05-02 — Connect: remove mailto (contact form only)

### Session Summary
- Removed the duplicate **mailto** envelope pill from **connect with me**; visitors reach you via the **contact** form and other social links.

### Files Updated
- `index.html`, `SESSION_LOG.md`

---

## 2026-05-02 — Home: no section hairlines; explore deck paused

### Session Summary
- Removed **horizontal hairline dividers** between portfolio sections (`.portfolio-section` **border-top**) and relied on **larger vertical gaps** instead.
- **Explore** card stack is **hidden via CSS** (class **`portfolio-section--explore-paused`**) so the HTML and deck behavior stay in the repo for a future friends/network strip — remove that class on the section to show it again.

### Files Updated
- `index.html`, `styles.css`, `SESSION_LOG.md`

---

## 2026-05-02 — Remove home “experience” section

### Session Summary
- Dropped the placeholder **experience** portfolio block from the homepage so it no longer appears in the scroll flow.

### Files Updated
- `index.html`, `SESSION_LOG.md`

---

## 2026-05-02 — Writing in sidebar dock (all pages)

### Session Summary
- Added **`/writing`** to the **desktop dock** (home → media → **writing** → tools → training, matching mobile) on every page with the shared sidebar nav.
- **`dock-nav.js`** tooltip + **`styles.css`** pen icon / label for Writing.

### Files Updated
- `about.html`, `books.html`, `index.html`, `media.html`, `movies.html`, `photos.html`, `portfolio.html`, `tools.html`, `training.html`, `videos.html`, `writing/*.html`, `dock-nav.js`, `styles.css`, `SESSION_LOG.md`

---

## 2026-05-02 — Home Projects (Current / Future tabs); remove Live Entries

### Session Summary
- Replaced the blank **projects** strip with a **tabbed Projects** section (**Current** | **Future**), driven by **`home-projects.js`** (`currentProjects` / `futureProjects` arrays).
- Removed **Live Entries** from the homepage and removed the **Life** admin pane/tab (home projects are edited in **`home-projects.js`** for now). Portfolio/code projects admin + **`/portfolio`** page unchanged.
- **`/api/projects`** remains for portfolio entries; **`data/projects.json`** was already empty.

### Files Updated
- `index.html`, `home-projects.js`, `styles.css`, `admin/index.html`, `SESSION_LOG.md`

---

## 2026-05-02 — Homepage projects: API, admin page, seed data

### Session Summary
- **Single source of truth** for the home “Current / Future” project cards: **`/api/home-projects`** (`api/home-projects.js`) with optional **R2 / Vercel Blob** at **`home-projects/index.json`** or local fallback **`data/home-projects.json`**.
- Admin UI: **`/admin/home-projects`** — password via **`POST /api/auth`**, **`sessionStorage.admin_pw`**, **`Authorization: Bearer`** on writes (same pattern as main admin).
- **GET** is public; responses without auth omit **`visible === false`** items. Full list and mutations require **`ADMIN_PASSWORD`**.
- Main **`/admin`** dashboard includes a banner link to this editor.
- **`home-projects.js`**: cleaner tab binding after fetch.
- **`env.example`**: optional **`BLOB_HOME_PROJECTS_INDEX_URL`**.

### Files Added / Updated
- Added: `admin/home-projects.html`, `data/home-projects.json`
- Updated: `admin/index.html`, `home-projects.js`, `env.example`, `SESSION_LOG.md`

### Operational notes
- Local: **`ADMIN_PASSWORD`** in `.env.local`; restart **`npm run dev`**. Seed JSON used when cloud index is missing.
- Production: **`BLOB_READ_WRITE_TOKEN`** or **R2** env; optional **`BLOB_HOME_PROJECTS_INDEX_URL`** for faster reads.

---

## 2026-05-02 — Get in touch: merged Connect + Contact

### Session Summary
- Combined **Connect with me** and **Contact** into one **`GET IN TOUCH`** section (`portfolio-eyebrow`: “get in touch”).
- Layout: **social icon row** → **two-column grid** (message form | booking PixelCard); **`contactShell`** max-width **1180px**.
- Tighter vertical rhythm: **`socialLinks`** margins **`28px` / `48px`**, removed extra gap between former sections; section padding **`96px 24px 160px`** so the fixed dock clears content.
- Responsive: **`contactGrid`** stacks at **`900px`** max-width.

### Files Updated
- `index.html`, `styles.css`, `SESSION_LOG.md`

---

## 2026-05-02 — Greater Engine wordmark logo

### Session Summary
- Added **`/images/greater-engine-logo.png`** dot-matrix wordmark; swapped the text **“greater engine”** in **`.brand-name`** / **`.mobile-nav-brand-name`** for **`<img class="brand-logo" />`** across every sidebar page (kept the small **“the”** prefix).
- CSS: **`.brand-logo`** / **`.mobile-nav-brand-logo`** sized to fit the sidebar/mobile nav; dark-mode `filter: invert(1)` so the black wordmark stays visible.

### Files Updated
- `images/greater-engine-logo.png` (new), `styles.css`, all 15 sidebar pages (`index.html`, `about.html`, `books.html`, `media.html`, `movies.html`, `photos.html`, `portfolio.html`, `tools.html`, `training.html`, `videos.html`, `writing/*.html`), `SESSION_LOG.md`

---

## 2026-05-02 — Two-mode theme toggle + animated dock sun/moon

### Session Summary
- Removed the third **`reading`** theme. Toggle now flips **dark ↔ light** only. Stored `"reading"` values are auto-migrated to `"light"` on load. Reading-mode entry in the command palette removed.
- Dock **`#theme`** button now swaps icon by current theme: **sun** in light mode, **moon** in dark mode (CSS-only, via `[data-theme="dark"] .nav-link[href="#theme"]` overriding `--dock-icon`).
- Click adds an **`is-flipping`** class for a brief rotate/scale + opacity transition before applying the theme — the icon visibly animates between sun and moon.
- Admin page toggle simplified to two modes too.

### Files Updated
- `script.js`, `styles.css`, `command-palette.js`, `admin/index.html`, all 15 sidebar pages + `admin/home-projects.html` (inline boot script), `SESSION_LOG.md`

---

## 2026-05-03 — Friends FAB: reliable after theme toggle

### Session Summary
- **Bugfix:** Friends FAB click handler moved into **`script.js`** and registered in the **capture** phase so the dock theme control’s **`stopPropagation`** cannot block reopening after switching light ↔ dark without refresh.
- **Behavior:** Closing the FAB on **`themechange`** so overlays never get stuck visually.

### Files Updated
- `script.js`, `index.html`, `SESSION_LOG.md`
