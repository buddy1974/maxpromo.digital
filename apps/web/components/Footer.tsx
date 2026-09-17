import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { BUSINESS } from '@maxpromo/config'

/**
 * components/Footer.tsx
 *
 * Navigation, legal access, and one copyright line.
 *
 * WHAT CAME OUT, AND ON WHOSE AUTHORITY
 * Until this change the global footer repeated, on every page of the site:
 * Marcel's personal name, the tax number, the tax office, and the §19 UStG
 * Kleinunternehmer clause. Marcel directed that these leave the repeated
 * corporate footer, on the grounds that their authoritative public location is
 * the Impressum.
 *
 * This is a deliberate exception to a standing rule. `docs/governance/
 * standards.md` and the root CLAUDE.md both say the §19 clause is required on
 * every commercial surface, and that instruction is older than this one. The
 * newer decision is the owner's and is recorded in `docs/adr/decision-log.md`
 * rather than applied silently. Note what it is not: §19 is a statement about
 * invoicing, and it still appears on every invoice and quotation this platform
 * generates (components/documents/) and in the Impressum, which is where
 * German disclosure law actually requires it. Nothing was removed from a
 * surface that is obliged to carry it.
 *
 * WHAT STAYS
 * The Impressum, Privacy and Terms links, so the disclosure is one click from
 * every page. The registered address and the contact address, which are
 * company facts rather than tax status. The wordmark, in the corporate
 * treatment, from the same tokens the header uses.
 *
 * The descriptor sentence is gone: the footer was restating what the company
 * does directly beneath a page that had just spent eight sections saying it.
 */

const COLUMNS = [
  {
    titleKey: 'colCompany',
    links: [
      { key: 'about',       href: '/about' },
      { key: 'solutions',   href: '/solutions' },
      { key: 'industries',  href: '/industries' },
      // The one product marketed publicly from the hub.
      { key: 'agentBureau', href: '/agent-bureau' },
      { key: 'contact',     href: '/contact' },
    ],
  },
  {
    titleKey: 'colResources',
    links: [
      { key: 'resources',   href: '/resources' },
      { key: 'blog',        href: '/blog' },
      { key: 'caseStudies', href: '/case-studies' },
    ],
  },
  {
    titleKey: 'colLegal',
    links: [
      { key: 'impressum', href: '/impressum' },
      { key: 'privacy',   href: '/privacy' },
      { key: 'agb',       href: '/agb' },
    ],
  },
] as const

export async function Footer() {
  const t = await getTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer-grid">
          <div>
            <p className="site-footer-brand">{t('brand')}</p>
            <address className="site-footer-address">
              {BUSINESS.street}<br />
              {BUSINESS.city}<br />
              {BUSINESS.country}
            </address>
            <a href={`mailto:${BUSINESS.email}`} className="site-footer-link">
              {BUSINESS.email}
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.titleKey} aria-label={t(col.titleKey)}>
              <p className="site-footer-coltitle">{t(col.titleKey)}</p>
              <ul className="site-footer-list">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="site-footer-link">{t(l.key)}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* One line. The tax disclosures live in the Impressum, linked above. */}
        <div className="site-footer-legal">
          <p>© {year} Maxpromo Digital</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
