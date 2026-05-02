/**
 * GET    /api/home-projects — list projects (optionally full list with Authorization)
 * POST   /api/home-projects — create project (ADMIN_PASSWORD)
 * PUT    /api/home-projects?id= — update by id (ADMIN_PASSWORD)
 * PATCH  /api/home-projects — reorder { ids: string[] } (ADMIN_PASSWORD)
 * DELETE /api/home-projects?id= — delete by id (ADMIN_PASSWORD)
 *
 * Storage: R2 / Vercel Blob at home-projects/index.json, else data/home-projects.json (local).
 */
const fs = require("fs");
const path = require("path");
const {
  formatBlobError,
  readIndexJsonFromBlob,
  writeIndexJsonToStorage,
  isCloudStorageConfigured,
} = require("../lib/blob-utils");

const INDEX_PATH = "home-projects/index.json";
const FILE_FALLBACK = path.join(process.cwd(), "data", "home-projects.json");

function getAuth(req) {
  const auth = (req.headers.authorization || "").trim();
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return (req.headers["x-admin-password"] || "").trim();
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
    req.on("error", () => resolve({}));
  });
}

function normalizeDoc(raw) {
  if (raw === null || raw === undefined) return { items: [] };
  if (Array.isArray(raw)) return { items: raw };
  if (typeof raw === "object" && Array.isArray(raw.items)) return { items: raw.items };
  return { items: [] };
}

async function readDocFromBlob() {
  return readIndexJsonFromBlob({
    directUrl: process.env.BLOB_HOME_PROJECTS_INDEX_URL,
    listPrefix: "home-projects/",
    indexPathname: INDEX_PATH,
  });
}

function readDocFromFile() {
  try {
    if (fs.existsSync(FILE_FALLBACK)) {
      const t = fs.readFileSync(FILE_FALLBACK, "utf8");
      return normalizeDoc(JSON.parse(t || "{}"));
    }
  } catch (e) {
    console.error("home-projects file read:", e);
  }
  return { items: [] };
}

async function loadDoc() {
  let raw = await readDocFromBlob();
  if (raw === null) raw = readDocFromFile();
  return normalizeDoc(raw);
}

async function persistDoc(doc) {
  const json = JSON.stringify(doc, null, 2);
  if (isCloudStorageConfigured()) {
    await writeIndexJsonToStorage(INDEX_PATH, doc);
    return;
  }
  try {
    const dir = path.dirname(FILE_FALLBACK);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FILE_FALLBACK, json, "utf8");
  } catch (e) {
    console.error("home-projects file write:", e);
    const err = new Error(e.message || "Failed to write local file");
    err.status = 500;
    throw err;
  }
}

function requireAdmin(body, req) {
  const pw = getAuth(req) || (body && body.password) || "";
  const adminPw = process.env.ADMIN_PASSWORD || "";
  if (!adminPw || pw !== adminPw) return false;
  return true;
}

