/**
 * GET /api/whoop — WHOOP recovery / sleep / cycle snapshot for the training page.
 *
 * Env: WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, WHOOP_REFRESH_TOKEN
 * OAuth: refresh token comes from authorization code exchange (developer.whoop.com).
 *
 * Docs: https://developer.whoop.com/api/
 */
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientId = process.env.WHOOP_CLIENT_ID || "";
  const clientSecret = process.env.WHOOP_CLIENT_SECRET || "";
  const refreshToken = process.env.WHOOP_REFRESH_TOKEN || "";

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
    const accessToken = await refreshWhoopToken(clientId, clientSecret, refreshToken);
    const end = new Date();
    const start = new Date(end.getTime() - rangeDays * 86400000);
    const startIso = start.toISOString();
    const endIso = end.toISOString();

    const [recoveries, sleeps, cycles] = await Promise.all([
      fetchAllRecords("/v2/recovery", accessToken, startIso, endIso),
      fetchAllRecords("/v2/activity/sleep", accessToken, startIso, endIso),
      fetchAllRecords("/v2/cycle", accessToken, startIso, endIso),
    ]);

    const latestRecovery = pickLatestScoredRecovery(recoveries);
    const series = buildRecoverySeries(recoveries, rangeDays);
    const sleepLast = pickLatestScoredSleep(sleeps);
    const cycleLatest = pickLatestScoredCycle(cycles);

    res.setHeader("Cache-Control", "s-maxage=120, max-age=0, stale-while-revalidate");
    return res.status(200).json({
      enabled: true,
      range: rawRange,
      rangeDays,
      latest: latestRecovery,
      series,
      sleep: formatSleepSummary(sleepLast),
      cycle: formatCycleSummary(cycleLatest),
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

async function refreshWhoopToken(clientId, clientSecret, refreshToken) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    scope: "offline",
  });

  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error("WHOOP token refresh failed (" + res.status + "): " + t.slice(0, 200));
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("WHOOP token response missing access_token.");
  }
  return data.access_token;
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
    if (out.length > 500) break;
  }

  return out;
}

function pickLatestScoredRecovery(records) {
  let best = null;
  let bestT = -1;
  for (const r of records) {
    if (r.score_state !== "SCORED" || !r.score) continue;
    const sc = r.score;
    if (sc.user_calibrating) continue;
    const t = Date.parse(r.updated_at || r.created_at || "");
    if (isNaN(t) || t <= bestT) continue;
    bestT = t;
    best = r;
  }
  if (!best) return null;
  const s = best.score;
  const day = (best.updated_at || best.created_at || "").slice(0, 10);
  return {
    date: day,
    recoveryScore: s.recovery_score != null ? Math.round(s.recovery_score) : null,
    restingHeartRate: s.resting_heart_rate != null ? Math.round(s.resting_heart_rate) : null,
    hrvRmssd:
      s.hrv_rmssd_milli != null ? Math.round(s.hrv_rmssd_milli * 10) / 10 : null,
  };
}

function buildRecoverySeries(records, rangeDays) {
  const byDay = new Map();
  for (const r of records) {
    if (r.score_state !== "SCORED" || !r.score || r.score.user_calibrating) continue;
    const sc = r.score;
    if (sc.recovery_score == null) continue;
    const day = (r.updated_at || r.created_at || "").slice(0, 10);
    if (!day || day.length < 10) continue;
    const t = Date.parse(r.updated_at || r.created_at || "");
    if (isNaN(t)) continue;
    const prev = byDay.get(day);
    if (!prev || t > prev.t) {
      byDay.set(day, { t, score: Math.round(sc.recovery_score) });
    }
  }
  const arr = Array.from(byDay.entries())
    .map(function (e) {
      return { date: e[0], score: e[1].score };
    })
    .sort(function (a, b) {
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    });

  const cap = Math.min(14, rangeDays, arr.length);
  return arr.slice(Math.max(0, arr.length - cap));
}

function pickLatestScoredSleep(records) {
  let best = null;
  let bestT = -1;
  for (const r of records) {
    if (r.score_state !== "SCORED" || !r.score) continue;
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
      sc.sleep_performance_percentage != null
        ? Math.round(sc.sleep_performance_percentage)
        : null,
    efficiencyPct:
      sc.sleep_efficiency_percentage != null
        ? Math.round(sc.sleep_efficiency_percentage * 10) / 10
        : null,
    estimatedHours: hours,
    nap: !!s.nap,
  };
}

function pickLatestScoredCycle(records) {
  let best = null;
  let bestT = -1;
  for (const r of records) {
    if (r.score_state !== "SCORED" || !r.score || r.score.strain == null) continue;
    const t = Date.parse(r.end || r.updated_at || r.created_at || "");
    if (isNaN(t) || t <= bestT) continue;
    bestT = t;
    best = r;
  }
  return best;
}

function formatCycleSummary(c) {
  if (!c || !c.score) return null;
  const ended = (c.end || "").slice(0, 10);
  return {
    day: ended || (c.updated_at || "").slice(0, 10),
    strain: Math.round(c.score.strain * 10) / 10,
    avgHr:
      c.score.average_heart_rate != null
        ? Math.round(c.score.average_heart_rate)
        : null,
  };
}
