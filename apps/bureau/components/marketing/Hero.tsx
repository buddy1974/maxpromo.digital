import Link from "next/link";
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
 */
export function Hero() {
  return (
    <section className="border-b border-hairline bg-surface-subtle">
      <div className="mx-auto max-w-content px-6 py-24 md:py-32">
        <p className="eyebrow">Essen · Überwachtes KI-Betriebsteam</p>

        <h1 className="mt-6 max-w-3xl text-hero text-ink">
          Ihr Tagesgeschäft läuft vorbereitet. Sie behalten die Kontrolle.
        </h1>

        <p className="mt-6 max-w-2xl text-body text-ink-secondary">
          Kein Chatbot. Ein überwachtes Team aus Agenten, das Anfragen erfasst,
          Leads qualifiziert, Follow-ups vorbereitet und Ihren Tag strukturiert.
          Jede Aktion nach außen geht erst raus, wenn{" "}
          <span className="font-medium text-ink">Sie sie freigeben.</span>
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href="#audit" className="btn-primary">
            Geschäfts-Check anfragen
          </a>
          <a href="#bureau" className="btn-secondary">
            Das Team ansehen
          </a>
        </div>

        <p className="mt-6 text-sm text-ink-muted">
          DSGVO-konform, in der EU gehostet, gebaut in Essen.{" "}
          {/* This offered a "System-Vorschau" and pointed at /dashboard, which
              is behind authentication — so the one thing on this page that
              promised a look at the product delivered a login form. It is a
              login, and now says so. */}
          <Link
            href="/login"
            className="text-ink underline decoration-hairline-strong decoration-1 underline-offset-4 transition-colors hover:text-accent-text"
          >
            Anmelden
          </Link>
        </p>

        <div className="mt-14">
          <StatusTicker />
        </div>
      </div>
    </section>
  );
}
