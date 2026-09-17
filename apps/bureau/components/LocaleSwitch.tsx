'use client'

import { useLocale } from 'next-intl'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * components/LocaleSwitch.tsx — DE · EN.
 *
 * Deliberately a link, not a button with a click handler. The locale is a
 * server-side cookie, so switching is a navigation: `/language` sets the cookie
 * and redirects back to `next`, which is this page. It therefore works before
 * hydration, works with JavaScript off, can be opened in a new tab, and — the
 * part that matters on a signed-in product — never touches the session. You
 * stay on the approvals desk; the approvals desk changes language.
 *
 * It renders the pair rather than only the other language, the same way the
 * hub's control does, so the two properties read as one company. The current
 * locale is marked for assistive technology with `aria-current`, which is what
 * makes a pair of two-letter codes comprehensible without sight of the styling.
 */

const VARIANTS = {
  light: {
    text: 'var(--brand-text-secondary)',
    active: 'var(--brand-text)',
    border: 'var(--brand-border)',
  },
  dark: {
    text: 'var(--brand-text-inverted-secondary)',
    active: 'var(--brand-text-inverted)',
    border: 'color-mix(in srgb, var(--brand-surface) 14%, transparent)',
  },
} as const

export default function LocaleSwitch({
  variant = 'light',
  label,
}: {
  variant?: 'light' | 'dark'
  label: string
}) {
  const locale = useLocale()
  const pathname = usePathname()
  const params = useSearchParams().toString()
  const colors = VARIANTS[variant]

  const here = params ? `${pathname}?${params}` : pathname
  const other = locale === 'de' ? 'en' : 'de'

  return (
    <div
      role="group"
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '5px 9px',
        fontFamily: 'var(--brand-font-mono)',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.1em',
      }}
    >
      {(['de', 'en'] as const).map((code, i) => (
        <span key={code} style={{ display: 'inline-flex', alignItems: 'center' }}>
          {i > 0 && <span aria-hidden="true" style={{ opacity: 0.4, marginRight: 'var(--space-1)' }}>·</span>}
          {code === locale ? (
            <span aria-current="true" style={{ color: colors.active }}>{code.toUpperCase()}</span>
          ) : (
            <a
              href={`/language?to=${other}&next=${encodeURIComponent(here)}`}
              style={{ color: colors.text, textDecoration: 'none' }}
            >
              {code.toUpperCase()}
            </a>
          )}
        </span>
      ))}
    </div>
  )
}
