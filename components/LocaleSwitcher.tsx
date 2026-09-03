'use client'

import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'

interface LocaleSwitcherProps {
  /** 'light' (default) sits on white surfaces; 'dark' sits on the footer-dark navbar. */
  variant?: 'light' | 'dark'
}

const VARIANT_COLORS = {
  light: {
    text: 'var(--color-text-secondary)',
    border: 'var(--color-border)',
    hoverText: 'var(--color-primary)',
    hoverBorder: 'color-mix(in srgb, var(--brand-primary) 40%, transparent)',
  },
  dark: {
    text: 'var(--color-footer-text)',
    border: 'rgba(255,255,255,0.14)',
    hoverText: '#FFFFFF',
    hoverBorder: 'rgba(255,255,255,0.32)',
  },
} as const

/**
 * Two-state locale toggle. Renders the OTHER locale's code (so on a
 * German page the button reads "EN", inviting the switch) and swaps
 * the visitor to the same pathname under the opposite locale.
 *
 * Uses next-intl's typed router so the pathname is rewritten
 * correctly across the locale boundary instead of being concatenated.
 */
export default function LocaleSwitcher({ variant = 'light' }: LocaleSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const colors = VARIANT_COLORS[variant]

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
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: colors.text,
        background: 'transparent',
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        padding: '7px 11px',
        cursor: isPending ? 'wait' : 'pointer',
        opacity: isPending ? 0.5 : 1,
        transition: 'border-color 150ms ease, color 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = colors.hoverText
        e.currentTarget.style.borderColor = colors.hoverBorder
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = colors.text
        e.currentTarget.style.borderColor = colors.border
      }}
    >
      <span aria-hidden="true">{locale.toUpperCase()}</span>
      <span style={{ opacity: 0.4, margin: '0 4px' }} aria-hidden="true">·</span>
      <span aria-hidden="true">{target.toUpperCase()}</span>
    </button>
  )
}
