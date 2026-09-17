import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PLAYBOOKS } from "@/lib/core/playbooks";
import { getTranslations } from "next-intl/server";

/**
 * Reusable agent playbooks — the repeatable delivery system (the systemize
 * stage of the operating model).
 *
 * Every word here comes from `playbooks.<id>`; the file behind it holds the
 * order, the lifecycle phase of each step and which agents are responsible.
 * The "approval required" badge was English inside a German page, which is one
 * of the mixtures this pass set out to remove.
 */
export default async function PlaybooksPage() {
  const t = await getTranslations("playbooksPage");
  const p = await getTranslations("playbooks");
  const ts = await getTranslations("sections");

  return (
    <DashboardShell title={ts("playbooks")}>
      <div className="space-y-4">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
            {t("eyebrow")}
          </p>
          <p className="mt-2 text-sm text-ink-secondary">{t("lede")}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {PLAYBOOKS.map((book) => {
            const steps = p.raw(`${book.id}.steps`) as string[];
            return (
              <div key={book.id} className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-ink">{p(`${book.id}.title`)}</h3>
                  {book.approvalRequired && (
                    <span className="shrink-0 rounded-full border border-hairline bg-surface-sunken px-2.5 py-0.5 font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">
                      {t("approvalRequired")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  {t("pain")}: {p(`${book.id}.pain`)}
                </p>
                <p className="mt-2 text-sm text-ink-secondary">
                  <span className="text-ink-muted">{t("trigger")}:</span> {p(`${book.id}.trigger`)}
                </p>

                <ol className="mt-3 space-y-1">
                  {book.steps.map((s, i) => (
                    <li key={s.id} className="flex gap-2 text-sm text-ink-secondary">
                      <span className="font-mono text-label text-ink-secondary">{s.order}.</span>
                      {steps[i]}
                    </li>
                  ))}
                </ol>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-hairline pt-3 text-label">
                  <span className="font-mono uppercase tracking-[0.12em] text-ink-muted">
                    {t("stage")}: {book.operatingStage}
                  </span>
                  <span className="font-mono uppercase tracking-[0.12em] text-ink-muted">
                    · {t("agents")}: {book.responsibleAgents.join(", ")}
                  </span>
                  {book.reusableTemplate && (
                    <span className="font-mono uppercase tracking-[0.12em] text-ink-secondary">
                      · {t("template")}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  {t("outcome")}: {p(`${book.id}.outcome`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
