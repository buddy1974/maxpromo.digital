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
 *  , When `src` is absent: reserves the slot. Same box, same aspect ratio,
 *     a restrained branded pending state and a truthful label. The real image
 *     later drops into a container that already exists, with no second layout
 *     pass. This is the Placeholders rule in docs/governance/standards.md, and
 *     the founder slot in components/home/FounderNote.tsx is its reference.
 *  , `whenMissing="collapse"` restores the old behaviour of rendering nothing.
 *     Explicit, deprecated, and for one narrow case described below.
 *
 * WHY THE DEFAULT CHANGED
 *
 * This component used to return null for a missing `src`, and said so: "the
 * section layout collapses cleanly, no empty boxes or dashed placeholders".
 * That is the opposite of the governance the platform now runs under, where a
 * missing asset is a reserved position rather than a licence to delete the
 * visual area.
 *
 * Changing the default could not alter anything currently rendered, which is
 * why it was safe to change rather than fork. Both callers were checked:
 * ProductGallery filters to tabs that have an `imageUrl` before it renders any
 * slot, and ProductOverviewVisual takes a required `cardImageSrc` which every
 * product in the registry supplies as a real path. No caller reaches the
 * missing-`src` branch, so no live page moves.
 *
 * WHEN TO USE `whenMissing="collapse"`
 *
 * Only on a surface still governed by the older, narrower instruction that a
 * product page must not show an empty frame or a "screens coming soon"
 * message. ProductGallery carries that instruction in its own header, twice
 * dated 2026-07-25, and handles it at the section level rather than here: it
 * renders nothing at all when no screenshot exists, which remains correct and
 * is not this component's decision to make.
 *
 * It is not a general escape hatch and it is not the default. A new surface
 * that reaches for it is almost certainly avoiding the placeholder rule rather
 * than satisfying an older one. It should be removed from any caller that
 * passes it the next time that surface is rebuilt, and when the last caller
 * stops passing it the prop goes with it.
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
  /** Path to image in /public. Absent reserves the slot — see `whenMissing`. */
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
  /**
   * What to do when `src` is absent.
   *
   * `'reserve'` (default) keeps the slot at its final size with a pending
   * state. `'collapse'` renders nothing, and is only for a surface still
   * governed by the older no-empty-frame instruction. See the file header.
   */
  whenMissing?: 'reserve' | 'collapse'
  /**
   * What the reserved slot says it is waiting for. Plain and truthful, in the
   * visitor's language where the caller has one. Never a filename or a TODO.
   */
  pendingLabel?: string
}

const BORDER = 'var(--brand-border)'

export function ScreenshotSlot({
  src,
  alt,
  width,
  height,
  caption,
  subcaption,
  priority = false,
  style,
  whenMissing = 'reserve',
  pendingLabel = 'SYSTEM SCREENSHOT',
}: ScreenshotSlotProps) {
  if (!src && whenMissing === 'collapse') return null

  /**
   * One object, both states. The reserved slot is the same box as the real
   * screenshot because it is literally the same style, not a second set of
   * numbers that has to be kept in step. That is what makes dropping the
   * image in later a no-op for layout.
   */
  const frame: CSSProperties = {
    position:     'relative',
    width:        '100%',
    aspectRatio:  `${width} / ${height}`,
    background:   'var(--brand-background)',
    border:       `1px solid ${BORDER}`,
    borderRadius: 'var(--radius-lg)',
    overflow:     'hidden',
  }

  return (
    <div style={style}>
      {/* Aspect-ratio wrapper prevents CLS, height is determined by ratio, not image load */}
      <div
        style={src ? frame : {
          ...frame,
          // Dashed, like the founder slot, so a reserved position never reads
          // as a finished one. Surface rather than background, so it sits
          // back instead of looking like a broken image.
          border:         `1px dashed var(--brand-border-strong)`,
          background:     'var(--brand-surface-subtle)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
            style={{ objectFit: 'cover', objectPosition: 'top left' }}
            priority={priority}
          />
        ) : (
          <span style={{
            fontFamily:    'var(--brand-font-mono)',
            fontSize:      'var(--text-micro)',
            letterSpacing: '0.16em',
            color:         'var(--brand-text-muted)',
            textTransform: 'uppercase',
          }}>
            {pendingLabel}
          </span>
        )}
      </div>

      {/* Caption block, only rendered if at least one string is provided */}
      {(caption || subcaption) && (
        <div style={{ marginTop: '14px', paddingLeft: '2px' }}>
          {caption && (
            <p style={{
              fontFamily:    'var(--brand-font-sans)',
              fontSize:      'var(--text-label)',
              color:         'var(--brand-text-inverted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin:        '0 0 5px',
            }}>
              {caption}
            </p>
          )}
          {subcaption && (
            <p style={{
              fontFamily: 'var(--brand-font-body)',
              fontSize:   'var(--text-micro)',
              color:      'var(--brand-text-muted)',
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
