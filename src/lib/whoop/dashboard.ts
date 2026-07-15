import {
  fetchAllWhoopRecords,
  fetchRecoveryForCycle,
  refreshWhoopAccessToken,
} from "@/lib/whoop/client";
import { WHOOP_TRAINING_RANGE } from "@/lib/whoop/constants";
import { loadWhoopRefreshToken } from "@/lib/whoop/token-store";
import type {
  WhoopCycleSummary,
  WhoopDashboard,
  WhoopRecoveryPoint,
  WhoopSeriesPoint,
  WhoopSleepSummary,
} from "@/lib/whoop/types";

type WhoopScore = {
  recovery_score?: number;
  resting_heart_rate?: number;
  hrv_rmssd_milli?: number;
  user_calibrating?: boolean;
  strain?: number;
  average_heart_rate?: number;
  sleep_performance_percentage?: number;
  sleep_efficiency_percentage?: number;
  stage_summary?: {
    total_slow_wave_sleep_time_milli?: number;
    total_rem_sleep_time_milli?: number;
    total_light_sleep_time_milli?: number;
  };
};

type WhoopRecord = {
  id?: number | string;
  cycle_id?: number | string;
  start?: string;
  score_state?: string;
  score?: WhoopScore;
  end?: string;
  updated_at?: string;
  created_at?: string;
  timezone_offset?: string;
  nap?: boolean;
};

const RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "14d": 14,
  "1m": 30,
  "3m": 90,
  "6m": 180,
  all: 365,
};

/** Default for /training — only need ~2 weeks for the trend chart. */
export { WHOOP_TRAINING_RANGE } from "@/lib/whoop/constants";

const CACHE_TTL_MS = 60_000;
const dashboardCache = new Map<
  string,
  { expiresAt: number; data: WhoopDashboard }
>();

