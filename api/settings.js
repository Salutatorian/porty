/**
 * GET    /api/settings — public site meta (URLs, titles) for Studio + future clients
 * PATCH  /api/settings — merge update (ADMIN_PASSWORD or Bearer)
 * Storage: site/settings.json in R2 or Blob
 */
const {
  readIndexJsonFromBlob,
  writeIndexJsonToStorage,
  formatBlobError,
  isCloudStorageConfigured,
} = require("../lib/blob-utils");

const INDEX_PATH = "site/settings.json";

const DEFAULTS = {
  siteTitle: "Greater Engine",
  tagline: "",
  github: "",
  linkedin: "",
  instagram: "",
  strava: "",
  resumeUrl: "/resume.pdf",
  bookingUrl: "",
  contactEmail: "",
};

function getAuth(req) {
  const auth = (req.headers.authorization || "").trim();
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return req.headers["x-admin-password"] || "";
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

function mergeInto(target, patch) {
  const keys = Object.keys(DEFAULTS);
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(patch, k) && patch[k] !== undefined) {
      target[k] = typeof patch[k] === "string" ? patch[k].trim() : String(patch[k] || "").trim();
    }
  });
  return target;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  async function readDoc() {
    let raw = await readIndexJsonFromBlob({
      directUrl: process.env.BLOB_SITE_SETTINGS_URL,
      listPrefix: "site/",
      indexPathname: INDEX_PATH,
    });
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      raw = {};
    }
    return { ...DEFAULTS, ...raw };
  }

  if (req.method === "GET") {
    try {
      const doc = await readDoc();
      res.status(200).json(doc);
    } catch (e) {
      console.error("GET settings error:", e);
      res.status(200).json({ ...DEFAULTS });
    }
    return;
  }

  if (req.method !== "PATCH") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const pw = getAuth(req);
  const body = await parseBody(req);
  const adminPw = process.env.ADMIN_PASSWORD || "";
  const password = pw || body.password || "";
  if (!adminPw || password !== adminPw) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!isCloudStorageConfigured()) {
    res.status(503).json({
      error: "Storage not configured. Set R2_* or BLOB_READ_WRITE_TOKEN.",
    });
    return;
  }

  try {
    const cur = await readDoc();
    delete body.password;
    const next = mergeInto({ ...cur }, body);
    await writeIndexJsonToStorage(INDEX_PATH, next);
    res.status(200).json({ ok: true, settings: next });
  } catch (e) {
    console.error("PATCH settings error:", e);
    res.status(e.status || 500).json({ error: formatBlobError(e) });
  }
};
