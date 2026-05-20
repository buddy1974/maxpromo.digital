/**
 * lib/registry/adapters/utils/locale.ts
 *
 * Locale resolution helpers.
 * Selects the correct language variant from any localised registry field.
 * All functions are pure — no side effects, no React, no JSX.
 */

import type {
  LocalisedString,
  LocalisedBullets,
  LocalisedWorkflow,
  BulletTuple,
  WorkflowTuple,
} from '@/lib/registry/types'

/**
 * Selects the correct locale variant from a localised field.
 * Falls back to `en` when the `de` variant is absent.
 *
 * @param field  A LocalisedString, LocalisedAsset, or any { en: T; de?: T } shape.
 * @param locale Active locale — 'de' | 'en' or any string (unknown locales fall back to en).
 */
export function pickLocale<T>(
  field: { readonly en: T; readonly de?: T },
  locale: string,
): T {
  if (locale === 'de' && field.de !== undefined) return field.de
  return field.en
}

/** Resolves a LocalisedString to a plain string for the given locale. */
export function resolveString(field: LocalisedString, locale: string): string {
  return pickLocale(field, locale)
}

/** Resolves LocalisedBullets to the correct BulletTuple for the given locale. */
export function resolveBullets(field: LocalisedBullets, locale: string): BulletTuple {
  return pickLocale(field, locale)
}

/** Resolves LocalisedWorkflow to the correct WorkflowTuple for the given locale. */
export function resolveWorkflow(field: LocalisedWorkflow, locale: string): WorkflowTuple {
  return pickLocale(field, locale)
}
