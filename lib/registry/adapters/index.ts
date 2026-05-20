/**
 * lib/registry/adapters/index.ts
 *
 * Barrel export — consumers import from '@/lib/registry/adapters'
 *
 * Import rules:
 *   Public pages   → homepage.adapter, systems.adapter only
 *   OS /protected  → os.adapter (also homepage + systems if needed)
 *   Never          → import directly from lib/registry/products.ts in a page
 *
 * Shared utilities (locale resolution, CTA helpers) re-exported for
 * any consumer that needs to compose its own transform.
 */

// ── Homepage adapter
export {
  toHomepageCard,
  getHomepageCards,
} from './homepage.adapter'
export type { HomepageCardData } from './homepage.adapter'

// ── Systems adapter
export {
  toSystemsCard,
  getSystemsCards,
  getSystemsCardsByCategory,
  getProtectedCards,
} from './systems.adapter'
export type { SystemsCardData } from './systems.adapter'

// ── OS adapter
export {
  toOSRegistryRow,
  getOSRegistry,
  getOSRegistryByTrack,
  getOSRegistryRow,
} from './os.adapter'
export type { OSRegistryRow } from './os.adapter'

// ── Shared utilities (for custom transforms)
export {
  pickLocale,
  resolveString,
  resolveBullets,
  resolveWorkflow,
  resolveAsset,
  resolveCardImage,
  resolveThumbImage,
  resolvePrimaryLabel,
  resolveSecondaryLabel,
  resolvePrimaryHref,
} from './utils'
