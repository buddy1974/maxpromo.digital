import type { AgentProposal } from "@/types/agent";
import { RiskBadge } from "./RiskBadge";

/**
 * Renders one agent proposal awaiting human review. The action buttons are
 * intentionally NON-FUNCTIONAL placeholders in this skeleton — the supervision
 * UI and data model are real; wiring approve/reject/execute is a later sprint.
 */
export function ApprovalCard({ proposal }: { proposal: AgentProposal }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">{proposal.title}</h3>
          <p className="mt-0.5 text-xs text-ink-muted">
            {proposal.agentName} · Awaiting Review
          </p>
        </div>
        <RiskBadge level={proposal.riskLevel} />
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <Row label="Kontext" value={proposal.businessContext} />
        <Row label="Vorgeschlagene Aktion" value={proposal.proposedAction} />
        <Row label="Erwartetes Ergebnis" value={proposal.expectedOutcome} />
      </dl>

      <div className="mt-4 rounded-lg border border-hairline bg-surface-subtle p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Audit-Trail (Vorschau)
        </p>
        <ul className="mt-2 space-y-1">
          {proposal.auditTrailPreview.map((line, i) => (
            <li key={i} className="font-mono text-xs text-ink-secondary">
              {line}
            </li>
          ))}
        </ul>
      </div>

      {/* Placeholder controls — no handlers yet (skeleton). */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          title="Platzhalter — Freigabe-Logik folgt in einem späteren Sprint"
          className="cursor-not-allowed rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white opacity-60"
        >
          Freigeben
        </button>
        <button
          type="button"
          disabled
          title="Platzhalter"
          className="cursor-not-allowed rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-ink-secondary opacity-60"
        >
          Ablehnen
        </button>
        <button
          type="button"
          disabled
          title="Platzhalter"
          className="cursor-not-allowed rounded-lg border border-hairline px-4 py-2 text-sm font-medium text-ink-secondary opacity-60"
        >
          Vor Freigabe bearbeiten
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-ink-secondary">{value}</dd>
    </div>
  );
}
