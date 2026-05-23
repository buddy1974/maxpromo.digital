interface ConversionProps {
  bookDemoUrl:  string
  domain:       string
  ctaPrimary:   string
  locale:       string
  bridge:       boolean
}

/**
 * Final conversion section — always rendered (both showcase and bridge mode).
 * Bridge mode: secondary CTA links directly to the product domain.
 * Showcase mode: secondary CTA links to the live demo or system URL.
 *
 * TODO Phase 3: Max chat handles the contact form — see MaxAgent component.
 */
export function Conversion({ bookDemoUrl, domain, ctaPrimary, locale, bridge }: ConversionProps) {
  const isDE    = locale === 'de'
  const eyebrow = isDE ? '// Bereit?' : '// Ready?'
  const heading = isDE
    ? 'Sehen Sie es in Ihrem Betrieb.'
    : 'See it in your business.'
  const sub     = isDE
    ? 'Erkunden Sie RestaurantOS mit einem Workflow, der Ihrem Restaurant entspricht.'
    : 'Explore RestaurantOS using a workflow closer to your restaurant.'

  const secondaryLabel = isDE
    ? `System ansehen bei ${domain} →`
    : `See full system at ${domain} →`

  return (
    <section style={{ padding: '7rem 2rem', borderTop: '1px solid rgba(128,128,128,0.10)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--brand-accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          {eyebrow}
        </p>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2rem, 4.5vw, 3rem)', letterSpacing: '-0.04em', lineHeight: 1.15, marginBottom: '1rem', color: 'var(--brand-fg)' }}>
          {heading}
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--brand-muted)', marginBottom: '2.5rem', letterSpacing: '0.02em' }}>
          {sub}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={bookDemoUrl}
            style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', letterSpacing: '0.04em', color: '#080808', background: '#F97316', padding: '16px 32px', borderRadius: '10px', textDecoration: 'none', display: 'inline-block', boxShadow: '0 0 36px rgba(249,115,22,0.3)' }}
          >
            {ctaPrimary}
          </a>
          {bridge && (
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--brand-fg)', padding: '16px 28px', borderRadius: '10px', border: '1px solid rgba(128,128,128,0.25)', textDecoration: 'none', display: 'inline-block' }}
            >
              {secondaryLabel}
            </a>
          )}
        </div>

        {/* TODO Phase 3: Max chat handles the contact form — see MaxAgent component */}
      </div>
    </section>
  )
}
