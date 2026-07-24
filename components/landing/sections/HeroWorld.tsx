import Image from 'next/image'
import type { BulletTuple } from '@/lib/registry/types'

interface HeroWorldProps {
  domainBrand:  string
  headline:     string
  subline:      string
  bullets:      BulletTuple
  cardImageSrc: string
  ctaPrimary:   string
  bookDemoUrl:  string
  locale:       string
}

/**
 * Hero section for showcase product domains.
 * Splits headline on first ". ", first part primary, second part in --brand-accent (VG-04).
 * CTA primary: always #F97316 (VG-03). Secondary: ghost.
 */
export function HeroWorld({
  domainBrand, headline, subline, bullets,
  cardImageSrc, ctaPrimary, bookDemoUrl, locale,
}: HeroWorldProps) {
  const secondaryLabel = locale === 'de' ? 'System in Aktion →' : 'See it in action →'
  const dotAt = headline.indexOf('. ')
  const line1 = dotAt > -1 ? headline.slice(0, dotAt + 1) : headline
  const line2 = dotAt > -1 ? headline.slice(dotAt + 2)    : null

  return (
    <section style={{ padding: '5rem 2rem 4rem', minHeight: '88vh', display: 'flex', alignItems: 'center' }}>
      <div
        style={{ maxWidth: '80rem', margin: '0 auto', width: '100%', display: 'grid', gap: '3rem', alignItems: 'center' }}
        className="grid-cols-1 lg:grid-cols-2"
      >
        {/* Copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--brand-accent)', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            {domainBrand}
          </p>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.75rem, 6vw, 4.5rem)', letterSpacing: '-0.04em', lineHeight: 1.05, margin: 0 }}>
            <span style={{ display: 'block' }}>{line1}</span>
            {line2 && <span style={{ display: 'block', color: 'var(--brand-accent)' }}>{line2}</span>}
          </h1>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--brand-muted)', lineHeight: 1.75, maxWidth: '34rem', margin: 0 }}>
            {subline}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bullets.map((b, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-fg)' }}>
                <span style={{ color: 'var(--brand-accent)', flexShrink: 0 }}>→</span>
                {b}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <a
              href={bookDemoUrl}
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px', letterSpacing: '0.04em', color: '#080808', background: '#F97316', padding: '14px 28px', borderRadius: '10px', textDecoration: 'none', display: 'inline-block' }}
            >
              {ctaPrimary}
            </a>
            <a
              href="#see-in-action"
              style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--brand-fg)', padding: '14px 28px', borderRadius: '10px', border: '1px solid rgba(128,128,128,0.25)', textDecoration: 'none', display: 'inline-block' }}
            >
              {secondaryLabel}
            </a>
          </div>
        </div>

        {/* Card image, desktop only */}
        <div
          className="hidden lg:block"
          style={{ position: 'relative', height: '420px', borderRadius: '16px', overflow: 'hidden', background: 'rgba(128,128,128,0.06)' }}
        >
          <Image
            src={cardImageSrc}
            alt={domainBrand}
            fill
            priority
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
            sizes="(max-width: 1024px) 0vw, 45vw"
          />
        </div>
      </div>
    </section>
  )
}
