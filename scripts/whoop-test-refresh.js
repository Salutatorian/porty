#!/usr/bin/env node
/**
 * Smoke-test WHOOP refresh using the same shape as production (redirect_uri + scope).
 * On success, writes the rotated refresh_token back into .env.local.
 *
 *   npm run whoop:test-refresh
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const ENV_PATH = path.join(__dirname, "..", ".env.local");

function loadEnvLocal() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error("Missing .env.local");
    process.exit(1);
  }
  const txt = fs.readFileSync(ENV_PATH, "utf8").replace(/^\uFEFF/, "");
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
  return s.replace(/[\r\n]+/g, "").trim();
}

function postRefresh(fields) {
  const encoded = new URLSearchParams(fields).toString();
  const parsed = new URL(TOKEN_URL);
  return new Promise((resolve, reject) => {
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
          resolve({
            status: res.statusCode || 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("timeout")));
    req.write(encoded, "utf8");
    req.end();
  });
}

function saveRotatedRefreshToken(newToken) {
  const txt = fs.readFileSync(ENV_PATH, "utf8");
  const line = `WHOOP_REFRESH_TOKEN=${newToken}`;
  const updated = txt.match(/^WHOOP_REFRESH_TOKEN=/m)
    ? txt.replace(/^WHOOP_REFRESH_TOKEN=.*$/m, line)
    : `${txt.replace(/\s*$/, "\n")}${line}\n`;
  fs.writeFileSync(ENV_PATH, updated, "utf8");
  console.log("\nUpdated WHOOP_REFRESH_TOKEN in .env.local (WHOOP rotates this on every refresh).");
}

async function main() {
  loadEnvLocal();
  const refreshToken = normalizeWhoopToken(process.env.WHOOP_REFRESH_TOKEN);
  const clientId = (process.env.WHOOP_CLIENT_ID || "").trim();
  const clientSecret = (process.env.WHOOP_CLIENT_SECRET || "").trim();
  const redirectUri = normalizeWhoopToken(
    process.env.WHOOP_REFRESH_REDIRECT_URI || process.env.WHOOP_REDIRECT_URI,
  );

  if (!refreshToken || !clientId || !clientSecret) {
    console.error("Need WHOOP_REFRESH_TOKEN, WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET in .env.local");
    process.exit(1);
  }

  const attempts = [
    { label: "offline + redirect_uri", scope: "offline", redirect_uri: redirectUri },
    { label: "offline body only", scope: "offline", redirect_uri: "" },
    { label: "minimal", scope: "", redirect_uri: "", minimal: true },
  ];

  let lastStatus = 0;
  let lastBody = "";

  for (const attempt of attempts) {
    if (attempt.redirect_uri === "" && attempt.label.includes("redirect") && !redirectUri) {
      continue;
    }
    const fields = {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    };
    if (!attempt.minimal) {
      if (attempt.scope) fields.scope = attempt.scope;
      if (attempt.redirect_uri) fields.redirect_uri = attempt.redirect_uri;
    }

    const res = await postRefresh(fields);
    lastStatus = res.status;
    lastBody = res.body;
    console.log(`[${attempt.label}] HTTP ${res.status}`);

    if (res.status >= 200 && res.status < 300) {
      const data = JSON.parse(res.body);
      console.log("Refresh OK.");
      if (data.refresh_token && data.refresh_token !== refreshToken) {
        saveRotatedRefreshToken(data.refresh_token);
      }
      process.exit(0);
    }
  }

  console.log("HTTP", lastStatus);
  console.log(lastBody.slice(0, 500));
  if (lastStatus === 400 || lastStatus === 401) {
    console.error(
      "\nRefresh token is dead or mismatched. Run `npm run whoop:auth`, approve in browser, exchange the code, then update .env.local and Vercel immediately.",
    );
  }
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
