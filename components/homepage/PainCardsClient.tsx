'use client'

import { motion } from 'framer-motion'
import { Link } from '@/i18n/navigation'

export interface PainCardData {
  id: string
  icon: string
  href: string
  tag: string
  title: string
  desc: string
  cta: string
}

interface PainCardsClientProps {
  cards: PainCardData[]
}

/**
 * Visual-facelift v2.1: dropped the stock-photo composite (generic stressed
 * office worker + floating app icons) that used to fill these cards — per
 * design/visual-facelift-v2.1.md, that's exactly the "generic business
 * meetings / generic office workers" imagery the spec asks to remove, and
 * it didn't explain anything specific. Each card now leads with its icon
 * only.
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
              {/* Icon + tag header */}
              <div style={{ padding: '1.75rem 1.75rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: '48px', height: '48px', borderRadius: 'var(--radius-card)',
                    background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: '22px', color: 'var(--color-primary)',
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-primary)', background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.2)', padding: '3px 10px', borderRadius: '4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {card.tag}
                </span>
              </div>

              {/* Text content */}
              <div style={{ padding: '1.25rem 1.75rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
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
