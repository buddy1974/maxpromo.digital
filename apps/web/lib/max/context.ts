/**
 * lib/max/context.ts — the context envelope: where Marcel is when he talks to Max. SERVER ONLY.
 *
 * The screen sends ids (the client page's client, the open conversation, the Inbox selection, the
 * invoice on screen). Each is checked against the database and turned into a label; an id that does
 * not exist is dropped. Only labels go to the model — never the records themselves — and only the
 * verified ids are used in grounding. Nothing else from the database is sent with every request:
 * grounding fetches what one proposal needs.
 */
import type { Sql } from '@/lib/commercial/types'
import { clientDisplayLabel } from '@/lib/clients/match'
import { leadLabel, q, type LeadRow } from '@/lib/commercial/records'
import type { MaxContext, MaxEnvelope } from './contract'
import { UUID } from './ground'

/** Shape check of what a browser sent. Unknown keys and malformed ids are dropped. */
export function parseEnvelope(raw: unknown): MaxEnvelope {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const id = (x: unknown) => (typeof x === 'string' && UUID.test(x) ? x : undefined)
  const route = typeof r.route === 'string' && /^\/os[\w/\-[\]]*$/.test(r.route) ? r.route.slice(0, 200) : '/os/ask'
  const selected = Array.isArray(r.selected_thread_ids) ? r.selected_thread_ids.map(id).filter((x): x is string => Boolean(x)).slice(0, 100) : []
  return {
    route,
    ...(id(r.client_id) ? { client_id: id(r.client_id) } : {}),
    ...(id(r.lead_id) ? { lead_id: id(r.lead_id) } : {}),
    ...(id(r.invoice_id) ? { invoice_id: id(r.invoice_id) } : {}),
    ...(id(r.angebot_id) ? { angebot_id: id(r.angebot_id) } : {}),
    ...(id(r.thread_id) ? { thread_id: id(r.thread_id) } : {}),
    ...(selected.length ? { selected_thread_ids: selected } : {}),
  }
}

export async function verifyContext(sql: Sql, e: MaxEnvelope): Promise<MaxContext> {
  const out: MaxContext = { route: e.route }
  const [client, lead, invoice, angebot, thread, selected] = await Promise.all([
    e.client_id ? q<{ id: string; name: string; company: string | null; email: string | null; status: string }>(sql`SELECT id::text, name, company, email, status FROM os_clients WHERE id = ${e.client_id}::uuid`) : [],
    e.lead_id ? q<LeadRow>(sql`SELECT * FROM os_leads WHERE id = ${e.lead_id}::uuid`) : [],
    e.invoice_id ? q<{ id: string; invoice_number: string; client_id: string | null }>(sql`SELECT id::text, invoice_number, client_id::text FROM os_invoices WHERE id = ${e.invoice_id}::uuid`) : [],
    e.angebot_id ? q<{ id: string; angebot_number: string; client_id: string | null }>(sql`SELECT id::text, angebot_number, client_id::text FROM os_angebote WHERE id = ${e.angebot_id}::uuid`) : [],
    e.thread_id ? q<{ id: string; subject: string; trashed: boolean; counterpart: string | null }>(sql`SELECT t.id::text, t.subject, t.trashed, (SELECT sender FROM mail.messages m WHERE m.thread_id = t.id AND m.direction = 'inbound' ORDER BY received_at DESC LIMIT 1) AS counterpart
      FROM mail.threads t WHERE t.id = ${e.thread_id}::uuid AND t.quarantine IS NULL`) : [],
    e.selected_thread_ids?.length ? q<{ id: string }>(sql`SELECT id::text FROM mail.threads WHERE id = ANY(${e.selected_thread_ids}::uuid[]) AND quarantine IS NULL`) : [],
  ])
  if (client[0]) out.client = { id: client[0].id, label: clientDisplayLabel(client[0]), email: client[0].email, status: client[0].status }
  if (lead[0]) out.lead = { id: lead[0].id, label: leadLabel(lead[0]), email: lead[0].email }
  if (invoice[0]) out.invoice = { id: invoice[0].id, number: invoice[0].invoice_number, client_id: invoice[0].client_id }
  if (angebot[0]) out.angebot = { id: angebot[0].id, number: angebot[0].angebot_number, client_id: angebot[0].client_id }
  if (thread[0]) out.thread = { id: thread[0].id, subject: thread[0].subject, counterpart: thread[0].counterpart, trashed: thread[0].trashed }
  if (selected.length) out.selection = { ids: selected.map(s => s.id) }
  /* An invoice or quote on screen names its client too: "record the payment" needs no name. */
  if (!out.client) {
    const cid = out.invoice?.client_id ?? out.angebot?.client_id
    if (cid) {
      const rows = await sql`SELECT id::text, name, company, email, status FROM os_clients WHERE id = ${cid}::uuid` as { id: string; name: string; company: string | null; email: string | null; status: string }[]
      if (rows[0]) out.client = { id: rows[0].id, label: clientDisplayLabel(rows[0]), email: rows[0].email, status: rows[0].status }
    }
  }
  return out
}

/** What the history keeps of the context: kinds and labels, for Marcel to see what Max saw. */
export function contextSummary(c: MaxContext): Record<string, unknown> {
  return {
    route: c.route,
    ...(c.client ? { client: { id: c.client.id, label: c.client.label } } : {}),
    ...(c.lead ? { lead: { id: c.lead.id, label: c.lead.label } } : {}),
    ...(c.invoice ? { invoice: { id: c.invoice.id, number: c.invoice.number } } : {}),
    ...(c.angebot ? { angebot: { id: c.angebot.id, number: c.angebot.number } } : {}),
    ...(c.thread ? { thread: { id: c.thread.id, subject: c.thread.subject } } : {}),
    ...(c.selection ? { selected: c.selection.ids.length } : {}),
  }
}
