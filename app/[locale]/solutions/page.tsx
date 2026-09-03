import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('services')
  return {
    title: t('metaTitle'),
    description: t('metaDesc'),
  }
}

const mono    = { fontFamily: 'var(--font-mono)' } as const
const grotesk = { fontFamily: 'var(--font-heading)' } as const
const sans    = { fontFamily: 'var(--font-body)' } as const

interface ServiceRef {
  id: 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6'
  href: string
  icon: string
}

/*
 * Card → destination mapping. Each card links to the service page whose
 * topic it actually describes. Two cards have no dedicated page of their
 * own (c1 legacy modernization, c5 commerce & catalogue) and route to the
 * closest real page, websites-platforms and workflow-automation
 * respectively, so the "Learn more" CTA always lands somewhere relevant.
 * The reviews and customer-inquiries pages have no matching card and are
 * intentionally not linked from this grid.
 */
const SERVICE_REFS: ReadonlyArray<ServiceRef> = [
  { id: 'c1', href: '/solutions/websites-platforms', icon: '◰' }, // Legacy Website & CMS Modernization
  { id: 'c2', href: '/solutions/workflow-automation', icon: '▤' }, // Workflow Automation
  { id: 'c3', href: '/solutions/ai-agents',           icon: '◇' }, // AI Business Systems
  { id: 'c4', href: '/solutions/customer-inquiries',  icon: '⊟' }, // Website Systems (lead capture, booking, portals)
  { id: 'c5', href: '/solutions/reviews',             icon: '→' }, // Commerce & Catalogue (quote/order automation)
  { id: 'c6', href: '/solutions/social-media',        icon: '⌗' }, // Content & Newsletter Systems
]

const BOUNDARY_IDS = ['n1', 'n2', 'n3', 'n4', 'n5'] as const
const LIFECYCLE_REFS = [
  { step: '01', id: 's1' as const },
  { step: '02', id: 's2' as const },
  { step: '03', id: 's3' as const },
  { step: '04', id: 's4' as const },
]

const SECTION_PADDING = 'clamp(4.5rem, 8vw, 8.75rem) 2rem'

export default async function ServicesPage() {
  const t      = await getTranslations('services')
  const tCards = await getTranslations('services.cards')
  const tBound = await getTranslations('services.boundary')
  const tLife  = await getTranslations('services.lifecycle')

  return (
    <main style={{ background: 'var(--color-bg)' }}>

      {/* Page header */}
      <section style={{ padding: 'clamp(4rem, 8vw, 7rem) 2rem 3.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {t('eyebrow')}
          </p>
          <h1 style={{ marginBottom: '20px' }}>
            {t('title1')}<br />
            <span>{t('titleAccent')}</span>
          </h1>
          <p style={{ ...sans, fontSize: '18px', color: 'var(--color-text-secondary)', maxWidth: '44rem', margin: '0 auto', lineHeight: 1.7 }}>
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Service cards */}
      <section style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '16px' }} className="grid-cols-1 lg:grid-cols-2">
            {SERVICE_REFS.map((svc) => (
              <Link
                key={svc.id}
                href={svc.href}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
              >
                <article
                  className="card mp-card-hover"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    flex: 1,
                  }}
                >
                  <span style={{ ...mono, fontSize: '26px', color: 'var(--brand-text-secondary)', display: 'block', marginBottom: '20px' }}>
                    {svc.icon}
                  </span>

                  <header style={{ marginBottom: '16px' }}>
                    <h2 style={{ marginBottom: '8px' }}>
                      {tCards(`${svc.id}Title`)}
                    </h2>
                    <p style={{ ...sans, fontSize: '15px', color: 'var(--brand-text-secondary)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
                      {tCards(`${svc.id}Lede`)}
                    </p>
                  </header>

                  <div style={{ display: 'grid', gap: '14px', marginBottom: '24px' }} className="grid-cols-1 sm:grid-cols-3">
                    <div>
                      <p style={{ ...mono, fontSize: '11px', color: 'var(--brand-text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        {t('painLabel')}
                      </p>
                      <p style={{ ...sans, fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0 }}>
                        {tCards(`${svc.id}Pain`)}
                      </p>
                    </div>
                    <div>
                      <p style={{ ...mono, fontSize: '11px', color: 'var(--brand-text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        {t('systemLabel')}
                      </p>
                      <p style={{ ...sans, fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0 }}>
                        {tCards(`${svc.id}System`)}
                      </p>
                    </div>
                    <div>
                      <p style={{ ...mono, fontSize: '11px', color: 'var(--brand-text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        {t('resultLabel')}
                      </p>
                      <p style={{ ...sans, fontSize: '14px', color: 'var(--brand-text-secondary)', lineHeight: 1.65, fontWeight: 600, margin: 0 }}>
                        {tCards(`${svc.id}Result`)}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                    <span style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.05em' }}>
                      {tCards('ctaCard')}
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* What we don't do */}
      <section style={{ background: 'var(--color-bg)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {t('boundaryEyebrow')}
          </p>
          <h2 style={{ marginBottom: '24px' }}>
            {t('boundaryTitle')}
          </h2>
          <p style={{ ...sans, fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: '32px' }}>
            {t('boundaryDesc')}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
            {BOUNDARY_IDS.map((id) => (
              <li
                key={id}
                style={{
                  background: 'var(--color-bg-section)',
                  border: '1px solid var(--color-border)',
                  borderLeft: '3px solid var(--color-text-secondary)',
                  padding: '18px 22px',
                  borderRadius: 'var(--radius-card)',
                }}
              >
                <p style={{ ...grotesk, fontWeight: 700, fontSize: '16px', color: 'var(--color-text-primary)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                  {tBound(`${id}No`)}
                </p>
                <p style={{ ...sans, fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.65, margin: 0 }}>
                  {tBound(`${id}Why`)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Delivery lifecycle */}
      <section style={{ background: 'var(--color-bg-section)', padding: SECTION_PADDING, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto' }}>
          <div style={{ maxWidth: '40rem', marginBottom: '3rem' }}>
            <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '14px' }}>
              {t('lifecycleEyebrow')}
            </p>
            <h2>
              {t('lifecycleTitle')}
            </h2>
          </div>
          <div style={{ display: 'grid', gap: '1px', background: 'var(--color-border)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {LIFECYCLE_REFS.map((s) => (
              <div key={s.step} style={{ background: 'var(--color-bg)', padding: '32px' }}>
                <p style={{ ...grotesk, fontWeight: 700, fontSize: '48px', color: 'var(--brand-text-secondary)', letterSpacing: '-0.02em', marginBottom: '12px', lineHeight: 1 }}>
                  {s.step}
                </p>
                <h3 className="h-card" style={{ marginBottom: '10px' }}>
                  {tLife(`${s.id}Title`)}
                </h3>
                <p style={{ ...sans, fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {tLife(`${s.id}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--color-bg)', padding: SECTION_PADDING }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('ctaEyebrow')}
          </p>
          <h2 style={{ marginBottom: '20px' }}>
            {t('ctaTitle')}
          </h2>
          <p style={{ ...sans, fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            {t('ctaDesc')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link href="/contact" className="btn btn-primary">
              {t('ctaPrimary')}
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              {t('ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
