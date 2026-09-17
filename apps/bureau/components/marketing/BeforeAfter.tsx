import { Icon } from "@maxpromo/ui";
import { getTranslations } from "next-intl/server";
// The "you are the bottleneck" narrative, in the Maxpromo voice.

export async function BeforeAfter() {
  const t = await getTranslations("beforeAfter");
  const BEFORE = t.raw("before") as string[];
  const AFTER = t.raw("after") as string[];

  return (
    <section className="border-b border-hairline">
      <div className="mx-auto max-w-content px-6 py-24 md:py-32">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h2 className="mt-4 max-w-2xl text-section-title text-ink">
          {t("title")}
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="card">
            <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-ink-muted">
              {t("beforeHeading")}
            </h3>
            <ul className="mt-5 space-y-4">
              {BEFORE.map((b) => (
                <li key={b} className="flex gap-3 text-ink-secondary">
                  <span className="mt-1 text-ink-muted">—</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-accent/30 bg-accent-soft p-10">
            <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-ink-secondary">
              {t("afterHeading")}
            </h3>
            <ul className="mt-5 space-y-4">
              {AFTER.map((a) => (
                <li key={a} className="flex gap-3 text-ink">
                  <span className="mt-0.5 text-ink-secondary"><Icon name="check" size="sm" /></span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
