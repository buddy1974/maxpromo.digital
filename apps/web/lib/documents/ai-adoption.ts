/**
 * lib/documents/ai-adoption.ts
 *
 * How a commercial-document form takes in an AI extraction. One copy, used by
 * every screen that offers AI extraction, so the provenance boundary does not
 * depend on which screen a person happens to be on.
 *
 * WHY THIS EXISTS
 *
 * The 2026-10-04 fix put the whole boundary — held lines, deliberate override,
 * client linking — into the new-quotation form, where the defect was seen. The
 * quotation edit screen and the new-invoice screen called the same extraction
 * route and dropped the hold markers on the floor while mapping the result:
 * the server had flagged a line, and the form forgot it had. A boundary that
 * exists on one of three doors is a decoration.
 *
 * THE INVARIANT
 *
 * No AI-assisted commercial document may persist unsupported contractual
 * content without explicit human resolution. Resolution is one of two things:
 * the person edits the unsupported words out, or the person keeps them
 * deliberately (`releaseHold`). Either is visible and either is theirs.
 *
 * The markers travel with the line items all the way to the save request, so
 * the server can refuse a held line too (`admitLineItems`). Screens must not
 * strip them; the gate checks that.
 *
 * Pure and dependency-free apart from the guard, so the gate can import it.
 */

import { isHeld } from './extraction-guard.ts'

export { isHeld }

export type Confidence = 'high' | 'medium' | 'low'

/** A line item as the extraction route returns it. */
export interface ExtractedLineItem {
  description: string
  quantity: number
  unit?: string
  unitPrice: number
  finalPrice: number
  isFixedPrice: boolean
  confidence?: Confidence
  category?: string
  unsupportedTerms?: string[]
}

/** A line item as the document forms hold it. */
export interface AdoptedLineItem {
  description: string
  qty: number
  unit: string
  unit_price: number
  total: number
  isFixedPrice: boolean
  aiConfidence?: Confidence
  category?: string
  unsupportedTerms?: string[]
}

/** Maps extracted lines into form lines, keeping the hold markers. */
export function adoptLineItems(items: readonly ExtractedLineItem[] | undefined): AdoptedLineItem[] {
  return (items ?? []).map((li) => ({
    description:  li.description,
    qty:          li.quantity,
    unit:         li.unit || 'pauschal',
    unit_price:   li.unitPrice,
    total:        li.finalPrice,
    isFixedPrice: li.isFixedPrice,
    aiConfidence: li.confidence,
    category:     li.category,
    unsupportedTerms: li.unsupportedTerms?.length ? [...li.unsupportedTerms] : undefined,
  }))
}

/** How many lines are still held. A form may not save or send while this is above zero. */
export function countHeld(items: ReadonlyArray<{ description: string; unsupportedTerms?: string[] }>): number {
  return items.filter(isHeld).length
}

/** The deliberate human override: keep line `index` as written. */
export function releaseHold<T extends { unsupportedTerms?: string[] }>(items: readonly T[], index: number): T[] {
  return items.map((li, i) => (i === index ? { ...li, unsupportedTerms: undefined } : li))
}
