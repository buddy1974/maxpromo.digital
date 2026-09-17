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
    // 64px on a phone, the full 112px from `md` up.
    //
    // A sticky bar is a permanent deduction from the reading area, and 112px
    // of a 667px viewport is a sixth of the screen given to a wordmark and a
    // language toggle — on the device where the hero has least room to make
    // its case. 112px is a proportion chosen for a desktop page and it does
    // not translate; 64px is the height the hub's bar already uses, so the two
    // properties now agree at the width where it matters most.
    <header className="sticky top-0 z-50 h-16 border-b border-hairline bg-surface md:h-28">
      <div className="mx-auto flex h-full max-w-content items-center justify-between gap-4 px-4 md:px-6">
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
