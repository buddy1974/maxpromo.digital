import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getCurrentUser } from "@/lib/auth/session";
import { osLinkedBusinessId, readRequestId, runOsCapability } from "@/lib/os/client";
import { getTranslations } from "next-intl/server";

// Approvals are a PROJECTION here (ADR-0021). Agents request business actions;
// Maxpromo OS holds each approval, binds it to the exact payload and executes it
// only after Marcel decides there. The Bureau shows the state and never decides,
// so there is one approval record, not two.
export const dynamic = "force-dynamic";

interface Requested {
  id: string;
  capability: string;
  summary: string;
  status: string;
  requestedBy: string;
  createdAt: string;
  expiresAt: string;
}

const OS_APPROVALS_URL = "https://www.maxpromo.digital/os/approvals";
const STATE_KEY: Record<string, string> = {
  pending: "statePending", executed: "stateExecuted", rejected: "stateRejected", expired: "stateExpired",
  superseded: "stateSuperseded", failed: "stateFailed", executing: "stateExecuting",
};

export default async function ApprovalsPage() {
  // Auth-5: source businessId from session — no global demo lookup.
  const user = await getCurrentUser();
  if (!user?.businessId) redirect("/login");

  const t = await getTranslations("approvals");
  const ts = await getTranslations("sections");
  const sh = await getTranslations("shell");

  // Only the business that IS Maxpromo sees Maxpromo OS state. A client tenant never does.
  const linked = osLinkedBusinessId() === user.businessId.toLowerCase();
  let rows: Requested[] = [];
  let unavailable = false;
  if (linked) {
    // A read; the request id is per page view so it is never mistaken for a retry.
    const call = await runOsCapability("console", readRequestId("approvals"), "approvals.requested", {});
    if (call.ok && call.response.status === "done") {
      rows = ((call.response.result?.data ?? {}) as { approvals?: Requested[] }).approvals ?? [];
    } else {
      unavailable = true;
    }
  }

  return (
    <DashboardShell title={ts("approvals")}>
      <div className="space-y-6">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
            {sh("supervisedMode")}
          </p>
          <p className="mt-2 text-sm text-ink-secondary">{t("osNote")}</p>
          {linked && (
            <a href={OS_APPROVALS_URL} className="btn-primary btn-sm mt-4 inline-flex">
              {t("decideInOs")}
            </a>
          )}
        </div>

        {!linked ? (
          <EmptyState title={t("notLinked")} icon="approvals" />
        ) : unavailable ? (
          <EmptyState title={t("unavailable")} icon="approvals" />
        ) : rows.length === 0 ? (
          <EmptyState title={t("noRequests")} icon="approvals" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {rows.map((r) => (
              <div key={r.id} className="rounded-lg border border-hairline bg-surface p-6 shadow-sm">
                <h3 className="break-words font-semibold text-ink">{r.summary}</h3>
                <p className="mt-1 font-mono text-xs text-ink-muted">
                  {r.capability} · {t(STATE_KEY[r.status] ?? "statePending")}
                </p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div>
                    <dt className="font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">{t("requestedBy")}</dt>
                    <dd className="mt-0.5 text-ink-secondary">{r.requestedBy}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
