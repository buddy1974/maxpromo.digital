import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MOCK_MEMORY } from "@/lib/mock/memory";
import type { MemoryEntryType } from "@/types/memory";

const TYPE_LABEL: Record<MemoryEntryType, string> = {
  contact: "Kontakt",
  company: "Firma",
  project: "Projekt",
  decision: "Entscheidung",
  note: "Notiz",
  conversation: "Gespräch",
};

export default function MemoryPage() {
  return (
    <DashboardShell title="Memory">
      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            Geschäftsgedächtnis
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            Persistenter Kontext: Kontakte, Firmen, Projekte, Entscheidungen und
            Gespräche. Die Wissensbasis, auf die sich die Agenten stützen.
          </p>
        </div>

        {MOCK_MEMORY.map((m) => (
          <div key={m.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900">{m.title}</h3>
              <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                {TYPE_LABEL[m.type]}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-600">{m.summary}</p>
            <p className="mt-2 font-mono text-[11px] text-zinc-400">
              {m.createdAt.slice(0, 10)} · {m.source}
            </p>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
