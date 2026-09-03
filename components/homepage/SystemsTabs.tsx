'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
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
    href: p.landingUrl, // dedicated /systems/<slug> page — carries its own Primary(external)/Secondary(contact) CTA pair
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
            gap: '4px',
            borderBottom: '1px solid var(--color-border)',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          } as React.CSSProperties}
        >
          {systems.map((sys, i) => (
            <button
              key={sys.slug}
              onClick={() => setActive(i)}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                padding: '14px 18px',
                border: 'none',
                borderBottom: i === active ? '2px solid var(--color-primary)' : '2px solid transparent',
                background: 'none',
                color: i === active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
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
            background: 'linear-gradient(to right, transparent, var(--color-bg))',
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
          <p style={{ fontFamily: 'var(--brand-font-sans)', fontSize: '12px', color: 'var(--color-text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
            {current.name}
          </p>
          <h3 style={{ marginBottom: '1.5rem' }}>
            {current.headline}
          </h3>
          <Link href={current.href} className="btn btn-primary">
            {t('viewSystem')}
          </Link>
        </div>

        {/* Image */}
        <div
          style={{
            position: 'relative',
            aspectRatio: '8 / 5',
            overflow: 'hidden',
            borderRadius: 'var(--radius-card)',
            background: 'var(--color-bg-section)',
            border: '1px solid var(--color-border)',
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
