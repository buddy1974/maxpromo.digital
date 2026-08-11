import type { DailyBriefing } from "@/types/dashboard";

export function BriefingPanel({ briefing }: { briefing: DailyBriefing }) {
  return (
    <section className="rounded-xl border border-accent/30 bg-accent-soft p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
          Chief of Staff · Tagesbriefing
        </span>
        <span className="font-mono text-[11px] text-zinc-500">
          {briefing.date}
        </span>
      </div>

      <h2 className="mt-3 text-xl font-semibold text-zinc-900">
        {briefing.greeting}
      </h2>
      <p className="mt-1 text-zinc-700">{briefing.headline}</p>

      <ul className="mt-5 space-y-3">
        {briefing.items.map((item) => (
          <li key={item.id} className="flex gap-3">
            <span className="mt-1 w-20 shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-500">
              {item.label}
            </span>
            <span className="text-sm text-zinc-700">{item.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
