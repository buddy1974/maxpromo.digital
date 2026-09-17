import { Icon, type IconName } from "@maxpromo/ui";
import { getTranslations } from "next-intl/server";

/**
 * Outcomes, not features — per the core philosophy ("people buy outcomes").
 *
 * The middle pillar was titled "Follow-through" inside otherwise German copy.
 * It is one of the English words that had leaked into the German interface, and
 * German has a perfectly good word for it: Verbindlichkeit. The English column
 * keeps Follow-through, which is the natural term there.
 */
const PILLARS = [
  { key: "p1", icon: "agents" as IconName },
  { key: "p2", icon: "arrowRight" as IconName },
  { key: "p3", icon: "memory" as IconName },
];

export async function Pillars() {
  const t = await getTranslations("pillars");

  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-content px-6 py-24 md:py-32">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2 className="mt-4 max-w-2xl text-section-title text-ink">{t("title")}</h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.key} className="card">
              <span className="text-ink-secondary"><Icon name={p.icon} size="lg" /></span>
              <h3 className="mt-4 text-card-title text-ink">{t(`${p.key}Title`)}</h3>
              <p className="mt-2 text-body text-ink-secondary">{t(`${p.key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
