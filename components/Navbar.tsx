'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/services',        label: 'Services'  },
  { href: '/systems',         label: 'Systems'   },
  { href: '/automation-lab',  label: 'Lab'       },
  { href: '/pricing',         label: 'Pricing'   },
  { href: '/blog',            label: 'Blog'      },
  { href: '/about',           label: 'About'     },
  { href: '/contact',         label: 'Contact'   },
]

const navLinkBase: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  textDecoration: 'none',
  color: 'hsl(40 12% 65%)',
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.03)',
  padding: '5px 12px',
  borderRadius: '4px',
  transition: 'all 0.2s ease',
  display: 'inline-block',
  whiteSpace: 'nowrap' as const,
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(1180px, calc(100% - 2rem))',
          zIndex: 50,
          background: scrolled
            ? 'hsl(240 12% 8% / 0.92)'
            : 'hsl(240 12% 8% / 0.65)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid hsl(40 30% 96% / 0.06)',
          borderRadius: '14px',
          transition: 'background 300ms ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
            padding: '0 1.25rem',
            gap: '1rem',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'relative', width: '8px', height: '8px', flexShrink: 0 }}>
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'hsl(28 100% 58%)',
                  opacity: 0.4,
                  animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                }}
              />
              <span
                style={{
                  position: 'relative',
                  display: 'block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'hsl(28 100% 58%)',
                }}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'hsl(40 30% 96%)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              MAXPROMO
              <span style={{ color: 'hsl(28 100% 58%)' }}> DIGITAL</span>
            </span>
          </Link>

          {/* Desktop links — flat, no dropdowns */}
          <div className="hidden md:flex" style={{ gap: '4px', alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden' }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={navLinkBase}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'
                  e.currentTarget.style.background = 'rgba(249,115,22,0.08)'
                  e.currentTarget.style.color = 'hsl(40 30% 96%)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.color = 'hsl(40 12% 65%)'
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex" style={{ flexShrink: 0 }}>
            <Link
              href="/automation-audit"
              className="shine"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'hsl(240 14% 4%)',
                background: 'hsl(28 100% 58%)',
                padding: '9px 18px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '8px',
                transition: 'opacity 150ms ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
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
              color: 'hsl(40 30% 96%)',
              cursor: 'pointer',
              padding: 0,
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Spacer */}
      <div style={{ height: '80px' }} />

      {/* Mobile fullscreen menu */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'hsl(240 14% 4%)',
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
              padding: '0 1.5rem',
              height: '64px',
              borderBottom: '1px solid hsl(40 30% 96% / 0.06)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'hsl(40 30% 96%)',
              }}
            >
              MAXPROMO <span style={{ color: 'hsl(28 100% 58%)' }}>DIGITAL</span>
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation"
              style={{
                background: 'none',
                border: 'none',
                color: 'hsl(40 30% 96%)',
                fontSize: '24px',
                cursor: 'pointer',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          {/* Scrollable nav items */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '1rem 1.5rem', gap: '8px' }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  fontSize: '15px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'hsl(40 12% 65%)',
                  textDecoration: 'none',
                  padding: '16px 20px',
                  display: 'block',
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)'
                  e.currentTarget.style.background = 'rgba(249,115,22,0.08)'
                  e.currentTarget.style.color = 'hsl(40 30% 96%)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.color = 'hsl(40 12% 65%)'
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div
            style={{
              padding: '1.5rem',
              borderTop: '1px solid hsl(40 30% 96% / 0.06)',
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
                fontSize: '14px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'hsl(240 14% 4%)',
                background: 'hsl(28 100% 58%)',
                padding: '18px 48px',
                textDecoration: 'none',
                display: 'block',
                textAlign: 'center',
                borderRadius: '10px',
                width: '100%',
              }}
            >
              FREE AUDIT →
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </>
  )
}
