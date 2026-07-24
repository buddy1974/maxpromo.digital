import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { getProductsCards } from '@/lib/registry/adapters'
import ProductsPageGrid from '@/components/systems/ProductsPageGrid'

/* ─── METADATA ─── */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'Alle Systeme | Sieben Betriebssysteme von Maxpromo Digital'
    : 'All Systems | Seven Operating Systems from Maxpromo Digital'
  const description = isDE
    ? 'Sieben Betriebssysteme, einsatzbereit zur Installation, für Restaurants, Handwerk, Praxen, Pflege, Verlage, Immobilien und Druckereien.'
    : 'Seven operating systems, configured and installation-ready, for restaurants, trades, medical practices, care, publishing, real estate and print shops.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/products`,
      languages: {
        de: 'https://www.maxpromo.digital/de/products',
        en: 'https://www.maxpromo.digital/en/products',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.maxpromo.digital/${locale}/products`,
    },
  }
}

/* ─── FILTER CHROME ─────────────────────────────────────────── */
// Visual filter chips, wired up in a future task.
// TODO: future filters , implement STATUS_FILTERS as server query params
// TODO: future tags    , wire CATEGORY_CHIPS to category adapter query
// TODO: future search  , add search input, pass query to getProductsCardsByCategory

const STATUS_LABELS = ['ALL', 'LIVE', 'DEPLOYED'] as const
const CATEGORY_CHIPS = ['TRADE', 'HOSPITALITY', 'PRINT', 'REAL ESTATE', 'CARE', 'PUBLISHING', 'MEDICAL'] as const

/* ─── STYLES ──────────────────────────────────────────────── */

const chipBase: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  padding: '6px 14px',
  border: '1px solid #1A1A1A',
  background: 'transparent',
  color: '#666666',
}

/* ─── PAGE ────────────────────────────────────────────────── */

export default async function ProductsPage() {
  const locale = await getLocale()
  const cards  = getProductsCards(locale)

  return (
    <main style={{ background: '#080808' }}>

      {/* ── HERO ── */}
      <section style={{ padding: '5rem 2rem', borderBottom: '1px solid #1A1A1A' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1.5rem' }}>
            ALL SYSTEMS
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '-0.04em', color: '#F0F0F0', lineHeight: 1.1, marginBottom: '0', whiteSpace: 'pre-line' }}>
            {'Seven operating systems.\nBuilt to install and run.'}
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: '#666666', maxWidth: '560px', marginTop: '1rem', lineHeight: 1.8 }}>
            Each system is configured and installation-ready. Designed to replace spreadsheets, paper records, and disconnected tools.
          </p>
        </div>
      </section>

      {/* ── FILTER BAR, visual placeholder, wired up in a future task ── */}
      <section style={{ background: '#0F0F0F', borderBottom: '1px solid #1A1A1A', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {STATUS_LABELS.map((label) => (
              <span key={label} style={chipBase}>
                {label}
              </span>
            ))}
          </div>

          {/* Visual separator */}
          <div style={{ width: '1px', height: '20px', background: '#1A1A1A', flexShrink: 0 }} />

          {/* Category chips */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORY_CHIPS.map((cat) => (
              <span key={cat} style={chipBase}>
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SYSTEMS GRID, registry-driven via ProductsPageGrid → SystemGrid → SystemCardFeatured ── */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <ProductsPageGrid cards={cards} locale={locale} />
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{ background: '#0F0F0F', borderTop: '1px solid #1A1A1A', padding: '5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#F97316', marginBottom: '1rem' }}>
            CUSTOM SYSTEMS
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', letterSpacing: '-0.04em', color: '#F0F0F0', margin: 0 }}>
            Need something that isn&apos;t listed?
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: '#666666', maxWidth: '500px', margin: '1rem auto 2rem', lineHeight: 1.8 }}>
            Every system above started as a custom brief. If your business has a specific operational problem, we build the system that solves it.
          </p>
          <Link
            href="/contact"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, background: '#F97316', color: '#080808', padding: '16px 32px', textDecoration: 'none', display: 'inline-block' }}
          >
            DISCUSS YOUR SYSTEM →
          </Link>
        </div>
      </section>

    </main>
  )
}
