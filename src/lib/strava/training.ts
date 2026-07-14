export type TrainingWeek = {
  weekLabel: string;
  cyclingHours: number;
  runningHours: number;
  swimmingHours: number;
};

export type TrainingDashboard = {
  weeks: TrainingWeek[];
  weekLabels: string[];
  totals: {
    totalHours: number;
    totalSessions: number;
    cyclingHours: number;
    runningHours: number;
    swimmingHours: number;
  };
  trainingDays: number;
  longestStreak: number;
  currentStreak: number;
};

function sportCategory(type: string | undefined) {
  const value = (type || "").toLowerCase();
  if (value.includes("ride") || value === "virtualride") return "cycling";
  if (value.includes("run") || value === "virtualrun") return "running";
  if (value.includes("swim")) return "swimming";
  return null;
}

async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
) {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Strava token refresh failed: ${response.status} ${error}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function fetchAllActivities(accessToken: string, after: number) {
  const activities: Array<{
    start_date: string;
    type?: string;
    sport_type?: string;
    moving_time?: number;
    distance?: number;
    name?: string;
  }> = [];

  let page = 1;
  const perPage = 200;

  while (true) {
    const url = `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=${perPage}&page=${page}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Strava activities failed: ${response.status} ${text}`);
    }

    const chunk = (await response.json()) as typeof activities;
    if (!chunk.length) break;

    activities.push(...chunk);
    if (chunk.length < perPage) break;
    page += 1;
  }

  return activities;
}

function processActivitiesToDashboard(
  activities: Awaited<ReturnType<typeof fetchAllActivities>>,
  rangeDays = 365,
): TrainingDashboard {
  const weekBuckets: Record<string, TrainingWeek> = {};
  const dayBuckets: Record<string, { minutes: number }> = {};

  activities.forEach((activity) => {
    const start = new Date(activity.start_date);
    const dayKey = start.toISOString().slice(0, 10);
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);
    const sport = sportCategory(activity.type || activity.sport_type);
    if (!sport) return;

    const hours = (activity.moving_time || 0) / 3600;

    if (!weekBuckets[weekKey]) {
      weekBuckets[weekKey] = {
        weekLabel: `W${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
        cyclingHours: 0,
        runningHours: 0,
        swimmingHours: 0,
      };
    }

    const week = weekBuckets[weekKey];
    if (sport === "cycling") week.cyclingHours += hours;
    if (sport === "running") week.runningHours += hours;
    if (sport === "swimming") week.swimmingHours += hours;

    if (!dayBuckets[dayKey]) dayBuckets[dayKey] = { minutes: 0 };
    dayBuckets[dayKey].minutes += hours * 60;
  });

  const weeks = Object.keys(weekBuckets)
    .sort()
    .map((key) => weekBuckets[key]);

  const totals = {
    cyclingHours: 0,
    runningHours: 0,
    swimmingHours: 0,
    totalHours: 0,
    totalSessions: activities.length,
  };

  weeks.forEach((week) => {
    totals.cyclingHours += week.cyclingHours;
    totals.runningHours += week.runningHours;
    totals.swimmingHours += week.swimmingHours;
  });

  totals.totalHours =
    totals.cyclingHours + totals.runningHours + totals.swimmingHours;

  const consistencyDays = Math.min(rangeDays, 365);
  let trainingDays = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let run = 0;

  for (let index = consistencyDays - 1; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    const day = dayBuckets[key];

    if (day && day.minutes > 0) {
      trainingDays += 1;
      run += 1;
      if (run > longestStreak) longestStreak = run;
    } else {
      if (run > 0 && currentStreak === 0) currentStreak = run;
      run = 0;
    }
  }

  if (run > 0 && currentStreak === 0) currentStreak = run;

  return {
    weeks,
    weekLabels: weeks.map((week) => week.weekLabel),
    totals,
    trainingDays,
    longestStreak,
    currentStreak,
  };
}

export function isStravaConfigured() {
  return Boolean(
    process.env.STRAVA_CLIENT_ID &&
      process.env.STRAVA_CLIENT_SECRET &&
      process.env.STRAVA_REFRESH_TOKEN,
  );
}

export async function getTrainingDashboard(range = "all") {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Strava env (STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN).",
    );
  }

  const rangeMap = {
    "7d": 7,
    "1m": 30,
    "3m": 90,
    "6m": 180,
    all: 365,
  } as const;
  const rangeDays = rangeMap[range as keyof typeof rangeMap] ?? 365;

  const accessToken = await refreshAccessToken(
    clientId,
    clientSecret,
    refreshToken,
  );
  const after = Math.floor(Date.now() / 1000 - rangeDays * 24 * 3600);
  const activities = await fetchAllActivities(accessToken, after);
  return processActivitiesToDashboard(activities, rangeDays);
}
