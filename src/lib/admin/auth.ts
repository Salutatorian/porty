import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_AUTH_BYPASS } from "@/lib/admin/auth-bypass";

function getBypassAdminUser(): User {
  return {
    id: "bypass-admin",
    email: process.env.ADMIN_EMAIL ?? "admin@localhost",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}

export async function getAdminUser() {
  if (ADMIN_AUTH_BYPASS) {
    return getBypassAdminUser();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!adminEmail || user.email.toLowerCase() !== adminEmail) {
    return null;
  }

  return user;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function getAdminDb() {
  await requireAdmin();
  return createAdminClient();
}
