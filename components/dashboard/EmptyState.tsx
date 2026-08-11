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
    <div className="rounded-xl border border-dashed border-zinc-200 bg-surface-subtle p-10 text-center">
      <div className="font-mono text-2xl text-zinc-400">{glyph}</div>
      <p className="mt-3 text-sm font-medium text-zinc-700">{title}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
