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

interface LayerRef {
  num: string
  id: 'l1' | 'l2' | 'l3' | 'l4' | 'l5' | 'l6'
  componentKeys: ReadonlyArray<'C1' | 'C2' | 'C3' | 'C4' | 'C5'>
  shipsIn: ReadonlyArray<{ name: string; href: string }>
}

const LAYER_REFS: ReadonlyArray<LayerRef> = [
  {
    num: '01', id: 'l1',
    componentKeys: ['C1','C2','C3','C4','C5'],
    shipsIn: [
      { name: 'RestaurantOS',   href: '/products/restaurant-os' },
      { name: 'PraxisOS',       href: '/products/praxis-os' },
      { name: 'RealEstateOS',   href: '/products/real-estate-os' },
    ],
  },
  {
    num: '02', id: 'l2',
    componentKeys: ['C1','C2','C3','C4','C5'],
    shipsIn: [
      { name: 'HandwerkOS', href: '/products/handwerk-os' },
    ],
  },
  {
    num: '03', id: 'l3',
    componentKeys: ['C1','C2','C3','C4','C5'],
    shipsIn: [
      { name: 'HandwerkOS',    href: '/products/handwerk-os' },
      { name: 'PublishingOS',  href: '/products/publishing-os' },
    ],
  },
  {
    num: '04', id: 'l4',
    componentKeys: ['C1','C2','C3','C4','C5'],
    shipsIn: [
      { name: 'CareOS',   href: '/products/care-os' },
      { name: 'PraxisOS', href: '/products/praxis-os' },
    ],
  },
  {
    num: '05', id: 'l5',
    componentKeys: ['C1','C2','C3','C4','C5'],
    shipsIn: [
      { name: 'CareOS',     href: '/products/care-os' },
      { name: 'PraxisOS',   href: '/products/praxis-os' },
      { name: 'HandwerkOS', href: '/products/handwerk-os' },
    ],
  },
  {
    num: '06', id: 'l6',
    componentKeys: ['C1','C2','C3','C4','C5'],
    shipsIn: [
      { name: 'PublishingOS', href: '/products/publishing-os' },
      { name: 'PrintShop OS', href: '/products/printshop' },
      { name: 'RestaurantOS', href: '/products/restaurant-os' },
    ],
  },
]

const BOUNDARY_IDS = ['n1', 'n2', 'n3', 'n4', 'n5'] as const
const LIFECYCLE_REFS = [
  { step: '01', id: 's1' as const },
  { step: '02', id: 's2' as const },
  { step: '03', id: 's3' as const },
  { step: '04', id: 's4' as const },
]

export default async function ServicesPage() {
  const t       = await getTranslations('services')
  const tLayers = await getTranslations('services.layers')
  const tBound  = await getTranslations('services.boundary')
  const tLife   = await getTranslations('services.lifecycle')

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

      {/* Operational layers */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '4rem 2rem', borderBottom: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <div style={{ maxWidth: '88rem', margin: '0 auto' }}>
          <div
            style={{ display: 'grid', gap: '12px' }}
            className="grid-cols-1 lg:grid-cols-2"
          >
            {LAYER_REFS.map((layer) => (
              <article
                key={layer.num}
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
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#F97316', opacity: 0.5 }} />

                <header style={{ marginBottom: '16px' }}>
                  <span style={{ ...mono, fontSize: '11px', color: 'hsl(40 12% 65% / 0.7)', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
                    {layer.num} · {t('layerLabel')}
                  </span>
                  <h2 style={{ ...grotesk, fontWeight: 700, fontSize: '24px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                    {tLayers(`${layer.id}Name`)}
                  </h2>
                </header>

                <p style={{ ...sans, fontSize: '15px', color: '#F97316', lineHeight: 1.6, marginBottom: '24px', fontStyle: 'italic' }}>
                  {tLayers(`${layer.id}OneLiner`)}
                </p>

                <div style={{ marginBottom: '20px' }}>
                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {t('painLabel')}
                  </p>
                  <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 30% 96% / 0.8)', lineHeight: 1.7, marginBottom: '14px' }}>
                    {tLayers(`${layer.id}Pain`)}
                  </p>

                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {t('systemLabel')}
                  </p>
                  <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 30% 96% / 0.8)', lineHeight: 1.7, marginBottom: '14px' }}>
                    {tLayers(`${layer.id}System`)}
                  </p>

                  <p style={{ ...mono, fontSize: '10px', color: 'rgba(249,115,22,0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    {t('resultLabel')}
                  </p>
                  <p style={{ ...sans, fontSize: '14px', color: '#F97316', lineHeight: 1.7, fontWeight: 600 }}>
                    {tLayers(`${layer.id}Result`)}
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <p style={{ ...mono, fontSize: '10px', color: 'hsl(40 12% 65% / 0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {t('componentsLabel')}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {layer.componentKeys.map((ck) => (
                      <li key={ck} style={{ display: 'flex', alignItems: 'center', gap: '10px', ...sans, fontSize: '13px', color: 'hsl(40 30% 96% / 0.75)' }}>
                        <span style={{ width: '4px', height: '4px', background: '#F97316', flexShrink: 0, display: 'inline-block' }} />
                        {tLayers(`${layer.id}${ck}`)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
                  <p style={{ ...mono, fontSize: '10px', color: 'hsl(40 12% 65% / 0.7)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {t('shipsInLabel')}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {layer.shipsIn.map((p) => (
                      <Link
                        key={p.name}
                        href={p.href}
                        style={{ ...mono, fontSize: '11px', color: '#F97316', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', padding: '4px 10px', letterSpacing: '0.04em', borderRadius: '2px', textDecoration: 'none' }}
                      >
                        {p.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
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
          <div
            style={{ display: 'grid', gap: '1px', background: 'hsl(240 10% 16%)', borderRadius: '12px', overflow: 'hidden' }}
            className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          >
            {LIFECYCLE_REFS.map((s) => (
              <div key={s.step} style={{ background: 'hsl(240 12% 7%)', padding: '32px' }}>
                <p style={{ ...grotesk, fontWeight: 700, fontSize: '48px', color: '#F97316', letterSpacing: '-0.04em', marginBottom: '12px', lineHeight: 1 }}>
                  {s.step}
                </p>
                <h3 style={{ ...grotesk, fontWeight: 700, fontSize: '17px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.02em', marginBottom: '10px', lineHeight: 1.3 }}>
                  {tLife(`${s.id}Title`)}
                </h3>
                <p style={{ ...sans, fontSize: '14px', color: 'hsl(40 12% 65%)', lineHeight: 1.7 }}>
                  {tLife(`${s.id}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* See live systems link */}
      <div style={{ background: 'hsl(240 14% 4%)', padding: '2rem', textAlign: 'center', borderTop: '1px solid hsl(40 30% 96% / 0.06)' }}>
        <Link href="/systems" className="sys-cta">
          {t('seeLiveLink')}
        </Link>
      </div>

      {/* CTA */}
      <section style={{ background: 'hsl(240 12% 6%)', padding: '5rem 2rem' }}>
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
            <Link href="/automation-audit" className="shine" style={{ ...mono, fontWeight: 700, fontSize: '15px', color: 'hsl(240 14% 4%)', background: '#F97316', padding: '14px 28px', textDecoration: 'none', display: 'inline-block', borderRadius: '10px' }}>
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
