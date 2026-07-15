import { createHmac, randomUUID } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "blog_visitor_id";

function getSecret() {
  return (
    process.env.BLOG_VISITOR_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "portfolio-blog-visitor-dev"
  );
}

export async function getOrCreateVisitorId() {
  const jar = await cookies();
  const existing = jar.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const visitorId = randomUUID();
  jar.set(COOKIE_NAME, visitorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return visitorId;
}

export function hashVisitorKey(visitorId: string, blogId: string) {
  return createHmac("sha256", getSecret())
    .update(`${visitorId}:${blogId}`)
    .digest("hex");
}

export function hashIpAddress(ip: string) {
  return createHmac("sha256", getSecret()).update(`ip:${ip}`).digest("hex");
}

export function getRequestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
