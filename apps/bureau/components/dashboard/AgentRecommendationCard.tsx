import { getTranslations } from "next-intl/server";

/**
 * The team a business is recommended, given what the audit found.
 *
 * The recommendation is structure — an id and the agents it names — and its
 * tier and situation sentence come from `model.recommendations.<id>`. The
 * agent ids are printed as they are: they are identifiers, and an operator
 * comparing this card with the agents page should see the same token on both.
 */
export async function AgentRecommendationCard({
  recommendation,
}: {
  recommendation: { id: string; agents: string[] };
}) {
  const t = await getTranslations("model");
  const a = await getTranslations("auditConsole");

  return (
    <div className="rounded-lg border border-accent/30 bg-accent-soft p-5">
      <p className="font-mono text-label uppercase tracking-[0.14em] text-ink-secondary">
        {a("recommendedTeam")}
      </p>
      <h3 className="mt-1 font-semibold text-ink">
        {t(`recommendations.${recommendation.id}.tier`)}
      </h3>
      <p className="mt-2 text-sm text-ink-secondary">
        {t(`recommendations.${recommendation.id}.forSituation`)}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {recommendation.agents.map((agent) => (
          <span
            key={agent}
            className="rounded-full border border-hairline bg-surface px-2.5 py-0.5 font-mono text-label-dense text-ink-secondary"
          >
            {agent}
          </span>
        ))}
      </div>
    </div>
  );
}
