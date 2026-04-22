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

const SYSTEMS_LINKS = [
  { href: '/products/handwerk-os', label: 'HANDWERK OS' },
  { href: '/products/restaurant-os', label: 'RESTAURANT OS' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [systemsOpen, setSystemsOpen] = useState(false)

  return (
    <nav
      style={{
        background: '#080808',
        borderBottom: '1px solid #1A1A1A',
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
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 400,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* SYSTEMS dropdown */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setSystemsOpen(true)}
              onMouseLeave={() => setSystemsOpen(false)}
            >
              <button
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 400,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: systemsOpen ? '#E8FF00' : '#666666',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'color 150ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Systems <span style={{ fontSize: '9px', opacity: 0.6 }}>▾</span>
              </button>

              {systemsOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    left: 0,
                    background: '#080808',
                    border: '1px solid #1A1A1A',
                    minWidth: '220px',
                    zIndex: 100,
                  }}
                >
                  {SYSTEMS_LINKS.map((item, idx) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        padding: '12px 20px',
                        color: '#666666',
                        textDecoration: 'none',
                        borderBottom: idx < SYSTEMS_LINKS.length - 1 ? '1px solid #1A1A1A' : 'none',
                        transition: 'color 150ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#E8FF00')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="hidden md:flex" style={{ flexShrink: 0 }}>
            <Link
              href="/automation-audit"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#080808',
                background: '#E8FF00',
                padding: '10px 20px',
                textDecoration: 'none',
                display: 'inline-block',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#D4EB00')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#E8FF00')}
            >
              Free Audit →
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle navigation"
            style={{ background: 'none', border: 'none', color: '#F0F0F0', cursor: 'pointer', padding: '4px' }}
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
              borderTop: '1px solid #1A1A1A',
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
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 400,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#666666',
                  textDecoration: 'none',
                  padding: '10px 0',
                  transition: 'color 150ms ease',
                }}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile SYSTEMS links */}
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#333333',
                padding: '12px 0 4px',
                margin: 0,
              }}
            >
              Systems
            </p>
            {SYSTEMS_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 400,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#666666',
                  textDecoration: 'none',
                  padding: '8px 0 8px 12px',
                  transition: 'color 150ms ease',
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
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#080808',
                background: '#E8FF00',
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
