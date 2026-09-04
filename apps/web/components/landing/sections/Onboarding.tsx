import { EYEBROW_STYLE, RADIUS, SECTION_PADDING, SECTION_DIVIDER, CARD_BORDER, INTERACTIVE_LINK_CLASSES } from '@/components/landing/showcaseTokens'

interface OnboardingProps {
  locale:      string
  contactHref: string
}

/**
 * Required by the shared architecture (section 3, item 14) and the V2
 * block list (item 12). Replaces the old AIImport.tsx / Installation.tsx
 * stubs, which both just `return null` with a "TODO Phase 5" comment —
 * retired from the render tree entirely rather than kept as dead weight.
 *
 * 3 steps, generic and truthful for every product in the registry (every
 * ProductEntry has `bookDemoUrl`, `domain`, and a revenueModel of
 * 'installation' or 'hybrid') — deliberately does NOT link directly to
 * `demoUrl` as a self-serve "try it now" step: HandwerkOS's demo login is
 * gated (see products.ts's demoCredentials comment — "guided review"
 * only), so the truthful flow is "request access", not "click and use
 * it immediately".
 *
 * Visual-polish pass 2026-07-25: tokens from showcaseTokens.ts; grid now
 * activates at `md` (768px) instead of `sm` (640px) for the same reason
 * as OutcomeStrip/TrustAndSecurity — 3 columns of short card content at
 * exactly 640–767px was tighter than necessary. Added focus-visible/hover
 * feedback to the closing "request a demo" link, previously static.
 */
export function Onboarding({ locale, contactHref }: OnboardingProps) {
  const isDE    = locale === 'de'
  const eyebrow = isDE ? 'So geht es los' : 'How it starts'
  const heading = isDE ? 'Drei Schritte bis live.' : 'Three steps to live.'

  const steps = isDE
    ? [
        { n: '01', label: 'Demo anfragen',        desc: 'Wir zeigen Ihnen das System live, zugeschnitten auf Ihren Betrieb.' },
        { n: '02', label: 'Individuelles Angebot', desc: 'Sie erhalten ein klares Angebot für Installation und Einrichtung.' },
        { n: '03', label: 'Live auf Ihrer Domain', desc: 'Wir installieren, übernehmen Hosting und Support — Sie konzentrieren sich auf die Arbeit.' },
      ]
    : [
        { n: '01', label: 'Request a demo',       desc: 'We show you the system live, tailored to your business.' },
        { n: '02', label: 'Get a custom offer',    desc: 'You receive a clear quote for installation and setup.' },
        { n: '03', label: 'Go live on your domain', desc: 'We install it, handle hosting and support — you focus on the work.' },
      ]

  return (
    <section style={{ padding: SECTION_PADDING.base, borderTop: SECTION_DIVIDER }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <p style={{ ...EYEBROW_STYLE, marginBottom: '0.75rem' }}>
          {eyebrow}
        </p>
        <h2 style={{ marginBottom: '2rem' }}>
          {heading}
        </h2>

        <div style={{ display: 'grid', gap: '12px' }} className="grid-cols-1 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} style={{ padding: '1.5rem', border: CARD_BORDER, borderRadius: RADIUS.md }}>
              <span style={{ fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-label)', color: 'var(--showcase-accent)', background: 'color-mix(in srgb, var(--showcase-accent) 12%, transparent)', borderRadius: '4px', padding: '3px 8px' }}>
                {s.n}
              </span>
              <p style={{ fontFamily: 'var(--brand-font-heading)', fontWeight: 'var(--weight-heading)', fontSize: 'var(--text-small)', color: 'var(--showcase-fg)', margin: '12px 0 6px' }}>
                {s.label}
              </p>
              <p style={{ fontFamily: 'var(--brand-font-body)', fontSize: 'var(--text-micro)', color: 'var(--showcase-muted)', lineHeight: 1.65, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        <a
          href={contactHref}
          className={INTERACTIVE_LINK_CLASSES}
          style={{ display: 'inline-block', marginTop: '1.75rem', fontFamily: 'var(--brand-font-mono)', fontSize: 'var(--text-micro)', color: 'var(--showcase-fg)', textDecoration: 'none', letterSpacing: '0.02em' }}
        >
          {isDE ? 'Jetzt Demo anfragen →' : 'Request a demo now →'}
        </a>
      </div>
    </section>
  )
}
