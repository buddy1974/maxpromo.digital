import { BUSINESS, resolveDomain, contactUrl } from "@maxpromo/config";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/lib/i18n/locale";

/**
 * The contact destination is the Domain Registry's to state, not this
 * component's. It used to be a hardcoded absolute URL here while the registry
 * declared "/kontakt" — two answers, and the registry's was the false one.
 *
 * The hub links now follow the reader's language: an English visitor is sent
 * to the English hub, not to the German one. The contact URL comes from the
 * registry's own resolver for the active locale, which is what it is for.
 */
const BUREAU = resolveDomain("agents.maxpromo.digital");

export async function Footer() {
  const t = await getTranslations("footer");
  const tc = await getTranslations("common");
  const locale = await resolveLocale();
  const hub = `https://www.maxpromo.digital/${locale}`;

  return (
    <footer className="bg-footer">
      <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-white">
                {tc("brandWordmark")}
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-footer-text">
              {t("blurb", { brand: BUSINESS.brand })}
            </p>
          </div>

          <nav className="flex gap-12 text-sm">
            <div className="space-y-2.5">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-footer-text/70">
                {t("companyHeading")}
              </p>
              {[
                [t("website"), hub],
                [t("solutions"), `${hub}/solutions`],
                [t("contact"), contactUrl(BUREAU, locale)],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-ink-secondary transition-colors hover:text-accent-text"
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="space-y-2.5">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-footer-text/70">
                {t("legalHeading")}
              </p>
              <a
                href="/impressum"
                className="block text-ink-secondary transition-colors hover:text-accent-text"
              >
                {t("impressum")}
              </a>
              <a
                href="/datenschutz"
                className="block text-ink-secondary transition-colors hover:text-accent-text"
              >
                {t("privacy")}
              </a>
            </div>
          </nav>
        </div>

        {/* Full Impressum (address, St.-Nr., §19 UStG clause) lives on /impressum,
            reachable via the "Impressum" link above. Kept out of the footer per
            owner request — §5 TMG only requires it to be easily reachable. */}
        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-footer-text/70">
          <p>© {new Date().getFullYear()} {BUSINESS.brand}</p>
        </div>
      </div>
    </footer>
  );
}