function validateProjectInput(body, partial) {
  const err = [];
  const type = body.type === "future" ? "future" : "current";
  const title = String(body.title || "").trim();
  if (!partial && !title) err.push("title required");
  const description = body.description !== undefined ? String(body.description) : partial ? undefined : "";
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];
  let priority = body.priority;
  if (priority !== undefined && priority !== null) {
    priority = String(priority).toLowerCase();
    if (!["high", "medium", "low"].includes(priority)) priority = undefined;
  }
  const links = Array.isArray(body.links)
    ? body.links
        .filter((l) => l && (l.href || l.label))
        .map((l) => ({
          label: String(l.label || "").trim() || "Link",
          href: String(l.href || "").trim() || "#",
        }))
    : [];
  const notes = body.notes !== undefined ? String(body.notes) : partial ? undefined : "";
  const visible = body.visible === false ? false : true;
  const status =
    body.status !== undefined && body.status !== null ? String(body.status).trim() : "";

  return {
    ok: err.length === 0,
    err,
    val: {
      type,
      title,
      description,
      tags,
      priority,
      links,
      notes,
      visible,
      status,
    },
  };
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    const ao = typeof a.sortOrder === "number" ? a.sortOrder : 0;
    const bo = typeof b.sortOrder === "number" ? b.sortOrder : 0;
    if (ao !== bo) return ao - bo;
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  if (!res.json) {
    res.json = function (data) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(data));
    };
  }
  if (!res.status) {
    res.status = function (code) {
      res.statusCode = code;
      return res;
    };
  }

  const url = new URL(req.url || "/", "http://localhost");
  const idParam = url.searchParams.get("id");

  if (req.method === "GET") {
    try {
      const doc = await loadDoc();
      let items = sortItems(doc.items || []);
      const authOk = requireAdmin({}, req);
      if (!authOk) {
        items = items.filter((p) => p.visible !== false);
      }
      res.status(200).json({ items });
    } catch (e) {
      console.error("GET home-projects:", e);
      res.status(500).json({ error: e.message || "Failed to load" });
    }
    return;
  }

  const body = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
    ? await parseBody(req)
    : {};

  if (!requireAdmin(body, req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    let doc = await loadDoc();
    let items = Array.isArray(doc.items) ? [...doc.items] : [];

    if (req.method === "POST") {
      const v = validateProjectInput(body, false);
      if (!v.ok) {
        res.status(400).json({ error: v.err.join(", ") });
        return;
      }
      const maxOrder = items.reduce((m, p) => Math.max(m, typeof p.sortOrder === "number" ? p.sortOrder : 0), 0);
      const id = `hm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const row = {
        id,
        type: v.val.type,
        title: v.val.title || "Untitled",
        description: v.val.description || "",
        tags: v.val.tags,
        links: v.val.links,
        notes: v.val.notes || "",
        visible: v.val.visible,
        status: v.val.status,
        priority: v.val.priority,
        sortOrder: maxOrder + 1,
      };
      if (row.type === "current") delete row.priority;
      else row.status = row.status || "";
      items.push(row);
      doc = { items };
      await persistDoc(doc);
      res.status(200).json({ ok: true, id });
      return;
    }

    if (req.method === "PUT") {
      if (!idParam) {
        res.status(400).json({ error: "Missing id query param" });
        return;
      }
      const idx = items.findIndex((p) => String(p.id) === String(idParam));
      if (idx === -1) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      const cur = { ...items[idx] };
      if (body.title !== undefined) cur.title = String(body.title || "").trim() || cur.title;
      if (body.description !== undefined) cur.description = String(body.description);
      if (body.type !== undefined) cur.type = body.type === "future" ? "future" : "current";
      if (body.tags !== undefined) {
        cur.tags = Array.isArray(body.tags)
          ? body.tags.map((t) => String(t).trim()).filter(Boolean)
          : [];
      }
      if (body.links !== undefined) {
        cur.links = Array.isArray(body.links)
          ? body.links
              .filter((l) => l && (l.href || l.label))
              .map((l) => ({
                label: String(l.label || "").trim() || "Link",
                href: String(l.href || "").trim() || "#",
              }))
          : [];
      }
      if (body.notes !== undefined) cur.notes = String(body.notes);
      if (body.visible !== undefined) cur.visible = body.visible !== false;
      if (body.status !== undefined) cur.status = String(body.status || "").trim();
      if (body.priority !== undefined) {
        const pr = String(body.priority || "").toLowerCase();
        cur.priority = ["high", "medium", "low"].includes(pr) ? pr : undefined;
      }
      if (body.sortOrder !== undefined && typeof body.sortOrder === "number") {
        cur.sortOrder = body.sortOrder;
      }
      if (cur.type === "current") delete cur.priority;
      if (cur.type === "future") cur.status = cur.status || "";
      items[idx] = cur;
      doc = { items };
      await persistDoc(doc);
      res.status(200).json({ ok: true, updated: idParam });
      return;
    }

    if (req.method === "PATCH") {
      const ids = Array.isArray(body.ids) ? body.ids.map(String) : null;
      if (!ids || !ids.length) {
        res.status(400).json({ error: "Expected body.ids array for reorder" });
        return;
      }
      ids.forEach((rid, i) => {
        const p = items.find((x) => String(x.id) === rid);
        if (p) p.sortOrder = i;
      });
      doc = { items };
      await persistDoc(doc);
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "DELETE") {
      if (!idParam) {
        res.status(400).json({ error: "Missing id query param" });
        return;
      }
      const next = items.filter((p) => String(p.id) !== String(idParam));
      if (next.length === items.length) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      doc = { items: next };
      await persistDoc(doc);
      res.status(200).json({ ok: true, deleted: idParam });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error("home-projects mutation:", e);
    res.status(e.status || 500).json({ error: formatBlobError(e) });
  }
};
