import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Coming Soon',
  description:
    'Long-form writing on AI automation, agent design, and the systems we build at Maxpromo Digital.',
}

const mono = { fontFamily: 'var(--font-roboto-mono)' } as const
const grotesk = { fontFamily: 'var(--font-inter)' } as const
const sans = { fontFamily: 'var(--font-inter)' } as const

export default function BlogPage() {
  return (
    <main style={{ background: '#0A0A0A', minHeight: '100vh', padding: '140px 24px 100px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ ...mono, fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 16px' }}>
          // Blog
        </p>
        <h1 style={{ ...grotesk, fontSize: 'clamp(36px, 6vw, 60px)', color: '#FFFFFF', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 20px', lineHeight: 1.05 }}>
          Coming soon.
        </h1>
        <p style={{ ...sans, fontSize: '17px', color: '#888888', lineHeight: 1.6, margin: '0 auto 36px', maxWidth: '560px' }}>
          We&rsquo;re writing about agent design, n8n at scale, German Kleinunternehmer billing, and the actual systems behind the OS. The first posts ship Q3 2026.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/automation-audit"
            style={{
              ...mono, fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase',
              background: '#F97316', color: '#000', border: 'none', borderRadius: '2px',
              padding: '14px 22px', textDecoration: 'none', display: 'inline-block',
            }}
          >
            Run the audit instead
          </Link>
          <Link
            href="/case-studies"
            style={{
              ...mono, fontWeight: 700, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase',
              background: 'rgba(255,255,255,0.04)', color: '#FFF', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px',
              padding: '14px 22px', textDecoration: 'none', display: 'inline-block',
            }}
          >
            Case studies
          </Link>
        </div>
      </div>
    </main>
  )
}
