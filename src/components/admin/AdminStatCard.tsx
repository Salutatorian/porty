type AdminStatCardProps = {
  label: string;
  value: number | string;
  hint?: string;
};

export function AdminStatCard({ label, value, hint }: AdminStatCardProps) {
  return (
    <div className="rounded-[12px] border border-neutral-200 bg-white px-4 py-3.5 dark:border-neutral-800 dark:bg-[#161616]">
      <p className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
        {label}
      </p>
      <p className="mt-2 text-[22px] font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[11px] text-neutral-400">{hint}</p>
      ) : null}
    </div>
  );
}
