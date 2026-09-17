import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { MOCK_MEMORY } from "@/lib/mock/memory";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/i18n/format";
import { resolveLocale } from "@/lib/i18n/locale";

// Research workspace (skeleton): surfaces agent-sourced research notes.
export default async function ResearchPage() {
  const t = await getTranslations("researchPage");
  const ts = await getTranslations("sections");
  const locale = await resolveLocale();
  const research = MOCK_MEMORY.filter(
    (m) => m.type === "company" || m.type === "conversation",
  );

  return (
    <DashboardShell title={ts("research")}>
      <div className="space-y-4">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
            {t("eyebrow")}
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            {t("lede")}
          </p>
        </div>

        {research.length ? (
          research.map((m) => (
            <div key={m.id} className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
              <h3 className="font-semibold text-ink">{m.title}</h3>
              <p className="mt-1 text-sm text-ink-secondary">{m.summary}</p>
              <p className="mt-2 font-mono text-label text-ink-muted">
                {formatDate(m.createdAt, locale)} · {m.source}
              </p>
            </div>
          ))
        ) : (
          <EmptyState title={t("empty")} icon="research" />
        )}
      </div>
    </DashboardShell>
  );
}
