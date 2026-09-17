'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { usePathname, useRouter } from '@/i18n/navigation'

interface LocaleSwitcherProps {
  /** 'light' (default) sits on white surfaces; 'dark' sits on the footer-dark navbar. */
  variant?: 'light' | 'dark'
}

/**
 * Two-state locale toggle. Renders both codes with the current one marked, and
 * swaps the visitor to the same pathname under the opposite locale.
 *
 * Uses next-intl's typed router so the pathname is rewritten correctly across
 * the locale boundary instead of being concatenated.
 *
 * THREE THINGS THE MOBILE PASS FIXED
 *
 *  1. The accessible name was an English template literal —
 *     `Switch language to EN` — written into the component, on a site whose
 *     default language is German. The one control whose entire purpose is to
 *     serve a reader who does not read the current language announced itself
 *     only in English. It is the catalogue's now.
 *  2. Hover was `onMouseEnter`/`onMouseLeave` assigning inline styles. That
 *     tells a mouse user the control is interactive and tells a keyboard user
 *     nothing — the same pattern the navigation's own docstring records having
 *     removed for exactly this reason. It is CSS, so `:focus-visible` gets the
 *     same response.
 *  3. 31px tall, in the corner of the navigation bar. 44px now, per the
 *     platform touch-target floor.
 */
export default function LocaleSwitcher({ variant = 'light' }: LocaleSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const t = useTranslations('nav')

  const target = locale === 'de' ? 'en' : 'de'

  function flip() {
    startTransition(() => {
      router.replace(pathname, { locale: target })
    })
  }

  return (
    <>
      <style>{`
        .locale-switch {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          padding: 0 12px;
          font-family: var(--brand-font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: transparent;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: color var(--duration-fast) var(--ease),
                      border-color var(--duration-fast) var(--ease);
        }
        .locale-switch[aria-busy='true'] { cursor: wait; opacity: 0.5; }

        .locale-switch-light {
          color: var(--brand-text-secondary);
          border: 1px solid var(--brand-border);
        }
        .locale-switch-light:hover,
        .locale-switch-light:focus-visible {
          color: var(--brand-primary-text);
          border-color: color-mix(in srgb, var(--brand-primary) 40%, transparent);
        }

        .locale-switch-dark {
          color: var(--brand-text-inverted-secondary);
          border: 1px solid color-mix(in srgb, var(--brand-surface) 14%, transparent);
        }
        .locale-switch-dark:hover,
        .locale-switch-dark:focus-visible {
          color: var(--brand-text-inverted);
          border-color: color-mix(in srgb, var(--brand-surface) 32%, transparent);
        }

        .locale-switch-sep { opacity: 0.4; margin: 0 var(--space-1); }
      `}</style>

      <button
        onClick={flip}
        disabled={isPending}
        aria-busy={isPending || undefined}
        aria-label={t('switchLanguage', { language: target.toUpperCase() })}
        className={variant === 'dark' ? 'locale-switch locale-switch-dark' : 'locale-switch locale-switch-light'}
      >
        <span aria-hidden="true">{locale.toUpperCase()}</span>
        <span className="locale-switch-sep" aria-hidden="true">·</span>
        <span aria-hidden="true">{target.toUpperCase()}</span>
      </button>
    </>
  )
}
