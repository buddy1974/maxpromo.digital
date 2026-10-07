/**
 * lib/commercial/registry.ts
 *
 * Every commercial capability the OS offers to an interface, in one map.
 *
 * Adding a capability means adding a definition to one of the capability
 * modules; the agent API, the census Mission Control reads and the proof
 * all discover it from here. No interface keeps its own list, and nothing is
 * routed by a switch statement.
 */

import { DOCUMENT_CAPABILITIES } from './capabilities/documents'
import { OPERATIONS_CAPABILITIES } from './capabilities/operations'
import { OUTREACH_CAPABILITIES } from './capabilities/outreach'
import { SALES_CAPABILITIES } from './capabilities/sales'
import { VIEW_CAPABILITIES } from './capabilities/views'
import type { AnyCapability } from './types'

const ALL: AnyCapability[] = [
  ...SALES_CAPABILITIES,
  ...OUTREACH_CAPABILITIES,
  ...DOCUMENT_CAPABILITIES,
  ...OPERATIONS_CAPABILITIES,
  ...VIEW_CAPABILITIES,
]

export const CAPABILITIES: ReadonlyMap<string, AnyCapability> = (() => {
  const map = new Map<string, AnyCapability>()
  for (const c of ALL) {
    if (map.has(c.id)) throw new Error(`[commercial] capability ${c.id} is defined twice`)
    if (c.risk === 'GREEN' && !c.run) throw new Error(`[commercial] GREEN capability ${c.id} has no run binding`)
    if (c.risk === 'AMBER' && (!c.prepare || !c.execute)) throw new Error(`[commercial] AMBER capability ${c.id} needs prepare and execute`)
    map.set(c.id, c)
  }
  return map
})()

/** The machine-readable census an interface reads to know what it may ask for. */
export function census() {
  return [...CAPABILITIES.values()].map((c) => ({
    id: c.id,
    family: c.family,
    title: c.title,
    description: c.description,
    risk: c.risk,
    input: c.input.describe,
    confirmation: c.risk === 'AMBER' ? 'prepare-then-execute, bound to payload hash, single use' : 'none',
  }))
}
