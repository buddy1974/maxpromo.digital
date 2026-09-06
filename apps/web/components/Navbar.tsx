'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import LocaleSwitcher from './LocaleSwitcher'
import { Icon } from '@maxpromo/ui'

/**
 * components/Navbar.tsx
 *
 * Rebuilt in v5.0 Sprint 1.
 *
 * Structure follows the approved information architecture: Solutions,
 * Industries, Resources, About, Contact. The former "Systems" entry is gone —
 * the operating systems are protected products marketed on their own domains,
 * not a public section of the consultancy site.
 *
 * Three things changed beyond the links:
 *
 *   1. Hover is CSS, not JavaScript. The previous version attached
 *      onMouseEnter/onMouseLeave handlers to every link to recolour them, which
 *      is both client work for something CSS does natively and a violation of
 *      the accent rules — nav links dimmed to the accent on hover, making lime
 *      the most frequent colour in the chrome.
 *   2. Height drops from 96px to 64px. A tall bar reads as a marketing site;
 *      a compact one reads as a product.
 *   3. No hardcoded colours. The bar sits on the inverted surface, so it uses
 *      the inverted text tokens rather than literal white.
 */

const NAV_LINKS = [
  { href: '/solutions',  key: 'solutions'  },
  { href: '/industries', key: 'industries' },
  { href: '/resources',  key: 'resources'  },
  { href: '/about',      key: 'about'      },
  { href: '/contact',    key: 'contact'    },
] as const

export default function Navbar() {
  const t = useTranslations('nav')
  const [menuOpen, setMenuOpen] = useState(false)

  // Lock the page behind the mobile sheet so the body cannot scroll under it.
  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [menuOpen])

  // Escape closes the sheet — expected of any dialog-like surface.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <>
      <header className="site-nav">
        <div className="site-nav-inner">
          <Link href="/" className="site-nav-logo">
            Maxpromo<span className="site-nav-logo-dim"> Digital</span>
          </Link>

          <nav className="site-nav-links" aria-label={t('primaryLabel')}>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="site-nav-link">
                {t(link.key)}
              </Link>
            ))}
          </nav>

          <div className="site-nav-actions">
            <LocaleSwitcher variant="dark" />
            <Link href="/contact" className="btn btn-primary btn-sm">
              {t('ctaAudit')}
            </Link>
          </div>

          <button
            type="button"
            className="site-nav-burger"
            onClick={() => setMenuOpen(true)}
            aria-label={t('openMenu')}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="site-nav-sheet" role="dialog" aria-modal="true" aria-label={t('primaryLabel')}>
          <div className="site-nav-sheet-head">
            <span className="site-nav-logo">
              Maxpromo<span className="site-nav-logo-dim"> Digital</span>
            </span>
            <button
              type="button"
              className="site-nav-close"
              onClick={() => setMenuOpen(false)}
              aria-label={t('closeMenu')}
            >
              <Icon name="close" size="sm" label="Menü schließen" />
            </button>
          </div>

          <nav className="site-nav-sheet-links">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="site-nav-sheet-link"
                onClick={() => setMenuOpen(false)}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          <div className="site-nav-sheet-foot">
            <LocaleSwitcher variant="dark" />
            <Link href="/contact" className="btn btn-primary" onClick={() => setMenuOpen(false)}>
              {t('ctaAudit')}
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
