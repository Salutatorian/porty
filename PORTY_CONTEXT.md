# Porty portfolio — MacBook / dev context

Portable notes for this repo (clone: https://github.com/Salutatorian/porty).

**Stack:** static HTML/CSS + vanilla JS, Node server (`npm run dev`, port 3000). No React in the main UI. Dependencies in `package.json`; run `npm install` on Mac. Secrets: copy `.env` from your other machine — never committed (`.gitignore`).

**Hero:** layered Switzerland bg + transparent hills PNGs under `heroContent`; fog; scroll step-blur on `#heroBackdrop` only (~`blur(5px)` after ~120px). Pixel dust on canvas `#heroPixelLayer` (theme-aware, fades on scroll).

**Dock:** `dock-nav.js` + `.nav--dock` styles; icons via CSS masks. Books/movies: mobile-only routes; CSS hides slots that wrap hidden `/books` / `/movies` links (phantom tooltips fixed): `.dock-slot:has(> .nav-link[href="/books"])`, etc.

**Fonts:** Inter + Departure Mono (`fonts/`) + DotGothic16/VT323 from Google Fonts; `.font-dot` for labels.

**Sections:** tech marquee (`.tech-marquee`, Simple Icons CDN), stacked cards (`#portfolio-stack`, hover fan + touch `.is-open`).

Continue from repo `main` branch; confirm no regressions when editing.

Session-by-session progress is tracked in `SESSION_LOG.md` with dates.
