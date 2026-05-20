/**
 * components/systems/SystemCard/helpers/category.ts
 *
 * Category label localisation for card variants.
 * Maps registry ProductCategory values to display strings.
 */

import type { ProductCategory } from '@/lib/registry/types'

const CATEGORY_LABELS: Record<ProductCategory, { en: string; de: string }> = {
  'business-system':  { en: 'Business System',  de: 'Betriebssystem'  },
  'platform':         { en: 'Platform',         de: 'Plattform'       },
  'personal-finance': { en: 'Personal Finance', de: 'Privatfinanzen'  },
  'ecosystem':        { en: 'Ecosystem',        de: 'Ökosystem'       },
}

export function resolveCategoryLabel(category: ProductCategory, locale: string): string {
  const entry = CATEGORY_LABELS[category]
  if (!entry) return category
  return locale === 'de' ? entry.de : entry.en
}
