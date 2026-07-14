#!/usr/bin/env node
/**
 * One-time WHOOP OAuth helper: turn ?code=… from the browser redirect into tokens.
 *
 * 1. In WHOOP Developer Dashboard, set Redirect URL to the SAME value as WHOOP_REDIRECT_URI
 *    in .env.local (e.g. http://127.0.0.1:8765/whoop/callback).
 *
 * 2. Open the printed authorize link (includes required `state` for WHOOP). Approve.
 *    Redirect has ?code=...&state=... — copy `code` only for the next step.
 *
 * 3. Run:  npm run whoop:auth -- PASTE_THE_CODE_HERE
 *    Copy refresh_token into WHOOP_REFRESH_TOKEN and restart npm run dev.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const AUTH_BASE = "https://api.prod.whoop.com/oauth/oauth2/auth";

const DEFAULT_SCOPES = [
  "offline",
  "read:recovery",
  "read:cycles",
  "read:sleep",
  "read:workout",
  "read:profile",
].join(" ");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const txt = fs.readFileSync(envPath, "utf8").replace(/^\uFEFF/, "");
  txt.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return;
    let value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "").trim();
    if (!process.env[key]) process.env[key] = value;
  });
}

async function exchangeCode(code, clientId, clientSecret, redirectUri) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: code.trim(),
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    console.error("Token exchange failed:", res.status, text.slice(0, 500));
    process.exit(1);
  }
  return data;
}

function main() {
  loadEnvLocal();

  const clientId = process.env.WHOOP_CLIENT_ID || "";
  const clientSecret = process.env.WHOOP_CLIENT_SECRET || "";
  const redirectUri = (process.env.WHOOP_REDIRECT_URI || "").trim();
  const code = (process.argv[2] || "").trim();

  if (code && /^https?:\/\//i.test(code)) {
    console.error(
      "\nThat URL is the WHOOP *authorize* link — open it in Chrome or Safari, not in the terminal.\n\n" +
        "Steps:\n" +
        "  1. Paste that URL into your browser address bar and press Enter.\n" +
        "  2. Approve the app.\n" +
        "  3. Address bar becomes: …?code=XXXX&scope=…  — copy only the XXXX part.\n" +
        "  4. Run:  npm run whoop:auth -- PASTE_XXXX\n\n"
    );
    process.exit(1);
  }

  if (!clientId || !clientSecret) {
    console.error("Set WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET in .env.local first.");
    process.exit(1);
  }

  if (!redirectUri) {
    console.error(
      "Set WHOOP_REDIRECT_URI in .env.local to the exact Redirect URL you configured in the WHOOP app (e.g. http://127.0.0.1:8765/whoop/callback)."
    );
    process.exit(1);
  }

  if (!code) {
    const state = crypto.randomBytes(16).toString("hex");
    const u = new URL(AUTH_BASE);
    u.searchParams.set("client_id", clientId);
    u.searchParams.set("redirect_uri", redirectUri);
    u.searchParams.set("response_type", "code");
    u.searchParams.set("scope", DEFAULT_SCOPES);
    u.searchParams.set("state", state);

    console.log("\n┌─────────────────────────────────────────────────────────────────────");
    console.log("│ 1) WHOOP Developer Dashboard → your OAuth app → Redirect URL(s)");
    console.log("│    Add EXACTLY this string (copy the line below, no extra spaces):");
    console.log("└─────────────────────────────────────────────────────────────────────");
    console.log("\n    " + redirectUri + "\n");
    console.log("┌─────────────────────────────────────────────────────────────────────");
    console.log("│ 2) Then open this authorize link in your browser:\n");
    console.log("└─────────────────────────────────────────────────────────────────────\n");
    console.log(u.toString());
    console.log(
      "\nAfter you approve, copy only the value after code= from the address bar, then:\n"
    );
    console.log("  npm run whoop:auth -- YOUR_CODE_FROM_REDIRECT\n");
    return;
  }

  exchangeCode(code, clientId, clientSecret, redirectUri)
    .then((data) => {
      console.log("\n=== Success — add this to .env.local and Vercel ===\n");
      if (data.refresh_token) {
        console.log("WHOOP_REFRESH_TOKEN=" + data.refresh_token);
      } else {
        console.warn("No refresh_token in response. Full body:", JSON.stringify(data, null, 2));
      }
      console.log("\n(access_token expires; the app only needs the refresh token.)\n");
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

main();
