/**
 * lib/max/ground.ts — grounding helpers: which real record a name means, whether an amount is
 * Marcel's own, whether a date is usable. SERVER ONLY; reads, never writes.
 *
 * A name is resolved by the OS's existing searches (records.searchClients / searchLeads); one hit
 * is the record, several are a choice Marcel makes, none is said plainly. The screen Marcel is on
 * wins when he says "this client" / "him" or names nothing.
 */
import { searchClients, searchLeads, leadLabel, type ClientRow, type LeadRow } from '@/lib/commercial/records'
import { clientDisplayLabel } from '@/lib/clients/match'
import type { Choice, GroundCtx, Lang } from './contract'
import { MAX_COPY } from './copy'

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ISO = /^\d{4}-\d{2}-\d{2}$/

/** Every amount written in a text: "2.000", "2,000", "1.500,50", "€500", "2k", "2 Tsd". */
export function amountsIn(text: string): number[] {
  const out: number[] = []
  const re = /(\d{1,3}(?:[.,   ]\d{3})+|\d+)(?:([.,])(\d{1,2}))?(?!\d)\s*(k\b|tsd\.?|tausend)?/gi
  for (const m of text.matchAll(re)) {
    const whole = Number(m[1].replace(/[.,   ]/g, ''))
    let n = m[3] ? Number(`${whole}.${m[3]}`) : whole
    if (m[4]) n *= 1000
    if (Number.isFinite(n)) out.push(Math.round(n * 100) / 100)
  }
  return out
}
export const amountInText = (amount: number, text: string) => amountsIn(text).some(x => Math.abs(x - amount) < 0.005)