export function isWhoopConfigured() {
  const hasClient = Boolean(
    process.env.WHOOP_CLIENT_ID?.trim() &&
      process.env.WHOOP_CLIENT_SECRET?.trim(),
  );
  if (!hasClient) return false;

  return Boolean(
    process.env.WHOOP_REFRESH_TOKEN?.trim() ||
      (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
  );
}

function whoopSetupHint() {
  const missing: string[] = [];
  if (!process.env.WHOOP_CLIENT_ID?.trim()) missing.push("WHOOP_CLIENT_ID");
  if (!process.env.WHOOP_CLIENT_SECRET?.trim()) missing.push("WHOOP_CLIENT_SECRET");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (missing.length > 0) {
    return `Missing on Vercel: ${missing.join(", ")}. Add them in Project Settings → Environment Variables, then redeploy.`;
  }
  return "No WHOOP token in Supabase yet. Run npm run whoop:auth locally, load /training once, then redeploy Vercel.";
}

async function ensureWhoopReady() {
  const clientId = process.env.WHOOP_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.WHOOP_CLIENT_SECRET?.trim() || "";
  if (!clientId || !clientSecret) {
    return { ok: false as const, message: whoopSetupHint() };
  }

  const token = await loadWhoopRefreshToken();
  if (!token) {
    return { ok: false as const, message: whoopSetupHint() };
  }

  return { ok: true as const, clientId, clientSecret };
}

function offsetStringToMinutes(offsetStr: string) {
  const m = offsetStr.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

function wakeYmdFromCycle(cycle: WhoopRecord) {
  // WHOOP cycles begin at wake — use start, not end (end is the *next* wake).
  const anchor = cycle.start || cycle.end;
  if (!anchor) return "";
  const utcMs = Date.parse(anchor);
  if (Number.isNaN(utcMs)) return "";
  const offMin = offsetStringToMinutes(cycle.timezone_offset || "");
  return new Date(utcMs + offMin * 60000).toISOString().slice(0, 10);
}

function cycleStartTime(cycle: WhoopRecord) {
  const anchor = cycle.start || cycle.end || cycle.updated_at || "";
  const t = Date.parse(anchor);
  return Number.isNaN(t) ? 0 : t;
}

function cyclesSortedByStartDesc(cycles: WhoopRecord[]) {
  return cycles
    .filter((c) => c.start || c.end)
    .sort((a, b) => cycleStartTime(b) - cycleStartTime(a));
}

/** Today's in-progress cycle — strain updates live like the WHOOP app home screen. */
function pickCurrentCycle(cycles: WhoopRecord[]) {
  const byStart = cyclesSortedByStartDesc(cycles);
  const inProgress = byStart.find(
    (c) =>
      c.score_state !== "SCORED" &&
      c.score &&
      c.score.strain != null,
  );
  if (inProgress) return inProgress;

  const withStrain = byStart.find((c) => c.score?.strain != null);
  return withStrain ?? byStart[0] ?? null;
}

function cyclesSortedByEndDesc(cycles: WhoopRecord[]) {
  return cycles
    .filter((c) => c.end && c.score_state === "SCORED")
    .sort((a, b) => Date.parse(b.end!) - Date.parse(a.end!));
}

function formatRecoveryRecord(
  rec: WhoopRecord,
  cycle: WhoopRecord | null,
): WhoopRecoveryPoint | null {
  if (!rec.score) return null;
  const s = rec.score;
  const day =
    (cycle ? wakeYmdFromCycle(cycle) : "") ||
    (rec.updated_at || rec.created_at || "").slice(0, 10);
  return {
    date: day || (rec.updated_at || "").slice(0, 10),
    recoveryScore:
      s.recovery_score != null ? Math.round(s.recovery_score) : null,
    restingHeartRate:
      s.resting_heart_rate != null ? Math.round(s.resting_heart_rate) : null,
    hrvRmssd:
      s.hrv_rmssd_milli != null
        ? Math.round(s.hrv_rmssd_milli * 10) / 10
        : null,
  };
}

function pickRecoveryForLatestCycleJoin(
  recoveries: WhoopRecord[],
  cycles: WhoopRecord[],
) {
  const cycleById = new Map<string | number, WhoopRecord>();
  for (const c of cycles) {
    if (c.id != null) cycleById.set(c.id, c);
  }
  const scored = recoveries.filter(
    (r) =>
      r.score_state === "SCORED" &&
      r.score &&
      !r.score.user_calibrating &&
      r.cycle_id != null,
  );
  scored.sort((a, b) => {
    const ca = cycleById.get(a.cycle_id!);
    const cb = cycleById.get(b.cycle_id!);
    return cycleStartTime(cb || {}) - cycleStartTime(ca || {});
  });
  const top = scored[0];
  if (!top) return null;
  return { rec: top, cycle: cycleById.get(top.cycle_id!) || null };
}

function buildRecoverySeries(
  recoveries: WhoopRecord[],
  cycles: WhoopRecord[],
  rangeDays: number,
): WhoopSeriesPoint[] {
  const cycleById = new Map<string | number, WhoopRecord>();
  for (const c of cycles) {
    if (c.id != null) cycleById.set(c.id, c);
  }
  const byDay = new Map<string, { t: number; score: number }>();
  for (const r of recoveries) {
    if (r.score_state !== "SCORED" || !r.score || r.score.user_calibrating) continue;
    if (r.score.recovery_score == null) continue;
    const c = cycleById.get(r.cycle_id!);
    const day = c
      ? wakeYmdFromCycle(c)
      : (r.updated_at || r.created_at || "").slice(0, 10);
    if (!day || day.length < 10) continue;
    const t = c?.start
      ? Date.parse(c.start)
      : c?.end
        ? Date.parse(c.end)
        : Date.parse(r.updated_at || r.created_at || "");
    if (Number.isNaN(t)) continue;
    const prev = byDay.get(day);
    if (!prev || t > prev.t) {
      byDay.set(day, { t, score: Math.round(r.score.recovery_score) });
    }
  }
  const arr = Array.from(byDay.entries())
    .map(([date, value]) => ({ date, score: value.score }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const cap = Math.min(14, rangeDays, arr.length);
  return arr.slice(Math.max(0, arr.length - cap));
}

function pickLatestMainSleep(records: WhoopRecord[]) {
  const scored = records.filter((r) => r.score_state === "SCORED" && r.score);
  const mains = scored.filter((r) => !r.nap);
  const pool = mains.length ? mains : scored;
  let best: WhoopRecord | null = null;
  let bestT = -1;
  for (const r of pool) {
    const t = Date.parse(r.end || r.updated_at || r.created_at || "");
    if (Number.isNaN(t) || t <= bestT) continue;
    bestT = t;
    best = r;
  }
  return best;
}

function formatSleepSummary(s: WhoopRecord | null): WhoopSleepSummary | null {
  if (!s?.score) return null;
  const sc = s.score;
  const st = sc.stage_summary;
  let hours: number | null = null;
  if (st) {
    const ms =
      (st.total_slow_wave_sleep_time_milli || 0) +
      (st.total_rem_sleep_time_milli || 0) +
      (st.total_light_sleep_time_milli || 0);
    if (ms > 0) hours = Math.round((ms / 3600000) * 10) / 10;
  }
  return {
    wakeDate: (s.end || s.updated_at || "").slice(0, 10),
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

function formatCycleSummary(c: WhoopRecord | null): WhoopCycleSummary | null {
  if (!c?.score || c.score.strain == null) return null;
  const day = wakeYmdFromCycle(c) || (c.updated_at || "").slice(0, 10);
  return {
    day,
    strain: Math.round(c.score.strain * 10) / 10,
    avgHr:
      c.score.average_heart_rate != null
        ? Math.round(c.score.average_heart_rate)
        : null,
  };
}

export async function getWhoopDashboard(
  range = WHOOP_TRAINING_RANGE,
): Promise<WhoopDashboard> {
  const cached = dashboardCache.get(range);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const setup = await ensureWhoopReady();
  if (!setup.ok) {
    return {
      enabled: false,
      message: setup.message,
      latest: null,
      series: [],
      sleep: null,
      cycle: null,
    };
  }

  const rangeDays = RANGE_DAYS[range] || 365;
  const accessToken = await refreshWhoopAccessToken(
    setup.clientId,
    setup.clientSecret,
  );
  const end = new Date();
  const start = new Date(end.getTime() - rangeDays * 86400000);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const [recoveries, sleeps, cycles] = await Promise.all([
    fetchAllWhoopRecords("/v2/recovery", accessToken, startIso, endIso),
    fetchAllWhoopRecords("/v2/activity/sleep", accessToken, startIso, endIso),
    fetchAllWhoopRecords("/v2/cycle", accessToken, startIso, endIso),
  ]);

  const typedRecoveries = recoveries as WhoopRecord[];
  const typedSleeps = sleeps as WhoopRecord[];
  const typedCycles = cycles as WhoopRecord[];
  const cyclesByStart = cyclesSortedByStartDesc(typedCycles);

  let latestRecovery: WhoopRecoveryPoint | null = null;

  // Prefer recovery on the current wake cycle (often still in progress — not SCORED on cycle).
  for (const c of cyclesByStart.slice(0, 3)) {
    if (c.id == null) continue;
    const direct = (await fetchRecoveryForCycle(
      accessToken,
      c.id,
    )) as WhoopRecord | null;
    if (
      direct &&
      direct.score_state === "SCORED" &&
      direct.score &&
      !direct.score.user_calibrating
    ) {
      latestRecovery = formatRecoveryRecord(direct, c);
      break;
    }
  }

  if (!latestRecovery) {
    const joined = pickRecoveryForLatestCycleJoin(typedRecoveries, typedCycles);
    latestRecovery = joined
      ? formatRecoveryRecord(joined.rec, joined.cycle)
      : null;
  }

  const cycleForStrain = pickCurrentCycle(typedCycles);

  const data: WhoopDashboard = {
    enabled: true,
    range,
    rangeDays,
    fetchedAt: new Date().toISOString(),
    latest: latestRecovery,
    series: buildRecoverySeries(typedRecoveries, typedCycles, rangeDays),
    sleep: formatSleepSummary(pickLatestMainSleep(typedSleeps)),
    cycle: formatCycleSummary(cycleForStrain),
  };

  dashboardCache.set(range, { expiresAt: Date.now() + CACHE_TTL_MS, data });
  return data;
}

export function getWhoopErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("(429)")) {
    return "WHOOP rate limit hit (too many requests). Wait a minute, avoid refreshing repeatedly in dev, then try again.";
  }
  return message || "Failed to load WHOOP data.";
}
