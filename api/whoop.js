/**
 * GET /api/whoop — WHOOP recovery / sleep / cycle snapshot for the training page.
 *
 * Aligns with the WHOOP app by tying recovery to the latest completed *cycle* (wake)
 * instead of sorting by recovery `updated_at`. Sleep prioritizes main sleep over naps.
 *
 * Env: WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, WHOOP_REFRESH_TOKEN
 * Optional: WHOOP_REFRESH_REDIRECT_URI — use if tokens came from localhost auth but WHOOP_REDIRECT_URI on the server points elsewhere (e.g. Vercel).
 * Docs: https://developer.whoop.com/api/
 */
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientId = (process.env.WHOOP_CLIENT_ID || "").trim();
  const clientSecret = (process.env.WHOOP_CLIENT_SECRET || "").trim();
  const refreshToken = normalizeWhoopToken(process.env.WHOOP_REFRESH_TOKEN);

  if (!clientId || !clientSecret || !refreshToken) {
    return res.status(200).json({
      enabled: false,
      message:
        "WHOOP_* not configured. Add WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, and WHOOP_REFRESH_TOKEN (see env.example).",
    });
  }

  const rawRange =
    (req.query && req.query.range) ||
    (req.url && new URL(req.url, "http://localhost").searchParams.get("range")) ||
    "all";

  const rangeDays =
    { "7d": 7, "1m": 30, "3m": 90, "6m": 180, all: 365 }[rawRange] || 365;

  try {
    const accessToken = await refreshWhoopToken(clientId, clientSecret);
    const end = new Date();
    const start = new Date(end.getTime() - rangeDays * 86400000);
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const [recoveries, sleeps, cycles] = await Promise.all([
      fetchAllRecords("/v2/recovery", accessToken, startIso, endIso),
      fetchAllRecords("/v2/activity/sleep", accessToken, startIso, endIso),
      fetchAllRecords("/v2/cycle", accessToken, startIso, endIso),
    ]);

    const sortedCycles = cyclesSortedByEndDesc(cycles);

    let latestRecovery = null;
    for (const c of sortedCycles.slice(0, 10)) {
      if (c.id == null) continue;
      const direct = await fetchRecoveryForCycle(accessToken, c.id);
      if (direct && direct.score_state === "SCORED" && direct.score && !direct.score.user_calibrating) {
        latestRecovery = formatRecoveryRecord(direct, c);
        break;
      }
    }
    if (!latestRecovery) {
      const r = pickRecoveryForLatestCycleJoin(recoveries, cycles);
      latestRecovery = r ? formatRecoveryRecord(r.rec, r.cycle) : null;
    }

    const series = buildRecoverySeries(recoveries, cycles, rangeDays);
    const sleepLast = pickLatestMainSleep(sleeps);
    const cycleForStrain =
      sortedCycles.find((c) => c.score_state === "SCORED" && c.score && c.score.strain != null) || null;

    res.setHeader("Cache-Control", "s-maxage=60, max-age=0, stale-while-revalidate");
    return res.status(200).json({
      enabled: true,
      range: rawRange,
      rangeDays,
      fetchedAt: new Date().toISOString(),
      latest: latestRecovery,
      series,
      sleep: formatSleepSummary(sleepLast),
      cycle: formatCycleSummary(cycleForStrain),
    });
  } catch (err) {
    console.error("[whoop]", err);
    return res.status(200).json({
      enabled: false,
      message: err.message || "WHOOP request failed.",
    });
  }
};

const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const WHOOP_API_BASE = "https://api.prod.whoop.com/developer";
const https = require("https");

/** Space-separated — must match `scripts/whoop-exchange-code.js` authorize `scope` (refresh may need the same string). */
const WHOOP_OAUTH_SCOPES = [
  "offline",
  "read:recovery",
  "read:cycles",
  "read:sleep",
  "read:workout",
  "read:profile",
].join(" ");

