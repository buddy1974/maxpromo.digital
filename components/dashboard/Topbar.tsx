export function Topbar({ title }: { title: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6">
      <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-accent/30 bg-accent-soft px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
          System Preview
        </span>
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500 sm:inline">
          Supervised Mode
        </span>
      </div>
    </header>
  );
}
