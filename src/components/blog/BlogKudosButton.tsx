"use client";

import * as React from "react";
import { ClapIcon } from "@/components/blog/ClapIcon";
import { cn } from "@/lib/utils";

type BlogKudosButtonProps = {
  slug: string;
  initialCount: number;
  className?: string;
  compact?: boolean;
};

function formatKudosCount(count: number) {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(count);
}

export function BlogKudosButton({
  slug,
  initialCount,
  className,
  compact = false,
}: BlogKudosButtonProps) {
  const [count, setCount] = React.useState(initialCount);
  const [liked, setLiked] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    fetch(`/api/blogs/${slug}/kudos`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setCount(data.count ?? initialCount);
        setLiked(Boolean(data.liked));
        setReady(true);
      })
      .catch(() => setReady(true));

    return () => {
      cancelled = true;
    };
  }, [slug, initialCount]);

  const onToggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/blogs/${slug}/kudos`, {
        method: liked ? "DELETE" : "POST",
      });
      const data = await response.json();
      if (!response.ok) return;

      setCount(data.count ?? count);
      setLiked(Boolean(data.liked));
    } finally {
      setLoading(false);
    }
  };

  const displayCount = ready ? count : initialCount;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      aria-pressed={liked}
      aria-label={liked ? "Remove your kudos" : "Give kudos"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-background font-medium shadow-sm transition",
        compact
          ? "px-2.5 py-1 text-[12px]"
          : "px-3 py-1.5 text-[13px]",
        liked
          ? "border-amber-500/50 bg-amber-50 text-amber-700 hover:border-amber-600/60 hover:bg-amber-100 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
          : "border-border text-foreground hover:border-foreground/25 hover:bg-muted dark:text-white dark:hover:border-white/25",
        loading && "cursor-wait opacity-70",
        className,
      )}
    >
      <ClapIcon
        className={cn(
          compact ? "size-3.5" : "size-4",
          liked ? "text-amber-600 dark:text-amber-300" : "text-foreground dark:text-white",
        )}
        filled={liked}
      />
      <span className="tabular-nums">{formatKudosCount(displayCount)}</span>
    </button>
  );
}
