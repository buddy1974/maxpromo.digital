/**
 * lib/commercial/records.ts
 *
 * Finding a record from what a person said, without guessing, and writing the
 * commercial history that every capability shares.
 *
 * Resolution follows the client-matching law in lib/documents/client-match.ts:
 * one clear answer links, anything else is handed back as a short choice. A
 * phone message that says "Afro Beauty" when two leads carry that name gets
 * two buttons, not the more recent one.
 */

import { normaliseIdentity } from '@/lib/documents/client-match'
import { CapabilityRefusal, type CapabilityResult, type FocusRef, type Sql } from './types'
import { leadStage, STAGE_LABEL } from './pipeline'

/** Typed rows from a query, for use inside Promise.all. */
export async function q<T>(query: PromiseLike<unknown>): Promise<T[]> {
  return (await query) as T[]
}

export interface LeadRow {
  id: string
  created_at: string
  updated_at: string | null
  name: string | null
  email: string | null
  phone: string | null
  company: string | null
  website: string | null
  city: string | null
  business_type: string | null
  language: string | null
  service_interest: string | null
  source: string
  category: string | null
  summary: string | null
  status: string
  notes: string | null
  value: string | null
  currency: string
  next_action: string | null
  next_action_at: string | null
  last_interaction_at: string | null
  research: Record<string, unknown>
  client_id: string | null
  lost_reason: string | null
}

export interface ClientRow {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  postcode: string | null
  country: string
  notes: string | null
  status: string
  created_at: string
}

export function leadLabel(l: Pick<LeadRow, 'company' | 'name' | 'city'>): string {
  const who = l.company || l.name || 'Unnamed lead'
  return l.city ? `${who}, ${l.city}` : who
}

export function clientLabel(c: Pick<ClientRow, 'company' | 'name'>): string {
  return c.company ? `${c.company} (${c.name})` : c.name
}

export function stageText(status: string): string {
  const s = leadStage(status)
  return s ? STAGE_LABEL[s].en : status
}

/** "Name — Company", the convention every document's client_name uses. */
export function documentClientName(name: string | null | undefined, company: string | null | undefined): string {
  const n = (name ?? '').trim()
  const c = (company ?? '').trim()
  if (n && c && normaliseIdentity(n) !== normaliseIdentity(c)) return `${n} — ${c}`
  return c || n || 'Unbekannt'
}

