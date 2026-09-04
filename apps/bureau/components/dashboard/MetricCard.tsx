import { Icon } from "@maxpromo/ui";
import type { DashboardMetric } from "@/types/dashboard";

const TREND_COLOR = {
  up: "text-success",
  down: "text-danger",
  flat: "text-ink-muted",
} as const;

const TREND_ICON = { up: "trendUp", down: "trendDown", flat: "trendFlat" } as const;

export function MetricCard({ metric }: { metric: DashboardMetric }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-5 shadow-sm">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted">
        {metric.label}
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tracking-tight text-ink">
          {metric.value}
        </span>
        {metric.trend && metric.delta && (
          <span className={`text-sm font-medium ${TREND_COLOR[metric.trend]}`}>
            <Icon name={TREND_ICON[metric.trend]} size="xs" /> {metric.delta}
          </span>
        )}
      </div>
      {metric.hint && (
        <p className="mt-1 text-xs text-ink-muted">{metric.hint}</p>
      )}
    </div>
  );
}
