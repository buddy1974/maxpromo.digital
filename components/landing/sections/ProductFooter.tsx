import { SECTION_PADDING, INTERACTIVE_LINK_CLASSES } from '@/components/landing/showcaseTokens'

interface ProductFooterProps {
  domainBrand: string
  locale:      string
  contactHref: string
}

/**
 * Minimal footer for external showcase product domains.
 *
 * Added 2026-07-25 — same gap as ProductNav.tsx: showcase pages had no
 * footer at all before this. Kept intentionally small (legal links back
 * to the Maxpromo hub + attribution + a contact link) — this is a
 * one-page product site, not a full sitemap.
 *
 * Legal links point at the Maxpromo hub's own Impressum/Datenschutz
 * pages (app/[locale]/impressum, app/[locale]/privacy) — these showcase
 * domains don't have their own legal pages, and Maxpromo (owner of every
 * product in the registry) is the operating entity, so this is the
 * correct legally-relevant destination rather than a dead link or an
 * invented one. Still flagged for Marcel to confirm.
 *
 * Visual-polish pass 2026-07-25: tokens from showcaseTokens.ts. Mobile
 * layout: the nav row now stacks with clearer spacing at narrow widths
 * (gap increased, items wrap onto their own line instead of crowding
 * against the copyright line) and every link gets explicit hover/focus
 * feedback, previously absent.
 */
export function ProductFooter({ domainBrand, locale, contactHref }: ProductFooterProps) {
  const isDE = locale === 'de'
  const year = '2026'

  return (
    <footer style={{ borderTop: '1px solid rgba(128,128,128,0.12)', padding: SECTION_PADDING.minimal }}>
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
        }}
      >
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--showcase-muted)', margin: 0 }}>
          © {year} {domainBrand} · {isDE ? 'ein Produkt von' : 'a product by'}{' '}
          <a href="https://www.maxpromo.digital" className={INTERACTIVE_LINK_CLASSES} style={{ color: 'var(--showcase-muted)' }}>
            Maxpromo Digital
          </a>
        </p>

        <nav style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <a
            href={contactHref}
            className={INTERACTIVE_LINK_CLASSES}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--showcase-muted)', textDecoration: 'none' }}
          >
            {isDE ? 'Kontakt' : 'Contact'}
          </a>
          <a
            href={`https://www.maxpromo.digital/${locale}/impressum`}
            className={INTERACTIVE_LINK_CLASSES}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--showcase-muted)', textDecoration: 'none' }}
          >
            {isDE ? 'Impressum' : 'Legal notice'}
          </a>
          <a
            href={`https://www.maxpromo.digital/${locale}/privacy`}
            className={INTERACTIVE_LINK_CLASSES}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--showcase-muted)', textDecoration: 'none' }}
          >
            {isDE ? 'Datenschutz' : 'Privacy'}
          </a>
        </nav>
      </div>
    </footer>
  )
}
