#!/usr/bin/env node
/**
 * Vercel runs `npm run build` before packaging. Some production projects omit
 * root-level static files but always merge `public/` onto the deployment root.
 * This script mirrors static assets into `public/` so /styles.css, /images/*, etc. resolve.
 *
 * Local `npm run dev`: still reads files from repo root first; falls back to public/ (server.js).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const pubDir = path.join(root, "public");

if (fs.existsSync(pubDir)) fs.rmSync(pubDir, { recursive: true, force: true });
fs.mkdirSync(pubDir, { recursive: true });

function copyRecursive(rel) {
  const src = path.join(root, rel);
  const dst = path.join(pubDir, rel);
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
}

/** Site folders served as static paths under /. */
const dirs = [
  "images",
  "fonts",
  "audio",
  "data",
  "js",
  "vendor",
  "photos",
];

/** Root files pulled in by HTML as relative or absolute / URLs. */
const rootFiles = [
  "styles.css",
  "script.js",
  "app-router.js",
  "dock-nav.js",
  "command-palette.js",
  "music-player.js",
  "page-ripple.js",
  "booking-pixel.js",
  "training.js",
  "home-projects.js",
  "photo-lightbox.js",
  "tools-photo-raw.js",
  "github-contributions.js",
  "favicon.ico",
  "ge-icon-180x180.png",
  "ge-icon-192x192.png",
  "ge-icon-512x512.png",
  "site.webmanifest",
  "resume.pdf",
];

for (const d of dirs) copyRecursive(d);
for (const f of rootFiles) {
  const src = path.join(root, f);
  if (fs.existsSync(src)) copyRecursive(f);
}

console.log("[vercel-sync-public] Wrote static mirror under public/");
