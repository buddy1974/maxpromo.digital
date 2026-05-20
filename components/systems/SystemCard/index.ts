/**
 * components/systems/SystemCard/index.ts
 * Barrel export — import from '@/components/systems/SystemCard'
 */

// Router (default export)
export { default as SystemCard } from './SystemCard'
export type { SystemCardProps, CardVariant } from './SystemCard'

// Compact
export { SystemCardCompact } from './SystemCardCompact'
export type { SystemCardCompactProps, ImageMode } from './SystemCardCompact'

// Featured
export { SystemCardFeatured } from './SystemCardFeatured'
export type { SystemCardFeaturedProps } from './SystemCardFeatured'

// Full
export { SystemCardFull } from './SystemCardFull'
export type { SystemCardFullProps } from './SystemCardFull'

// Admin
export { SystemCardAdmin } from './SystemCardAdmin'
export type { SystemCardAdminProps } from './SystemCardAdmin'

// Table
export { SystemCardTable } from './SystemCardTable'
export type { SystemCardTableProps } from './SystemCardTable'

// Skeleton
export { SystemCardSkeleton } from './SystemCardSkeleton'
export type { SystemCardSkeletonProps } from './SystemCardSkeleton'
