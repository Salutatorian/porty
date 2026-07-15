import { Skeleton } from "@/components/ui/skeleton";

export function WhoopSkeleton() {
  return (
    <section
      aria-label="Loading WHOOP data"
      aria-busy="true"
      className="w-full"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-14" />
          <Skeleton className="mt-4 h-4 w-[320px] max-w-full" />
        </div>

        <Skeleton className="h-7 w-20 rounded-full" />
      </div>

      <div className="mt-5 rounded-[18px] border border-foreground/[0.08] bg-foreground/[0.025] p-5">
        <Skeleton className="h-3 w-28" />

        <div className="mt-4 flex items-end gap-2">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="mb-1 h-5 w-12" />
        </div>

        <Skeleton className="mt-3 h-3 w-32" />

        <Skeleton className="mt-5 h-1.5 w-full rounded-full" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-0 rounded-[18px] border border-foreground/[0.08] bg-foreground/[0.025] p-5 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="min-w-0 py-3 sm:py-0">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-14" />
            <Skeleton className="mt-1 h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="mt-7">
        <Skeleton className="h-3 w-28" />

        <div className="mt-5 flex h-16 items-end gap-2">
          {[30, 42, 54, 18, 46, 70, 58, 66, 78, 74, 88, 76, 48, 82].map(
            (height, index) => (
              <Skeleton
                key={index}
                className="min-w-4 flex-1 rounded-md"
                style={{ height }}
              />
            ),
          )}
        </div>
      </div>

      <span className="sr-only">
        Loading recovery, strain, sleep, heart rate, and HRV.
      </span>
    </section>
  );
}
