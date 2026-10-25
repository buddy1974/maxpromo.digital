import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AgentIdentityCard } from "@/components/dashboard/AgentIdentityCard";
import { AGENTS } from "@/lib/registry/agents";
import { getTranslations } from "next-intl/server";

// The agents that run (ADR-0030). Operational identity cards — no faces, no
// placeholders: an agent is listed when it has a trigger, a job and a result path.
export default async function AgentsPage() {
  const t = await getTranslations("agentsPage");
  const ts = await getTranslations("sections");

  return (
    <DashboardShell title={ts("agents")}>
      <div className="space-y-6">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
            {t("count", { count: AGENTS.length })}
          </p>
          <p className="mt-2 text-sm text-ink-secondary">{t("lede")}</p>
        </div>
        <section>
          <h2 className="mb-3 font-mono text-label uppercase tracking-[0.16em] text-ink-muted">{t("specialists")}</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {AGENTS.map((a) => <AgentIdentityCard key={a.id} agent={a} />)}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
