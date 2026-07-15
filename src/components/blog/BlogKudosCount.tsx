import { ClapIcon } from "@/components/blog/ClapIcon";
import { cn } from "@/lib/utils";

type BlogKudosCountProps = {
  count: number;
  className?: string;
  compact?: boolean;
};

function formatKudosCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(count);
}

export function BlogKudosCount({
  count,
  className,
  compact = false,
}: BlogKudosCountProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-background font-medium text-muted-foreground shadow-sm",
        compact ? "px-2.5 py-1 text-[12px]" : "px-3 py-1.5 text-[13px]",
        className,
      )}
      aria-label={`${count} kudos`}
    >
      <ClapIcon
        className={cn(
          compact ? "size-3.5" : "size-4",
          "text-foreground/70 dark:text-white/70",
        )}
      />
      <span className="tabular-nums">{formatKudosCount(count)}</span>
    </span>
  );
}
