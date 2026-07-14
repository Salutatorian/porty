import https from "node:https";
import { normalizeWhoopToken } from "@/lib/whoop/normalize";
import {
  loadWhoopRefreshToken,
  saveWhoopRefreshToken,
} from "@/lib/whoop/token-store";

const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const WHOOP_API_BASE = "https://api.prod.whoop.com/developer";

const WHOOP_OAUTH_SCOPES = [
  "offline",
  "read:recovery",
  "read:cycles",
  "read:sleep",
  "read:workout",
  "read:profile",
].join(" ");

const WHOOP_REFRESH_REDIRECT_FALLBACKS = [
  "http://127.0.0.1:8765/whoop/callback",
  "http://localhost:8765/whoop/callback",
];

let whoopRefreshTokenCache = "";
let whoopRefreshInFlight: Promise<string> | null = null;
let whoopAccessTokenCache = { token: "", expiresAt: 0 };

export { normalizeWhoopToken } from "@/lib/whoop/normalize";

function resolveWhoopRedirectForRefresh() {
  let primary = normalizeWhoopToken(process.env.WHOOP_REFRESH_REDIRECT_URI);
  if (primary && !/^https?:\/\//i.test(primary)) primary = "";
  let fallback = normalizeWhoopToken(process.env.WHOOP_REDIRECT_URI);
  if (fallback && !/^https?:\/\//i.test(fallback)) fallback = "";
  return normalizeWhoopToken(primary || fallback);
}

function summarizeWhoopTokenError(rawText: string) {
  try {
    const j = JSON.parse(rawText) as {
      error_hint?: string;
      error_description?: string;
    };
    const parts: string[] = [];
    if (j.error_hint?.trim()) parts.push(j.error_hint.trim());
    if (j.error_description?.trim()) {
      const d = j.error_description.trim();
      if (!parts.some((p) => d.startsWith(p))) parts.push(d);
    }
    if (parts.length) return parts.join(" ");
  } catch {
    // ignore
  }
  return rawText.trim().slice(0, 500);
}

export function whoopRefreshFailureUserHint(lastText: string) {
  try {
    const j = JSON.parse(lastText) as { error?: string };
    if (j.error === "invalid_grant") {
      return "WHOOP rejected this refresh token. Run `npm run whoop:auth`, copy the new WHOOP_REFRESH_TOKEN into .env.local and Vercel, then redeploy.";
    }
    if (j.error === "invalid_client") {
      return "WHOOP_CLIENT_ID or WHOOP_CLIENT_SECRET does not match your app in the WHOOP dashboard.";
    }
    if (j.error === "invalid_request") {
      return "WHOOP rejected the refresh request. Run `npm run whoop:auth`, sync WHOOP_* vars to .env.local and Vercel, and register redirect http://127.0.0.1:8765/whoop/callback in the WHOOP dashboard.";
    }
  } catch {
    // ignore
  }
  return summarizeWhoopTokenError(lastText);
}

function postWhoopRefresh(fields: {
  refresh_token: string;
  client_id: string;
  client_secret: string;
  scope?: string;
  redirect_uri?: string;
  minimal?: boolean;
}) {
  const bodyPairs: Record<string, string> = {
    grant_type: "refresh_token",
    refresh_token: fields.refresh_token,
    client_id: fields.client_id,
    client_secret: fields.client_secret,
  };
  if (!fields.minimal) {
    if (fields.scope) bodyPairs.scope = fields.scope;
    if (fields.redirect_uri) bodyPairs.redirect_uri = fields.redirect_uri;
  }

  const encoded = new URLSearchParams(bodyPairs).toString();
  const parsed = new URL(WHOOP_TOKEN_URL);
  const port = parsed.port ? Number(parsed.port) : 443;

  return new Promise<{ ok: boolean; status: number; text: string }>(
    (resolve, reject) => {
      const req = https.request(
        {
          hostname: parsed.hostname,
          port,
          path: parsed.pathname,
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(encoded, "utf8"),
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const bodyStr = Buffer.concat(chunks).toString("utf8");
            const code = res.statusCode || 0;
            resolve({ ok: code >= 200 && code < 300, status: code, text: bodyStr });
          });
        },
      );
      req.on("error", reject);
      req.setTimeout(15000, () => req.destroy(new Error("WHOOP token POST timed out.")));
      req.write(encoded, "utf8");
      req.end();
    },
  );
}

