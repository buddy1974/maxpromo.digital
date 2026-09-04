import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS, UST_CLAUSE } from "@maxpromo/config";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Impressum — Max Agent",
  robots: { index: false },
};

export default function ImpressumPage() {
  return (
    <>
      <a href="#content" className="skip-link">Zum Inhalt springen</a>
      <Nav />
      <main id="content" className="mx-auto max-w-2xl px-6 py-20">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.16em] text-ink-secondary hover:text-accent-text"
        >
          ← Zurück
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink">
          Impressum
        </h1>

        <div className="mt-8 space-y-6 text-ink-secondary">
          <section>
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-ink-muted">
              Angaben gemäß § 5 DDG
            </h2>
            <p className="mt-3 text-ink">{BUSINESS.legalName}</p>
            <p>{BUSINESS.brand}</p>
            <p>{BUSINESS.street}</p>
            <p>
              {BUSINESS.city} · {BUSINESS.country}
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-ink-muted">
              Kontakt
            </h2>
            <p className="mt-3">E-Mail: {BUSINESS.email}</p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-ink-muted">
              Umsatzsteuer
            </h2>
            <p className="mt-3">Steuernummer: {BUSINESS.steuernummer}</p>
            <p>Finanzamt: {BUSINESS.finanzamt}</p>
            <p className="mt-2 text-ink">{UST_CLAUSE.de}</p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-ink-muted">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p className="mt-3">
              {BUSINESS.legalName}, {BUSINESS.street}, {BUSINESS.city}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
