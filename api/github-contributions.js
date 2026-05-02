const DAY_MS = 24 * 60 * 60 * 1000;

const GRAPHQL_URL = "https://api.github.com/graphql";

function levelFromCount(count) {
  if (count <= 0) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 10) return 3;
  return 4;
}

/** Rolling 365-day window: from start of (today−364) UTC through end of today UTC (aligns with GitHub "last year"). */
function rollingRangeUtc(now) {
  const toEnd = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59
    )
  );
  const fromStart = new Date(
    toEnd.getTime() - 364 * DAY_MS
  );
  const fromUtc = new Date(
    Date.UTC(
      fromStart.getUTCFullYear(),
      fromStart.getUTCMonth(),
      fromStart.getUTCDate(),
      0,
      0,
      0
    )
  );
  return {
    from: fromUtc.toISOString(),
    to: toEnd.toISOString(),
    fromDay: fromUtc.toISOString().slice(0, 10),
    toDay: toEnd.toISOString().slice(0, 10),
  };
}

module.exports = async function githubContributionsHandler(req, res) {
  try {
    const reqUrl = new URL(req.url, "http://localhost");
    const raw =
      reqUrl.searchParams.get("username") ||
      reqUrl.searchParams.get("user") ||
      "Salutatorian";
    const user = String(raw).trim();
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const rangeParam = (reqUrl.searchParams.get("range") || "rolling").toLowerCase();
    const rangeMode = rangeParam === "calendar" ? "calendar" : "rolling";

    if (!/^[A-Za-z0-9-]{1,39}$/.test(user)) {
      return res.status(400).json({ error: "Invalid GitHub username." });
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token || !String(token).trim()) {
      console.error(
        "[github-contributions] GITHUB_TOKEN is not set — cannot load contribution calendar."
      );
      return res.status(503).json({ error: "Missing GITHUB_TOKEN" });
    }

    let fromIso;
    let toIso;
    let calendarYear = null;
    let fromDay;
    let toDay;

    if (rangeMode === "calendar") {
      calendarYear = Number(reqUrl.searchParams.get("year")) || currentYear;
      const start = new Date(Date.UTC(calendarYear, 0, 1));
      const end = new Date(Date.UTC(calendarYear, 11, 31, 23, 59, 59));
      fromIso = start.toISOString();
      toIso = end.toISOString();
      fromDay = `${calendarYear}-01-01`;
      toDay = `${calendarYear}-12-31`;
    } else {
      const r = rollingRangeUtc(now);
      fromIso = r.from;
      toIso = r.to;
      fromDay = r.fromDay;
      toDay = r.toDay;
    }

    const query = `
      query($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  weekday
                  color
                }
              }
            }
          }
        }
      }
    `;

    const ghRes = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "User-Agent": "porty-github-contributions",
      },
      body: JSON.stringify({
        query,
        variables: {
          login: user,
          from: fromIso,
          to: toIso,
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    const bodyText = await ghRes.text();
    let json;
    try {
      json = JSON.parse(bodyText);
    } catch {
      return res.status(502).json({
        error: "Invalid response from GitHub GraphQL.",
        details: bodyText.slice(0, 200),
      });
    }

    if (!ghRes.ok) {
      console.error(
        "[github-contributions] GitHub HTTP error:",
        ghRes.status,
        bodyText.slice(0, 500)
      );
      if (ghRes.status === 401 || ghRes.status === 403) {
        return res.status(401).json({
          error: "Invalid or unauthorized GITHUB_TOKEN.",
          details: json.message || ghRes.statusText,
        });
      }
      return res.status(502).json({
        error: "GitHub GraphQL request failed.",
        details: json.message || ghRes.statusText,
      });
    }

    if (json.errors && json.errors.length) {
      const msg = json.errors.map((e) => e.message).join("; ");
      console.error("[github-contributions] GraphQL errors:", msg);
      return res.status(422).json({
        error: "GitHub GraphQL error.",
        details: msg,
      });
    }

    const gqlUser = json.data && json.data.user;
    if (!gqlUser) {
      return res.status(404).json({ error: `GitHub user not found: ${user}` });
    }

    const calendar =
      gqlUser.contributionsCollection &&
      gqlUser.contributionsCollection.contributionCalendar;

    if (!calendar || !Array.isArray(calendar.weeks)) {
      return res.status(502).json({
        error: "GitHub returned no contribution calendar.",
      });
    }

    const totalContributions =
      typeof calendar.totalContributions === "number"
        ? calendar.totalContributions
        : calendar.weeks.reduce(function (sum, week) {
            const days = week.contributionDays || [];
            return (
              sum +
              days.reduce(function (s, d) {
                return s + (Number(d.contributionCount) || 0);
              }, 0)
            );
          }, 0);

    const weeks = calendar.weeks.map(function (week) {
      const days = week.contributionDays || [];
      return days.map(function (day) {
        const dateStr =
          typeof day.date === "string"
            ? day.date.slice(0, 10)
            : String(day.date || "").slice(0, 10);
        const count = Number(day.contributionCount) || 0;
        return {
          date: dateStr,
          count,
          level: levelFromCount(count),
          color: day.color || null,
          weekday:
            typeof day.weekday === "number" ? day.weekday : undefined,
        };
      });
    });

    res.setHeader("Cache-Control", "public, max-age=900");
    return res.json({
      user,
      range: rangeMode === "calendar" ? "calendar" : "rolling",
      year: calendarYear,
      from: fromDay,
      to: toDay,
      total: totalContributions,
      totalContributions,
      weeks,
    });
  } catch (err) {
    console.error("[github-contributions]", err);
    return res.status(500).json({
      error: "Could not load GitHub contributions.",
      details: err && err.message ? err.message : String(err),
    });
  }
};
