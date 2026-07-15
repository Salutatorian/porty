import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { ADMIN_AUTH_BYPASS } from "@/lib/admin/auth-bypass";
import { getAdminUser } from "@/lib/admin/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (ADMIN_AUTH_BYPASS) redirect("/admin");

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background p-6 md:p-10">
        <div className="w-full max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <h1 className="text-lg font-semibold text-foreground">
            Admin login unavailable
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This deployment is missing{" "}
            <code className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            in Vercel environment variables.
          </p>
        </div>
      </div>
    );
  }

  const user = await getAdminUser();
  if (user) redirect("/admin");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
