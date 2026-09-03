/**
 * MaxBranches.ts — industry-aware opener context map.
 *
 * TODO(phase3b): pass getBranchContext(slug) result into claude.ts
 * system prompt to set industry-specific opener tone and terminology.
 */

export interface BranchContext {
  openerSnippet: string
  industryHint:  string
}

// Placeholder context per product slug.
// Phase 3b: replace with real, tested opener copy per vertical.
const BRANCHES: Record<string, BranchContext> = {
  'restaurant-os':  { openerSnippet: 'restaurant and hospitality',    industryHint: 'hospitality'  },
  'handwerk-os':    { openerSnippet: 'trades and construction',        industryHint: 'trade'        },
  'praxis-os':      { openerSnippet: 'medical and specialist practice', industryHint: 'healthcare'  },
  'printshop-os':   { openerSnippet: 'print shop production',          industryHint: 'print'        },
  'care-os':        { openerSnippet: 'care services and supported living', industryHint: 'care'     },
  'realestate-os':  { openerSnippet: 'real estate and property',       industryHint: 'real-estate'  },
  'publishing-os':  { openerSnippet: 'publishing and content',         industryHint: 'publishing'   },
  'taxkontrol':     { openerSnippet: 'tax and personal finance',       industryHint: 'finance'      },
}

export function getBranchContext(slug: string | null): BranchContext | null {
  if (!slug) return null
  return BRANCHES[slug] ?? null
}
