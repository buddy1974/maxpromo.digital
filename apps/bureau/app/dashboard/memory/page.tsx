import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MOCK_MEMORY } from "@/lib/mock/memory";
import type { MemoryEntryType } from "@/types/memory";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/i18n/format";
import { resolveLocale } from "@/lib/i18n/locale";

export default async function MemoryPage() {
  const t = await getTranslations("memoryPage");
  const ts = await getTranslations("sections");
  const locale = await resolveLocale();
  return (
    <DashboardShell title={ts("memory")}>
      <div className="space-y-4">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
            {t("eyebrow")}
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            {t("lede")}
          </p>
        </div>

        {MOCK_MEMORY.map((m) => (
          <div key={m.id} className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">{m.title}</h3>
              <span className="rounded-full border border-hairline bg-surface-sunken px-2.5 py-0.5 font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">
                {t(m.type)}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-secondary">{m.summary}</p>
            <p className="mt-2 font-mono text-label text-ink-muted">
              {formatDate(m.createdAt, locale)} · {m.source}
            </p>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
