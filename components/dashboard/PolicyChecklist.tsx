import type { PolicyChecklistItem } from "@/types/ai-governance";

export function PolicyChecklist({ items }: { items: PolicyChecklistItem[] }) {
  const done = items.filter((i) => i.done).length;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-zinc-900">Policy-Checkliste</h3>
        <span className="font-mono text-[11px] text-zinc-500">
          {done}/{items.length}
        </span>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                i.done
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-zinc-300 text-zinc-300"
              }`}
            >
              {i.done ? "✓" : ""}
            </span>
            <span className={i.done ? "text-zinc-400 line-through" : "text-zinc-900"}>
              {i.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
