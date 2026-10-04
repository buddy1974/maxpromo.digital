/**
 * lib/documents/client-match.ts
 *
 * Linking an extracted customer to an existing client record, without guessing.
 *
 * WHAT HAPPENED
 *
 * The first genuine evidence run extracted "Katrin Beckmann" and "Beckmann
 * Elektrotechnik GmbH" from an enquiry. The client list already held exactly
 * that client. The selector stayed empty and the quotation was saved with the
 * customer as free text and no `client_id`, so it belongs to nobody: the
 * client's page does not list it, and converting it to an invoice starts the
 * address over.
 *
 * Nothing had failed. The form populated the name fields from the extraction
 * and never looked at the client list at all — there was no matching step to
 * go wrong.
 *
 * THE LAW
 *
 * Attaching a quotation to the wrong client is worse than attaching it to none:
 * one is an empty selector a person notices, the other is a commercial document
 * filed under another business. So matching is exact and deterministic, and
 * anything short of one clear answer is handed to a person.
 *
 *   EMAIL     exact, case-insensitive. An address identifies one mailbox.
 *   COMPANY   exact after folding case, umlauts, punctuation and spacing.
 *             "Beckmann Elektrotechnik GmbH" matches "beckmann elektrotechnik
 *             gmbh"; it does not match "Beckmann Elektro GmbH" or "Beckmann
 *             Elektrotechnik". The legal form is part of the identity.
 *   NAME      a person's name alone never links. Two clients can share a
 *             contact name, and a name is the field an extraction is likeliest
 *             to get approximately right. A unique name match is offered to a
 *             person as a candidate, never applied.
 *
 * A link is made only when the evidence points at exactly one client and
 * nothing points at a different one. An email naming client A and a company
 * naming client B is a conflict, not a tie-break.
 *
 * Nothing here creates a client. No match means the form behaves as before.
 *
 * Pure and dependency-free, so the gate that proves it can import it directly.
 */

export interface MatchableClient {
  id: string
  name?: string | null
  company?: string | null
  email?: string | null
}

export interface ExtractedCustomer {
  clientName?: string
  clientCompany?: string
  clientEmail?: string
}

export type ClientMatch<C extends MatchableClient> =
  | { kind: 'linked'; client: C; basis: 'email' | 'company' | 'email+company' }
  | { kind: 'ambiguous'; candidates: C[]; reason: 'several' | 'conflict' | 'name-only' }
  | { kind: 'none' }

/** Case, umlauts, accents, punctuation and spacing folded away. */
export function normaliseIdentity(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normaliseEmail(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase()
}

export function matchExistingClient<C extends MatchableClient>(
  extracted: ExtractedCustomer,
  clients: readonly C[],
): ClientMatch<C> {
  const email = normaliseEmail(extracted.clientEmail)
  const company = normaliseIdentity(extracted.clientCompany)
  const name = normaliseIdentity(extracted.clientName)

  const byEmail = email ? clients.filter((c) => normaliseEmail(c.email) === email) : []
  const byCompany = company ? clients.filter((c) => normaliseIdentity(c.company) === company) : []

  if (byEmail.length > 0 || byCompany.length > 0) {
    if (byEmail.length > 0 && byCompany.length > 0) {
      const both = byEmail.filter((c) => byCompany.includes(c))
      if (both.length === 1) return { kind: 'linked', client: both[0], basis: 'email+company' }
      const union = [...new Set([...byEmail, ...byCompany])]
      return { kind: 'ambiguous', candidates: union, reason: both.length > 1 ? 'several' : 'conflict' }
    }
    const hits = byEmail.length > 0 ? byEmail : byCompany
    if (hits.length === 1) {
      return { kind: 'linked', client: hits[0], basis: byEmail.length > 0 ? 'email' : 'company' }
    }
    return { kind: 'ambiguous', candidates: hits, reason: 'several' }
  }

  if (name) {
    const byName = clients.filter((c) => normaliseIdentity(c.name) === name)
    if (byName.length > 0) return { kind: 'ambiguous', candidates: byName, reason: 'name-only' }
  }

  return { kind: 'none' }
}
