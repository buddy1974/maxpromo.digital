'use client'

import { Icon } from '@maxpromo/ui'

interface MaxBubbleProps {
  onClick: () => void
}

/**
 * Fixed bottom-right launch bubble.
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
 * Hover moved to CSS so keyboard focus gets the same response. A JS-only
 * onMouseEnter tells a mouse user this is interactive and tells a keyboard
 * user nothing.
 */
export function MaxBubble({ onClick }: MaxBubbleProps) {
  return (
    <>
      <style>{`
        .max-bubble {
          position: fixed;
          bottom: var(--space-5);
          right: var(--space-5);
          z-index: 1000;
          width: 56px;
          height: 56px;
          border-radius: var(--radius-full);
          background: var(--brand-primary);
          color: var(--brand-on-primary);
          border: 1px solid var(--brand-primary-edge);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: var(--shadow-overlay);
          transition: transform var(--duration-base) var(--ease),
                      background-color var(--duration-base) var(--ease);
        }
        .max-bubble:hover,
        .max-bubble:focus-visible {
          transform: scale(1.06);
          background: var(--brand-primary-hover);
        }
        @media (prefers-reduced-motion: reduce) {
          .max-bubble:hover,
          .max-bubble:focus-visible { transform: none; }
        }
      `}</style>

      <button onClick={onClick} aria-label="Open Max" className="max-bubble">
        <Icon name="message" size="lg" />
      </button>
    </>
  )
}
