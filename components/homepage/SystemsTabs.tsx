'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { SYSTEMS_PAGE_PRODUCTS } from '@/lib/registry/products'

export function SystemsTabs() {
  const locale = useLocale()
  const t      = useTranslations('home.systemsTabs')
  const [active, setActive] = useState(0)

  const systems = SYSTEMS_PAGE_PRODUCTS.map((p) => ({
    slug:     p.slug,
    name:     p.name,
    headline: locale === 'de' && 'de' in p.headline && p.headline.de
      ? p.headline.de
      : p.headline.en,
    imgSrc: locale === 'de' && p.media.card.de
      ? `/${p.media.card.de}`
      : `/${p.media.card.en}`,
    href: p.bookDemoUrl, // MVP hardening: routes to consultation, not external system
  }))

  const current = systems[active]

  return (
    <div>

      {/* Tab bar, horizontally scrollable with a right-edge fade hint on mobile */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '2px',
            borderBottom: '1px solid hsl(40 30% 96% / 0.08)',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          } as React.CSSProperties}
        >
          {systems.map((sys, i) => (
            <button
              key={sys.slug}
              onClick={() => setActive(i)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                padding: '14px 16px',
                border: 'none',
                borderBottom: i === active ? '2px solid #F97316' : '2px solid transparent',
                background: 'none',
                color: i === active ? '#F97316' : 'hsl(40 12% 50%)',
                cursor: 'pointer',
                transition: 'color 150ms ease',
                flexShrink: 0,
                minHeight: '44px',
              }}
            >
              {sys.name}
            </button>
          ))}
        </div>
        {/* Scroll hint, fades out on desktop via md:hidden */}
        <div
          aria-hidden="true"
          className="md:hidden"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '48px',
            background: 'linear-gradient(to right, transparent, hsl(240 14% 4%))',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Active system panel */}
      <div
        style={{
          display: 'grid',
          gap: '2rem',
          alignItems: 'center',
          padding: '2.5rem 0 0',
        }}
        className="grid-cols-1 lg:grid-cols-[1fr_1.4fr]"
      >
        {/* Copy */}
        <div style={{ order: 1 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'hsl(40 12% 50%)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
            {current.name}
          </p>
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              letterSpacing: '-0.04em',
              color: 'hsl(40 30% 96%)',
              lineHeight: 1.2,
              marginBottom: '1.5rem',
            }}
          >
            {current.headline}
          </h3>
          <a
            href={current.href}
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '13px',
              color: 'hsl(240 14% 4%)',
              background: '#F97316',
              padding: '11px 22px',
              textDecoration: 'none',
              display: 'inline-block',
              letterSpacing: '0.05em',
            }}
          >
            {t('viewSystem')}
          </a>
        </div>

        {/* Image */}
        <div
          style={{
            position: 'relative',
            aspectRatio: '8 / 5',
            overflow: 'hidden',
            borderRadius: '8px',
            background: 'hsl(240 12% 5%)',
            order: 2,
          }}
        >
          <Image
            key={current.slug}
            src={current.imgSrc}
            alt={current.name}
            fill
            style={{ objectFit: 'cover', objectPosition: 'top' }}
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        </div>
      </div>

    </div>
  )
}
