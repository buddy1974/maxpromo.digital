export function Topbar({ title }: { title: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-hairline bg-surface px-6">
      <h1 className="text-lg font-semibold tracking-tight text-ink">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-secondary">
          System Preview
        </span>
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-ink-muted sm:inline">
          Supervised Mode
        </span>
      </div>
    </header>
  );
}
