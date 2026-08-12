'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import LocaleSwitcher from './LocaleSwitcher'

/**
 * NAV_LINKS pairs a route with the translation key under nav.* so the
 * label flips with the active locale. Keys live in messages/{de,en}.json.
 */
const NAV_LINKS = [
  { href: '/services',  key: 'services' },
  { href: '/systems',   key: 'systems'  },
  { href: '/blog',      key: 'blog'     },
  { href: '/about',     key: 'about'    },
  { href: '/contact',   key: 'contact'  },
] as const

const navLinkBase: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-nav)',
  fontWeight: 600,
  lineHeight: 1,
  textDecoration: 'none',
  color: '#FFFFFF',
  padding: '10px 6px',
  transition: 'color 0.15s ease',
  display: 'inline-flex',
  alignItems: 'center',
  whiteSpace: 'nowrap' as const,
}

export default function Navbar() {
  const t = useTranslations('nav')
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
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
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          background: 'var(--color-footer-bg)',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
          boxShadow: scrolled ? 'var(--shadow-elevated)' : 'none',
          transition: 'border-color 200ms ease, box-shadow 200ms ease',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--container-width)',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '96px',
            padding: '0 2rem',
            gap: '2rem',
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
              marginRight: '1rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '24px',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.01em',
                lineHeight: 1,
              }}
            >
              Maxpromo
              <span style={{ color: 'var(--color-primary)' }}> Digital</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex" style={{ gap: '40px', alignItems: 'center', flexWrap: 'nowrap' }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={navLinkBase}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#FFFFFF' }}
              >
                {t(link.key)}
              </Link>
            ))}
          </div>

          {/* Desktop actions — locale + CTA grouped as one cluster, set off
              from the links by a divider so the CTA reads as part of the
              bar rather than a button floating at the edge. */}
          <div className="hidden md:flex" style={{ flexShrink: 0, alignItems: 'center', gap: '24px' }}>
            <span aria-hidden="true" style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.08)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <LocaleSwitcher variant="dark" />
              <Link href="/contact" className="btn btn-primary">
                {t('ctaAudit')} →
              </Link>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
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
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile fullscreen menu */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'var(--color-footer-bg)',
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
              height: '96px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '18px',
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              Maxpromo <span style={{ color: 'var(--color-primary)' }}>Digital</span>
            </span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation"
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
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
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <LocaleSwitcher variant="dark" />
            </div>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '20px',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '18px 4px',
                  display: 'block',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {t(link.key)}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div
            style={{
              padding: '1.5rem',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="btn btn-primary"
              style={{ width: '100%', textAlign: 'center' }}
            >
              {t('ctaAudit')} →
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
