import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { StatusTicker } from "./StatusTicker";

/**
 * components/marketing/Hero.tsx
 *
 * v5.0 Sprint 7. Three changes, all rule-driven rather than stylistic:
 *
 *   1. The headline no longer colours its second sentence. It was rendered in
 *      the brand accent, which on white measures 1.51:1 — the phrase was
 *      effectively invisible. Black carries the message; the platform rule is
 *      that a heading is never part-coloured.
 *   2. The three trust badges are gone. "DSGVO-konform · EU-gehostet · Made in
 *      Essen" set in a tick list is the marketing-badge pattern the design
 *      direction retires. The same three facts are now one plain sentence,
 *      which is how a technical document would state them.
 *   3. The "System-Vorschau" link reads as a link rather than as accent text.
 *
 * The sentence carrying the EU-hosting and GDPR wording is translated as it
 * stands and not strengthened in either language — its evidence is still an
 * open item in governance/known-risks.md, and a translation is not the place
 * to settle it.
 */
export async function Hero() {
  const t = await getTranslations("hero");
  const tc = await getTranslations("common");

  return (
    <section className="border-b border-hairline bg-surface-subtle">
      <div className="mx-auto max-w-content px-6 py-24 md:py-32">
        <p className="eyebrow">{t("eyebrow")}</p>

        <h1 className="mt-6 max-w-3xl text-hero text-ink">{t("title")}</h1>

        <p className="mt-6 max-w-2xl text-body text-ink-secondary">
          {t("bodyBefore")}
          <span className="font-medium text-ink">{t("bodyEmphasis")}</span>
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href="#audit" className="btn-primary">
            {t("ctaPrimary")}
          </a>
          <a href="#bureau" className="btn-secondary">
            {t("ctaSecondary")}
          </a>
        </div>

        <p className="mt-6 text-sm text-ink-muted">
          {t("footnote")}
          {/* This offered a "System-Vorschau" and pointed at /dashboard, which
              is behind authentication — so the one thing on this page that
              promised a look at the product delivered a login form. It is a
              login, and now says so. */}
          <Link
            href="/login"
            className="text-ink underline decoration-hairline-strong decoration-1 underline-offset-4 transition-colors hover:text-accent-text"
          >
            {tc("signIn")}
          </Link>
        </p>

        <div className="mt-14">
          <StatusTicker />
        </div>
      </div>
    </section>
  );
}
