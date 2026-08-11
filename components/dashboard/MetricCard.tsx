import type { DashboardMetric } from "@/types/dashboard";

const TREND_COLOR = {
  up: "text-emerald-600",
  down: "text-red-600",
  flat: "text-zinc-500",
} as const;

const TREND_GLYPH = { up: "↑", down: "↓", flat: "→" } as const;

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
        {metric.label}
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-zinc-900">
          {metric.value}
        </span>
        {metric.trend && metric.delta && (
          <span className={`text-sm font-medium ${TREND_COLOR[metric.trend]}`}>
            {TREND_GLYPH[metric.trend]} {metric.delta}
          </span>
        )}
      </div>
      {metric.hint && (
        <p className="mt-1 text-xs text-zinc-500">{metric.hint}</p>
      )}
    </div>
  );
}
