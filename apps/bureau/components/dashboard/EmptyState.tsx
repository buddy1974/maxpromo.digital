export function EmptyState({
  title,
  hint,
  glyph = "○",
}: {
  title: string;
  hint?: string;
  glyph?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-hairline bg-surface-subtle p-10 text-center">
      <div className="font-mono text-2xl text-ink-muted">{glyph}</div>
      <p className="mt-3 text-sm font-medium text-ink-secondary">{title}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
