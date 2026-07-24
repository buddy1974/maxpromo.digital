'use client'

import Image from 'next/image'
import { useState } from 'react'
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
 * Pain card scene image. No approved photography exists yet for these six
 * cards (see public/images/homepage/README.md). Rather than requesting a
 * path that 404s, this renders nothing when no asset is present — the
 * premium gradient + ghost-glyph + tag fallback already layered in the
 * parent card carries the visual weight, so no broken-image icon is ever
 * shown. Once real photography is dropped at
 * /images/homepage/pain/{id}.png, it is picked up automatically.
 */
function PainCardImage({ id }: { id: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <Image
      src={`/images/homepage/pain/${id}.png`}
      alt=""
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      style={{ objectFit: 'cover', objectPosition: 'center top' }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

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
                boxShadow: '0 0 40px rgba(249,115,22,0.09)',
                transition: { duration: 0.25 },
              }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: 'hsl(240 12% 7%)',
                border: '1px solid hsl(40 30% 96% / 0.07)',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              {/* Image area — next/image with WebP/AVIF optimisation */}
              <motion.div
                className="pain-card-img"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'relative',
                  aspectRatio: '16 / 9',
                  backgroundColor: 'hsl(240 12% 5%)',
                  overflow: 'hidden',
                }}
              >
                <PainCardImage id={card.id} />
                {/* Dark gradient overlay */}
                <div
                  aria-hidden="true"
                  style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,10,14,0.2) 0%, rgba(10,10,14,0.65) 100%)', zIndex: 1 }}
                />
                {/* Fallback ghost glyph */}
                <span
                  aria-hidden="true"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '96px', color: 'rgba(249,115,22,0.06)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', userSelect: 'none', pointerEvents: 'none', zIndex: 0 }}
                >
                  {card.icon}
                </span>
                {/* Brand radial */}
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: card.imgBg, zIndex: 0, pointerEvents: 'none' }} />
                {/* Top strip */}
                <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #F97316 0%, rgba(249,115,22,0.3) 60%, transparent 100%)', zIndex: 2 }} />
                {/* Tag */}
                <span style={{ position: 'absolute', zIndex: 3, top: '14px', left: '14px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F97316', background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)', padding: '3px 10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {card.tag}
                </span>
              </motion.div>

              {/* Text content */}
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '18px', letterSpacing: '-0.03em', color: 'hsl(40 30% 96%)', lineHeight: 1.25, margin: 0 }}>
                  {card.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'hsl(40 12% 60%)', lineHeight: 1.7, margin: 0, flex: 1 }}>
                  {card.desc}
                </p>
                <motion.span
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#F97316', letterSpacing: '0.05em', marginTop: '4px', display: 'inline-block' }}
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
