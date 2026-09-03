import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { SOLUTIONS, asLocale } from '@/lib/solutions'

/**
 * app/[locale]/solutions/page.tsx
 *
 * The Solutions index. Answers one business question: "can you fix the thing
 * that is costing me time?"
 *
 * A reference list, not a card grid of icons. Each row states the problem the
 * way an operator would state it, so a reader scanning for their own situation
 * finds it in one pass. The previous version was a six-tile grid with glyph
 * badges and a separate "layers / boundary / lifecycle" narrative that
 * repeated what the child pages already said.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  return {
    title: isDE ? 'Leistungen' : 'Solutions',
    description: isDE
      ? 'Die Probleme, für die Betriebe uns holen: Anfragen, manuelle Abläufe, Altsysteme, Bewertungen, Sichtbarkeit.'
      : 'The problems businesses bring us: enquiries, manual steps, legacy systems, reviews, visibility.',
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/solutions`,
      languages: {
        de: 'https://www.maxpromo.digital/de/solutions',
        en: 'https://www.maxpromo.digital/en/solutions',
      },
    },
  }
}

export default async function SolutionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const l = asLocale(locale)
  const isDE = l === 'de'

  return (
    <>
      <section className="section-feature">
        <div className="container">
          <div style={{ maxWidth: 'var(--measure)' }}>
            <p className="section-label">{isDE ? 'Leistungen' : 'Solutions'}</p>
            <h1 style={{ margin: '0 0 var(--space-5)' }}>
              {isDE ? 'Wir arbeiten am Ablauf, nicht am Werkzeug.' : 'We work on the process, not the tool.'}
            </h1>
            <p className="lede">
              {isDE
                ? 'Jede dieser Seiten beschreibt ein Problem, das uns Betriebe tatsächlich bringen — was schiefläuft, warum es passiert, was wir dagegen tun und was nicht dazugehört.'
                : 'Each of these describes a problem businesses actually bring us: what goes wrong, why it happens, what we do about it, and what is not included.'}
            </p>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="industry-list">
            {SOLUTIONS.map((s) => (
              <Link key={s.slug} href={`/solutions/${s.slug}`} className="industry-row">
                <div className="industry-row-name">
                  <h2 className="h-card" style={{ margin: 0 }}>{s.name[l]}</h2>
                </div>
                <div className="industry-row-body">
                  <p className="industry-row-summary">{s.summary[l]}</p>
                  <span className="industry-row-cta">{isDE ? 'Ansehen' : 'Read'} →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--brand-surface-subtle)', borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div className="prose-two-col">
            <div>
              <p className="section-label">{isDE ? 'Wie wir arbeiten' : 'How we work'}</p>
            </div>
            <div>
              <ol className="step-list">
                {(isDE
                  ? [
                      'Wir sehen uns an, wie der Betrieb heute tatsächlich arbeitet — nicht, wie er arbeiten sollte.',
                      'Wir rechnen nach, was die manuellen Schritte pro Monat kosten. Das entscheidet die Reihenfolge.',
                      'Wir bauen das kleinste System, das das Problem löst, und stellen es in Betrieb.',
                      'Wir arbeiten Ihr Team ein, bis es ohne uns läuft.',
                      'Wir pflegen es danach weiter. Ein System ohne Betreuung verfällt.',
                    ]
                  : [
                      'We look at how the business actually works today, not how it is supposed to.',
                      'We put a monthly cost on the manual steps. That decides the order of work.',
                      'We build the smallest system that solves the problem, and put it into service.',
                      'We train your team until it runs without us.',
                      'We maintain it afterwards. A system nobody looks after decays.',
                    ]
                ).map((step, i) => (
                  <li key={i}>
                    <span className="step-list-num">{String(i + 1).padStart(2, '0')}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ borderTop: '1px solid var(--brand-border)' }}>
        <div className="container">
          <div style={{ maxWidth: 'var(--measure-narrow)' }}>
            <h2 style={{ margin: '0 0 var(--space-4)' }}>
              {isDE ? 'Nicht sicher, was davon passt?' : 'Not sure which of these applies?'}
            </h2>
            <p style={{ margin: '0 0 var(--space-6)', fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--brand-text-secondary)' }}>
              {isDE
                ? 'Das ist normal. Meistens ist das genannte Problem ein Symptom eines anderen. Ein Gespräch klärt das schneller als eine Auswahl auf einer Website.'
                : 'That is normal. The problem people name is usually a symptom of a different one. A conversation settles that faster than a menu on a website.'}
            </p>
            <Link href="/contact" className="btn btn-primary">
              {isDE ? 'Gespräch vereinbaren' : 'Start a conversation'}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
