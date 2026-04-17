'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/automation-lab', label: 'Lab' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/automation-audit', label: 'Audit' },
  { href: '/contact', label: 'Contact' },
  { href: '/portfolio', label: 'Portfolio' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav
      style={{
        background: 'rgba(3,3,5,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '64px',
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <Image
              src="/logo.png"
              alt="Maxpromo Digital"
              width={180}
              height={45}
              style={{ height: '36px', width: 'auto' }}
              priority
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex" style={{ gap: '1.5rem', alignItems: 'center' }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link"
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 500,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex" style={{ flexShrink: 0 }}>
            <Link
              href="/automation-audit"
              style={{
                fontFamily: 'var(--font-roboto-mono)',
                fontWeight: 700,
                fontSize: '13px',
                color: '#030305',
                background: '#F97316',
                padding: '10px 20px',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'opacity 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Free Audit →
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle navigation"
            style={{ background: 'none', border: 'none', color: '#FAFAFF', cursor: 'pointer', padding: '4px' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '16px 0 20px',
            }}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-inter)',
                  fontWeight: 500,
                  fontSize: '15px',
                  color: '#6B6B7A',
                  textDecoration: 'none',
                  padding: '10px 0',
                }}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/automation-audit"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'inline-block',
                marginTop: '12px',
                fontFamily: 'var(--font-roboto-mono)',
                fontWeight: 700,
                fontSize: '12px',
                color: '#030305',
                background: '#F97316',
                padding: '10px 20px',
                textDecoration: 'none',
              }}
            >
              Free Audit →
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
