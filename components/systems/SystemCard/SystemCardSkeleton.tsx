/**
 * components/systems/SystemCard/SystemCardSkeleton.tsx
 *
 * Loading skeleton for product cards.
 * Renders a placeholder that matches the approximate shape of each variant
 * while data or images are loading.
 *
 * Used for:
 *  , Systems page loading state
 *  , /os admin tables while Supabase data resolves
 *  , Analytics cards while events load
 *  , Embedded product lists in landing pages
 *  , Any async context that shows cards before data is ready
 *
 * TODO: add CSS pulse/shimmer animation in the visual implementation pass
 * TODO: connect to Suspense boundaries once consumers are built
 */

import type { CardVariant } from './SystemCard'

// =============================================================================
// TYPES
// =============================================================================

export interface SystemCardSkeletonProps {
  /**
   * Variant to mimic, determines the skeleton's height and block structure.
   * Defaults to 'full'. Match this to the card variant being replaced.
   */
  readonly variant?: CardVariant
  /**
   * ARIA label for screen readers.
   * Defaults to "Loading product…"
   */
  readonly label?: string
}

// =============================================================================
// SKELETON BLOCK HELPER
// A single grey placeholder block used to represent text lines and images.
// =============================================================================

function SkeletonBlock({
  width = '100%',
  height,
  borderRadius = '4px',
}: {
  readonly width?: string
  readonly height: string
  readonly borderRadius?: string
}) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--color-border)',
        // TODO: add shimmer animation: background linear-gradient sweep
      }}
    />
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * SystemCardSkeleton, loading placeholder.
 *
 * Renders an inert, animated (TODO) skeleton matching the target variant shape.
 * Place this inside a Suspense boundary or conditional render while data loads.
 *
 * @example
 * // Match to the cards being replaced:
 * <SystemCardSkeleton variant="compact" label="Loading RestaurantOS…" />
 * <SystemCardSkeleton variant="full" />
 * <SystemCardSkeleton variant="admin" />
 */
export function SystemCardSkeleton({
  variant = 'full',
  label = 'Loading product…',
}: SystemCardSkeletonProps) {

  return (
    <div
      data-variant={`skeleton-${variant}`}
      role="status"
      aria-label={label}
      aria-busy="true"
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      {/* ── Compact skeleton: thumbnail block + 2 text lines */}
      {variant === 'compact' && (
        <>
          <SkeletonBlock height="180px" borderRadius="8px" />
          <SkeletonBlock height="20px" width="70%" />
          <SkeletonBlock height="14px" width="90%" />
        </>
      )}

      {/* ── Featured skeleton: large thumbnail + name + 3 bullets + CTA */}
      {variant === 'featured' && (
        <>
          <SkeletonBlock height="220px" borderRadius="8px" />
          <SkeletonBlock height="22px" width="60%" />
          <SkeletonBlock height="16px" width="85%" />
          <SkeletonBlock height="14px" width="75%" />
          <SkeletonBlock height="14px" width="80%" />
          <SkeletonBlock height="14px" width="70%" />
          <SkeletonBlock height="40px" width="50%" borderRadius="8px" />
        </>
      )}

      {/* ── Full skeleton: matches full card proportions */}
      {variant === 'full' && (
        <>
          <SkeletonBlock height="200px" borderRadius="8px" />
          <SkeletonBlock height="12px" width="30%" />
          <SkeletonBlock height="24px" width="65%" />
          <SkeletonBlock height="16px" width="90%" />
          <SkeletonBlock height="14px" width="75%" />
          <SkeletonBlock height="14px" width="80%" />
          <SkeletonBlock height="14px" width="70%" />
          <div style={{ display: 'flex', gap: '8px' }}>
            <SkeletonBlock height="40px" width="45%" borderRadius="8px" />
            <SkeletonBlock height="40px" width="40%" borderRadius="8px" />
          </div>
        </>
      )}

      {/* ── Admin skeleton: single row with multiple column blocks */}
      {variant === 'admin' && (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <SkeletonBlock height="16px" width="160px" />
          <SkeletonBlock height="16px" width="120px" />
          <SkeletonBlock height="24px" width="80px" borderRadius="12px" />
          <SkeletonBlock height="24px" width="60px" borderRadius="12px" />
          <SkeletonBlock height="16px" width="40px" />
          <SkeletonBlock height="32px" width="90px" borderRadius="6px" />
        </div>
      )}

      {/* ── Table skeleton: single compact row */}
      {variant === 'table' && (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <SkeletonBlock height="14px" width="120px" />
          <SkeletonBlock height="14px" width="90px" />
          <SkeletonBlock height="14px" width="100px" />
          <SkeletonBlock height="14px" width="60px" />
        </div>
      )}
    </div>
  )
}
