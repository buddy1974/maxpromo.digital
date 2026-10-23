import { getLocale, getTranslations } from "next-intl/server";
import { flushIntakeOutbox, intakeOutboxState, recentIntakeRuns } from "@/lib/agents/intake";
import { osConfigured, osLinkedBusinessId, readRequestId, runOsCapability } from "@/lib/os/client";
import { formatDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/locale";

const OS_APPROVALS_URL = "https://www.maxpromo.digital/os/approvals";

/**
 * The live part of the Agent Control Plane (ADR-0021): agents that have a
 * runtime, what they did, and what they are waiting on. No sample data here.
 * Opening it also retries anything stuck in the intake outbox — an operator
 * looking is a good moment to try again.
 */
export async function LivePanel({ businessId }: { businessId: string }) {
  const t = await getTranslations("dashboard");
  const locale = (await getLocale()) as Locale;
  const linked = osLinkedBusinessId() === businessId.toLowerCase();
  if (!linked) return null;

  if (osConfigured()) await flushIntakeOutbox(3).catch(() => undefined);
  const [outbox, runs, requested] = await Promise.all([
    intakeOutboxState().catch(() => ({ waiting: 0, oldest: null, lastError: null })),
    recentIntakeRuns(businessId).catch(() => []),
    osConfigured()
      ? runOsCapability("console", readRequestId("dashboard"), "approvals.requested", {})
      : Promise.resolve(null),
  ]);
  const waitingApprovals = requested?.ok && requested.response.status === "done"
    ? (((requested.response.result?.data ?? {}) as { approvals?: { status: string }[] }).approvals ?? []).filter((a) => a.status === "pending").length
    : null;

  return (
    <section aria-labelledby="live-title">
      <div className="mb-3">
        <h2 id="live-title" className="text-base font-semibold text-ink">{t("liveTitle")}</h2>
        <p className="text-xs text-ink-muted">{t("liveHint")}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">{t("intakeAgent")}</p>
          <p className="mt-2 text-sm text-ink">
            {!osConfigured() ? t("intakeNotConfigured") : outbox.waiting === 0 ? t("intakeClear") : t("intakeWaiting", { count: outbox.waiting })}
          </p>
          {outbox.waiting > 0 && outbox.lastError && (
            <p className="mt-1 font-mono text-xs text-ink-muted">{t("intakeLastError", { reason: outbox.lastError })}</p>
          )}
          <p className="mt-4 font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">{t("recentRuns")}</p>
          {runs.length ? (
            <ul className="mt-2 space-y-1 font-mono text-xs text-ink-secondary">
              {runs.map((r) => (
                <li key={r.id}>
                  {r.finishedAt ? formatDateTime(r.finishedAt, locale) : "—"} · {r.status === "completed" ? t("runCompleted") : t("runFailed")}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-ink-muted">{t("noRuns")}</p>
          )}
        </div>
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">{t("requestedTitle")}</p>
          <p className="mt-2 text-sm text-ink">
            {waitingApprovals === null ? "—" : t("requestedCount", { count: waitingApprovals })}
          </p>
          <a href={OS_APPROVALS_URL} className="btn-secondary btn-sm mt-4 inline-flex">{t("openInOs")}</a>
        </div>
      </div>
    </section>
  );
}
