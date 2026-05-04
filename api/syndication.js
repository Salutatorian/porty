/**
 * Single Vercel function for Goodreads + Letterboxd (Hobby plan: max 12 functions).
 * Public URLs stay /api/reading and /api/movies via vercel.json rewrites + ?__route
 */
const moviesHandler = require("../lib/api-movies");
const readingHandler = require("../lib/api-reading");

module.exports = async function syndication(req, res) {
  let route = "";
  try {
    const u = new URL(req.url || "/", "http://localhost");
    route = u.searchParams.get("__route") || "";
  } catch (e) {
    route = "";
  }

  if (route === "movies") return moviesHandler(req, res);
  if (route === "reading") return readingHandler(req, res);

  res.setHeader("Access-Control-Allow-Origin", "*");
  return res.status(404).json({ error: "Not found" });
};