export function emailsIn(text: string): string[] {
  return [...text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(m => m[0].toLowerCase())
}
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** A calendar date the model or Marcel gave, checked. */
export function validDate(d: unknown): string | null {
  if (typeof d !== 'string' || !ISO.test(d)) return null
  const t = Date.parse(`${d}T12:00:00Z`)
  return Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== d ? null : d
}

export function addDaysIso(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
}

export function formatDate(iso: string, lang: Lang): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function money(amount: number, currency: string, lang: Lang): string {
  try { return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-GB', { style: 'currency', currency }).format(amount) } catch { return `${amount.toFixed(2)} ${currency}` }
}

export const str = (x: unknown, max = 300): string | undefined => {
  if (typeof x !== 'string') return undefined
  const s = x.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim()
  return s ? s.slice(0, max) : undefined
}
export const num = (x: unknown, max = 10_000_000): number | undefined =>
  typeof x === 'number' && Number.isFinite(x) && x > 0 && x <= max ? Math.round(x * 100) / 100 : typeof x === 'string' && x.trim() && Number.isFinite(Number(x.replace(',', '.'))) ? num(Number(x.replace(',', '.')), max) : undefined

/** "this client", "him", "ihn", "diesen Kunden" … — a reference to the record on screen. */
const DEICTIC = /^(this|that|the)\s+(client|customer|company|lead|person|one)$|^(him|her|them|it)$|^(dies(en|er|em|es)?|de[nrm])\s+(kunden?|firma|lead|person)$|^(ihn|ihm|sie|ihr|ihnen)$/i
export const refersToScreen = (ref: string | undefined) => !ref || DEICTIC.test(ref.trim())

export interface ClientLite { id: string; label: string; email: string | null; status: string; name: string; company: string | null }
const liteClient = (c: ClientRow & { status?: string }): ClientLite => ({ id: c.id, label: clientDisplayLabel(c), email: c.email, status: c.status ?? 'active', name: c.name, company: c.company })
export interface LeadLite { id: string; label: string; email: string | null; website: string | null; status: string }
const liteLead = (l: LeadRow): LeadLite => ({ id: l.id, label: leadLabel(l), email: l.email, website: (l as LeadRow & { website?: string | null }).website ?? null, status: l.status })

export async function clientById(g: GroundCtx, id: string): Promise<ClientLite | null> {
  if (!UUID.test(id)) return null
  const rows = await g.ctx.sql`SELECT * FROM os_clients WHERE id = ${id}::uuid` as (ClientRow & { status: string })[]
  return rows[0] ? liteClient(rows[0]) : null
}
export async function leadById(g: GroundCtx, id: string): Promise<LeadLite | null> {
  if (!UUID.test(id)) return null
  const rows = await g.ctx.sql`SELECT * FROM os_leads WHERE id = ${id}::uuid` as LeadRow[]
  return rows[0] ? liteLead(rows[0]) : null
}

type Resolved<T> = { found: T } | { choice: Choice } | { missing: string; warning?: string }

/** One client from a stored id, the screen, or a name. Archived clients are found and flagged. */
export async function resolveClient(g: GroundCtx, f: { client_id?: unknown; client?: unknown }): Promise<Resolved<ClientLite>> {
  const c = MAX_COPY[g.lang]
  if (typeof f.client_id === 'string') {
    const hit = await clientById(g, f.client_id)
    if (hit) return { found: hit }
  }
  const ref = str(f.client, 200)
  if (g.context.client && (refersToScreen(ref) || sameName(ref!, g.context.client.label))) {
    const hit = await clientById(g, g.context.client.id)
    if (hit) return { found: hit }
  }
  if (!ref) return { missing: 'client' }
  const hits = (await searchClients(g.ctx.sql, ref, 6)).map(liteClient)
  if (hits.length === 1) return { found: hits[0] }
  if (!hits.length) return { missing: 'client', warning: c.warn.client_not_found }
  return { choice: { field: 'client_id', prompt: c.choice.client, options: hits.map(h => ({ id: h.id, label: h.label, hint: [h.email, h.status === 'archived' ? c.value.archived : null].filter(Boolean).join(' · ') || undefined, href: `/os/clients/${h.id}` })) } }
}

export async function resolveLead(g: GroundCtx, f: { lead_id?: unknown; lead?: unknown }): Promise<Resolved<LeadLite>> {
  const c = MAX_COPY[g.lang]
  if (typeof f.lead_id === 'string') {
    const hit = await leadById(g, f.lead_id)
    if (hit) return { found: hit }
  }
  const ref = str(f.lead, 200)
  if (g.context.lead && (refersToScreen(ref) || sameName(ref!, g.context.lead.label))) {
    const hit = await leadById(g, g.context.lead.id)
    if (hit) return { found: hit }
  }
  if (!ref) return { missing: 'lead' }
  const hits = (await searchLeads(g.ctx.sql, ref, 6)).map(liteLead)
  if (hits.length === 1) return { found: hits[0] }
  if (!hits.length) return { missing: 'lead', warning: c.warn.lead_not_found }
  return { choice: { field: 'lead_id', prompt: c.choice.lead, options: hits.map(h => ({ id: h.id, label: h.label, hint: h.email ?? undefined })) } }
}

export type Party = { kind: 'client'; client: ClientLite } | { kind: 'lead'; lead: LeadLite }

/** A client OR a lead — for follow-ups, notes and emails. Choice ids are "client:<id>" / "lead:<id>". */
export async function resolveParty(g: GroundCtx, f: { party?: unknown; client_id?: unknown; lead_id?: unknown; client?: unknown; lead?: unknown }): Promise<Resolved<Party>> {
  const c = MAX_COPY[g.lang]
  if (typeof f.party === 'string') {
    const [kind, id] = f.party.split(':')
    if (kind === 'client') { const hit = await clientById(g, id); if (hit) return { found: { kind: 'client', client: hit } } }
    if (kind === 'lead') { const hit = await leadById(g, id); if (hit) return { found: { kind: 'lead', lead: hit } } }
  }
  if (typeof f.client_id === 'string') { const hit = await clientById(g, f.client_id); if (hit) return { found: { kind: 'client', client: hit } } }
  if (typeof f.lead_id === 'string') { const hit = await leadById(g, f.lead_id); if (hit) return { found: { kind: 'lead', lead: hit } } }
  const ref = str(f.client, 200) ?? str(f.lead, 200)
  if (refersToScreen(ref) || (ref && g.context.client && sameName(ref, g.context.client.label)) || (ref && g.context.lead && sameName(ref, g.context.lead.label))) {
    if (g.context.client && (!ref || refersToScreen(ref) || sameName(ref, g.context.client.label))) { const hit = await clientById(g, g.context.client.id); if (hit) return { found: { kind: 'client', client: hit } } }
    if (g.context.lead) { const hit = await leadById(g, g.context.lead.id); if (hit) return { found: { kind: 'lead', lead: hit } } }
  }
  if (!ref) return { missing: 'party' }
  const [clients, leads] = await Promise.all([searchClients(g.ctx.sql, ref, 5), searchLeads(g.ctx.sql, ref, 5)])
  /* A lead that became a client is the client. */
  const clientIds = new Set(clients.map(x => x.id))
  const openLeads = leads.filter(l => !(l.client_id && clientIds.has(l.client_id)))
  const all: Party[] = [...clients.map(x => ({ kind: 'client' as const, client: liteClient(x) })), ...openLeads.map(l => ({ kind: 'lead' as const, lead: liteLead(l) }))]
  if (all.length === 1) return { found: all[0] }
  if (!all.length) return { missing: 'party', warning: c.warn.party_not_found }
  return { choice: { field: 'party', prompt: c.choice.party, options: all.map(p => p.kind === 'client'
    ? { id: `client:${p.client.id}`, label: p.client.label, hint: `${c.row.client}${p.client.email ? ` · ${p.client.email}` : ''}` }
    : { id: `lead:${p.lead.id}`, label: p.lead.label, hint: `${c.row.lead}${p.lead.email ? ` · ${p.lead.email}` : ''}` }) } }
}
export const partyLabel = (p: Party) => (p.kind === 'client' ? p.client.label : p.lead.label)
export const partyEmail = (p: Party) => (p.kind === 'client' ? p.client.email : p.lead.email)

function fold(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}
/** "Urologie" names "Urologie Neuwied (Dr. X)": every word of the reference is in the label. */
export function sameName(ref: string, label: string): boolean {
  const words = fold(ref).split(' ').filter(w => w.length > 1)
  const hay = fold(label)
  return words.length > 0 && words.every(w => hay.includes(w))
}
