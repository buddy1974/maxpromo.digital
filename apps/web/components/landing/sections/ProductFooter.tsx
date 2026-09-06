import { SECTION_PADDING, INTERACTIVE_LINK_CLASSES } from '@/components/landing/showcaseTokens'

interface ProductFooterProps {
  domainBrand: string
  locale:      string
  contactHref: string
  /**
   * This domain's own legal pages.
   *
   * They used to be hardcoded to the Maxpromo hub, because a product domain
   * had no legal pages of its own — it had the whole consultancy site instead,
   * with no footer on any of it. Since v13.0 a product domain serves exactly
   * its product, its contact page and the operator's legal pages, so these
   * links stay on the domain the visitor is already on.
   */
  impressumHref: string
  privacyHref:   string
}

/**
 * The footer every page on a product domain wears.
 *
 * Rendered from ShowcaseChrome in app/[locale]/layout.tsx since v13.0, not
 * from LandingEngine — it belongs to the domain, and living inside the landing
 * page meant the contact page had no footer, no legal links and no way back.
 *
 * Added 2026-07-25 — same gap as ProductNav.tsx: showcase pages had no
 * footer at all before this. Kept intentionally small (legal links back
 * to the Maxpromo hub + attribution + a contact link) — this is a
 * one-page product site, not a full sitemap.
 *
 * Legal content is the operating entity's — Maxpromo Digital owns every
 * product in the registry — and it is now served on the product's own domain
 * rather than linked away to the hub, so a visitor reading the Impressum for
 * restaurant-os.de never leaves restaurant-os.de.
 *
 * Visual-polish pass 2026-07-25: tokens from showcaseTokens.ts. Mobile
 * layout: the nav row now stacks with clearer spacing at narrow widths
 * (gap increased, items wrap onto their own line instead of crowding
 * against the copyright line) and every link gets explicit hover/focus
 * feedback, previously absent.
 */
export function ProductFooter({ domainBrand, locale, contactHref, impressumHref, privacyHref }: ProductFooterProps) {
  const isDE = locale === 'de'
  const year = '2026'

  return (
    <footer style={{ borderTop: '1px solid var(--brand-border)', padding: SECTION_PADDING.minimal }}>
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
        <p style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: 'var(--showcase-muted)', margin: 0 }}>
          © {year} {domainBrand} · {isDE ? 'ein Produkt von' : 'a product by'}{' '}
          <a href="https://www.maxpromo.digital" className={INTERACTIVE_LINK_CLASSES} style={{ color: 'var(--showcase-muted)' }}>
            Maxpromo Digital
          </a>
        </p>

        <nav style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <a
            href={contactHref}
            className={INTERACTIVE_LINK_CLASSES}
            style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: 'var(--showcase-muted)', textDecoration: 'none' }}
          >
            {isDE ? 'Kontakt' : 'Contact'}
          </a>
          <a
            href={impressumHref}
            className={INTERACTIVE_LINK_CLASSES}
            style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: 'var(--showcase-muted)', textDecoration: 'none' }}
          >
            {isDE ? 'Impressum' : 'Legal notice'}
          </a>
          <a
            href={privacyHref}
            className={INTERACTIVE_LINK_CLASSES}
            style={{ fontFamily: 'var(--brand-font-mono)', fontSize: '12px', color: 'var(--showcase-muted)', textDecoration: 'none' }}
          >
            {isDE ? 'Datenschutz' : 'Privacy'}
          </a>
        </nav>
      </div>
    </footer>
  )
}