/** `www.Example.de/path` → `example.de`. */
export function normaliseDomain(input: string | null | undefined): string {
  const raw = (input ?? '').trim().toLowerCase()
  if (!raw) return ''
  const host = raw.replace(/^[a-z]+:\/\//, '').split(/[/?#]/)[0]
  return host.replace(/^www\./, '')
}

/** Digits only, German national prefix folded to +49. */
export function normalisePhone(input: string | null | undefined): string {
  let d = (input ?? '').replace(/[^\d+]/g, '')
  if (d.startsWith('00')) d = `+${d.slice(2)}`
  if (d.startsWith('0')) d = `+49${d.slice(1)}`
  return d.replace(/\D/g, '')
}

export async function getLead(sql: Sql, id: string): Promise<LeadRow> {
  const rows = await sql`SELECT * FROM os_leads WHERE id = ${id}` as LeadRow[]
  if (!rows.length) throw new CapabilityRefusal('No lead with that id.', 'not_found')
  return rows[0]
}

export async function getClient(sql: Sql, id: string): Promise<ClientRow> {
  const rows = await sql`SELECT * FROM os_clients WHERE id = ${id}` as ClientRow[]
  if (!rows.length) throw new CapabilityRefusal('No client with that id.', 'not_found')
  return rows[0]
}

export interface Match {
  kind: 'lead' | 'client'
  id: string
  label: string
  basis: string
}

/**
 * Who a described business might already be. Exact identity only — email,
 * website domain, phone, or company name (folded) — and the basis is named so
 * the answer can be judged. A name similar to another is not a match.
 */
export async function findExisting(sql: Sql, d: {
  company?: string; name?: string; email?: string; phone?: string; website?: string; city?: string
}): Promise<Match[]> {
  const email = (d.email ?? '').trim().toLowerCase()
  const domain = normaliseDomain(d.website)
  const phone = normalisePhone(d.phone)
  const company = normaliseIdentity(d.company)
  const city = normaliseIdentity(d.city)

  const leads = await sql`
    SELECT id, name, company, email, phone, website, city FROM os_leads
    WHERE (${email} <> '' AND lower(email) = ${email})
       OR (${domain} <> '' AND lower(website) LIKE ${'%' + domain + '%'})
       OR (${phone} <> '' AND phone IS NOT NULL)
       OR (${company} <> '' AND company IS NOT NULL)
    LIMIT 500` as Pick<LeadRow, 'id' | 'name' | 'company' | 'email' | 'phone' | 'website' | 'city'>[]
  const clients = await sql`
    SELECT id, name, company, email, phone, city FROM os_clients
    WHERE (${email} <> '' AND lower(email) = ${email})
       OR (${phone} <> '' AND phone IS NOT NULL)
       OR (${company} <> '' AND company IS NOT NULL)
    LIMIT 500` as Pick<ClientRow, 'id' | 'name' | 'company' | 'email' | 'phone' | 'city'>[]

  const out: Match[] = []
  const judge = (r: { email?: string | null; phone?: string | null; company?: string | null; website?: string | null; city?: string | null }) => {
    const basis: string[] = []
    if (email && (r.email ?? '').toLowerCase() === email) basis.push('email')
    if (domain && r.website && normaliseDomain(r.website) === domain) basis.push('website')
    if (phone && r.phone && normalisePhone(r.phone) === phone) basis.push('phone')
    if (company && normaliseIdentity(r.company) === company) {
      /* A company name alone is a match only where the city does not
         contradict it — "Bella Italia" exists in every city. */
      const rc = normaliseIdentity(r.city)
      if (!city || !rc || rc === city) basis.push(city && rc ? 'company+city' : 'company')
    }
    return basis
  }
  for (const l of leads) {
    const b = judge(l)
    if (b.length) out.push({ kind: 'lead', id: l.id, label: leadLabel(l), basis: b.join('+') })
  }
  for (const c of clients) {
    const b = judge(c)
    if (b.length) out.push({ kind: 'client', id: c.id, label: clientLabel(c), basis: b.join('+') })
  }
  return out
}

/**
 * Resolve "that barber in Bochum" to one lead, or say why not. Searches the
 * fields a person would use, never notes or research text, so a lead that
 * merely mentions a word is not presented as the business itself.
 */
export async function searchLeads(sql: Sql, query: string, limit = 6): Promise<LeadRow[]> {
  const words = normaliseIdentity(query).split(' ').filter((w) => w.length > 1).slice(0, 5)
  if (!words.length) return []
  const rows = await sql`
    SELECT * FROM os_leads
    WHERE lower(coalesce(company,'') || ' ' || coalesce(name,'') || ' ' || coalesce(city,'') || ' ' ||
                coalesce(business_type,'') || ' ' || coalesce(email,'') || ' ' || coalesce(website,'') || ' ' ||
                coalesce(service_interest,''))
          LIKE ${'%' + words[0] + '%'}
    ORDER BY coalesce(last_interaction_at, created_at) DESC
    LIMIT 200` as LeadRow[]
  const hay = (l: LeadRow) => normaliseIdentity([l.company, l.name, l.city, l.business_type, l.email, l.website, l.service_interest].join(' '))
  return rows.filter((l) => words.every((w) => hay(l).includes(w))).slice(0, limit)
}

export async function searchClients(sql: Sql, query: string, limit = 6): Promise<ClientRow[]> {
  const words = normaliseIdentity(query).split(' ').filter((w) => w.length > 1).slice(0, 5)
  if (!words.length) return []
  const rows = await sql`
    SELECT * FROM os_clients
    WHERE lower(coalesce(company,'') || ' ' || name || ' ' || coalesce(city,'') || ' ' || coalesce(email,''))
          LIKE ${'%' + words[0] + '%'}
    ORDER BY created_at DESC LIMIT 200` as ClientRow[]
  const hay = (c: ClientRow) => normaliseIdentity([c.company, c.name, c.city, c.email].join(' '))
  return rows.filter((c) => words.every((w) => hay(c).includes(w))).slice(0, limit)
}

/** One lead from an id or a description, or a choice. */
export async function resolveLead(
  sql: Sql, ref: { lead_id?: string; query?: string },
): Promise<{ lead: LeadRow } | { result: CapabilityResult }> {
  if (ref.lead_id) return { lead: await getLead(sql, ref.lead_id) }
  if (!ref.query) throw new CapabilityRefusal('Which lead? Give a name or open one first.')
  const hits = await searchLeads(sql, ref.query)
  if (hits.length === 1) return { lead: hits[0] }
  if (hits.length === 0) {
    return { result: { summary: `No lead matches “${ref.query}”.`, next: [`Check ${ref.query}`, `Save ${ref.query} as a lead`] } }
  }
  return {
    result: {
      summary: `${hits.length} leads match “${ref.query}”. Which one?`,
      choices: hits.map((l) => ({ id: l.id, kind: 'lead' as const, label: `${leadLabel(l)} · ${stageText(l.status)}` })),
    },
  }
}

export async function resolveClient(
  sql: Sql, ref: { client_id?: string; query?: string },
): Promise<{ client: ClientRow } | { result: CapabilityResult }> {
  if (ref.client_id) return { client: await getClient(sql, ref.client_id) }
  if (!ref.query) throw new CapabilityRefusal('Which client?')
  const hits = await searchClients(sql, ref.query)
  if (hits.length === 1) return { client: hits[0] }
  if (hits.length === 0) return { result: { summary: `No client matches “${ref.query}”.` } }
  return {
    result: {
      summary: `${hits.length} clients match “${ref.query}”. Which one?`,
      choices: hits.map((c) => ({ id: c.id, kind: 'client' as const, label: clientLabel(c) })),
    },
  }
}

export interface ActivityInput {
  lead_id?: string | null
  client_id?: string | null
  job_id?: string | null
  angebot_id?: string | null
  invoice_id?: string | null
  kind: string
  channel?: string | null
  summary: string
  detail?: Record<string, unknown>
  actor: string
  external_ref?: string | null
}

export async function logActivity(sql: Sql, a: ActivityInput): Promise<string> {
  const rows = await sql`
    INSERT INTO os_activities (lead_id, client_id, job_id, angebot_id, invoice_id, kind, channel, summary, detail, actor, external_ref)
    VALUES (${a.lead_id ?? null}, ${a.client_id ?? null}, ${a.job_id ?? null}, ${a.angebot_id ?? null}, ${a.invoice_id ?? null},
            ${a.kind}, ${a.channel ?? null}, ${a.summary.slice(0, 500)}, ${JSON.stringify(a.detail ?? {})}::jsonb,
            ${a.actor}, ${a.external_ref ?? null})
    RETURNING id` as { id: string }[]
  return rows[0].id
}

/** Mark that something happened with a lead today; never moves a stage. */
export async function touchLead(sql: Sql, leadId: string): Promise<void> {
  await sql`UPDATE os_leads SET last_interaction_at = now(), updated_at = now() WHERE id = ${leadId}`
}

export function focus(kind: FocusRef['kind'], id: string, label: string): FocusRef {
  return { kind, id, label }
}

export function eur(amount: number | string | null | undefined, currency = 'EUR'): string {
  const n = Number(amount ?? 0)
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(Number.isFinite(n) ? n : 0)
}

/**
 * A DATE column as `YYYY-MM-DD`. The Neon driver returns DATE as a Date at
 * LOCAL midnight, so `toISOString()` moves it a day back anywhere east of
 * UTC. The calendar components are the stored date; read those.
 */
export { isoDate } from './money'

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
