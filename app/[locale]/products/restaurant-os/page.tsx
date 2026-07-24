import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isDE = locale === 'de'
  const title = isDE
    ? 'RestaurantOS | QR-Bestellung, Küchenrouting & Zahlung'
    : 'RestaurantOS | QR Ordering, Kitchen Routing & Payment'
  const description = isDE
    ? 'QR-Bestellung, Küchenrouting und Zahlung in einem System. Keine App für Gäste, kein Tablet für das Personal, installiert auf Ihrer eigenen Domain.'
    : 'QR ordering, kitchen routing and payment in one system. No app for guests, no tablet for staff, installed on your own domain.'
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.maxpromo.digital/${locale}/products/restaurant-os`,
      languages: {
        de: 'https://www.maxpromo.digital/de/products/restaurant-os',
        en: 'https://www.maxpromo.digital/en/products/restaurant-os',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.maxpromo.digital/${locale}/products/restaurant-os`,
    },
  }
}

export default async function RestaurantOSPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>

        {/* Eyebrow */}
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#F97316', marginBottom: '1.5rem' }}>
          {'// Restaurant OS'}
        </p>

        {/* Headline */}
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.03em', color: '#F0F0F0', lineHeight: 1.15, marginBottom: '1rem' }}>
          {locale === 'de' ? 'Bestellungen laufen.' : 'Orders move.'}<br />{locale === 'de' ? 'Personal nicht.' : "Staff doesn’t."}
        </h1>

        {/* Description */}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#888888', lineHeight: 1.75, marginBottom: '1.5rem' }}>
          {locale === 'de' ? 'QR-Bestellung, Küchenrouting und Zahlung, alles in einem System. Keine App für Gäste. Kein Tablet für das Personal. Installiert auf Ihrer Domain.' : 'QR ordering, kitchen routing and payment, all in one system. No app for guests. No tablet for staff. Installed on your domain.'}
        </p>

        {/* Benefits */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(locale === 'de' ? [
            'Vollständige QR-Speisekarte mit Tischbestellung',
            'Echtzeit-Küchenrouting',
            'Integrierte Zahlung, keine Drittanbieter-Kasse',
            'Auf Ihrer eigenen Domain installiert',
          ] : [
            'Full QR menu with table ordering',
            'Real-time kitchen routing',
            'Integrated payment, no third-party POS',
            'Installed on your own domain',
          ]).map((item) => (
            <li key={item} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#666', letterSpacing: '0.04em', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ color: '#F97316', flexShrink: 0 }}>→</span>
              {item}
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/contact?system=restaurant-os"
            style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', background: '#F97316', color: '#000', padding: '14px 24px', textDecoration: 'none', display: 'block', textAlign: 'center' }}
          >
            {locale === 'de' ? 'Beratung anfragen →' : 'Book Consultation →'}
          </Link>
          <Link
            href="/contact?system=restaurant-os&request=walkthrough"
            style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'transparent', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)', padding: '14px 24px', textDecoration: 'none', display: 'block', textAlign: 'center' }}
          >
            {locale === 'de' ? 'Walkthrough anfragen →' : 'Request a Walkthrough →'}
          </Link>
        </div>

        {/* Note */}
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444444', marginTop: '1.5rem', lineHeight: 1.6 }}>
          {locale === 'de' ? 'Nur für qualifizierte Betriebe. Wir vereinbaren zuerst ein kurzes Gespräch.' : 'Available for qualified businesses. We schedule a short conversation first.'}
        </p>

      </div>
    </main>
  )
}
