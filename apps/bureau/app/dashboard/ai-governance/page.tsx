import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AIToolRegister } from "@/components/dashboard/AIToolRegister";
import { GovernanceRiskCard } from "@/components/dashboard/GovernanceRiskCard";
import { PolicyChecklist } from "@/components/dashboard/PolicyChecklist";
import { DataSensitivityMatrix } from "@/components/dashboard/DataSensitivityMatrix";
import {
  MOCK_AI_TOOLS,
  MOCK_GOVERNANCE_RISKS,
  MOCK_POLICY_CHECKLIST,
  MOCK_DATA_SENSITIVITY,
} from "@/lib/mock/ai-governance";

// Module 5 — Shadow AI Governance. Assessment & policy dashboard.
// Uses "assessment"/"policy" language — does NOT claim to scan real tools.
export default function AIGovernancePage() {
  return (
    <DashboardShell title="AI Governance">
      <div className="space-y-8">
        <div className="rounded-lg border border-hairline bg-surface p-5 shadow-sm">
          <p className="font-mono text-label uppercase tracking-[0.16em] text-ink-secondary">
            Shadow-AI unter Kontrolle
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            Eine Einschätzung der KI-Nutzung im Betrieb: freigegebene Tools, Risikobereiche,
            Policy-Status und Datensensibilität. Dies ist eine Bewertungs- und
            Richtlinienübersicht — kein automatischer Scan von Mitarbeiter-Tools.
          </p>
        </div>

        <section>
          <h3 className="mb-3 text-base font-semibold text-ink">Tool-Register</h3>
          <AIToolRegister tools={MOCK_AI_TOOLS} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-base font-semibold text-ink">Risikobereiche</h3>
            <div className="grid gap-4">
              {MOCK_GOVERNANCE_RISKS.map((r) => (
                <GovernanceRiskCard key={r.id} risk={r} />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <PolicyChecklist items={MOCK_POLICY_CHECKLIST} />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-ink">Datensensibilität</h3>
          <DataSensitivityMatrix rows={MOCK_DATA_SENSITIVITY} />
        </section>
      </div>
    </DashboardShell>
  );
}
