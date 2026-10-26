import { getLocale, getTranslations } from "next-intl/server";
import type { WorkItem } from "@/lib/db/queries/work";
import { formatDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/locale";
import { AGENTS } from "@/lib/registry/agents";

/**
 * Delegated work as the operator sees it (ADR-0030): which agent, about which
 * OS record, in what state, how long it took, what came back — and whether the
 * result reached Maxpromo OS. Real rows only; an empty list says so.
 */
export async function WorkList({ items }: { items: WorkItem[] }) {
  const t = await getTranslations("workPage");
  const locale = (await getLocale()) as Locale;
  if (!items.length) return <p className="text-sm text-ink-muted">{t("none")}</p>;
  return (
    <ul className="divide-y divide-hairline rounded-lg border border-hairline bg-surface shadow-sm">
      {items.map((w) => {
        const agent = AGENTS.find((a) => a.id === `${w.agentKey}-agent`)?.name ?? w.agentKey;
        const result = w.result as { qualification?: { score: number; confidence: string; qualified: boolean; verdict?: "qualified" | "review" | "not_qualified" }; findings?: { evidence?: unknown[] } } | null;
        const failure = w.failure as { category: string; detail: string } | null;
        const took = w.startedAt && w.finishedAt ? Math.max(0, Math.round((w.finishedAt.getTime() - w.startedAt.getTime()) / 1000)) : null;
        const stateKey = ({ queued: "stateQueued", running: "stateRunning", completed: "stateCompleted", failed: "stateFailed", cancelled: "stateCancelled" } as const)[w.state as "queued"] ?? "stateFailed";
        return (
          <li key={w.id} className="grid gap-1 px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-ink"><span className="font-semibold">{agent}</span> · {w.subjectLabel}</p>
              <span className="font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">{t(stateKey)}</span>
            </div>
            <p className="text-xs text-ink-muted">
              {formatDateTime(w.createdAt, locale)} · {t("by", { who: w.requestedBy, source: w.source })}
              {took !== null ? ` · ${took}s` : ""}{w.model ? ` · ${w.model}` : ""}
            </p>
            {result?.qualification && (
              <p className="text-xs text-ink-secondary">
                {t("score", { score: result.qualification.score, confidence: result.qualification.confidence, verdict: result.qualification.verdict === "review" ? t("verdictReview") : result.qualification.qualified ? t("verdictYes") : t("verdictNo") })}
                {" · "}{t("evidence", { count: result.findings?.evidence?.length ?? 0 })}
              </p>
            )}
            {failure && <p className="text-xs text-ink-secondary">{failure.category}: {failure.detail}</p>}
            {["completed", "failed", "cancelled"].includes(w.state) && (
              <p className="font-mono text-xs text-ink-muted">{w.deliveredAt ? t("delivered") : t("notDelivered", { error: w.deliveryError ?? "—" })}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
