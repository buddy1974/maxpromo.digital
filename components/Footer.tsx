'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

type InternalLinkKey =
  | 'about' | 'services' | 'systems' | 'contact' | 'blog'
  | 'impressum' | 'privacy' | 'agb'

/**
 * System pages now live at /systems/<slug> inside maxpromo.digital, each with
 * its own Primary (external product domain) / Secondary (/contact?system=<slug>)
 * CTA pair. The footer links to the dedicated system page, not directly to the
 * contact form or the external domain, matching Navbar and the systems index.
 */
type SystemLinkKey =
  | 'agentBureau' | 'restaurantOs' | 'printshopOs' | 'taxkontrol' | 'praxisOs' | 'handwerkOs' | 'publishingOs'

type ServiceLinkKey =
  | 'legacyModernization' | 'workflowAutomation' | 'aiSystems' | 'websiteSystems' | 'contentNewsletter'

interface InternalLink { key: InternalLinkKey | SystemLinkKey; href: string; external?: false }
interface ServiceLink  { key: ServiceLinkKey;  href: string; external?: false }

type AnyLink = InternalLink | ServiceLink

interface Column {
  titleKey: 'colCompany' | 'colSystems' | 'colServices' | 'colLegal'
  links: AnyLink[]
}

const COLUMNS: Column[] = [
  {
    titleKey: 'colCompany',
    links: [
      { key: 'about',    href: '/about' },
      { key: 'services', href: '/services' },
      { key: 'systems',  href: '/systems' },
      { key: 'blog',     href: '/blog' },
      { key: 'contact',  href: '/contact' },
    ],
  },
  {
    titleKey: 'colSystems',
    links: [
      // Each system has its own dedicated page at /systems/<slug>. That page carries
      // the Primary (external product domain) / Secondary (/contact?system=<slug>) CTA
      // pair. The old gated behaviour, routing every footer link straight to /contact,
      // is retired as of 2026-07-25.
      { key: 'agentBureau',   href: '/systems/agent-bureau' },
      { key: 'restaurantOs',  href: '/systems/restaurant-os' },
      { key: 'printshopOs',   href: '/systems/printshop-os' },
      { key: 'taxkontrol',    href: '/systems/taxkontrol' },
      { key: 'praxisOs',      href: '/systems/praxis-os' },
      { key: 'handwerkOs',    href: '/systems/handwerk-os' },
      { key: 'publishingOs',  href: '/systems/publishing-os' },
    ],
  },
  {
    titleKey: 'colServices',
    links: [
      { key: 'legacyModernization', href: '/services/websites-platforms' },
      { key: 'workflowAutomation',  href: '/services/workflow-automation' },
      { key: 'aiSystems',           href: '/services/ai-agents' },
      { key: 'websiteSystems',      href: '/services/customer-inquiries' },
      { key: 'contentNewsletter',   href: '/services/social-media' },
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
]

export default function Footer() {
  const t      = useTranslations('footer')
  const tLinks = useTranslations('footer.links')

  return (
    <footer
      style={{
        background: 'var(--color-footer-bg)',
      }}
    >
      {/* CTA strip */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '3.5rem 2rem' }}>
        <div
          style={{
            maxWidth: 'var(--container-width)',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div>
            <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
              {t('ctaEyebrow')}
            </p>
            <h3 style={{ color: '#FFFFFF', margin: 0 }}>
              {t('ctaHeadline')}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/contact" className="btn btn-primary">
              {t('ctaPrimary')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div style={{ maxWidth: 'var(--container-width)', margin: '0 auto', padding: '4.5rem 2rem' }}>
        <style>{`
          .footer-cols-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          @media (min-width: 640px) {
            .footer-cols-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 3rem;
            }
          }
          @media (min-width: 1024px) {
            .footer-cols-grid {
              grid-template-columns: repeat(4, 1fr);
              gap: 2.5rem;
              align-items: start;
            }
          }
          .footer-bottom {
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: center;
            gap: 12px 24px;
          }
          @media (max-width: 639px) {
            .footer-bottom {
              grid-template-columns: 1fr;
              gap: 8px;
            }
            .footer-bottom > div:last-child {
              justify-content: flex-start !important;
            }
          }
        `}</style>
        <div className="footer-cols-grid">
          {COLUMNS.map((col) => (
            <div key={col.titleKey}>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  marginBottom: '18px',
                }}
              >
                {t(col.titleKey)}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {col.links.map((link) => (
                  <li key={link.key}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-link"
                      >
                        {tLinks(link.key)}
                      </a>
                    ) : (
                      <Link href={link.href} className="footer-link">
                        {tLinks(link.key)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div
          style={{
            marginTop: '3.5rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
          className="footer-bottom"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-footer-text)' }}>
              {t('copyright')}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(214,216,219,0.55)' }}>
              {t('tagline')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(214,216,219,0.55)' }}>
              {t('address')}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(214,216,219,0.55)' }}>
              {t('tax')}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(214,216,219,0.55)' }}>
              {t('taxClause')}
            </span>
            <Link
              href="/portfolio"
              style={{ color: 'var(--color-footer-bg)', fontSize: '10px', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(214,216,219,0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-footer-bg)')}
              aria-label={t('staffPortal')}
            >
              ·
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
