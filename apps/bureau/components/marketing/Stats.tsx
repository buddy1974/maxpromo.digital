import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/lib/i18n/locale";

/**
 * Honest framing: the headline promise is the offer, not a delivered result.
 * Hard delivery numbers belong to Maxpromo's installed systems and are linked
 * rather than restated here — the note under the row says so, and the link now
 * follows the reader's language to the hub's own case studies.
 *
 * The figures themselves are translated rather than reformatted: "10–15 Std."
 * and "10–15 hrs" are the same claim in two languages, and neither is
 * strengthened.
 */
const STATS = ["s1", "s2", "s3"] as const;

export async function Stats() {
  const t = await getTranslations("stats");
  const locale = await resolveLocale();

  return (
    <section className="border-b border-hairline bg-surface-subtle">
      <div className="mx-auto max-w-content px-6 py-20 md:py-28">
        <div className="grid gap-8 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s}>
              <div className="text-3xl font-semibold tracking-tight text-ink-secondary md:text-4xl">
                {t(`${s}Value`)}
              </div>
              <div className="mt-2 text-sm text-ink-secondary">{t(`${s}Label`)}</div>
            </div>
          ))}
        </div>
        <p className="mt-8 font-mono text-xs text-ink-muted">
          {t("note")}{" "}
          —{" "}
          <a
            href={`https://www.maxpromo.digital/${locale}/case-studies`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-secondary underline underline-offset-2 hover:text-ink-secondary"
          >
            {t("caseStudies")}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
