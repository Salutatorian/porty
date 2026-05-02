const DAY_MS = 24 * 60 * 60 * 1000;

function levelFromCount(count) {
  if (count <= 0) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 10) return 3;
  return 4;
}

function parseContributionRects(svgText) {
  const dayMap = new Map();
  const rectRegex = /<rect\b[^>]*>/g;
  let match;
  while ((match = rectRegex.exec(svgText))) {
    const tag = match[0];
    const dateMatch = tag.match(/\bdata-date="([^"]+)"/);
    const countMatch = tag.match(/\bdata-count="([^"]+)"/);
    if (!dateMatch || !countMatch) continue;
    const date = dateMatch[1];
    const count = Number(countMatch[1]) || 0;
    dayMap.set(date, {
      date,
      count,
      level: levelFromCount(count),
    });
  }
  return dayMap;
}

function toIsoDateUTC(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
    .toISOString()
    .slice(0, 10);
}

module.exports = async function githubContributionsHandler(req, res) {
  try {
    const reqUrl = new URL(req.url, "http://localhost");
    const user = (reqUrl.searchParams.get("user") || "Salutatorian").trim();
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const year = Number(reqUrl.searchParams.get("year")) || currentYear;

    if (!/^[A-Za-z0-9-]{1,39}$/.test(user)) {
      return res.status(400).json({ error: "Invalid GitHub username." });
    }

    const from = `${year}-01-01`;
    const to = `${year}-12-31`;
    const ghUrl = `https://github.com/users/${encodeURIComponent(
      user
    )}/contributions?from=${from}&to=${to}`;

    const ghRes = await fetch(ghUrl, {
      headers: {
        "User-Agent": "porty-local-server",
        Accept: "image/svg+xml,text/html",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!ghRes.ok) {
      return res
        .status(ghRes.status)
        .json({ error: "Failed to fetch GitHub contributions." });
    }

    const svgText = await ghRes.text();
    const parsed = parseContributionRects(svgText);

    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));
    const gridStart = new Date(yearStart);
    gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());
    const gridEnd = new Date(yearEnd);
    gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - gridEnd.getUTCDay()));

    const weeks = [];
    let total = 0;
    for (
      let cursor = new Date(gridStart);
      cursor <= gridEnd;
      cursor = new Date(cursor.getTime() + DAY_MS * 7)
    ) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(cursor.getTime() + d * DAY_MS);
        const iso = toIsoDateUTC(dayDate);
        const day =
          parsed.get(iso) || {
            date: iso,
            count: 0,
            level: 0,
          };
        if (iso >= from && iso <= to) total += day.count;
        week.push(day);
      }
      weeks.push(week);
    }

    res.setHeader("Cache-Control", "public, max-age=900");
    return res.json({
      user,
      year,
      total,
      weeks,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Could not load GitHub contributions.",
      details: err && err.message ? err.message : String(err),
    });
  }
};
