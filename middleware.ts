import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { ADMIN_AUTH_BYPASS } from "@/lib/admin/auth-bypass";
import {
  getSupabaseMiddlewareEnv,
  updateSession,
} from "@/lib/supabase/middleware";

async function getRequestUser(request: NextRequest) {
  const env = getSupabaseMiddlewareEnv();
  if (!env) {
    return null;
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {},
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

function isAdminEmail(email: string | undefined) {
  if (!email) return false;
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  return Boolean(adminEmail && email.toLowerCase() === adminEmail);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacyRedirects: Record<string, string> = {
    "/admin/media/photos": "/admin/photos",
    "/admin/media/books": "/admin",
    "/admin/media/movies": "/admin",
    "/admin/media": "/admin/photos",
    "/admin/books": "/admin",
    "/admin/movies": "/admin",
    "/admin/training": "/admin",
    "/admin/homepage": "/admin",
    "/admin/about": "/admin",
    "/admin/uploads": "/admin",
    "/admin/settings": "/admin",
  };

  if (legacyRedirects[pathname]) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = legacyRedirects[pathname];
    return NextResponse.redirect(redirectUrl);
  }

  if (
    !ADMIN_AUTH_BYPASS &&
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login")
  ) {
    const user = await getRequestUser(request);

    if (!isAdminEmail(user?.email)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|ico)$).*)",
  ],
};
