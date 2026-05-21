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
        background: 'hsl(240 14% 4%)',
        padding: '6rem 2rem',
        borderTop: '1px solid hsl(40 30% 96% / 0.06)',
      }}
    >
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>

        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#F97316', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '2.5rem' }}>
          {t('eyebrow')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {items.map((item, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                style={{
                  borderTop: '1px solid hsl(40 30% 96% / 0.07)',
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
                    padding: '1.25rem 0',
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
                      fontSize: '16px',
                      color: isOpen ? 'hsl(40 30% 96%)' : 'hsl(40 12% 70%)',
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
                      fontSize: '16px',
                      color: isOpen ? '#F97316' : 'hsl(40 12% 40%)',
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
                      fontSize: '15px',
                      color: 'hsl(40 12% 60%)',
                      lineHeight: 1.8,
                      paddingBottom: '1.25rem',
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
          <div style={{ borderTop: '1px solid hsl(40 30% 96% / 0.07)' }} />
        </div>

      </div>
    </section>
  )
}