function whoopRefreshAttemptList(redirectUriRaw: string) {
  const ru = normalizeWhoopToken(redirectUriRaw);
  const attempts: Array<{
    label: string;
    scope: string;
    redirect_uri: string;
    minimal: boolean;
  }> = [];

  function push(label: string, scope: string, redirectUri: string, minimal: boolean) {
    attempts.push({
      label: label + (redirectUri ? " + redirect_uri" : ""),
      scope,
      redirect_uri: redirectUri,
      minimal,
    });
  }

  function tripleForRedirect(rUri: string, prefix: string) {
    if (!rUri) return;
    push(`${prefix}offline`, "offline", rUri, false);
    push(`${prefix}full_auth_scopes`, WHOOP_OAUTH_SCOPES, rUri, false);
    push(`${prefix}no_scope`, "", rUri, false);
  }

  push("offline·body", "offline", "", false);
  push("full_auth_scopes·body", WHOOP_OAUTH_SCOPES, "", false);
  push("no_scope·body", "", "", false);
  push("minimal_four_fields_only", "", "", true);

  const seen = new Set<string>();
  const ordered: string[] = [];
  if (ru) {
    ordered.push(ru);
    seen.add(ru);
  }
  for (const u of WHOOP_REFRESH_REDIRECT_FALLBACKS) {
    if (!seen.has(u)) {
      ordered.push(u);
      seen.add(u);
    }
  }
  for (let i = 0; i < ordered.length; i++) {
    tripleForRedirect(ordered[i], `u${i}·`);
  }

  return attempts;
}

export async function refreshWhoopAccessToken(clientId: string, clientSecret: string) {
  // Access tokens last ~1h. Reuse them so we don't rotate the refresh_token on every page view.
  if (
    whoopAccessTokenCache.token &&
    whoopAccessTokenCache.expiresAt > Date.now() + 120_000
  ) {
    return whoopAccessTokenCache.token;
  }

  if (whoopRefreshInFlight) return whoopRefreshInFlight;

  whoopRefreshInFlight = (async () => {
    const fromStored = await loadWhoopRefreshToken();
    const fromEnv = normalizeWhoopToken(process.env.WHOOP_REFRESH_TOKEN);
    const refreshToken = normalizeWhoopToken(
      whoopRefreshTokenCache || fromStored || fromEnv,
    );
    if (!refreshToken) {
      throw new Error("WHOOP_REFRESH_TOKEN is empty after normalization.");
    }

    const redirectFromEnv = resolveWhoopRedirectForRefresh();
    let lastText = "";
    let lastStatus = 0;

    for (const attempt of whoopRefreshAttemptList(redirectFromEnv)) {
      const res = await postWhoopRefresh({
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        scope: attempt.scope,
        redirect_uri: attempt.redirect_uri,
        minimal: attempt.minimal,
      });

      if (res.ok) {
        const data = JSON.parse(res.text) as {
          access_token?: string;
          refresh_token?: string;
          expires_in?: number;
        };
        if (!data.access_token) {
          throw new Error("WHOOP token response missing access_token.");
        }
        const expiresIn =
          typeof data.expires_in === "number" ? data.expires_in : 3600;
        whoopAccessTokenCache = {
          token: data.access_token,
          expiresAt: Date.now() + expiresIn * 1000,
        };
        if (data.refresh_token) {
          const rotated = normalizeWhoopToken(data.refresh_token);
          whoopRefreshTokenCache = rotated;
          await saveWhoopRefreshToken(rotated, refreshToken);
        }
        return data.access_token;
      }

      lastStatus = res.status;
      lastText = res.text;
    }

    throw new Error(
      `WHOOP token refresh failed (${lastStatus}). ${whoopRefreshFailureUserHint(lastText)}`,
    );
  })();

  try {
    return await whoopRefreshInFlight;
  } finally {
    whoopRefreshInFlight = null;
  }
}

type WhoopRecord = Record<string, unknown>;

export async function fetchAllWhoopRecords(
  path: string,
  accessToken: string,
  startIso: string,
  endIso: string,
) {
  const out: WhoopRecord[] = [];
  let nextToken: string | null = null;

  for (;;) {
    const u = new URL(WHOOP_API_BASE + path);
    u.searchParams.set("limit", "25");
    u.searchParams.set("start", startIso);
    u.searchParams.set("end", endIso);
    if (nextToken) u.searchParams.set("nextToken", nextToken);

    const res = await fetch(u.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    });

    if (!res.ok) {
      const t = await res.text();
      if (res.status === 429) {
        throw new Error(
          `WHOOP ${path} failed (429): rate limited — wait 60s before retrying.`,
        );
      }
      throw new Error(`WHOOP ${path} failed (${res.status}): ${t.slice(0, 180)}`);
    }

    const j = (await res.json()) as { records?: WhoopRecord[]; next_token?: string };
    const recs = j.records || [];
    out.push(...recs);
    nextToken = j.next_token || null;
    if (!nextToken || recs.length === 0) break;
    if (out.length > 800) break;
  }

  return out;
}

export async function fetchRecoveryForCycle(accessToken: string, cycleId: number | string) {
  const res = await fetch(`${WHOOP_API_BASE}/v2/cycle/${cycleId}/recovery`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<WhoopRecord>;
}
