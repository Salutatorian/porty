import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { ADMIN_AUTH_BYPASS } from "@/lib/admin/auth-bypass";
import { getAdminUser } from "@/lib/admin/auth";

export default async function AdminLoginPage() {
  if (ADMIN_AUTH_BYPASS) redirect("/admin");

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
