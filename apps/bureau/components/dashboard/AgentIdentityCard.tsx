import { Icon } from "@maxpromo/ui";
import { getTranslations } from "next-intl/server";
import type { AgentRecord } from "@/lib/registry/agents";
import { StatusBadge } from "./StatusBadge";
import { RiskBadge } from "./RiskBadge";
import { formatDateTime } from "@/lib/i18n/format";
import { resolveLocale } from "@/lib/i18n/locale";

/**
 * Operational agent identity — no faces, no avatars. It communicates one
 * thing: this agent prepares work and proposes it; it does not execute
 * uncontrolled actions.
 *
 * Everything an operator reads here comes from the catalogue, keyed by the
 * agent's id. The card used to render German that lived in the registry beside
 * the English word "Approval Required", which is precisely the mixture this
 * pass exists to remove.
 *
 * The timestamp is formatted rather than sliced. It used to be printed by
 * cutting the ISO string and appending "UTC", which showed an English reader
 * and a German reader the same machine format in a time zone neither of them
 * works in.
 */
export async function AgentIdentityCard({
  agent,
  primary = false,
}: {
  agent: AgentRecord;
  primary?: boolean;
}) {
  const t = await getTranslations(`agentRegistry.${agent.id}`);
  const c = await getTranslations("agentCard");
  const sec = await getTranslations("sections");
  const locale = await resolveLocale();

  const observes = t.raw("caps") as string[];
  const prepares = t.raw("allowed") as string[];
  const blocked = t.raw("blocked") as string[];

  return (
    <div
      className={`rounded-lg border bg-surface p-6 shadow-sm ${
        primary ? "border-accent/40 bg-accent-soft" : "border-hairline"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 font-mono text-lg ${primary ? "text-ink-secondary" : "text-ink-muted"}`}>
            <Icon name={primary ? "dashboard" : "agents"} size="sm" />
          </span>
          <div>
            <h3 className="font-semibold text-ink">{agent.name}</h3>
            <p className="text-xs text-ink-muted">{t("role")}</p>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{t("description")}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <RiskBadge level={agent.riskLevel} />
        {agent.requiresApproval && (
          <span className="rounded-full border border-hairline bg-surface-sunken px-2.5 py-0.5 font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">
            {c("approvalRequired")}
          </span>
        )}
      </div>

      <div className="mt-5 space-y-3">
        <Field label={c("observes")} items={observes} />
        <Field label={c("prepares")} items={prepares} />
        <Field label={c("needsApprovalFor")} items={blocked} accent />
      </div>

      <div className="mt-5 grid gap-3 border-t border-hairline pt-4 sm:grid-cols-2">
        <div>
          <Label>{c("connectedSystems")}</Label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {agent.connectedSections.map((s) => (
              <span
                key={s}
                className="rounded border border-hairline bg-surface-sunken px-2 py-0.5 font-mono text-label-dense text-ink-secondary"
              >
                {sec(s)}
              </span>
            ))}
          </div>
        </div>
        <div>
          <Label>{c("lastActivity")}</Label>
          <p className="mt-1 font-mono text-label text-ink-muted">
            {formatDateTime(agent.lastActivity, locale)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-hairline bg-surface-subtle p-3">
        <Label>{c("nextAction")}</Label>
        <p className="mt-1 text-sm text-ink-secondary">{t("next")}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  items,
  accent = false,
}: {
  label: string;
  items: string[];
  accent?: boolean;
}) {
  if (!items.length) return null;
  return (
    <div>
      <Label accent={accent}>{label}</Label>
      <ul className="mt-1 space-y-0.5">
        {items.map((it) => (
          <li key={it} className="flex gap-2 text-sm text-ink-secondary">
            <span className={accent ? "text-ink-secondary" : "text-ink-muted"}>—</span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Label({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <p
      className={`font-mono text-label-dense uppercase tracking-[0.14em] ${
        accent ? "text-ink-secondary" : "text-ink-muted"
      }`}
    >
      {children}
    </p>
  );
}
