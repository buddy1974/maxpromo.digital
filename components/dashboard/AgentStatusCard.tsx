import type { Agent } from "@/types/agent";
import { StatusBadge } from "./StatusBadge";
import { RiskBadge } from "./RiskBadge";

export function AgentStatusCard({ agent }: { agent: Agent }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-900">{agent.name}</h3>
          <p className="text-xs text-zinc-500">{agent.role}</p>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-zinc-600">
        {agent.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <RiskBadge level={agent.riskLevel} />
        {agent.requiresApproval && (
          <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-zinc-600">
            Approval Required
          </span>
        )}
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
          Nächste empfohlene Aktion
        </p>
        <p className="mt-1 text-sm text-zinc-700">{agent.nextRecommendedAction}</p>
      </div>
    </div>
  );
}
