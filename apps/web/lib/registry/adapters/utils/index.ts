/**
 * lib/registry/adapters/utils/index.ts
 *
 * Barrel export — import from '@/lib/registry/adapters/utils'
 *
 * Adapters import from this barrel, not from individual modules.
 * This keeps adapter imports stable even if utilities are reorganised.
 */

export {
  pickLocale,
  resolveString,
  resolveBullets,
  resolveWorkflow,
} from './locale'

export {
  resolveAsset,
  resolveCardImage,
  resolveThumbImage,
} from './assets'

export {
  resolvePrimaryLabel,
  resolveSecondaryLabel,
  resolvePrimaryHref,
  resolveDemoAccessLabel,
} from './cta'

// workflow.ts is a placeholder — nothing to export yet
