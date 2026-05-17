'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

/**
 * Footer columns — four columns of five links each, identical row counts so
 * the heights align on desktop. Order matches the audit directive:
 * Company / Layers / Tools / Legal.
 *
 * The Layers column reflects the operational-layer naming we ship under
 * /services. The old "AI Agentic Workflows / Process Automation / AI
 * Websites / Custom Integration" capabilities-list is gone — that
 * language signalled "AI agency" exactly the way the audit called out.
 */
/**
 * Footer columns — explicit order per Marcel's directive:
 *   Company · Tools · Services · Legal
 *
 * Five links per column so all four columns end at the same height.
 * The Services column lists operational layers (the systems we
 * install), not capabilities. No tool names ever in any link label —
 * implementation details belong on the architecture page.
 */
/**
 * Footer columns — locale-driven.
 *
 * Column titles and link labels are translation keys; the strings live
 * in messages/{de,en}.json under footer.* and footer.links.*. Hrefs
 * stay as bare paths — the Link import from @/i18n/navigation
 * auto-prefixes the current locale.
 */
type LinkKey =
  | 'services' | 'systems' | 'caseStudies' | 'pricing' | 'contact'
  | 'automationAudit' | 'automationLab' | 'discoveryBrief' | 'estimateTool' | 'aiWebsites'
  | 'intakeRouting' | 'dispatchField' | 'documentFlow' | 'customerTriage' | 'compliance'
  | 'impressum' | 'privacy' | 'agb' | 'cookiePolicy' | 'dataDeletion'

const columns: Array<{
  titleKey: 'colCompany' | 'colTools' | 'colServices' | 'colLegal'
  links: Array<{ key: LinkKey; href: string }>
}> = [
  {
    titleKey: 'colCompany',
    links: [
      { key: 'services',    href: '/services' },
      { key: 'systems',     href: '/systems' },
      { key: 'caseStudies', href: '/case-studies' },
      { key: 'pricing',     href: '/pricing' },
      { key: 'contact',     href: '/contact' },
    ],
  },
  {
    titleKey: 'colTools',
    links: [
      { key: 'automationAudit', href: '/automation-audit' },
      { key: 'automationLab',   href: '/automation-lab' },
      { key: 'discoveryBrief',  href: '/discovery' },
      { key: 'estimateTool',    href: '/estimate' },
      { key: 'aiWebsites',      href: '/ai-websites' },
    ],
  },
  {
    titleKey: 'colServices',
    links: [
      { key: 'intakeRouting',  href: '/services' },
      { key: 'dispatchField',  href: '/services' },
      { key: 'documentFlow',   href: '/services' },
      { key: 'customerTriage', href: '/services' },
      { key: 'compliance',     href: '/services' },
    ],
  },
  {
    titleKey: 'colLegal',
    links: [
      { key: 'impressum',    href: '/impressum' },
      { key: 'privacy',      href: '/privacy' },
      { key: 'agb',          href: '/agb' },
      { key: 'cookiePolicy', href: '/privacy#cookies' },
      { key: 'dataDeletion', href: '/data-deletion' },
    ],
  },
]

export default function Footer() {
  const t = useTranslations('footer')
  const tLinks = useTranslations('footer.links')

  return (
    <footer
      style={{
        background: 'hsl(240 12% 6%)',
        borderTop: '1px solid hsl(40 30% 96% / 0.06)',
      }}
    >
      {/* CTA strip */}
      <div
        style={{
          borderBottom: '1px solid hsl(40 30% 96% / 0.06)',
          padding: '3rem 2rem',
        }}
      >
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
        {/*
          Force 4-column horizontal layout on desktop via a scoped inline
          media query — Tailwind's `md:grid-cols-4` was not being
          generated for production (likely a content-scan gap on v4),
          which collapsed the footer to a 2×2 grid. Inline CSS bypasses
          Tailwind entirely so the layout is bulletproof.
        */}
        <style>{`
          .footer-cols-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 2.5rem;
          }
          @media (min-width: 768px) {
            .footer-cols-grid {
              grid-template-columns: repeat(4, 1fr);
              gap: 2rem;
              align-items: start;
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

        {/*
          Bottom strip — two-row symmetric structure instead of the prior
          four-item flex-wrap which landed asymmetric on medium widths.
          Row 1: copyright + status (left)  ·  legal identifier (right)
          Row 2: tiny hidden /portfolio link, right-aligned. Single source
          of weight on each side reads enterprise, not cluttered.
        */}
        <div
          style={{
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid hsl(40 30% 96% / 0.06)',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            alignItems: 'center',
            gap: '12px 24px',
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
