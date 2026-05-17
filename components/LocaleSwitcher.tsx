'use client'

import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'

/**
 * Two-state locale toggle. Renders the OTHER locale's code (so on a
 * German page the button reads "EN", inviting the switch) and swaps
 * the visitor to the same pathname under the opposite locale.
 *
 * Uses next-intl's typed router so the pathname is rewritten
 * correctly across the locale boundary instead of being concatenated.
 */
export default function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const target = locale === 'de' ? 'en' : 'de'

  function flip() {
    startTransition(() => {
      router.replace(pathname, { locale: target })
    })
  }

  return (
    <button
      onClick={flip}
      disabled={isPending}
      aria-label={`Switch language to ${target.toUpperCase()}`}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'hsl(40 12% 65%)',
        background: 'transparent',
        border: '1px solid hsl(40 30% 96% / 0.12)',
        borderRadius: '4px',
        padding: '6px 10px',
        cursor: isPending ? 'wait' : 'pointer',
        opacity: isPending ? 0.5 : 1,
        transition: 'border-color 150ms ease, color 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'hsl(28 100% 58%)'
        e.currentTarget.style.borderColor = 'hsl(28 100% 58% / 0.4)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'hsl(40 12% 65%)'
        e.currentTarget.style.borderColor = 'hsl(40 30% 96% / 0.12)'
      }}
    >
      <span aria-hidden="true">{locale.toUpperCase()}</span>
      <span style={{ opacity: 0.4, margin: '0 4px' }} aria-hidden="true">·</span>
      <span aria-hidden="true">{target.toUpperCase()}</span>
    </button>
  )
}
