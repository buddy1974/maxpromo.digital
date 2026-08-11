import type { ActivityLog } from "@/types/activity";

const ACTOR_GLYPH = { user: "●", agent: "⊟", system: "◆" } as const;
const ACTOR_COLOR = {
  user: "text-zinc-600",
  agent: "text-zinc-500",
  system: "text-zinc-400",
} as const;

function timeLabel(iso: string): string {
  // Render a stable HH:MM in UTC so server/client markup matches (no hydration drift).
  return `${iso.slice(11, 16)} UTC`;
}

export function ActivityFeed({ items }: { items: ActivityLog[] }) {
  return (
    <ul className="divide-y divide-zinc-200">
      {items.map((a) => (
        <li key={a.id} className="flex gap-3 py-3">
          <span className={`mt-0.5 font-mono text-sm ${ACTOR_COLOR[a.actor]}`}>
            {ACTOR_GLYPH[a.actor]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-800">
              <span className="font-medium">{a.actorName}</span> — {a.action}
              {a.target ? <span className="text-zinc-500"> · {a.target}</span> : null}
            </p>
            {a.detail && <p className="text-xs text-zinc-500">{a.detail}</p>}
          </div>
          <span className="shrink-0 font-mono text-[11px] text-zinc-400">
            {timeLabel(a.timestamp)}
          </span>
        </li>
      ))}
    </ul>
  );
}
