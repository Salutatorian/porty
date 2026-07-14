export type WhoopRecoveryPoint = {
  date: string;
  recoveryScore: number | null;
  restingHeartRate: number | null;
  hrvRmssd: number | null;
};

export type WhoopSleepSummary = {
  wakeDate: string;
  performancePct: number | null;
  efficiencyPct: number | null;
  estimatedHours: number | null;
  nap: boolean;
};

export type WhoopCycleSummary = {
  day: string;
  strain: number;
  avgHr: number | null;
};

export type WhoopSeriesPoint = {
  date: string;
  score: number;
};

export type WhoopDashboard = {
  enabled: boolean;
  message?: string;
  range?: string;
  rangeDays?: number;
  fetchedAt?: string;
  latest: WhoopRecoveryPoint | null;
  series: WhoopSeriesPoint[];
  sleep: WhoopSleepSummary | null;
  cycle: WhoopCycleSummary | null;
};
