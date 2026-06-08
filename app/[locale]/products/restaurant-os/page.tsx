import Link from 'next/link'

export default function RestaurantOSPage() {
  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: '520px', width: '100%' }}>

        {/* Eyebrow */}
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#F97316', marginBottom: '1.5rem' }}>
          {'// Restaurant OS'}
        </p>

        {/* Headline */}
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.03em', color: '#F0F0F0', lineHeight: 1.15, marginBottom: '1rem' }}>
          Orders move.<br />Staff doesn&apos;t.
        </h1>

        {/* Description */}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#888888', lineHeight: 1.75, marginBottom: '1.5rem' }}>
          QR ordering, kitchen routing and payment — all in one system. No app for guests. No tablet for staff. Installed on your domain.
        </p>

        {/* Benefits */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            'Full QR menu with table ordering',
            'Real-time kitchen routing',
            'Integrated payment — no third-party POS',
            'Installed on your own domain',
          ].map((item) => (
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
            Book Consultation →
          </Link>
          <Link
            href="/contact?system=restaurant-os&request=walkthrough"
            style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'transparent', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)', padding: '14px 24px', textDecoration: 'none', display: 'block', textAlign: 'center' }}
          >
            Request a Walkthrough →
          </Link>
        </div>

        {/* Note */}
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#444444', marginTop: '1.5rem', lineHeight: 1.6 }}>
          Available for qualified businesses. We schedule a short conversation first.
        </p>

      </div>
    </main>
  )
}
