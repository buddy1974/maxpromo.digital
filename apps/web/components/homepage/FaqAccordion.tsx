'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface FaqItem {
  q: string
  a: string
}

export function FaqAccordion() {
  const t     = useTranslations('home.faq')
  const items = t.raw('items') as FaqItem[]
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section
      style={{
        background: 'var(--color-bg)',
        padding: 'clamp(4.5rem, 8vw, 8.75rem) 2rem',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>

        <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '13px', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2.5rem' }}>
          {t('eyebrow')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                style={{
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '1.5rem 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 600,
                      fontSize: '18px',
                      color: isOpen ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.4,
                      transition: 'color 200ms ease',
                    }}
                  >
                    {item.q}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '18px',
                      color: isOpen ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      flexShrink: 0,
                      transition: 'transform 200ms ease, color 200ms ease',
                      display: 'inline-block',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    }}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '16px',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.8,
                      paddingBottom: '1.5rem',
                      margin: 0,
                    }}
                  >
                    {item.a}
                  </p>
                )}
              </div>
            )
          })}

          {/* Final border */}
          <div style={{ borderTop: '1px solid var(--color-border)' }} />
        </div>

      </div>
    </section>
  )
}
