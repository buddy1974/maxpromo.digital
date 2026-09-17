'use client'

import { useTranslations } from 'next-intl'
import { Icon } from '@maxpromo/ui'

interface MaxBubbleProps {
  onClick: () => void
}

/**
 * Fixed bottom-right launch control.
 *
 * The description here read "56px, orange, soft glow" until v7.1 — a colour
 * retired three brand generations ago, and a glow the design system retired
 * with it. The glow was real: 24px of Brand Lime at 45%, on every page of the
 * site, which is the accent used as light rather than as a fill.
 *
 * Two other things it carried. Brand Lime on white measures 1.51:1, so a lime
 * circle on a white page had no perceivable edge — the WCAG 1.4.11 problem
 * --brand-primary-edge exists to solve and that .btn-primary already solves.
 * And it drew its own chat glyph as inline SVG at a stroke weight belonging to
 * no set, next to an icon package that has one (ADR-0003).
 *
 * The homepage presentation pass took the last of it. A 56px lime circle
 * floating over the page is the support-widget pattern, and it was the most
 * prominent accent on every screen of the site — brighter than the page's own
 * primary action, on pages that have one. It is now a named control on the
 * inverted surface: the same black the navigation bar uses, a labelled pill
 * rather than an anonymous bubble, and no accent at all. Discoverability goes
 * up rather than down, because it now says what it is.
 *
 * No status dot. A live indicator would be asserting availability nothing here
 * measures — the same reason the hero's three uptime pills were removed.
 *
 * Hover is CSS so keyboard focus gets the same response. A JS-only
 * onMouseEnter tells a mouse user this is interactive and tells a keyboard
 * user nothing.
 *
 * THE MOBILE PASS CHANGED THREE THINGS
 *  1. `aria-label="Open Max"` was English, written into the component, on a
 *     German-first site. It is the catalogue's now, like everything else.
 *  2. 48px tall is under the 44px floor only in the other direction — it
 *     passed — but it sat `--space-5` from the bottom of the viewport, which
 *     on a phone with a home indicator is inside the gesture area. It now
 *     clears the safe-area inset.
 *  3. It hides itself while the sheet is open, rather than sitting under it.
 */
export function MaxBubble({ onClick }: MaxBubbleProps) {
  const t = useTranslations('max')

  return (
    <>
      <style>{`
        .max-bubble {
          position: fixed;
          bottom: calc(var(--space-5) + env(safe-area-inset-bottom, 0px));
          right: var(--space-5);
          z-index: 1000;
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          min-height: 48px;
          padding: 0 var(--space-4);
          border-radius: var(--radius-full);
          background: var(--brand-surface-inverted);
          color: var(--brand-text-inverted);
          border: 1px solid var(--brand-border-inverted);
          box-shadow: var(--shadow-overlay);
          cursor: pointer;
          transition: background-color var(--duration-base) var(--ease),
                      border-color var(--duration-base) var(--ease);
        }
        .max-bubble-label {
          font-family: var(--brand-font-sans);
          font-size: var(--text-label);
          font-weight: 500;
          letter-spacing: var(--tracking-label);
          text-transform: uppercase;
        }
        .max-bubble:hover,
        .max-bubble:focus-visible {
          background: var(--brand-text);
          border-color: var(--brand-border-control);
        }
      `}</style>

      <button onClick={onClick} aria-label={t('open')} className="max-bubble">
        <Icon name="message" size="sm" />
        <span className="max-bubble-label" aria-hidden="true">{t('name')}</span>
      </button>
    </>
  )
}
