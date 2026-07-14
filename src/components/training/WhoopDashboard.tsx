import { format, parseISO } from "date-fns";
import type {
  WhoopCycleSummary,
  WhoopDashboard,
  WhoopRecoveryPoint,
  WhoopSleepSummary,
} from "@/lib/whoop/types";
import { cn } from "@/lib/utils";

function formatWakeDate(dateStr: string) {
  try {
    return `Wake · ${format(parseISO(dateStr), "d MMM yyyy")}`;
  } catch {
    return `Wake · ${dateStr}`;
  }
}

function formatTrendDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "d MMM");
  } catch {
    return dateStr;
  }
}

function recoveryColor(score: number) {
  if (score >= 67) return "bg-emerald-500";
  if (score >= 34) return "bg-amber-400";
  return "bg-rose-500";
}

type WhoopDashboardProps = {
  dashboard: WhoopDashboard;
  error?: string | null;
};

function Metric({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  meta: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-[0.12em] text-foreground/40">
        {label}
      </span>
      <span className="text-[22px] font-medium tabular-nums leading-none">
        {value}
      </span>
      <span className="text-[11px] text-foreground/35">{meta}</span>
    </div>
  );
}

function renderRecovery(latest: WhoopRecoveryPoint | null) {
  const score = latest?.recoveryScore;
  const width = score != null ? Math.min(100, Math.max(0, score)) : 0;

  return (
    <article className="rounded-2xl border border-black/[0.05] bg-white/70 px-5 py-5 dark:border-white/[0.07] dark:bg-white/[0.04]">
      <p className="text-[11px] uppercase tracking-[0.14em] text-foreground/40">
        Recovery score
      </p>
      <div className="mt-3 flex items-end gap-1">
        <span className="text-[42px] font-medium tabular-nums leading-none tracking-[-0.03em]">
          {score ?? "—"}
        </span>
        <span className="pb-1 text-[18px] text-foreground/30">/ 100</span>
      </div>
      <p className="mt-2 text-[13px] text-foreground/45">
        {latest?.date ? formatWakeDate(latest.date) : "No recovery yet"}
      </p>
      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]"
        aria-hidden
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            score != null ? recoveryColor(score) : "bg-foreground/10",
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </article>
  );
}

function renderStats(
  latest: WhoopRecoveryPoint | null,
  sleep: WhoopSleepSummary | null,
  cycle: WhoopCycleSummary | null,
) {
  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-black/[0.05] bg-white/70 px-5 py-5 sm:grid-cols-4 dark:border-white/[0.07] dark:bg-white/[0.04]">
      <Metric
        label="Strain"
        value={cycle?.strain != null ? String(cycle.strain) : "—"}
        meta="today"
      />
      <Metric
        label="Sleep"
        value={
          sleep?.performancePct != null ? String(sleep.performancePct) : "—"
        }
        meta={
          sleep?.estimatedHours != null
            ? `${sleep.estimatedHours} h sleep`
            : "%"
        }
      />
      <Metric
        label="Resting HR"
        value={
          latest?.restingHeartRate != null
            ? String(latest.restingHeartRate)
            : "—"
        }
        meta="bpm"
      />
      <Metric
        label="HRV"
        value={latest?.hrvRmssd != null ? String(latest.hrvRmssd) : "—"}
        meta="RMSSD · ms"
      />
    </div>
  );
}

export function WhoopDashboard({ dashboard, error }: WhoopDashboardProps) {
  const connected = dashboard.enabled && !error;
  const notice = error || (!dashboard.enabled ? dashboard.message : null);

  return (
    <section aria-label="WHOOP today">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[12px] uppercase tracking-[0.14em] text-foreground/40">
            Today
          </h2>
          <p className="mt-2 text-[14px] text-foreground/45">
            {connected
              ? "Recovery, strain, and sleep from your WHOOP — same data as the app."
              : "Connect WHOOP to sync live recovery and training metrics."}
          </p>
        </div>
        <span className="rounded-full border border-black/[0.08] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-foreground/50 dark:border-white/[0.1]">
          WHOOP
        </span>
      </div>

      {notice ? (
        <p
          className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-[13px] leading-relaxed text-foreground/60"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      <div className="space-y-3">
        {renderRecovery(dashboard.latest)}
        {renderStats(dashboard.latest, dashboard.sleep, dashboard.cycle)}
      </div>

      {dashboard.series.length > 0 ? (
        <footer className="mt-6">
          <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-foreground/35">
            Past two weeks
          </p>
          <div
            className="flex h-14 items-end gap-1.5"
            role="group"
            aria-label="Recovery by day"
          >
            {dashboard.series.map((row) => {
              const height = Math.max(6, Math.round((Math.min(100, row.score) / 100) * 52));
              return (
                <div
                  key={row.date}
                  className={cn(
                    "min-w-0 flex-1 rounded-sm",
                    recoveryColor(row.score),
                  )}
                  style={{ height: `${height}px` }}
                  title={`${formatTrendDate(row.date)} · recovery ${row.score}`}
                  role="img"
                  aria-label={`Recovery ${row.score} on ${row.date}`}
                />
              );
            })}
            {Array.from({ length: Math.max(0, 14 - dashboard.series.length) }).map(
              (_, i) => (
                <div
                  key={`pad-${i}`}
                  className="min-w-0 flex-1 rounded-sm bg-black/[0.04] dark:bg-white/[0.06]"
                  style={{ height: "6px" }}
                  aria-hidden
                />
              ),
            )}
          </div>
        </footer>
      ) : null}
    </section>
  );
}
