#!/usr/bin/env node
/**
 * Smoke-test WHOOP refresh with the same shape as api/whoop.js (scope=offline, no redirect).
 * Loads `.env.local`. Does not print secrets — only HTTP status + error JSON snippet.
 *
 *   npm run whoop:test-refresh
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  const txt = fs.readFileSync(envPath, "utf8").replace(/^\uFEFF/, "");
  txt.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "").trim();
    if (!process.env[key]) process.env[key] = value;
  });
}

function normalizeWhoopToken(value) {
  let s = String(value || "").trim();
  if (!s) return "";
  if (/^["'].*["']$/.test(s)) s = s.slice(1, -1).trim();
  if (s.toLowerCase().startsWith("bearer ")) s = s.slice(7).trim();
  s = s.replace(/[\r\n]+/g, "").trim();
  return s;
}

function main() {
  loadEnvLocal();
  const refreshToken = normalizeWhoopToken(process.env.WHOOP_REFRESH_TOKEN);
  const clientId = (process.env.WHOOP_CLIENT_ID || "").trim();
  const clientSecret = (process.env.WHOOP_CLIENT_SECRET || "").trim();
  if (!refreshToken || !clientId || !clientSecret) {
    console.error("Need WHOOP_REFRESH_TOKEN, WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET in .env.local");
    process.exit(1);
  }

  const bodyPairs = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    scope: "offline",
  };
  const encoded = new URLSearchParams(bodyPairs).toString();
  const parsed = new URL(TOKEN_URL);

  const req = https.request(
    {
      hostname: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 443,
      path: parsed.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(encoded, "utf8"),
      },
    },
    (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        console.log("HTTP", res.statusCode);
        console.log(text.slice(0, 400));
        process.exit(res.statusCode >= 200 && res.statusCode < 300 ? 0 : 1);
      });
    }
  );
  req.on("error", (e) => {
    console.error(e);
    process.exit(1);
  });
  req.setTimeout(15000, () => {
    req.destroy(new Error("timeout"));
  });
  req.write(encoded, "utf8");
  req.end();
}

main();
