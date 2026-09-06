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
        background: 'var(--brand-background)',
        padding: 'var(--section-y) var(--section-x)',
        borderTop: '1px solid var(--brand-border)',
      }}
    >
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>

        <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: 'var(--text-micro)', color: 'var(--brand-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2.5rem' }}>
          {t('eyebrow')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                style={{
                  borderTop: '1px solid var(--brand-border)',
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
                    gap: 'var(--space-4)',
                    padding: 'var(--space-5) 0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--brand-font-heading)',
                      fontWeight: 600,
                      fontSize: '18px',
                      color: isOpen ? 'var(--brand-text)' : 'var(--brand-text-secondary)',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.4,
                      transition: 'color var(--duration-base) var(--ease)',
                    }}
                  >
                    {item.q}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--brand-font-mono)',
                      fontSize: '18px',
                      color: isOpen ? 'var(--brand-primary-text)' : 'var(--brand-text-secondary)',
                      flexShrink: 0,
                      transition: 'transform var(--duration-base) var(--ease), color var(--duration-base) var(--ease)',
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
                      fontFamily: 'var(--brand-font-body)',
                      fontSize: '16px',
                      color: 'var(--brand-text-secondary)',
                      lineHeight: 1.8,
                      paddingBottom: 'var(--space-5)',
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
          <div style={{ borderTop: '1px solid var(--brand-border)' }} />
        </div>

      </div>
    </section>
  )
}
