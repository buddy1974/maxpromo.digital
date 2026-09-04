// Generic panel for a prepared (not sent) response suggestion. Reused across the
// waiting room and document desk to make the "prepared, awaiting approval" state
// visually consistent — and to keep the no-autonomous-send rule obvious.
export function ResponseSuggestionPanel({
  label = "Vorgeschlagene Antwort (Entwurf)",
  text,
}: {
  label?: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-subtle p-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">
          {label}
        </p>
        <span className="font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">
          nicht gesendet
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-secondary">{text}</p>
    </div>
  );
}
