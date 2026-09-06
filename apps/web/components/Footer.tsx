import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { BUSINESS, UST_CLAUSE } from '@maxpromo/config'

/**
 * components/Footer.tsx
 *
 * Rebuilt in v5.0 Sprint 1.
 *
 * The previous footer was a four-column marketing footer listing every
 * operating system by name — which, under the protected-product split, is
 * exactly the wrong thing for a consultancy site to advertise. It also carried
 * a 32px display heading, its own copy of the business address, and a client
 * component wrapper for markup with no interactivity.
 *
 * This one reads like the colophon of a technical document: three columns of
 * plain links, then a rule, then the legal line. Server-rendered. Address and
 * VAT clause come from lib/legal so they exist in one place.
 */

const COLUMNS = [
  {
    titleKey: 'colCompany',
    links: [
      { key: 'about',       href: '/about' },
      { key: 'solutions',   href: '/solutions' },
      { key: 'industries',  href: '/industries' },
      // The one product marketed publicly from the hub, and until v8.0 it had
      // exactly one inbound link on the entire site: a homepage section.
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
          {/* Identity */}
          <div>
            <p className="site-footer-brand">Maxpromo Digital</p>
            <p className="site-footer-desc">{t('descriptor')}</p>
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

        <div className="site-footer-legal">
          <p>© {year} {BUSINESS.legalName} · Maxpromo Digital</p>
          <p>
            {t('taxNumber')}: {BUSINESS.steuernummer} · {t('taxOffice')}: {BUSINESS.finanzamt}
          </p>
          {/* Mandatory on every commercial surface (Kleinunternehmer §19 UStG). */}
          <p>{UST_CLAUSE.de}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
