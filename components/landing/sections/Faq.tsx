'use client'

import { useState } from 'react'
import type { FaqItem } from '@/lib/registry/types'
import { EYEBROW_STYLE, SECTION_PADDING, INTERACTIVE_LINK_CLASSES } from '@/components/landing/showcaseTokens'

interface FaqProps {
  faq:    ReadonlyArray<FaqItem> | null
  locale: string
}

/**
 * Accordion FAQ. Only renders when faq data is non-empty.
 * Registry FaqItem[] is populated per-product in Phase 3.
 * Client component for accordion state (no server-side alternative).
 *
 * Visual-polish pass 2026-07-25: tokens from showcaseTokens.ts. Added
 * explicit focus-visible styling to the accordion trigger — a plain
 * `background: none; border: none` button relies entirely on the
 * browser's default outline, which is inconsistent across browsers and
 * easy to lose against a dark background. Now gets the same branded
 * focus ring as every other interactive element on the page.
 */
export function Faq({ faq, locale }: FaqProps) {
  const [open, setOpen] = useState<number | null>(null)

  if (!faq || faq.length === 0) return null

  const isDE    = locale === 'de'
  const eyebrow = isDE ? 'Häufige Fragen' : 'Common questions'

  return (
    <section style={{ padding: SECTION_PADDING.relaxed, borderTop: '1px solid var(--brand-border)' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
        <p style={{ ...EYEBROW_STYLE, marginBottom: '2.5rem' }}>
          {eyebrow}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {faq.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={i} style={{ borderTop: '1px solid var(--brand-border)' }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className={`${INTERACTIVE_LINK_CLASSES} rounded-sm`}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.25rem 4px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '16px', color: isOpen ? 'var(--showcase-fg)' : 'var(--showcase-muted)', letterSpacing: '-0.01em', lineHeight: 1.4, transition: 'color 200ms ease' }}>
                    {item.question}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: isOpen ? 'var(--showcase-accent)' : 'var(--showcase-muted)', flexShrink: 0, display: 'inline-block', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 200ms ease, color 200ms ease' }}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--showcase-muted)', lineHeight: 1.8, padding: '0 4px 1.25rem', margin: 0 }}>
                    {item.answer}
                  </p>
                )}
              </div>
            )
          })}
          <div style={{ borderTop: '1px solid var(--brand-border)' }} />
        </div>
      </div>
    </section>
  )
}