/** Strip accidental quotes/newlines/Bearer prefix from OAuth tokens and redirect URIs. */
function normalizeWhoopToken(value) {
  let s = String(value || "").trim();
  if (!s) return "";
  if (/^["'].*["']$/.test(s)) s = s.slice(1, -1).trim();
  if (s.toLowerCase().startsWith("bearer ")) s = s.slice(7).trim();
  s = s.replace(/[\r\n]+/g, "").trim();
  return s;
}

function summarizeWhoopTokenError(rawText) {
  try {
    const j = JSON.parse(rawText);
    var parts = [];
    if (j.error_hint && typeof j.error_hint === "string") parts.push(j.error_hint.trim());
    if (j.error_description && typeof j.error_description === "string") {
      var d = j.error_description.trim();
      if (!parts.some(function (p) { return d.indexOf(p) === 0; })) parts.push(d);
    }
    if (parts.length) return parts.join(" ");
  } catch (e0) {}
  return (rawText || "").trim().slice(0, 500);
}

/**
 * WHOOP accepts **client_secret_post** only. Use raw `https.request` (not `fetch`) so no client
 * stack or proxy forwards `Authorization: Basic`; Hydra reports 401 client_secret_basic if it sees Basic.
 */
function postWhoopRefresh(fields) {
  var bodyPairs = {
    grant_type: "refresh_token",
    refresh_token: fields.refresh_token,
    client_id: fields.client_id,
    client_secret: fields.client_secret,
  };
  if (fields.scope) bodyPairs.scope = fields.scope;
  if (fields.redirect_uri) bodyPairs.redirect_uri = fields.redirect_uri;

  var encoded = new URLSearchParams(bodyPairs).toString();
  var parsed = new URL(WHOOP_TOKEN_URL);
  var port = parsed.port ? Number(parsed.port) : 443;

  return new Promise(function (resolve, reject) {
    var opts = {
      hostname: parsed.hostname,
      port: port,
      path: parsed.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(encoded, "utf8"),
      },
    };

    var req = https.request(opts, function (res) {
      var chunks = [];
      res.on("data", function (c) {
        chunks.push(c);
      });
      res.on("end", function () {
        var bodyStr = Buffer.concat(chunks).toString("utf8");
        var code = res.statusCode || 0;
        resolve({
          ok: code >= 200 && code < 300,
          status: code,
          text: function () {
            return Promise.resolve(bodyStr);
          },
        });
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, function () {
      req.destroy(new Error("WHOOP token POST timed out."));
    });
    req.write(encoded, "utf8");
    req.end();
  });
}

/** WHOOP returns a new refresh_token on every refresh and invalidates the previous one.
 * We keep the latest in memory so the next /api/whoop call does not resend a dead token.
 * Serverless cold starts still need WHOOP_REFRESH_TOKEN updated in the dashboard when it rotates.
 */
let whoopRefreshTokenCache = "";
/** Avoid parallel refreshes (two successes would invalidate each other's refresh token). */
let whoopRefreshInFlight = null;

/**
 * WHOOP’s token service (Hydra) often returns `error_hint` about `redirect_uri` on refresh.
 * Try the same redirect used at authorize time + the full authorize scope string, then fall back to doc-minimal shapes.
 */
function whoopRefreshAttemptList(redirectUriRaw) {
  const ru = normalizeWhoopToken(redirectUriRaw);
  const attempts = [];

  function push(label, scope, includeRedirect) {
    var useRu = includeRedirect && ru ? ru : "";
    attempts.push({
      label: label + (useRu ? " + redirect_uri" : ""),
      scope: scope || "",
      redirect_uri: useRu,
    });
  }

  if (ru) {
    push("offline", "offline", true);
    push("full_auth_scopes", WHOOP_OAUTH_SCOPES, true);
    push("no_scope", "", true);
  }
  push("offline", "offline", false);
  push("full_auth_scopes", WHOOP_OAUTH_SCOPES, false);
  push("no_scope", "", false);

  return attempts;
}

async function refreshWhoopToken(clientId, clientSecret) {
  if (whoopRefreshInFlight) return whoopRefreshInFlight;

  whoopRefreshInFlight = (async () => {
    const fromEnv = normalizeWhoopToken(process.env.WHOOP_REFRESH_TOKEN);
    const refreshToken = normalizeWhoopToken(whoopRefreshTokenCache || fromEnv);
    if (!refreshToken) {
      throw new Error("WHOOP_REFRESH_TOKEN is empty after normalization.");
    }

    const redirectFromEnv = normalizeWhoopToken(
      process.env.WHOOP_REFRESH_REDIRECT_URI || process.env.WHOOP_REDIRECT_URI
    );
    let lastText = "";
    let lastStatus = 0;

    const bodyAttempts = whoopRefreshAttemptList(redirectFromEnv);

    for (let ti = 0; ti < bodyAttempts.length; ti++) {
      const a = bodyAttempts[ti];
      const fields = {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
        scope: a.scope,
        redirect_uri: a.redirect_uri,
      };

      const res = await postWhoopRefresh(fields);
      const t = await res.text();
      if (res.ok) {
        let data;
        try {
          data = JSON.parse(t);
        } catch (e1) {
          throw new Error("WHOOP token response was not JSON.");
        }
        if (!data.access_token) {
          throw new Error("WHOOP token response missing access_token.");
        }
        if (ti > 0) {
          console.warn('[whoop] Token refresh succeeded (fallback: "' + a.label + '").');
        }
        if (data.refresh_token) {
          whoopRefreshTokenCache = normalizeWhoopToken(data.refresh_token);
          if (whoopRefreshTokenCache !== fromEnv) {
            console.warn(
              "[whoop] New refresh_token issued — update WHOOP_REFRESH_TOKEN in .env.local / Vercel (required for cold starts)."
            );
          }
        }
        return data.access_token;
      }

      lastStatus = res.status;
      lastText = t;
      console.warn("[whoop] Refresh failed (body · " + a.label + "): " + t.slice(0, 200));
    }

    console.error("[whoop] All refresh attempts failed.", {
      refreshTokenLength: refreshToken.length,
      clientIdLength: clientId.length,
      hasSecret: !!clientSecret,
      hadRedirectEnv: !!redirectFromEnv,
    });

    throw new Error(
      "WHOOP token refresh failed (" +
        lastStatus +
        "). " +
        summarizeWhoopTokenError(lastText) +
        ' If you still see client_secret_basic after deploy, redeploy from latest main (WHOOP token POST uses raw HTTPS, not fetch) or clear Vercel build cache. Else run npm run whoop:auth, refresh WHOOP_REFRESH_TOKEN, and use WHOOP_REFRESH_REDIRECT_URI=http://127.0.0.1:8765/whoop/callback on production.'
    );
  })();

  try {
    return await whoopRefreshInFlight;
  } finally {
    whoopRefreshInFlight = null;
  }
}

async function fetchAllRecords(path, accessToken, startIso, endIso) {
  const out = [];
  let nextToken = null;

  for (;;) {
    const u = new URL(WHOOP_API_BASE + path);
    u.searchParams.set("limit", "25");
    u.searchParams.set("start", startIso);
    u.searchParams.set("end", endIso);
    if (nextToken) u.searchParams.set("nextToken", nextToken);

    const res = await fetch(u.toString(), {
      headers: { Authorization: "Bearer " + accessToken },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error("WHOOP " + path + " failed (" + res.status + "): " + t.slice(0, 180));
    }

    const j = await res.json();
    const recs = j.records || [];
    out.push(...recs);
    nextToken = j.next_token || null;
    if (!nextToken || recs.length === 0) break;
    if (out.length > 800) break;
  }

  return out;
}

/** GET /v2/cycle/:id/recovery — canonical recovery for that sleep/cycle (matches app). */
async function fetchRecoveryForCycle(accessToken, cycleId) {
  const res = await fetch(WHOOP_API_BASE + "/v2/cycle/" + cycleId + "/recovery", {
    headers: { Authorization: "Bearer " + accessToken },
    signal: AbortSignal.timeout(15000),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const t = await res.text();
    console.warn("[whoop] cycle recovery", cycleId, res.status, t.slice(0, 120));
    return null;
  }
  return res.json();
}

function cyclesSortedByEndDesc(cycles) {
  return (cycles || [])
    .filter((c) => c && c.end && c.score_state === "SCORED")
    .sort((a, b) => Date.parse(b.end) - Date.parse(a.end));
}

/**
 * WHOOP offset e.g. "-05:00" → minutes to add to UTC instant for approximate local civil time.
 */
function offsetStringToMinutes(offsetStr) {
  if (!offsetStr || typeof offsetStr !== "string") return 0;
  const m = offsetStr.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  const mins = parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
  return sign * mins;
}

/** Calendar Y-M-D for cycle wake using WHOOP cycle.end + timezone_offset (matches in-app “day”). */
function wakeYmdFromCycle(cycle) {
  if (!cycle || !cycle.end) return "";
  const utcMs = Date.parse(cycle.end);
  if (isNaN(utcMs)) return "";
  const offMin = offsetStringToMinutes(cycle.timezone_offset);
  const shiftedMs = utcMs + offMin * 60000;
  return new Date(shiftedMs).toISOString().slice(0, 10);
}

function formatRecoveryRecord(rec, cycle) {
  if (!rec || !rec.score) return null;
  const s = rec.score;
  const day = cycle ? wakeYmdFromCycle(cycle) : (rec.updated_at || rec.created_at || "").slice(0, 10);
  return {
    date: day || (rec.updated_at || "").slice(0, 10),
    recoveryScore: s.recovery_score != null ? Math.round(s.recovery_score) : null,
    restingHeartRate: s.resting_heart_rate != null ? Math.round(s.resting_heart_rate) : null,
    hrvRmssd: s.hrv_rmssd_milli != null ? Math.round(s.hrv_rmssd_milli * 10) / 10 : null,
  };
}

/** Prefer recovery row for the cycle that ended most recently (same ordering as HOME in app). */
function pickRecoveryForLatestCycleJoin(recoveries, cycles) {
  const cycleById = new Map();
  for (const c of cycles || []) {
    if (c && c.id != null) cycleById.set(c.id, c);
  }
  const scored = (recoveries || []).filter(
    (r) =>
      r &&
      r.score_state === "SCORED" &&
      r.score &&
      !r.score.user_calibrating &&
      r.cycle_id != null
  );
  scored.sort((a, b) => {
    const ca = cycleById.get(a.cycle_id);
    const cb = cycleById.get(b.cycle_id);
    const ta = ca && ca.end ? Date.parse(ca.end) : 0;
    const tb = cb && cb.end ? Date.parse(cb.end) : 0;
    return tb - ta;
  });
  const top = scored[0];
  if (!top) return null;
  return { rec: top, cycle: cycleById.get(top.cycle_id) || null };
}

function buildRecoverySeries(recoveries, cycles, rangeDays) {
  const cycleById = new Map();
  for (const c of cycles || []) {
    if (c && c.id != null) cycleById.set(c.id, c);
  }
  const byDay = new Map();
  for (const r of recoveries || []) {
    if (r.score_state !== "SCORED" || !r.score || r.score.user_calibrating) continue;
    if (r.score.recovery_score == null) continue;
    const c = cycleById.get(r.cycle_id);
    const day = c ? wakeYmdFromCycle(c) : (r.updated_at || r.created_at || "").slice(0, 10);
    if (!day || day.length < 10) continue;
    const t = c && c.end ? Date.parse(c.end) : Date.parse(r.updated_at || r.created_at || "");
    if (isNaN(t)) continue;
    const prev = byDay.get(day);
    if (!prev || t > prev.t) {
      byDay.set(day, { t, score: Math.round(r.score.recovery_score) });
    }
  }
  const arr = Array.from(byDay.entries())
    .map((e) => ({ date: e[0], score: e[1].score }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const cap = Math.min(14, rangeDays, arr.length);
  return arr.slice(Math.max(0, arr.length - cap));
}

/** Latest main sleep (not nap) by end time — aligns with nightly % in app. */
function pickLatestMainSleep(records) {
  const scored = (records || []).filter((r) => r && r.score_state === "SCORED" && r.score);
  const mains = scored.filter((r) => !r.nap);
  const pool = mains.length ? mains : scored;
  let best = null;
  let bestT = -1;
  for (const r of pool) {
    const t = Date.parse(r.end || r.updated_at || r.created_at || "");
    if (isNaN(t) || t <= bestT) continue;
    bestT = t;
    best = r;
  }
  return best;
}

function formatSleepSummary(s) {
  if (!s || !s.score) return null;
  const sc = s.score;
  const st = sc.stage_summary;
  let hours = null;
  if (st) {
    const ms =
      (st.total_slow_wave_sleep_time_milli || 0) +
      (st.total_rem_sleep_time_milli || 0) +
      (st.total_light_sleep_time_milli || 0);
    if (ms > 0) hours = Math.round((ms / 3600000) * 10) / 10;
  }
  const ended = (s.end || s.updated_at || "").slice(0, 10);
  return {
    wakeDate: ended,
    performancePct:
      sc.sleep_performance_percentage != null ? Math.round(sc.sleep_performance_percentage) : null,
    efficiencyPct:
      sc.sleep_efficiency_percentage != null ? Math.round(sc.sleep_efficiency_percentage * 10) / 10 : null,
    estimatedHours: hours,
    nap: !!s.nap,
  };
}

function formatCycleSummary(c) {
  if (!c || !c.score || c.score.strain == null) return null;
  const ended = (c.end || "").slice(0, 10);
  return {
    day: ended || (c.updated_at || "").slice(0, 10),
    strain: Math.round(c.score.strain * 10) / 10,
    avgHr:
      c.score.average_heart_rate != null ? Math.round(c.score.average_heart_rate) : null,
  };
}
