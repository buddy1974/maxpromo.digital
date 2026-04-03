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
    <footer style={{ background: '#0E0E12', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '4rem 2rem' }}>
        <div
          style={{ display: 'grid', gap: '2.5rem', gridTemplateColumns: 'repeat(2, 1fr)' }}
          className="md:grid-cols-4"
        >
          {columns.map((col) => (
            <div key={col.title}>
              <p
                style={{
                  fontFamily: 'var(--font-space-mono)',
                  fontSize: '10px',
                  color: '#F97316',
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
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: '#6B6B7A' }}>
            © 2026 MaxPromo Digital
          </span>
          <span style={{ fontFamily: 'var(--font-space-mono)', fontSize: '11px', color: '#6B6B7A' }}>
            Built with Next.js · Deployed on Vercel
          </span>
          <a
            href="/portfolio"
            style={{
              color: '#1A1A1A',
              fontSize: '10px',
              textDecoration: 'none',
              fontFamily: 'var(--font-ibm-mono)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#333333')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#1A1A1A')}
          >
            staff
          </a>
        </div>
      </div>
    </footer>
  )
}
