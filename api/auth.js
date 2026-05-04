/**
 * POST /api/auth — verify admin password
 * Used by /admin login. Requires ADMIN_PASSWORD in env.
 */
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

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = await parseBody(req);
  const pw = (body.password || "").trim();
  const adminPw = (process.env.ADMIN_PASSWORD || "").trim();

  if (!adminPw) {
    res.status(503).json({
      ok: false,
      error:
        "ADMIN_PASSWORD is not set on this server. For local dev, add it to .env.local and restart npm run dev. On Vercel, set it under Project → Settings → Environment Variables.",
    });
    return;
  }

  if (pw !== adminPw) {
    res.status(401).json({ ok: false, error: "Invalid password" });
    return;
  }

  res.status(200).json({ ok: true });
};
