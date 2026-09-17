import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS, UST_CLAUSE } from "@maxpromo/config";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: t("impressumTitle"), description: t("impressumDescription"), robots: { index: false } };
}

export default async function ImpressumPage() {
  const t = await getTranslations("legal");
  const c = await getTranslations("common");

  return (
    <>
      <a href="#content" className="skip-link">{c("skipToContent")}</a>
      <Nav />
      <main id="content" className="mx-auto max-w-2xl px-6 py-20">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.16em] text-ink-secondary hover:text-accent-text"
        >
          {t("back")}
        </Link>
        {/* Why this page is not translated.
            i18n-exempt — everything below is German legal text. It discharges
            obligations under German law to German authorities and German data
            subjects; a translation of it would be a second legal text that no
            lawyer has reviewed, and the governing instruction for this pass is
            explicit that a legal translation is not something to invent. The
            page chrome around it is localised, and an English reader is told,
            in English, why the body is not. */}
        <p className="mt-6 rounded-lg border border-hairline bg-surface-subtle p-4 text-sm text-ink-secondary">
          <span className="block font-mono text-label uppercase tracking-[0.14em] text-ink-muted">
            {t("germanOnlyTitle")}
          </span>
          <span className="mt-1 block">{t("germanOnlyBody")}</span>
        </p>

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
