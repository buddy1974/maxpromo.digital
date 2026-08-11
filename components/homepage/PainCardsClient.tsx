'use client'

import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'

export interface PainCardData {
  id: string
  icon: string
  href: string
  imgBg: string
  tag: string
  title: string
  desc: string
  cta: string
}

interface PainCardsClientProps {
  cards: PainCardData[]
}

/**
 * Each card's `imgBg` (set in PainCards.tsx) is a real screenshot under
 * public/images/services/. It paints via the "Brand radial" div below; the
 * ghost-glyph icon sits underneath it as a zero-cost fallback if a given
 * card's image is ever missing.
 */

export function PainCardsClient({ cards }: PainCardsClientProps) {
  return (
    <div
      style={{ display: 'grid', gap: '12px' }}
      className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    >
      {cards.map((card, i) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href={card.href}
            style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
          >
            <motion.article
              className="pain-card"
              whileHover={{
                borderColor: 'var(--color-primary)',
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              {/* Image area, next/image with WebP/AVIF optimisation */}
              <motion.div
                className="pain-card-img"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'relative',
                  aspectRatio: '16 / 9',
                  backgroundColor: 'var(--color-bg-section)',
                  overflow: 'hidden',
                }}
              >
                {/* Fallback ghost glyph */}
                <span
                  aria-hidden="true"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '80px', color: 'rgba(249,115,22,0.10)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', userSelect: 'none', pointerEvents: 'none', zIndex: 0 }}
                >
                  {card.icon}
                </span>
                {/* Brand radial */}
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: card.imgBg, zIndex: 0, pointerEvents: 'none' }} />
                {/* Top strip */}
                <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--color-primary)', zIndex: 2 }} />
                {/* Tag */}
                <span style={{ position: 'absolute', zIndex: 3, top: '14px', left: '14px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-primary)', background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.2)', padding: '3px 10px', borderRadius: '4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {card.tag}
                </span>
              </motion.div>

              {/* Text content */}
              <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '19px', letterSpacing: '-0.01em', color: 'var(--color-text-primary)', lineHeight: 1.25, margin: 0 }}>
                  {card.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0, flex: 1 }}>
                  {card.desc}
                </p>
                <motion.span
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-primary)', letterSpacing: '0.05em', marginTop: '4px', display: 'inline-block' }}
                  whileHover={{ x: 3, transition: { duration: 0.2 } }}
                >
                  {card.cta} →
                </motion.span>
              </div>
            </motion.article>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
