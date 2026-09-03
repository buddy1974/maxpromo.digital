import Image from 'next/image'
import type { CSSProperties } from 'react'

/**
 * components/ui/ScreenshotSlot.tsx
 *
 * Reusable proof-layer screenshot slot for product pages.
 * Renders a screenshot with optional caption/subcaption.
 *
 * Behaviour:
 *  , When `src` is provided: renders next/image with aspect-ratio container.
 *     No layout shift. Scales cleanly on all breakpoints.
 *  , When `src` is null/undefined: renders nothing.
 *     The section layout collapses cleanly, no empty boxes or dashed placeholders.
 *
 * To add a screenshot later: pass the path as `src`.
 * The component handles everything else.
 *
 * Image storage standard:
 *   public/images/systems/[product]/proof/[screenshot-name].png
 *
 * Example paths for TaxKontrol:
 *   /images/systems/taxkontrol/proof/reserve-dashboard.png
 *   /images/systems/taxkontrol/proof/deadline-overview.png
 *   /images/systems/taxkontrol/proof/income-expense.png
 *   /images/systems/taxkontrol/proof/quarterly-view.png
 */

export interface ScreenshotSlotProps {
  /** Path to image in /public. Pass null/undefined to render nothing. */
  src?: string | null
  /** Image alt text, required for accessibility */
  alt: string
  /** Intrinsic width of the screenshot (px), used for aspect-ratio */
  width: number
  /** Intrinsic height of the screenshot (px), used for aspect-ratio */
  height: number
  /** Short label shown above subcaption in mono font */
  caption?: string
  /** Supporting sentence shown below caption in body font */
  subcaption?: string
  /** LCP candidate, pass true for above-the-fold screenshots */
  priority?: boolean
  /** Optional outer wrapper style overrides */
  style?: CSSProperties
}

const BORDER = '#1A1A1A'

export function ScreenshotSlot({
  src,
  alt,
  width,
  height,
  caption,
  subcaption,
  priority = false,
  style,
}: ScreenshotSlotProps) {
  if (!src) return null

  return (
    <div style={style}>
      {/* Aspect-ratio wrapper prevents CLS, height is determined by ratio, not image load */}
      <div
        style={{
          position:     'relative',
          width:        '100%',
          aspectRatio:  `${width} / ${height}`,
          background:   '#0A0A0A',
          border:       `1px solid ${BORDER}`,
          borderRadius: '10px',
          overflow:     'hidden',
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
          style={{ objectFit: 'cover', objectPosition: 'top left' }}
          priority={priority}
        />
      </div>

      {/* Caption block, only rendered if at least one string is provided */}
      {(caption || subcaption) && (
        <div style={{ marginTop: '14px', paddingLeft: '2px' }}>
          {caption && (
            <p style={{
              fontFamily:    'var(--brand-font-sans)',
              fontSize:      '11px',
              color:         '#F0F0F0',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin:        '0 0 5px',
            }}>
              {caption}
            </p>
          )}
          {subcaption && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize:   '13px',
              color:      '#555',
              lineHeight: 1.65,
              margin:     0,
            }}>
              {subcaption}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
