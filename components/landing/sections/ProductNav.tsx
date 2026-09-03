'use client'

import LocaleSwitcher from '@/components/LocaleSwitcher'
import { BUTTON_PRIMARY_COMPACT, INTERACTIVE_LINK_CLASSES, INTERACTIVE_PRIMARY_CLASSES, externalLinkProps } from '@/components/landing/showcaseTokens'

interface ProductNavProps {
  domainBrand: string
  domain:      string
  ctaLabel:    string
  ctaHref:     string
}

/**
 * Minimal sticky navigation for external showcase product domains.
 *
 * Added 2026-07-25 — app/[locale]/layout.tsx suppresses the Maxpromo
 * Navbar/Footer entirely in showcase mode (x-mp-mode: showcase), so
 * every showcase domain (superhandwerk.de etc.) previously shipped with
 * ZERO navigation. This is the first real one.
 *
 * Deliberately minimal: no multi-item menu (there's nothing else on this
 * single-page site to link to besides the sections below), just the
 * product identity, the locale switch, and the one action that matters.
 * (Doc corrected 2026-07-25 — an earlier draft of this comment mentioned
 * a "jump to the interface gallery" link that was never actually built;
 * ProductGallery only renders when real screenshots exist, so a
 * permanent nav link to it would sometimes point at nothing.)
 *
 * Visual-polish pass 2026-07-25: logo/CTA now use the shared showcase
 * tokens (BUTTON_PRIMARY_COMPACT) instead of one-off inline values, and
 * both interactive elements get explicit hover/focus-visible feedback —
 * previously neither had any state feedback at all.
 */
export function ProductNav({ domainBrand, domain, ctaLabel, ctaHref }: ProductNavProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'color-mix(in srgb, var(--brand-bg) 88%, transparent)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        borderBottom: '1px solid rgba(128,128,128,0.12)',
      }}
    >
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '14px 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <a
          href="#top"
          className={INTERACTIVE_LINK_CLASSES}
          style={{
            fontFamily: 'var(--brand-font-sans)',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--brand-fg)',
            textDecoration: 'none',
          }}
        >
          {domainBrand}
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span
            className="hidden sm:inline"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--brand-muted)' }}
          >
            {domain}
          </span>
          <LocaleSwitcher />
          <a href={ctaHref} className={INTERACTIVE_PRIMARY_CLASSES} style={BUTTON_PRIMARY_COMPACT} {...externalLinkProps(ctaHref)}>
            {ctaLabel}
          </a>
        </div>
      </div>
    </header>
  )
}
