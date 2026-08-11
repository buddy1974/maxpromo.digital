import type { DocumentRequiredAction } from "@/types/document-intake";
import { EmptyState } from "./EmptyState";

export function RequiredActionPanel({
  actions,
}: {
  actions: DocumentRequiredAction[];
}) {
  if (!actions.length) {
    return (
      <p className="text-xs text-zinc-500">Keine offene Aktion erforderlich.</p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {actions.map((a) => (
        <li key={a.id} className="flex items-center justify-between text-sm">
          <span className="text-zinc-700">{a.label}</span>
          {a.deadline && (
            <span className="font-mono text-[11px] text-orange-600">
              bis {a.deadline}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

// Note: EmptyState imported for callers that prefer a richer empty block.
export { EmptyState };
