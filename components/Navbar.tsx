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
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          style={{ fontFamily: 'var(--font-ibm-mono)', fontSize: '0.95rem', fontWeight: 600 }}
        >
          <span style={{ color: '#FFFFFF' }}>MaxPromo</span>
          <span style={{ color: '#F97316' }}>.digital</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link text-sm font-medium"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/automation-audit"
            className="text-sm font-semibold px-5 py-2 transition-opacity hover:opacity-85"
            style={{
              fontFamily: 'var(--font-dm-sans)',
              background: '#F97316',
              color: '#0A0A0A',
              borderRadius: '2px',
            }}
          >
            Free Audit
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1"
          style={{ color: '#FFFFFF' }}
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
          className="md:hidden px-6 py-5 flex flex-col gap-4"
          style={{ background: '#111111', borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium"
              style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-dm-sans)' }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/automation-audit"
            className="text-sm font-semibold px-5 py-3 text-center mt-1"
            style={{ background: '#F97316', color: '#0A0A0A', borderRadius: '2px', fontFamily: 'var(--font-dm-sans)' }}
            onClick={() => setMenuOpen(false)}
          >
            Free Audit
          </Link>
        </div>
      )}
    </nav>
  )
}
