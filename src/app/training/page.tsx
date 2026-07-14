import { BackButton } from "@/components/BackButton";
import { WhoopDashboard } from "@/components/training/WhoopDashboard";
import {
  getWhoopDashboard,
  getWhoopErrorMessage,
  isWhoopConfigured,
} from "@/lib/whoop/dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function TrainingPage() {
  let error: string | null = null;
  let dashboard: Awaited<ReturnType<typeof getWhoopDashboard>>;

  try {
    dashboard = await getWhoopDashboard("all");
  } catch (caught) {
    error = getWhoopErrorMessage(caught);
    dashboard = {
      enabled: false,
      message: error,
      latest: null,
      series: [],
      sleep: null,
      cycle: null,
    };
  }

  if (!dashboard.enabled && dashboard.message && !error) {
    error = dashboard.message;
  }

  return (
    <main className="min-h-dvh bg-[#fdfcf9] text-black dark:bg-[#101010] dark:text-white">
      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:px-8">
        <BackButton href="/" />

        <header className="mt-10 max-w-xl">
          <h1 className="text-[28px] font-medium tracking-[-0.02em] sm:text-[32px]">
            Training
          </h1>
        </header>

        <div className="mt-14">
          <WhoopDashboard dashboard={dashboard} error={error} />
        </div>

        {!isWhoopConfigured() ? (
          <section className="mt-10 rounded-2xl border border-black/[0.04] bg-white/40 px-5 py-5 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <h2 className="text-[12px] uppercase tracking-[0.14em] text-foreground/40">
              Connect WHOOP
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-foreground/50">
              <li>
                Add <code className="text-foreground/70">WHOOP_CLIENT_ID</code> and{" "}
                <code className="text-foreground/70">WHOOP_CLIENT_SECRET</code> from
                the WHOOP Developer Dashboard to Vercel.
              </li>
              <li>
                Locally, set{" "}
                <code className="text-foreground/70">WHOOP_REDIRECT_URI=http://127.0.0.1:8765/whoop/callback</code>{" "}
                (same redirect in the WHOOP app settings).
              </li>
              <li>
                Run <code className="text-foreground/70">npm run whoop:auth</code>,
                approve in the browser, then paste the code.
              </li>
              <li>
                Copy <code className="text-foreground/70">WHOOP_REFRESH_TOKEN</code>{" "}
                to <code className="text-foreground/70">.env.local</code> and Vercel,
                then redeploy.
              </li>
            </ol>
          </section>
        ) : null}
      </div>
    </main>
  );
}
