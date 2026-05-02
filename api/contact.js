/**
 * POST /api/contact — send portfolio contact form via Resend.
 * Env: RESEND_API_KEY (required), CONTACT_TO_EMAIL, RESEND_FROM
 */
const { Resend } = require("resend");

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (c) => {
      buf += c;
      if (buf.length > 256000) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(buf ? JSON.parse(buf) : {});
      } catch {
        resolve(null);
      }
    });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let raw;
  try {
    raw = await parseBody(req);
  } catch {
    res.status(413).json({ error: "Request too large" });
    return;
  }

  if (raw === null) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const subject = typeof raw.subject === "string" ? raw.subject.trim() : "";
  const message = typeof raw.message === "string" ? raw.message.trim() : "";

  if (!name || !email || !subject || !message) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (
    name.length > 200 ||
    email.length > 254 ||
    subject.length > 300 ||
    message.length > 20000
  ) {
    res.status(400).json({ error: "Field too long" });
    return;
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    res.status(503).json({ error: "Email is not configured on this server" });
    return;
  }

  const to = process.env.CONTACT_TO_EMAIL || "contactjoshuawaldo@gmail.com";
  const from =
    process.env.RESEND_FROM ||
    "Portfolio contact <onboarding@resend.dev>";

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: email,
      subject: `Portfolio contact: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    if (error) {
      console.error("Resend error:", error);
      const status =
        typeof error.statusCode === "number" &&
        error.statusCode >= 400 &&
        error.statusCode < 500
          ? 422
          : 502;
      const msg =
        typeof error.message === "string" && error.message.trim()
          ? error.message.trim()
          : "Failed to send message";
      res.status(status).json({ error: msg });
      return;
    }

    res.status(200).json({ success: true });
  } catch (e) {
    console.error("Contact form error:", e);
    res.status(500).json({ error: "Failed to send message" });
  }
};
