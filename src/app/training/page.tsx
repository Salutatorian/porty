import { BackButton } from "@/components/BackButton";
import { TrainingLoadChart } from "@/components/training/TrainingLoadChart";
import {
  getStravaErrorMessage,
  getTrainingDashboard,
  isStravaConfigured,
} from "@/lib/strava/training";

export default async function TrainingPage() {
  let connected = false;
  let dashboard: Awaited<ReturnType<typeof getTrainingDashboard>> | null = null;
  let error: string | null = null;

  if (isStravaConfigured()) {
    try {
      dashboard = await getTrainingDashboard("all");
      connected = true;
    } catch (caught) {
      error = getStravaErrorMessage(caught);
    }
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

        <section className="mt-14" aria-label="Weekly training load">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[12px] uppercase tracking-[0.14em] text-foreground/40">
                Hours per week
              </h2>
              <p className="mt-2 text-[14px] text-foreground/45">
                {connected
                  ? "Rolling volume by sport from your Strava activities."
                  : "Rolling volume by sport — preview until Strava env vars are added."}
              </p>
            </div>
          </div>
          <TrainingLoadChart weeks={dashboard?.weeks} connected={connected} />
        </section>

        <section
          className="mt-10 rounded-2xl border border-black/[0.04] bg-white/40 px-5 py-5 dark:border-white/[0.06] dark:bg-white/[0.03]"
          aria-label="Strava integration"
        >
          <h2 className="text-[12px] uppercase tracking-[0.14em] text-foreground/40">
            Strava
          </h2>
          {connected && dashboard ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/35">
                  Total hours
                </p>
                <p className="mt-1 text-[20px] font-medium tabular-nums">
                  {dashboard.totals.totalHours.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/35">
                  Training days
                </p>
                <p className="mt-1 text-[20px] font-medium tabular-nums">
                  {dashboard.trainingDays}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/35">
                  Longest streak
                </p>
                <p className="mt-1 text-[20px] font-medium tabular-nums">
                  {dashboard.longestStreak}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-[14px] leading-relaxed text-foreground/45">
              {error ??
                "Add STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, and STRAVA_REFRESH_TOKEN in Vercel (copy them from your old porty project settings), then redeploy."}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
