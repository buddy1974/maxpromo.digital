'use client'

import Link from 'next/link'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/automation-lab', label: 'Lab' },
  { href: '/ai-websites', label: 'AI Websites' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: 'rgba(6,8,10,0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,106,0,0.12)' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo — monospace */}
        <Link
          href="/"
          className="tracking-tight"
          style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: '1rem', fontWeight: 600, color: '#F0EDE8' }}
        >
          MaxPromo<span style={{ color: '#FF6A00' }}>.digital</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.6)', letterSpacing: '0.02em' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = '#FF6A00')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = 'rgba(240,237,232,0.6)')}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/automation-audit"
            className="text-sm font-semibold px-5 py-2 rounded-sm transition-all"
            style={{
              fontFamily: 'var(--font-ibm-mono)',
              background: '#FF6A00',
              color: '#06080A',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={e => ((e.target as HTMLElement).style.background = '#E55F00')}
            onMouseLeave={e => ((e.target as HTMLElement).style.background = '#FF6A00')}
          >
            Free Audit
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1"
          style={{ color: '#F0EDE8' }}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-6 py-4 flex flex-col gap-4"
          style={{ background: '#0D1014', borderColor: 'rgba(255,106,0,0.12)' }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium py-1"
              style={{ fontFamily: 'var(--font-ibm-mono)', color: 'rgba(240,237,232,0.7)' }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/automation-audit"
            className="text-sm font-semibold px-5 py-2.5 rounded-sm text-center"
            style={{ fontFamily: 'var(--font-ibm-mono)', background: '#FF6A00', color: '#06080A' }}
            onClick={() => setMenuOpen(false)}
          >
            Free Audit
          </Link>
        </div>
      )}
    </nav>
  )
}
