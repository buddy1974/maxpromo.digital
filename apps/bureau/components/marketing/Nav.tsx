import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LocaleSwitch from "@/components/LocaleSwitch";

/**
 * The public navigation.
 *
 * The wordmark now reads what the registries say this product is called. It
 * said "Max Agent" here and in the footer while @maxpromo/config declares
 * `Max Agent Bureau` in the Brand Registry and `MAX AGENT BUREAU` as the
 * Domain Registry's brand — three names for one product, which is the thing a
 * registry exists to stop. No new naming decision was taken here; the existing
 * one was applied.
 *
 * The section anchors are unchanged. They are addresses people may have been
 * sent, and translating an id is how a link stops working.
 */
export async function Nav() {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");

  return (
    <header className="sticky top-0 z-50 h-28 border-b border-hairline bg-surface">
      <div className="mx-auto flex h-full max-w-content items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-ink">
            {tc("brandWordmark")}
          </span>
        </Link>

        <nav className="hidden items-center gap-10 text-lede font-medium tracking-[-0.01em] text-ink-secondary md:flex">
          <a href="#bureau" className="transition-colors hover:text-ink">
            {t("team")}
          </a>
          <a href="#ablauf" className="transition-colors hover:text-ink">
            {t("process")}
          </a>
          <a
            href="https://www.maxpromo.digital/de"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-ink"
          >
            {t("maxpromo")}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitch label={tc("languageLabel")} />
          {/* The call to action steps out below 640px. The language control
              and it together need 374px of a 362px viewport, and of the two
              this is the one the page repeats: the same button is the first
              thing in the hero, one screen down. A navigation that pushes the
              page sideways is worse than a navigation with one less button.

              The hiding sits on a wrapper, not on the link. `.btn-primary`
              sets its own `display`, and which of the two wins is a question
              about stylesheet order — which is not a question a layout should
              depend on. */}
          <span className="hidden sm:inline-flex">
            <a href="#audit" className="btn-primary whitespace-nowrap">
              {t("businessCheck")}
            </a>
          </span>
        </div>
      </div>
    </header>
  );
}
