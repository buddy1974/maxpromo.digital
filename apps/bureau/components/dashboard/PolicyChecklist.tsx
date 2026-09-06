import { Icon } from "@maxpromo/ui";
import { TONE_BADGE } from "@maxpromo/ui";
import type { PolicyChecklistItem } from "@/types/ai-governance";

export function PolicyChecklist({ items }: { items: PolicyChecklistItem[] }) {
  const done = items.filter((i) => i.done).length;
  return (
    <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink">Policy-Checkliste</h3>
        <span className="font-mono text-label text-ink-muted">
          {done}/{items.length}
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border text-label-dense ${
                i.done
                  ? TONE_BADGE.positive
                  : TONE_BADGE.neutral
              }`}
            >
              {i.done ? <Icon name="check" size="sm" /> : null}
            </span>
            <span className={i.done ? "text-ink-muted line-through" : "text-ink"}>
              {i.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
