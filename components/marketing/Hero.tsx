import Link from "next/link";
import { StatusTicker } from "./StatusTicker";

const BADGES = ["DSGVO-konform", "EU-gehostet", "Made in Essen"];

export function Hero() {
  return (
    <section className="border-b border-zinc-200 bg-surface-subtle">
      <div className="mx-auto max-w-content px-6 py-24 md:py-36">
        <p className="eyebrow">{"// Essen · Überwachtes KI-Betriebsteam"}</p>

        <h1 className="mt-6 max-w-4xl text-hero text-zinc-900">
          Ein KI-Team, das Ihren Betrieb führt.{" "}
          <span className="text-accent">Sie behalten die Kontrolle.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-body text-zinc-600">
          Kein Chatbot. Kein Spielzeug. Ein überwachtes Team aus KI-Agenten, das
          Anfragen erfasst, Leads qualifiziert, Follow-ups vorbereitet und Ihren
          Tag strukturiert — jede Aktion nach außen geht erst raus, wenn{" "}
          <span className="font-medium text-zinc-900">Sie sie freigeben.</span>
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <a href="#audit" className="btn-primary">
            Kostenlosen Geschäfts-Check anfragen
          </a>
          <a href="#bureau" className="btn-secondary">
            Das Team ansehen →
          </a>
        </div>

        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          System-Vorschau ansehen →
        </Link>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500">
          {BADGES.map((b) => (
            <span key={b} className="flex items-center gap-2">
              <span className="text-accent">✓</span>
              {b}
            </span>
          ))}
        </div>

        <div className="mt-14">
          <StatusTicker />
        </div>
      </div>
    </section>
  );
}
