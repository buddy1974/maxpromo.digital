import type { AgentRecommendation } from "@/types/operating-model";

export function AgentRecommendationCard({
  recommendation,
}: {
  recommendation: AgentRecommendation;
}) {
  return (
    <div className="rounded-lg border border-accent/30 bg-accent-soft p-5">
      <p className="font-mono text-label uppercase tracking-[0.14em] text-ink-secondary">
        Empfohlenes Team
      </p>
      <h3 className="mt-1 font-semibold text-ink">{recommendation.tier}</h3>
      <p className="mt-2 text-sm text-ink-secondary">{recommendation.forSituation}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {recommendation.agents.map((a) => (
          <span
            key={a}
            className="rounded-full border border-hairline bg-surface px-2.5 py-0.5 font-mono text-label-dense text-ink-secondary"
          >
            {a}
          </span>
        ))}
      </div>
    </div>
  );
}
