/**
 * lib/channels/os-bridge.ts — SERVER ONLY.
 *
 * The one door from a public conversation into Maxpromo OS.
 *
 * Every OS capability in the registry was written for Marcel: GREEN there
 * means "safe for the owner", and the owner may read the whole business
 * (`commercial.search`, `owner.overview`, `lead.find` …). A WhatsApp sender is
 * a stranger. So this lane is not given the registry; it is given four
 * capabilities, named below, with inputs built by code — never by the model,
 * never by the customer's words naming a record.
 *
 *   lead.check       who is this phone number? (result read by code, never shown)
 *   lead.create      record a new enquiry; the OS deduplicates by phone
 *   note.add         the qualified summary, on this conversation's own lead
 *   incident.create  an existing client's support request, on their own record
 *
 * Each runs through the commercial engine, so it inherits request-id
 * idempotency (os_agent_results) and the audit trail (os_audit), under the
 * actor `whatsapp:<conversation>` and channel `whatsapp`.
 */

import { runCapability, type EngineResponse } from '@/lib/commercial/engine'
import type { Sql } from '@/lib/commercial/types'
import type { OsIdentity, OsPort } from './orchestrator'

export const PUBLIC_CHANNEL_CAPABILITIES = ['lead.check', 'lead.create', 'note.add', 'incident.create'] as const
type PublicCapability = typeof PUBLIC_CHANNEL_CAPABILITIES[number]

export class OsRefused extends Error {
  constructor(message: string) { super(message); this.name = 'OsRefused' }
}

interface Match { kind: 'lead' | 'client'; id: string }

function firstName(full: string | null | undefined): string | null {
  const w = (full ?? '').trim().split(/\s+/)[0]
  return w && w.length <= 40 && /^\p{L}[\p{L}'-]*$/u.test(w) ? w : null
}

export function createOsBridge(sql: Sql, conversationId: string): OsPort {
  const actor = `whatsapp:${conversationId}`

  async function run(capability: PublicCapability, requestId: string, input: Record<string, unknown>): Promise<EngineResponse & { status: 'done' }> {
    /* Belt and braces: the type already restricts this; the runtime check is
       what a future edit cannot quietly widen. */
    if (!(PUBLIC_CHANNEL_CAPABILITIES as readonly string[]).includes(capability)) throw new OsRefused(`capability ${capability} is not open to public channels`)
    const r = await runCapability(sql, { requestId, actor, channel: 'whatsapp', capability, input })
    if (r.status !== 'done') throw new OsRefused(`${capability}: ${r.status}${'code' in r ? ` ${r.code}` : ''}`)
    return r
  }

  async function nameOf(m: Match): Promise<string | null> {
    const rows = m.kind === 'client'
      ? await sql`SELECT name FROM os_clients WHERE id = ${m.id}` as { name: string | null }[]
      : await sql`SELECT name FROM os_leads WHERE id = ${m.id}` as { name: string | null }[]
    return firstName(rows[0]?.name)
  }

  return {
    async identify(requestId, contact): Promise<OsIdentity> {
      if (!contact.phone) return { kind: 'none' }
      const r = await run('lead.check', requestId, { phone: `+${contact.phone}` })
      const data = r.result.data as { known?: boolean; matches?: Match[] } | undefined
      const matches = data?.matches ?? []
      if (!data?.known || !matches.length) return { kind: 'none' }
      /* A client outranks a lead for the same number: they are the same
         person further along, and must not be sold to. */
      const clients = matches.filter((m) => m.kind === 'client')
      const pick = clients.length === 1 ? clients[0] : clients.length === 0 && matches.length === 1 ? matches[0] : null
      if (!pick) return { kind: 'ambiguous', count: matches.length }
      return { kind: pick.kind, id: pick.id, firstName: await nameOf(pick) }
    },

    async createLead(requestId, input) {
      const { distinctFrom, ...fields } = input
      const r = await run('lead.create', requestId, {
        ...fields, source: 'whatsapp', stage: 'discovered',
        /* Set only by the orchestrator after the OS matched on something
           other than the verified phone (lib/channels/orchestrator.ts). */
        ...(distinctFrom?.length ? { confirmed_distinct_from: distinctFrom.slice(0, 10) } : {}),
      })
      const data = r.result.data as { created?: boolean; lead_id?: string; matches?: (Match & { basis: string })[] } | undefined
      if (data?.created && data.lead_id) return { created: true, id: data.lead_id }
      const matches = (data?.matches ?? []).map((m) => ({ kind: m.kind, id: m.id, basis: m.basis }))
      if (matches.length) return { created: false, matches }
      throw new OsRefused('lead.create returned neither a lead nor a match')
    },

    async recordQualification(requestId, leadId, summary) {
      await run('note.add', requestId, { lead_id: leadId, text: `WhatsApp qualification (Max):\n${summary}` })
    },

    async openIncident(requestId, clientId, input) {
      await run('incident.create', requestId, {
        client_id: clientId, title: input.title, detail: input.detail, severity: input.severity,
        source: 'whatsapp', dedupe_key: input.dedupeKey,
      })
    },
  }
}
