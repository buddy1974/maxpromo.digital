import { BUSINESS } from "@maxpromo/config";

export function Footer() {
  return (
    <footer className="bg-footer">
      <div className="mx-auto max-w-content px-6 py-20 sm:py-24">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Max Agent
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-footer-text">
              Ein Produkt von {BUSINESS.brand}. Überwachte KI-Betriebssysteme,
              installiert in echten Betrieben.
            </p>
          </div>

          <nav className="flex gap-12 text-sm">
            <div className="space-y-2.5">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-footer-text/70">
                Maxpromo
              </p>
              {[
                ["Website", "https://www.maxpromo.digital/de"],
                ["Leistungen", "https://www.maxpromo.digital/de/solutions"],
                ["Kontakt", "https://www.maxpromo.digital/de/contact"],
              ].map(([label, href]) => (
                <a
                  key={label}
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
                Rechtliches
              </p>
              <a
                href="/impressum"
                className="block text-ink-secondary transition-colors hover:text-accent-text"
              >
                Impressum
              </a>
              <a
                href="/datenschutz"
                className="block text-ink-secondary transition-colors hover:text-accent-text"
              >
                Datenschutz
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
