/**
 * Local dev server: serves static site and /api/training (Strava) and /api/whoop (WHOOP).
 * Run: node server.js  (or npm run dev)
 * Requires .env.local with STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

// Load env from .env.local
try {
  const envPath = path.join(__dirname, ".env.local");
  console.log("Looking for env file at:", envPath);

  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, "utf8").replace(/^\uFEFF/, "");
    env.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const eq = trimmed.indexOf("=");
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return;
      let value = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "")
        .trim();
      process.env[key] = value;
    });

    console.log("STRAVA_CLIENT_ID loaded:", !!process.env.STRAVA_CLIENT_ID);
    console.log("STRAVA_CLIENT_SECRET loaded:", !!process.env.STRAVA_CLIENT_SECRET);
    console.log("STRAVA_REFRESH_TOKEN loaded:", !!process.env.STRAVA_REFRESH_TOKEN);
    console.log("GITHUB_TOKEN loaded:", !!process.env.GITHUB_TOKEN);
    console.log("ADMIN_PASSWORD loaded:", !!process.env.ADMIN_PASSWORD);
    if (!(process.env.ADMIN_PASSWORD || "").trim()) {
      console.warn(
        "\n[admin] ADMIN_PASSWORD missing or empty — /admin login will fail until you set ADMIN_PASSWORD in .env.local and restart this server.\n"
      );
    }
  } else {
    console.warn(".env.local was not found.");
  }
} catch (e) {
  console.error("Failed to load .env.local:", e);
}

const PORT = process.env.PORT || 3000;
const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;

function getMimeType(filePath) {
  const ext = path.extname(filePath);
  const map = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".webmanifest": "application/manifest+json",
    ".ico": "image/x-icon",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".mp3": "audio/mpeg",
    ".webp": "image/webp",
  };
  return map[ext] || "application/octet-stream";
}

function sportCategory(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("ride") || t === "virtualride") return "cycling";
  if (t.includes("run") || t === "virtualrun") return "running";
  if (t.includes("swim")) return "swimming";
  return null;
}

async function refreshAccessToken() {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: STRAVA_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error("Strava token refresh failed: " + res.status + " " + err);
  }

  const data = await res.json();
  return data.access_token;
}

async function fetchAllActivities(accessToken, after) {
  const activities = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const url = `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=${perPage}&page=${page}`;
    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + accessToken },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error("Strava activities failed: " + res.status);
    }

    const chunk = await res.json();
    if (!chunk.length) break;

    activities.push(...chunk);

    if (chunk.length < perPage) break;
    page++;
  }

  return activities;
}

function processActivitiesToDashboard(activities, rangeDays = 365) {
  const weekBuckets = {};
  const dayBuckets = {};

  const highlights = {
    longestRide: null,
    longestRun: null,
    longestSwim: null,
    biggestWeek: null,
    lastActivity: null,
  };

  activities.forEach((a) => {
    const start = new Date(a.start_date);
    const key = start.toISOString().slice(0, 10);

    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().slice(0, 10);

    const sport = sportCategory(a.type || a.sport_type);
    if (!sport) return;

    const hours = (a.moving_time || 0) / 3600;
    const miles = (a.distance || 0) / 1609.344;
    const name = a.name || "";

    if (!weekBuckets[weekKey]) {
      weekBuckets[weekKey] = {
        weekLabel: "W" + (weekStart.getMonth() + 1) + "/" + weekStart.getDate(),
        cyclingHours: 0,
        runningHours: 0,
        swimmingHours: 0,
        cyclingMiles: 0,
        runningMiles: 0,
        swimmingMiles: 0,
        cyclingSessions: 0,
        runningSessions: 0,
        swimmingSessions: 0,
      };
    }

    const w = weekBuckets[weekKey];
    w[sport + "Hours"] += hours;
    w[sport + "Miles"] += miles;
    w[sport + "Sessions"] += 1;

    if (!dayBuckets[key]) dayBuckets[key] = { minutes: 0, count: 0 };
    dayBuckets[key].minutes += hours * 60;
    dayBuckets[key].count += 1;

    const longestKey =
      sport === "cycling" ? "longestRide" : sport === "running" ? "longestRun" : "longestSwim";
    const currentLongest = highlights[longestKey];
    if (!currentLongest || miles > currentLongest.distanceMi) {
      highlights[longestKey] = { distanceMi: miles, hours, date: key, name };
    }

    if (!highlights.lastActivity || start.getTime() > new Date(highlights.lastActivity.date).getTime()) {
      highlights.lastActivity = {
        date: start.toISOString(),
        sport,
        distanceMi: miles,
        hours,
        name,
      };
    }
  });

  const weekKeys = Object.keys(weekBuckets).sort();
  const weeks = weekKeys.map((k) => weekBuckets[k]);
  const weekLabels = weeks.map((w) => w.weekLabel);

  const totals = {
    cyclingHours: 0,
    runningHours: 0,
    swimmingHours: 0,
    totalHours: 0,
    cyclingMiles: 0,
    runningMiles: 0,
    swimmingMiles: 0,
    totalMiles: 0,
    cyclingSessions: 0,
    runningSessions: 0,
    swimmingSessions: 0,
    totalSessions: 0,
    weeksCount: weeks.length,
  };

  weeks.forEach((w) => {
    totals.cyclingHours += w.cyclingHours;
    totals.runningHours += w.runningHours;
    totals.swimmingHours += w.swimmingHours;
    totals.cyclingMiles += w.cyclingMiles;
    totals.runningMiles += w.runningMiles;
    totals.swimmingMiles += w.swimmingMiles;
    totals.cyclingSessions += w.cyclingSessions;
    totals.runningSessions += w.runningSessions;
    totals.swimmingSessions += w.swimmingSessions;
  });

  totals.totalHours =
    totals.cyclingHours + totals.runningHours + totals.swimmingHours;
  totals.totalMiles =
    totals.cyclingMiles + totals.runningMiles + totals.swimmingMiles;
  totals.totalSessions =
    totals.cyclingSessions + totals.runningSessions + totals.swimmingSessions;

  let biggestWeek = null;
  weeks.forEach((w) => {
    const weekHours = w.cyclingHours + w.runningHours + w.swimmingHours;
    if (!biggestWeek || weekHours > biggestWeek.hours) {
      biggestWeek = { hours: weekHours, weekLabel: w.weekLabel };
    }
  });
  highlights.biggestWeek = biggestWeek;

  const consistencyDays = Math.min(rangeDays, 365);
  const consistencyData = [];
  let trainingDays = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let run = 0;

  for (let i = consistencyDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const day = dayBuckets[key];

    let level = 0;
    if (day && day.minutes > 0) {
      trainingDays++;
      if (day.minutes >= 90) level = 4;
      else if (day.minutes >= 45) level = 3;
      else if (day.minutes >= 20) level = 2;
      else level = 1;

      run++;
      if (run > longestStreak) longestStreak = run;
    } else {
      if (run > 0 && currentStreak === 0) currentStreak = run;
      run = 0;
    }

    consistencyData.push(level);
  }

  if (run > 0 && currentStreak === 0) currentStreak = run;

  const consistencyCols = Math.ceil(consistencyDays / 7);
  const restDays = consistencyDays - trainingDays;

  const rangeEnd = new Date();
  const rangeStart = new Date();
  rangeStart.setDate(rangeStart.getDate() - (consistencyDays - 1));
  const consistencyStart = rangeStart.toISOString().slice(0, 10);
  const consistencyEnd = rangeEnd.toISOString().slice(0, 10);

  return {
    weeks,
    weekLabels,
    totals,
    consistencyData,
    consistencyCols,
    consistencyDays,
    consistencyStart,
    consistencyEnd,
    trainingDays,
    restDays,
    longestStreak,
    currentStreak,
    highlights,
  };
}

const DATA_DIR = path.join(__dirname, "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const PHOTOS_FILE = path.join(DATA_DIR, "photos.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

function readJsonSync(filePath, fallback = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (e) {
    console.error("Read JSON error:", e);
  }
  return fallback;
}

function writeJsonSync(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("Write JSON error:", e);
    return false;
  }
}

function parseBody(req) {
  return new Promise((resolve) => {
    let buf = "";
    req.on("data", (c) => (buf += c));
    req.on("end", () => {
      try {
        resolve(buf ? JSON.parse(buf) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function attachApiResponseHelpers(res) {
  if (!res.status) {
    res.status = function (code) {
      res.statusCode = code;
      return res;
    };
  }
  if (!res.json) {
    res.json = function (data) {
      if (!res.headersSent) {
        res.setHeader("Content-Type", "application/json");
      }
      res.end(JSON.stringify(data));
    };
  }
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split("?")[0];

  if (urlPath.startsWith("/api/")) {
    attachApiResponseHelpers(res);
  }

  if (urlPath.startsWith("/api/home-projects")) {
    const homeProjectsHandler = require("./api/home-projects");
    return homeProjectsHandler(req, res);
  }

  if (urlPath === "/api/projects") {
    const projectsHandler = require("./api/projects");
    return projectsHandler(req, res);
  }

  if (urlPath === "/api/photos") {
    const photosHandler = require("./api/photos");
    return photosHandler(req, res);
  }

  if (urlPath === "/api/videos") {
    const videosHandler = require("./api/videos");
    return videosHandler(req, res);
  }

  if (urlPath === "/api/upload" && req.method === "POST") {
    const uploadHandler = require("./api/upload");
    return uploadHandler(req, res);
  }

  if (urlPath === "/api/auth") {
    const authHandler = require("./api/auth");
    return authHandler(req, res);
  }

  if (urlPath === "/api/writings") {
    const writingsHandler = require("./api/writings");
    return writingsHandler(req, res);
  }

  if (urlPath === "/api/reading" && req.method === "GET") {
    const readingHandler = require("./lib/api-reading");
    return readingHandler(req, res);
  }

  if (urlPath === "/api/movies" && req.method === "GET") {
    const moviesHandler = require("./lib/api-movies");
    return moviesHandler(req, res);
  }

  if (urlPath === "/api/github-contributions" && req.method === "GET") {
    const githubContributionsHandler = require("./api/github-contributions");
    return githubContributionsHandler(req, res);
  }

  if (urlPath === "/api/contact") {
    const contactHandler = require("./api/contact");
    return contactHandler(req, res);
  }

  if (req.url.startsWith("/api/training") && req.method === "GET") {
    if (!STRAVA_CLIENT_ID || !STRAVA_CLIENT_SECRET || !STRAVA_REFRESH_TOKEN) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error:
            "Missing Strava env (STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REFRESH_TOKEN). Copy env.example to .env.local.",
        })
      );
      return;
    }

    const url = new URL(req.url, "http://localhost");
    const range = url.searchParams.get("range") || "all";
    const rangeDays = { "7d": 7, "1m": 30, "3m": 90, "6m": 180, "all": 365 }[range] || 365;

    try {
      const accessToken = await refreshAccessToken();
      const after = Math.floor(Date.now() / 1000 - rangeDays * 24 * 3600);
      const activities = await fetchAllActivities(accessToken, after);
      const dashboard = processActivitiesToDashboard(activities, rangeDays);

      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify(dashboard));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (urlPath === "/api/whoop" && req.method === "GET") {
    const whoopHandler = require("./api/whoop");
    return whoopHandler(req, res);
  }

  let filePath = path.join(
    __dirname,
    req.url === "/" ? "index.html" : urlPath === "/admin" || urlPath === "/admin/" ? "admin/index.html" : urlPath
  );

  // Prevent path traversal — resolved path must stay inside project root
  if (!path.resolve(filePath).startsWith(path.resolve(__dirname))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!path.extname(filePath)) {
    if (fs.existsSync(filePath + ".html")) filePath += ".html";
    else if (fs.existsSync(path.join(filePath, "index.html"))) {
      filePath = path.join(filePath, "index.html");
    }
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    const publicRoot = path.resolve(__dirname, "public");
    const rel = urlPath.replace(/^\/+/, "");
    const candidate = path.resolve(publicRoot, rel);
    if (
      rel &&
      candidate.startsWith(publicRoot) &&
      fs.existsSync(candidate) &&
      fs.statSync(candidate).isFile()
    ) {
      filePath = candidate;
    } else {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
  }

  res.writeHead(200, { "Content-Type": getMimeType(filePath) });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log("Server at http://localhost:" + PORT);
  console.log("Training data: http://localhost:" + PORT + "/api/training");
  console.log("WHOOP data: http://localhost:" + PORT + "/api/whoop");
});