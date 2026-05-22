'use client'

import { useState } from 'react'
import type { FaqItem } from '@/lib/registry/types'

interface FaqProps {
  faq:    ReadonlyArray<FaqItem> | null
  locale: string
}

/**
 * Accordion FAQ. Only renders when faq data is non-empty.
 * Registry FaqItem[] is populated per-product in Phase 3.
 * Client component for accordion state (no server-side alternative).
 */
export function Faq({ faq, locale }: FaqProps) {
  const [open, setOpen] = useState<number | null>(null)

  if (!faq || faq.length === 0) return null

  const isDE    = locale === 'de'
  const eyebrow = isDE ? '// Häufige Fragen' : '// Common questions'

  return (
    <section style={{ padding: '5rem 2rem', borderTop: '1px solid rgba(128,128,128,0.10)' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--brand-accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '2.5rem' }}>
          {eyebrow}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {faq.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={i} style={{ borderTop: '1px solid rgba(128,128,128,0.12)' }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.25rem 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '16px', color: isOpen ? 'var(--brand-fg)' : 'var(--brand-muted)', letterSpacing: '-0.01em', lineHeight: 1.4, transition: 'color 200ms ease' }}>
                    {item.question}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: isOpen ? 'var(--brand-accent)' : 'var(--brand-muted)', flexShrink: 0, display: 'inline-block', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 200ms ease, color 200ms ease' }}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--brand-muted)', lineHeight: 1.8, paddingBottom: '1.25rem', margin: 0 }}>
                    {item.answer}
                  </p>
                )}
              </div>
            )
          })}
          <div style={{ borderTop: '1px solid rgba(128,128,128,0.12)' }} />
        </div>
      </div>
    </section>
  )
}
