import { BackButton } from "@/components/BackButton";
import { TrainingLoadChart } from "@/components/training/TrainingLoadChart";

export function TrainingPageContent() {
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
                Rolling volume by sport — interactive preview until Strava syncs.
              </p>
            </div>
          </div>
          <TrainingLoadChart />
        </section>

        <section
          className="mt-10 rounded-2xl border border-black/[0.04] bg-white/40 px-5 py-5 dark:border-white/[0.06] dark:bg-white/[0.03]"
          aria-label="Strava integration"
        >
          <h2 className="text-[12px] uppercase tracking-[0.14em] text-foreground/40">
            Strava
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-foreground/45">
            Strava API integration coming next — recent activities, weekly volume,
            consistency heatmap, and favorite routes from your old training
            page will land here.
          </p>
        </section>
      </div>
    </main>
  );
}
