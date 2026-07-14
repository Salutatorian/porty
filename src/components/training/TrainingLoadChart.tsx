"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TrainingWeek } from "@/lib/strava/training";

const previewData = [
  { week: "Oct", running: 5.2, cycling: 1.8, swimming: 0 },
  { week: "Nov", running: 6.1, cycling: 2.4, swimming: 0 },
  { week: "Dec", running: 4.8, cycling: 3.1, swimming: 0 },
  { week: "Jan", running: 7.4, cycling: 2.2, swimming: 0 },
  { week: "Feb", running: 6.8, cycling: 2.9, swimming: 0 },
  { week: "Mar", running: 8.1, cycling: 3.4, swimming: 0 },
];

const chartConfig = {
  running: {
    label: "Running",
    color: "#3b82f6",
  },
  cycling: {
    label: "Cycling",
    color: "#22d3ee",
  },
  swimming: {
    label: "Swimming",
    color: "#14b8a6",
  },
} satisfies ChartConfig;

type TrainingLoadChartProps = {
  weeks?: TrainingWeek[];
  connected?: boolean;
};

function toChartData(weeks: TrainingWeek[]) {
  return weeks.slice(-12).map((week) => ({
    week: week.weekLabel,
    running: Number(week.runningHours.toFixed(1)),
    cycling: Number(week.cyclingHours.toFixed(1)),
    swimming: Number(week.swimmingHours.toFixed(1)),
  }));
}

export function TrainingLoadChart({
  weeks,
  connected = false,
}: TrainingLoadChartProps) {
  const chartData =
    connected && weeks && weeks.length > 0 ? toChartData(weeks) : previewData;
  const showSwimming = chartData.some((week) => (week.swimming ?? 0) > 0);

  return (
    <div className="space-y-3">
      <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="week"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(value) => `${value} · hours`}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="running" fill="var(--color-running)" radius={4} />
          <Bar dataKey="cycling" fill="var(--color-cycling)" radius={4} />
          {showSwimming ? (
            <Bar dataKey="swimming" fill="var(--color-swimming)" radius={4} />
          ) : null}
        </BarChart>
      </ChartContainer>

      <p className="px-1 text-[11px] text-foreground/35">
        {connected
          ? "Live data from Strava"
          : "Preview data · add Strava env vars on Vercel to sync"}
      </p>
    </div>
  );
}
