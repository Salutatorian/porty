"use client";

import * as React from "react";
import { WhoopDashboard } from "@/components/training/WhoopDashboard";
import { WhoopSkeleton } from "@/components/training/whoop-skeleton";
import { WHOOP_TRAINING_RANGE } from "@/lib/whoop/constants";
import type { WhoopDashboard as WhoopDashboardData } from "@/lib/whoop/types";

export function WhoopPanelClient() {
  const [dashboard, setDashboard] = React.useState<WhoopDashboardData | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/whoop?range=${WHOOP_TRAINING_RANGE}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Unable to load WHOOP data.");
        }

        const data = (await response.json()) as WhoopDashboardData;

        if (cancelled) return;

        setDashboard(data);
        if (!data.enabled && data.message) {
          setError(data.message);
        }
      } catch (caught) {
        if (cancelled) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Failed to load WHOOP data.",
        );
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!dashboard) {
    return <WhoopSkeleton />;
  }

  return <WhoopDashboard dashboard={dashboard} error={error} />;
}
