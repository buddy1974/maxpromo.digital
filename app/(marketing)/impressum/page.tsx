import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS, UST_CLAUSE } from "@/config/legal";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Impressum — Max Agent",
  robots: { index: false },
};

export default function ImpressumPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 py-20">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.16em] text-accent hover:text-accent-hover"
        >
          ← Zurück
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-900">
          Impressum
        </h1>

        <div className="mt-8 space-y-6 text-zinc-600">
          <section>
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
              Angaben gemäß § 5 DDG
            </h2>
            <p className="mt-3 text-zinc-800">{BUSINESS.legalName}</p>
            <p>{BUSINESS.brand}</p>
            <p>{BUSINESS.street}</p>
            <p>
              {BUSINESS.city} · {BUSINESS.country}
            </p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
              Kontakt
            </h2>
            <p className="mt-3">E-Mail: {BUSINESS.email}</p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
              Umsatzsteuer
            </h2>
            <p className="mt-3">Steuernummer: {BUSINESS.steuernummer}</p>
            <p>Finanzamt: {BUSINESS.finanzamt}</p>
            <p className="mt-2 text-zinc-800">{UST_CLAUSE}</p>
          </section>

          <section>
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-zinc-500">
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
