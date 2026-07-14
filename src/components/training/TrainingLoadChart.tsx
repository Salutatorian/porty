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

const chartData = [
  { week: "Oct", running: 5.2, cycling: 1.8 },
  { week: "Nov", running: 6.1, cycling: 2.4 },
  { week: "Dec", running: 4.8, cycling: 3.1 },
  { week: "Jan", running: 7.4, cycling: 2.2 },
  { week: "Feb", running: 6.8, cycling: 2.9 },
  { week: "Mar", running: 8.1, cycling: 3.4 },
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
} satisfies ChartConfig;

export function TrainingLoadChart() {
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
        </BarChart>
      </ChartContainer>

      <p className="px-1 text-[11px] text-foreground/35">
        Preview data · live Strava sync coming next
      </p>
    </div>
  );
}
