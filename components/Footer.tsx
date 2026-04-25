'use client'

import Link from 'next/link'

const columns = [
  {
    title: 'Company',
    links: [
      { label: 'Services', href: '/services' },
      { label: 'Case Studies', href: '/case-studies' },
      { label: 'Automation Lab', href: '/automation-lab' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'AI Agentic Workflows', href: '/services' },
      { label: 'Process Automation', href: '/services' },
      { label: 'AI-Powered Websites', href: '/ai-websites' },
      { label: 'Custom Integration', href: '/services' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { label: 'Free Automation Audit', href: '/automation-audit' },
      { label: 'Automation Lab', href: '/automation-lab' },
      { label: 'AI Websites', href: '/ai-websites' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Impressum', href: '/impressum' },
      { label: 'Datenschutz / Privacy', href: '/privacy' },
      { label: 'AGB / Terms', href: '/agb' },
      { label: 'Cookie Policy', href: '/privacy#cookies' },
    ],
  },
]

export default function Footer() {
  return (
    <footer
      style={{
        background: 'hsl(240 12% 6%)',
        borderTop: '1px solid hsl(40 30% 96% / 0.06)',
      }}
    >
      {/* CTA strip */}
      <div
        style={{
          borderBottom: '1px solid hsl(40 30% 96% / 0.06)',
          padding: '3rem 2rem',
        }}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
              // Ready to automate?
            </p>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '28px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.04em', margin: 0 }}>
              Let&apos;s build your first agent.
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href="/automation-audit"
              className="shine"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '13px',
                color: 'hsl(240 14% 4%)',
                background: 'hsl(28 100% 58%)',
                padding: '12px 24px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '8px',
              }}
            >
              Book my free audit →
            </Link>
            <Link
              href="/contact"
              className="glass"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: 'hsl(40 30% 96%)',
                padding: '12px 24px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '8px',
              }}
            >
              Just send me the deck
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3.5rem 2rem' }}>
        <div
          style={{ display: 'grid', gap: '2.5rem', gridTemplateColumns: 'repeat(2, 1fr)' }}
          className="md:grid-cols-4"
        >
          {columns.map((col) => (
            <div key={col.title}>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'hsl(28 100% 58%)',
                  letterSpacing: '0.2em',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                }}
              >
                {col.title}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid hsl(40 30% 96% / 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              className="status-pulse"
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(28 100% 58%)', display: 'inline-block', flexShrink: 0 }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)' }}>
              © 2026 MAXPROMO DIGITAL — Built by humans. Operated by machines.
            </span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 35%)' }}>
            // SYS.STATUS · ALL OPERATIONAL · 99.9% UPTIME
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 35%)' }}>
            Steuernummer: 111/5339/7597 · Finanzamt: Essen-NordOst
          </span>
          <a
            href="/portfolio"
            style={{ color: 'hsl(240 14% 4%)', fontSize: '10px', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(240 8% 35%)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(240 14% 4%)')}
          >
            staff
          </a>
        </div>
      </div>
    </footer>
  )
}
