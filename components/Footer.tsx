'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

type LinkKey =
  | 'about' | 'services' | 'systems' | 'caseStudies' | 'contact'
  | 'automationAudit' | 'blog' | 'automationLab'
  | 'impressum' | 'privacy' | 'agb' | 'dataDeletion'

const columns: Array<{
  titleKey: 'colCompany' | 'colResources' | 'colLegal'
  links: Array<{ key: LinkKey; href: string }>
}> = [
  {
    titleKey: 'colCompany',
    links: [
      { key: 'about',       href: '/about' },
      { key: 'services',    href: '/services' },
      { key: 'systems',     href: '/systems' },
      { key: 'caseStudies', href: '/case-studies' },
      { key: 'contact',     href: '/contact' },
    ],
  },
  {
    titleKey: 'colResources',
    links: [
      { key: 'automationAudit', href: '/automation-audit' },
      { key: 'blog',            href: '/blog' },
      { key: 'automationLab',   href: '/automation-lab' },
    ],
  },
  {
    titleKey: 'colLegal',
    links: [
      { key: 'impressum',    href: '/impressum' },
      { key: 'privacy',      href: '/privacy' },
      { key: 'agb',          href: '/agb' },
      { key: 'dataDeletion', href: '/data-deletion' },
    ],
  },
]

export default function Footer() {
  const t      = useTranslations('footer')
  const tLinks = useTranslations('footer.links')

  return (
    <footer
      style={{
        background: 'hsl(240 12% 6%)',
        borderTop: '1px solid hsl(40 30% 96% / 0.06)',
      }}
    >
      {/* CTA strip */}
      <div style={{ borderBottom: '1px solid hsl(40 30% 96% / 0.06)', padding: '3rem 2rem' }}>
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(28 100% 58%)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
              {t('ctaEyebrow')}
            </p>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '28px', color: 'hsl(40 30% 96%)', letterSpacing: '-0.04em', margin: 0 }}>
              {t('ctaHeadline')}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              href="/automation-audit"
              className="shine"
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '13px',
                color: 'hsl(240 14% 4%)',
                background: 'hsl(28 100% 58%)',
                padding: '12px 24px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '8px',
              }}
            >
              {t('ctaPrimary')}
            </Link>
            <Link
              href="/contact"
              className="glass"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: 'hsl(40 30% 96%)',
                padding: '12px 24px',
                textDecoration: 'none',
                display: 'inline-block',
                borderRadius: '8px',
              }}
            >
              {t('ctaSecondary')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3.5rem 2rem' }}>
        <style>{`
          .footer-cols-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          @media (min-width: 640px) {
            .footer-cols-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 2.5rem;
            }
          }
          @media (min-width: 768px) {
            .footer-cols-grid {
              grid-template-columns: repeat(3, 1fr);
              gap: 2rem;
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
          {columns.map((col) => (
            <div key={col.titleKey}>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'hsl(28 100% 58%)',
                  letterSpacing: '0.2em',
                  marginBottom: '16px',
                  textTransform: 'uppercase',
                }}
              >
                {t(col.titleKey)}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {col.links.map((link) => (
                  <li key={link.key}>
                    <Link href={link.href} className="footer-link">
                      {tLinks(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div
          style={{
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid hsl(40 30% 96% / 0.06)',
          }}
          className="footer-bottom"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              className="status-pulse"
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'hsl(28 100% 58%)', display: 'inline-block', flexShrink: 0 }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'hsl(40 12% 65%)' }}>
              {t('copyright')}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 35%)' }}>
              {t('tagline')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 35%)' }}>
              {t('operationalSignal')}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(240 8% 35%)' }}>
              {t('tax')}
            </span>
            <a
              href="/portfolio"
              style={{ color: 'hsl(240 14% 4%)', fontSize: '10px', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(240 8% 35%)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(240 14% 4%)')}
              aria-label="Staff portal"
            >
              ·
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
