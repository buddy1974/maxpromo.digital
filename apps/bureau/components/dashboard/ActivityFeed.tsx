import { Icon } from "@maxpromo/ui";
import type { ActivityLog } from "@/types/activity";

const ACTOR_ICON = { user: "user", agent: "agents", system: "system" } as const;
const ACTOR_COLOR = {
  user: "text-ink-secondary",
  agent: "text-ink-muted",
  system: "text-ink-muted",
} as const;

function timeLabel(iso: string): string {
  // Render a stable HH:MM in UTC so server/client markup matches (no hydration drift).
  return `${iso.slice(11, 16)} UTC`;
}

export function ActivityFeed({ items }: { items: ActivityLog[] }) {
  return (
    <ul className="divide-y divide-hairline">
      {items.map((a) => (
        <li key={a.id} className="flex gap-3 py-3">
          <span className={`mt-0.5 font-mono text-sm ${ACTOR_COLOR[a.actor]}`}>
            <Icon name={ACTOR_ICON[a.actor]} size="sm" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink">
              <span className="font-medium">{a.actorName}</span> — {a.action}
              {a.target ? <span className="text-ink-muted"> · {a.target}</span> : null}
            </p>
            {a.detail && <p className="text-xs text-ink-muted">{a.detail}</p>}
          </div>
          <span className="shrink-0 font-mono text-[11px] text-ink-muted">
            {timeLabel(a.timestamp)}
          </span>
        </li>
      ))}
    </ul>
  );
}
