'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/automation-lab', label: 'Lab' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/automation-audit', label: 'Audit' },
  { href: '/contact', label: 'Contact' },
]

const SYSTEMS_LINKS_TOP = [
  { href: '/products/handwerk-os', label: 'HANDWERK OS' },
  { href: '/products/restaurant-os', label: 'RESTAURANT OS' },
]

const SYSTEMS_LINKS_BOTTOM = [
  { href: '/products/printshop', label: 'PRINTSHOP OS' },
  { href: '/products/real-estate-os', label: 'REAL ESTATE OS' },
  { href: '/products/care-os', label: 'CARE OS' },
  { href: '/products/publishing-os', label: 'PUBLISHING OS' },
  { href: '/products/praxis-os', label: 'PRAXIS OS' },
]

const ALL_SYSTEMS_LINKS = [...SYSTEMS_LINKS_TOP, ...SYSTEMS_LINKS_BOTTOM]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [systemsOpen, setSystemsOpen] = useState(false)

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

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
                    top: '100%',
                    left: 0,
                    paddingTop: '8px',
                    background: '#080808',
                    border: '1px solid #1A1A1A',
                    minWidth: '220px',
                    zIndex: 100,
                  }}
                >
                  {SYSTEMS_LINKS_TOP.map((item) => (
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
                        borderBottom: '1px solid #1A1A1A',
                        transition: 'color 150ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#E8FF00')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div style={{ height: '1px', background: '#1A1A1A', margin: '4px 0' }} />
                  {SYSTEMS_LINKS_BOTTOM.map((item, idx) => (
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
                        borderBottom: idx < SYSTEMS_LINKS_BOTTOM.length - 1 ? '1px solid #1A1A1A' : 'none',
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

          {/* Desktop CTA */}
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

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            style={{
              background: 'none',
              border: 'none',
              color: '#F0F0F0',
              cursor: 'pointer',
              padding: 0,
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── FULLSCREEN MOBILE MENU ── */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: '#080808',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 2rem',
              height: '64px',
              borderBottom: '1px solid #1A1A1A',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#F0F0F0',
              }}
            >
              MAXPROMO
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation"
              style={{
                background: 'none',
                border: 'none',
                color: '#F0F0F0',
                fontSize: '24px',
                lineHeight: 1,
                cursor: 'pointer',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Scrollable links */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '28px',
                  letterSpacing: '-0.03em',
                  color: '#666666',
                  textDecoration: 'none',
                  padding: '20px 2rem',
                  display: 'block',
                  textAlign: 'center',
                  borderBottom: '1px solid #1A1A1A',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E8FF00')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
              >
                {link.label}
              </Link>
            ))}

            {/* Systems label */}
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: '#333333',
                textAlign: 'center',
                padding: '20px 2rem 8px',
                margin: 0,
              }}
            >
              Systems
            </p>

            {ALL_SYSTEMS_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '16px',
                  color: '#666666',
                  textDecoration: 'none',
                  padding: '12px 2rem',
                  display: 'block',
                  textAlign: 'center',
                  transition: 'color 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F0F0F0')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA at bottom */}
          <div
            style={{
              padding: '1.5rem 2rem',
              borderTop: '1px solid #1A1A1A',
              display: 'flex',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Link
              href="/automation-audit"
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#080808',
                background: '#E8FF00',
                padding: '16px 32px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              FREE AUDIT →
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
