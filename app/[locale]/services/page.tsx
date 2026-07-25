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
  { id: 'c1', href: '/services/websites-platforms', icon: '◰' }, // Legacy Website & CMS Modernization
  { id: 'c2', href: '/services/workflow-automation', icon: '▤' }, // Workflow Automation
  { id: 'c3', href: '/services/ai-agents',           icon: '◇' }, // AI Business Systems
  { id: 'c4', href: '/services/customer-inquiries',  icon: '⊟' }, // Website Systems (lead capture, booking, portals)
  { id: 'c5', href: '/services/reviews',             icon: '→' }, // Commerce & Catalogue (quote/order automation)
  { id: 'c6', href: '/services/social-media',        icon: '⌗' }, // Content & Newsletter Systems
]

const BOUNDARY_IDS = ['n1', 'n2', 'n3', 'n4', 'n5'] as const
const LIFECYCLE_REFS = [
  { step: '01', id: 's1' as const },
  { step: '02', id: 's2' as const },
  { step: '03', id: 's3' as const },
  { step: '04', id: 's4' as const },
]

export default async function ServicesPage() {
  const t      = await getTranslations('services')
  const tCards = await getTranslations('services.cards')
  const tBound = await getTranslations('services.boundary')
  const tLife  = await getTranslations('services.lifecycle')

  return (
    <main style={{ background: 'hsl(240 14% 4%)' }}>

      {/* Page header */}
      <section style={{ padding: '6rem 2rem 3rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            {t('eyebrow')}
          </p>
          <h1 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '20px', lineHeight: 1.1 }}>
            {t('title1')}<br />
            <span style={{ color: '#F97316' }}>{t('titleAccent')}</span>
          </h1>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', maxWidth: '44rem', margin: '0 auto', lineHeight: 1.7 }}>
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Service cards */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '4rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '88rem', margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '12px' }} className="grid-cols-1 lg:grid-cols-2">
            {SERVICE_REFS.map((svc) => (
              <Link
                key={svc.id}
                href={svc.href}
                style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
              >
                <article
                  className="dark-card"
                  style={{
                    background: 'hsl(240 12% 7%)',
                    border: '1px solid hsl(40 30% 96% / 0.08)',
                    borderRadius: '12px',
                    padding: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    flex: 1,
                    transition: 'border-color 200ms ease',
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#F97316', opacity: 0.5 }} />

                  <span style={{ ...mono, fontSize: '24px', color: '#F97316', display: 'block', marginBottom: '20px' }}>
                    {svc.icon}
                  </span>

                  <header style={{ marginBottom: '16px' }}>
                    <h2 style={{ ...grotesk, fontWeight: 700, fontSize: '22px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: '8px' }}>
                      {tCards(`${svc.id}Title`)}
                    </h2>
                    <p style={{ ...sans, fontSize: '15px', color: '#F97316', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
                      {tCards(`${svc.id}Lede`)}
                    </p>
                  </header>

                  <div style={{ display: 'grid', gap: '14px', marginBottom: '24px' }} className="grid-cols-1 sm:grid-cols-3">
                    <div>
                      <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        {t('painLabel')}
                      </p>
                      <p style={{ ...sans, fontSize: '13px', color: 'hsl(40 30% 96% / 0.75)', lineHeight: 1.65, margin: 0 }}>
                        {tCards(`${svc.id}Pain`)}
                      </p>
                    </div>
                    <div>
                      <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        {t('systemLabel')}
                      </p>
                      <p style={{ ...sans, fontSize: '13px', color: 'hsl(40 30% 96% / 0.75)', lineHeight: 1.65, margin: 0 }}>
                        {tCards(`${svc.id}System`)}
                      </p>
                    </div>
                    <div>
                      <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                        {t('resultLabel')}
                      </p>
                      <p style={{ ...sans, fontSize: '13px', color: '#F97316', lineHeight: 1.65, fontWeight: 600, margin: 0 }}>
                        {tCards(`${svc.id}Result`)}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
                    <span style={{ ...mono, fontSize: '12px', color: '#F97316', letterSpacing: '0.05em' }}>
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
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            {t('boundaryEyebrow')}
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '24px' }}>
            {t('boundaryTitle')}
          </h2>
          <p style={{ ...sans, fontSize: '16px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, marginBottom: '32px' }}>
            {t('boundaryDesc')}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
            {BOUNDARY_IDS.map((id) => (
              <li
                key={id}
                style={{
                  background: 'hsl(240 12% 7%)',
                  border: '1px solid hsl(40 30% 96% / 0.06)',
                  borderLeft: '3px solid hsl(0 84% 60% / 0.6)',
                  padding: '18px 22px',
                  borderRadius: '6px',
                }}
              >
                <p style={{ ...grotesk, fontWeight: 700, fontSize: '15px', color: 'hsl(40 30% 96%)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                  {tBound(`${id}No`)}
                </p>
                <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.65, margin: 0 }}>
                  {tBound(`${id}Why`)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Delivery lifecycle */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div style={{ maxWidth: '40rem', marginBottom: '3rem' }}>
            <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
              {t('lifecycleEyebrow')}
            </p>
            <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)' }}>
              {t('lifecycleTitle')}
            </h2>
          </div>
          <div style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '12px', overflow: 'hidden' }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {LIFECYCLE_REFS.map((s) => (
              <div key={s.step} style={{ background: 'hsl(240 12% 7%)', padding: '32px' }}>
                <p style={{ ...grotesk, fontWeight: 700, fontSize: '48px', color: '#F97316', letterSpacing: '-0.04em', marginBottom: '12px', lineHeight: 1 }}>
                  {s.step}
                </p>
                <h3 style={{ ...grotesk, fontWeight: 700, fontSize: '17px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', marginBottom: '10px', lineHeight: 1.3 }}>
                  {tLife(`${s.id}Title`)}
                </h3>
                <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.7, margin: 0 }}>
                  {tLife(`${s.id}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'hsl(240 14% 4%)', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>
            {t('ctaEyebrow')}
          </p>
          <h2 style={{ ...grotesk, fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: 'hsl(40 30% 96%)', marginBottom: '20px' }}>
            {t('ctaTitle')}
          </h2>
          <p style={{ ...sans, fontSize: '17px', color: 'hsl(40 12% 65%)', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            {t('ctaDesc')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link href="/contact" className="shine" style={{ ...mono, fontWeight: 700, fontSize: '15px', color: 'hsl(240 14% 4%)', background: '#F97316', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}>
              {t('ctaPrimary')}
            </Link>
            <Link href="/contact" className="glass" style={{ ...sans, fontWeight: 500, fontSize: '15px', color: 'hsl(40 30% 96%)', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}>
              {t('ctaSecondary')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
