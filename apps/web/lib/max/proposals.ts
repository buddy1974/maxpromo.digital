/**
 * lib/max/proposals.ts — the registry of what Universal Max may propose (ADR-0029). SERVER ONLY.
 *
 * Each entry maps ONE proposal type to the existing capability (or capabilities) it may run, its
 * confirmation policy, the fields Marcel may edit, and its grounding. Adding a capability to Max
 * means adding an entry here: register, ground, propose, govern, preview — never a new screen.
 *
 * Rules every entry keeps:
 *   - ids come from the verified screen context, a server-made choice, or a lookup — never the model;
 *   - amounts on money and commercial documents must be written in Marcel's own words (or typed by
 *     him in the edit form); a number only in a document or in the model's output is not used;
 *   - an email recipient comes from a record, the conversation, or Marcel's words; one found only in
 *     a document is shown as such and needs an explicit tick;
 *   - drafts only for anything that leaves the building: email, quotes, invoices, introductions;
 *   - tax is never computed here: invoices and quotes follow the document rules (§19 UStG, no VAT).
 */
import { runCapability } from '@/lib/commercial/engine'
import { findExisting } from '@/lib/commercial/records'
import { LEAD_STAGES } from '@/lib/commercial/pipeline'
import { invoiceBalance } from '@/lib/commercial/money'
import { loadInvoicesForMoney } from '@/lib/commercial/capabilities/documents'
import { websiteValidator } from '@/lib/commercial/capabilities/clients'
import { findClientMatches } from '@/lib/clients/match'
import { INJECTION } from '@/lib/leads/research'
import {
  isProposalType, type EditableField, type Fields, type GroundCtx, type Grounded, type ModelAction, type ProposalTypeDef, type ProposalTypeName,
} from './contract'
import { MAX_COPY } from './copy'
import {
  addDaysIso, amountInText, clientById, EMAIL, emailsIn, formatDate, money, num, partyEmail, partyLabel, resolveClient, resolveLead,
  resolveParty, str, UUID, validDate, type ClientLite, type Party,
} from './ground'

/* ── shared ─────────────────────────────────────────────────────────────── */

const IDENTITY = ['name', 'company', 'email', 'phone', 'website', 'address', 'postcode', 'city', 'country', 'notes'] as const
type IdentityKey = typeof IDENTITY[number]

const warnings = (f: Fields): string[] => (Array.isArray(f._warn) ? f._warn.filter((w): w is string => typeof w === 'string') : [])
const T = (g: GroundCtx) => MAX_COPY[g.lang]

function skeleton(g: GroundCtx, type: ProposalTypeName, capability: string, f: Fields): Grounded {
  return { state: 'ready', capability, title: T(g).type[type], rows: [], warnings: warnings(f).map(w => T(g).warn[w] ?? w), missing: [], editable: [] }
}
function field(g: GroundCtx, key: string, kind: EditableField['kind'], value: unknown, label?: string): EditableField {
  const rows = T(g).row as Record<string, string>
  return { key, kind, label: label ?? rows[key] ?? key, value: value === undefined || value === null ? '' : String(value) }
}
/** Finish a grounding: missing fields or a pending choice mean nothing can run yet. */
function settle(g: Grounded, input: Record<string, unknown> | null): Grounded {
  if (g.state === 'blocked') return { ...g, input: undefined }
  if (g.missing.length || g.choice || !input) return { ...g, state: 'needs_input', input: undefined }
  return { ...g, state: 'ready', input }
}
function apply<T>(g: Grounded, r: { found: T } | { choice: Grounded['choice'] } | { missing: string; warning?: string }): T | null {
  if ('found' in r) return r.found
  if ('choice' in r) { g.choice = r.choice; return null }
  g.missing.push(r.missing)
  if (r.warning) g.warnings.push(r.warning)
  return null
}

/**
 * A contact channel (email, phone, website) is kept only when it is in Marcel's words, a text
 * document, or the client extraction of an attached file — a model never invents one.
 */
function channelOk(g: GroundCtx, kind: 'email' | 'phone' | 'website', value: string): boolean {
  const sources = [g.ownerText, g.documentText ?? '', g.extraction ? Object.values(g.extraction.fields).join(' ') : ''].join('\n').toLowerCase()
  if (kind === 'email') return sources.includes(value.toLowerCase())
  if (kind === 'phone') { const d = value.replace(/\D/g, '').replace(/^49/, '').replace(/^0/, ''); return d.length >= 4 && sources.replace(/\D/g, '').includes(d) }
  try { return sources.includes(new URL(/^https?:/i.test(value) ? value : `https://${value}`).hostname.replace(/^www\./, '')) } catch { return false }
}
function identityFrom(a: ModelAction, g: GroundCtx, warn: string[]): Partial<Record<IdentityKey, string>> {
  const out: Partial<Record<IdentityKey, string>> = {}
  for (const k of IDENTITY) {
    const val = str(k === 'notes' ? a.note : (a as unknown as Record<string, unknown>)[k], k === 'notes' ? 1000 : 300)
    if (!val) continue
    if ((k === 'email' || k === 'phone' || k === 'website') && !channelOk(g, k, val)) { if (k === 'email') warn.push('recipient_dropped'); continue }
    out[k] = val
  }
  return out
}
/** An amount the model reported, kept only when Marcel wrote it. */
function ownAmount(a: ModelAction, g: GroundCtx, warn: string[]): number | undefined {
  const n = num(a.amount)
  if (n === undefined) return undefined
  if (amountInText(n, g.ownerText)) return n
  warn.push('amount_not_in_text')
  return undefined
}
function ownItems(a: ModelAction, g: GroundCtx, warn: string[]): { description: string; amount: number }[] | undefined {
  if (!Array.isArray(a.items) || !a.items.length) return undefined
  const items: { description: string; amount: number }[] = []
  for (const i of a.items.slice(0, 20)) {
    const d = str(i?.description, 300), n = num(i?.amount)
    if (!d) continue
    if (n === undefined || !amountInText(n, g.ownerText)) { warn.push('amount_not_in_text'); return undefined }
    items.push({ description: d, amount: n })
  }
  return items.length ? items : undefined
}
const lang = (x: unknown) => (x === 'de' || x === 'en' ? x : undefined)
const contextIds = (g: GroundCtx) => ({
  ...(g.context.client ? { client_id: g.context.client.id } : {}),
  ...(g.context.lead ? { lead_id: g.context.lead.id } : {}),
})
/** Prefer what the screen shows only when Marcel names nobody else. */
const screenFirst = (g: GroundCtx, ref: string | undefined) => (!ref ? contextIds(g) : {})

/* ── clients ─────────────────────────────────────────────────────────────── */

const clientCreate: ProposalTypeDef = {
  type: 'CLIENT_CREATE', capabilities: ['client.create'], confirmation: 'confirm',
  editable: ['name', 'company', 'email', 'phone', 'website', 'address', 'postcode', 'city', 'country', 'notes'],
  fromModel(a, g) {
    const warn: string[] = []
    const fields: Fields = { ...identityFrom(a, g, warn) }
    /* A document's contact comes from the one extraction contract (lib/clients/extract). Marcel's
       own words override it field by field. */
    if (g.extraction) {
      for (const k of IDENTITY) if (!fields[k] && g.extraction.fields[k]) fields[k] = g.extraction.fields[k]
      if (g.extraction.fields.language) fields.language = g.extraction.fields.language
      if (g.extraction.warnings.includes('instructions_in_document')) warn.push('instructions_in_document')
      if (g.extraction.warnings.includes('no_identity')) warn.push('no_contact_found')
      else if (g.extraction.confidence === 'low') warn.push('low_confidence')
      fields.from_document = true
    }
    return { ...fields, _warn: [...new Set(warn)] }
  },
  async ground(g, f) {
    const out = skeleton(g, 'CLIENT_CREATE', 'client.create', f)
    const c = T(g)
    const id: Record<string, string> = {}
    for (const k of IDENTITY) { const s = str(f[k], k === 'notes' ? 1000 : 300); if (s) id[k] = s }
    if (id.email && !EMAIL.test(id.email)) { delete id.email; out.warnings.push(c.warn.recipient_dropped) }
    if (id.website) { try { id.website = websiteValidator().parse(id.website, 'website') } catch { delete id.website } }
    const name = id.name ?? id.company
    if (!name) out.missing.push('name')
    for (const k of IDENTITY) if (id[k]) out.rows.push({ label: c.row[k], value: id[k] })
    if (f.from_document) out.rows.push({ label: c.row.document, value: c.value.fromDocument, tone: 'muted' })
    out.editable = clientCreate.editable.map(k => field(g, k, k === 'notes' ? 'textarea' : k === 'email' ? 'email' : 'text', id[k]))
    const confirmed = Array.isArray(f.confirmed_distinct_from) ? f.confirmed_distinct_from.filter((x): x is string => typeof x === 'string' && UUID.test(x)) : []
    if (name) {
      const matches = await findClientMatches(g.ctx.sql, { ...id, name: id.name ?? '' })
      const open = matches.candidates.filter(m => !confirmed.includes(m.id))
      if (open.length) {
        out.warnings.push(c.warn.duplicates)
        out.choice = { field: 'distinct', prompt: c.choice.distinct, allowNone: c.choice.createAnyway,
          options: open.map(m => ({ id: m.id, label: m.label, hint: `${m.level} · ${m.reasons.join(' + ')}${m.archived ? ` · ${c.value.archived}` : ''}`, href: `/os/clients/${m.id}` })) }
      }
    }
    return settle(out, name ? { name, ...id, ...(id.name ? {} : { name }), source: 'max', ...(confirmed.length ? { confirmed_distinct_from: confirmed } : {}) } : null)
  },
}

const clientUpdate: ProposalTypeDef = {
  type: 'CLIENT_UPDATE', capabilities: ['client.update'], confirmation: 'confirm',
  editable: ['name', 'company', 'email', 'phone', 'website', 'address', 'postcode', 'city', 'country', 'notes'],
  fromModel(a, g) {
    const warn: string[] = []
    const set = identityFrom(a, g, warn)
    const clear = (Array.isArray(a.clear) ? a.clear : []).filter((k): k is IdentityKey => (IDENTITY as readonly string[]).includes(k) && k !== 'name' && k !== 'country' && !(k in set))
    if (Array.isArray(a.clear) && a.clear.includes('country')) warn.push('country_clear')
    return { client: str(a.client, 200), ...screenFirst(g, str(a.client)), set, clear, _warn: warn }
  },
  async ground(g, f) {
    const out = skeleton(g, 'CLIENT_UPDATE', 'client.update', f)
    const c = T(g)
    const client = apply(out, await resolveClient(g, f))
    const set = (f.set && typeof f.set === 'object' ? f.set : {}) as Record<string, unknown>
    const clear = Array.isArray(f.clear) ? f.clear.filter((k): k is IdentityKey => (IDENTITY as readonly string[]).includes(k as string)) : []
    out.editable = clientUpdate.editable.map(k => field(g, `set.${k}`, k === 'notes' ? 'textarea' : k === 'email' ? 'email' : 'text', set[k], (c.row as Record<string, string>)[k]))
    if (!client) return settle(out, null)
    const rows = await g.ctx.sql`SELECT * FROM os_clients WHERE id = ${client.id}::uuid` as Record<string, string | null>[]
    const before = rows[0] ?? {}
    out.rows.push({ label: c.row.client, value: client.label })
    if (client.status === 'archived') out.warnings.push(c.warn.archived_client)
    const input: Record<string, unknown> = { client_id: client.id }
    for (const k of IDENTITY) {
      let val = str(set[k], k === 'notes' ? 4000 : 300)
      if (k === 'website' && val) { try { val = websiteValidator().parse(val, 'website') } catch { val = undefined } }
      if (k === 'email' && val && !EMAIL.test(val)) val = undefined
      if (val && val !== (before[k] ?? '')) { input[k] = val; out.rows.push({ label: c.row[k], before: before[k] || c.value.none, value: val }) }
    }
    for (const k of clear) if (before[k]) { input[k] = null; out.rows.push({ label: c.row[k], before: before[k]!, value: c.value.cleared, tone: 'warn' }) }
    if (Object.keys(input).length === 1) { out.state = 'blocked'; out.warnings.push(c.warn.no_changes) }
    out.links = [{ label: client.label, href: `/os/clients/${client.id}` }]
    return settle(out, input)
  },
}

function lifecycle(type: 'CLIENT_ARCHIVE' | 'CLIENT_RESTORE'): ProposalTypeDef {
  const capability = type === 'CLIENT_ARCHIVE' ? 'client.archive' : 'client.restore'
  return {
    type, capabilities: [capability], confirmation: 'confirm', editable: [],
    fromModel(a, g) { return { client: str(a.client, 200), ...screenFirst(g, str(a.client)) } },
    async ground(g, f) {
      const out = skeleton(g, type, capability, f)
      const c = T(g)
      const client = apply(out, await resolveClient(g, f))
      if (!client) return settle(out, null)
      out.rows.push({ label: c.row.client, value: client.label }, { label: c.row.status, before: client.status === 'archived' ? c.value.archived : c.value.active, value: type === 'CLIENT_ARCHIVE' ? c.value.archived : c.value.active })
      if (type === 'CLIENT_ARCHIVE' && client.status === 'archived') { out.state = 'blocked'; out.warnings.push(c.warn.already_archived) }
      if (type === 'CLIENT_RESTORE' && client.status !== 'archived') { out.state = 'blocked'; out.warnings.push(c.warn.not_archived) }
      out.links = [{ label: client.label, href: `/os/clients/${client.id}` }]
      return settle(out, { client_id: client.id })
    },
  }
}

const clientNote: ProposalTypeDef = {
  type: 'CLIENT_NOTE', capabilities: ['note.add'], confirmation: 'confirm', editable: ['note'],
  fromModel(a, g) { return { client: str(a.client, 200), lead: str(a.lead, 200), ...screenFirst(g, str(a.client) ?? str(a.lead)), note: str(a.note, 4000) } },
  async ground(g, f) {
    const out = skeleton(g, 'CLIENT_NOTE', 'note.add', f)
    const c = T(g)
    const party = apply(out, await resolveParty(g, f))
    const note = str(f.note, 4000)
    if (!note) out.missing.push('note')
    out.editable = [field(g, 'note', 'textarea', note)]
    if (party) out.rows.push({ label: party.kind === 'client' ? c.row.client : c.row.lead, value: partyLabel(party) })
    if (note) out.body = { label: c.row.note, text: note }
    return settle(out, party && note ? { ...(party.kind === 'client' ? { client_id: party.client.id } : { lead_id: party.lead.id }), text: note } : null)
  },
}

/* ── leads ───────────────────────────────────────────────────────────────── */

const leadCreate: ProposalTypeDef = {
  type: 'LEAD_CREATE', capabilities: ['lead.create'], confirmation: 'confirm',
  editable: ['company', 'name', 'email', 'phone', 'website', 'city', 'service_interest', 'summary'],
  fromModel(a, g) {
    const warn: string[] = []
    const id = identityFrom(a, g, warn)
    if (g.extraction) {
      for (const k of ['company', 'name', 'email', 'phone', 'website', 'city'] as const) if (!id[k] && g.extraction.fields[k]) id[k] = g.extraction.fields[k]
      if (g.extraction.warnings.includes('instructions_in_document')) warn.push('instructions_in_document')
    }
    return { ...id, company: id.company ?? id.name, service_interest: str(a.description, 300), summary: str(a.note, 1000), _warn: [...new Set(warn)] }
  },
  async ground(g, f) {
    const out = skeleton(g, 'LEAD_CREATE', 'lead.create', f)
    const c = T(g)
    const d: Record<string, string> = {}
    for (const k of ['company', 'name', 'email', 'phone', 'website', 'city', 'service_interest', 'summary']) { const s = str(f[k], k === 'summary' ? 1000 : 300); if (s) d[k] = s }
    if (d.email && !EMAIL.test(d.email)) delete d.email
    if (d.website) { try { d.website = websiteValidator().parse(d.website, 'website') } catch { delete d.website } }
    if (!d.company) out.missing.push('company')
    const rowLabel: Record<string, string> = { ...c.row, service_interest: c.row.instruction, summary: c.row.notes }
    for (const [k, val] of Object.entries(d)) out.rows.push({ label: rowLabel[k] ?? k, value: val })
    out.editable = leadCreate.editable.map(k => field(g, k, k === 'summary' ? 'textarea' : k === 'email' ? 'email' : 'text', d[k], rowLabel[k]))
    const confirmed = Array.isArray(f.confirmed_distinct_from) ? f.confirmed_distinct_from.filter((x): x is string => typeof x === 'string' && UUID.test(x)) : []
    if (d.company) {
      const open = (await findExisting(g.ctx.sql, d)).filter(m => !confirmed.includes(m.id))
      if (open.length) {
        out.warnings.push(c.warn.lead_duplicates)
        out.choice = { field: 'distinct', prompt: c.choice.distinct, allowNone: c.choice.leadAnyway,
          options: open.map(m => ({ id: m.id, label: m.label, hint: `${m.kind === 'client' ? c.row.client : c.row.lead} · ${m.basis}`, href: m.kind === 'client' ? `/os/clients/${m.id}` : '/os/leads' })) }
      }
    }
    return settle(out, d.company ? { ...d, source: 'max', ...(confirmed.length ? { confirmed_distinct_from: confirmed } : {}) } : null)
  },
}

const STAGES = LEAD_STAGES.filter(s => s !== 'won')
const leadUpdate: ProposalTypeDef = {
  type: 'LEAD_UPDATE', capabilities: ['lead.update'], confirmation: 'confirm', editable: ['next_action', 'next_action_at', 'service_interest'],
  fromModel(a, g) {
    const warn: string[] = []
    const stage = str(a.stage, 40)
    if (stage === 'won') warn.push('stage_won')
    return {
      lead: str(a.lead, 200) ?? str(a.client, 200), ...(g.context.lead && !str(a.lead) ? { lead_id: g.context.lead.id } : {}),
      stage: stage && (STAGES as readonly string[]).includes(stage) ? stage : undefined,
      value: num(a.value) !== undefined && amountInText(num(a.value)!, g.ownerText) ? num(a.value) : undefined,
      next_action: str(a.next_action, 300), next_action_at: validDate(a.date) ?? undefined, service_interest: str(a.description, 300),
      ...identityFrom({ ...a, company: undefined, name: undefined, address: undefined, postcode: undefined, country: undefined, note: undefined } as ModelAction, g, warn),
      _warn: warn,
    }
  },
  async ground(g, f) {
    const out = skeleton(g, 'LEAD_UPDATE', 'lead.update', f)
    const c = T(g)
    const lead = apply(out, await resolveLead(g, f))
    out.editable = [field(g, 'next_action', 'text', f.next_action, c.row.nextAction), field(g, 'next_action_at', 'date', f.next_action_at, c.row.date), field(g, 'service_interest', 'text', f.service_interest, c.row.instruction)]
    if (!lead) return settle(out, null)
    out.rows.push({ label: c.row.lead, value: lead.label })
    const input: Record<string, unknown> = { lead_id: lead.id }
    if (typeof f.stage === 'string' && (STAGES as readonly string[]).includes(f.stage)) { input.stage = f.stage; out.rows.push({ label: c.row.stage, before: lead.status, value: f.stage }) }
    if (num(f.value) !== undefined) { input.value = num(f.value); out.rows.push({ label: c.row.value, value: money(num(f.value)!, 'EUR', g.lang) }) }
    for (const [k, label] of [['next_action', c.row.nextAction], ['service_interest', c.row.instruction], ['email', c.row.email], ['phone', c.row.phone], ['website', c.row.website], ['city', c.row.city]] as const) {
      const s = str(f[k], 300)
      if (s && !(k === 'email' && !EMAIL.test(s))) { input[k] = s; out.rows.push({ label, value: s }) }
    }
    const at = validDate(f.next_action_at)
    if (at) { input.next_action_at = at; out.rows.push({ label: c.row.date, value: formatDate(at, g.lang) }) }
    if (Object.keys(input).length === 1) { out.state = 'blocked'; out.warnings.push(c.warn.no_changes) }
    return settle(out, input)
  },
}

const leadResearch: ProposalTypeDef = {
  type: 'LEAD_RESEARCH', capabilities: ['lead.research'], confirmation: 'confirm', editable: [],
  fromModel(a, g) { return { lead: str(a.lead, 200) ?? str(a.company, 200) ?? str(a.client, 200), ...(g.context.lead && !str(a.lead) ? { lead_id: g.context.lead.id } : {}) } },
  async ground(g, f) {
    const out = skeleton(g, 'LEAD_RESEARCH', 'lead.research', f)
    const c = T(g)
    const lead = apply(out, await resolveLead(g, f))
    if (!lead) return settle(out, null)
    out.rows.push({ label: c.row.lead, value: lead.label }, { label: c.row.website, value: lead.website ?? c.value.none }, { label: c.row.channel, value: c.value.website, tone: 'muted' })
    if (!lead.website) { out.state = 'blocked'; out.warnings.push(c.warn.no_lead_website) }
    return settle(out, { lead_id: lead.id })
  },
}

const leadOutreach: ProposalTypeDef = {
  type: 'LEAD_OUTREACH_DRAFT', capabilities: ['outreach.draft'], confirmation: 'confirm', editable: ['instruction'],
  fromModel(a, g) { return { lead: str(a.lead, 200) ?? str(a.company, 200), ...(g.context.lead && !str(a.lead) ? { lead_id: g.context.lead.id } : {}), instruction: str(a.instruction, 600), language: lang(a.language) } },
  async ground(g, f) {
    const out = skeleton(g, 'LEAD_OUTREACH_DRAFT', 'outreach.draft', f)
    const c = T(g)
    const lead = apply(out, await resolveLead(g, f))
    const instruction = str(f.instruction, 600)
    out.editable = [field(g, 'instruction', 'textarea', instruction)]
    if (!lead) return settle(out, null)
    out.rows.push({ label: c.row.lead, value: lead.label }, { label: c.row.channel, value: c.value.emailOnly }, { label: c.row.status, value: c.value.draftOnly, tone: 'muted' })
    if (instruction) out.rows.push({ label: c.row.instruction, value: instruction })
    return settle(out, { lead_id: lead.id, channel: 'email', ...(instruction ? { instruction } : {}), ...(lang(f.language) ? { language: lang(f.language) } : {}) })
  },
}

/* ── email ───────────────────────────────────────────────────────────────── */

interface ThreadRow { id: string; subject: string; trashed: boolean; quarantine: string | null }
async function threadsById(g: GroundCtx, ids: string[]): Promise<ThreadRow[]> {
  const ok = ids.filter(id => UUID.test(id)).slice(0, 100)
  if (!ok.length) return []
  return await g.ctx.sql`SELECT id::text, subject, trashed, quarantine FROM mail.threads WHERE id = ANY(${ok}::uuid[])` as ThreadRow[]
}

async function writeText(g: GroundCtx, input: Record<string, unknown>): Promise<{ text: string; subject?: string; previewOnly?: boolean } | null> {
  const r = await runCapability(g.ctx.sql, { requestId: `max:assist:${crypto.randomUUID()}`, actor: g.ctx.actor, channel: g.ctx.channel, capability: 'email.assist', input })
  if (r.status !== 'done') return null
  const d = r.result.data as { text?: string; subject?: string; previewOnly?: boolean } | undefined
  return d?.text ? { text: d.text, subject: d.subject, previewOnly: d.previewOnly } : null
}

const emailReply: ProposalTypeDef = {
  type: 'EMAIL_REPLY_DRAFT', capabilities: ['email.compose'], confirmation: 'confirm', editable: ['subject', 'body'],
  fromModel(a, g) {
    return {
      ...(g.context.thread ? { thread_id: g.context.thread.id } : {}),
      client: str(a.client, 200), lead: str(a.lead, 200), instruction: str(a.instruction, 600) ?? str(g.ownerText, 600), language: lang(a.language) ?? g.lang,
    }
  },
  async ground(g, f) {
    const out = skeleton(g, 'EMAIL_REPLY_DRAFT', 'email.compose', f)
    const c = T(g)
    let threadId = typeof f.thread_id === 'string' && UUID.test(f.thread_id) ? f.thread_id : null
    if (!threadId) {
      /* No conversation on screen: the person's own recent conversations, never a guess. */
      const party = apply(out, await resolveParty(g, f))
      if (party) {
        const email = partyEmail(party)
        const id = party.kind === 'client' ? party.client.id : party.lead.id
        const rows = await g.ctx.sql`SELECT t.id::text, t.subject FROM mail.threads t WHERE t.quarantine IS NULL AND t.trashed = false AND (
            EXISTS(SELECT 1 FROM mail.business_links b WHERE b.thread_id = t.id AND b.entity_id = ${id} AND b.match_status = 'owner_confirmed')
            OR (${email}::text IS NOT NULL AND EXISTS(SELECT 1 FROM mail.messages m WHERE m.thread_id = t.id AND m.direction = 'inbound' AND lower(m.sender) = lower(${email ?? ''}))))
          ORDER BY t.updated_at DESC LIMIT 5` as { id: string; subject: string }[]
        if (rows.length === 1) threadId = rows[0].id
        else if (rows.length > 1) out.choice = { field: 'thread_id', prompt: c.choice.thread, options: rows.map(r => ({ id: r.id, label: r.subject || '—', href: `/os/inbox?thread=${r.id}` })) }
        else { out.state = 'blocked'; out.warnings.push(c.warn.no_thread) }
      } else if (!out.choice) { out.missing = out.missing.filter(m => m !== 'party'); out.state = 'blocked'; out.warnings.push(c.warn.no_thread) }
    }
    out.editable = [field(g, 'subject', 'text', f.subject, c.row.subject), field(g, 'body', 'textarea', f.body, c.row.message)]
    if (!threadId) return settle(out, null)
    const [t] = await threadsById(g, [threadId])
    if (!t) { out.state = 'blocked'; out.warnings.push(c.warn.no_thread); return settle(out, null) }
    if (t.quarantine) { out.state = 'blocked'; out.warnings.push(c.warn.quarantined); return settle(out, null) }
    const [last] = await g.ctx.sql`SELECT id::text, sender FROM mail.messages WHERE thread_id = ${t.id}::uuid AND direction = 'inbound' ORDER BY received_at DESC LIMIT 1` as { id: string; sender: string }[]
    if (!last || !EMAIL.test(last.sender ?? '')) { out.state = 'blocked'; out.warnings.push(c.warn.no_thread); return settle(out, null) }
    let body = str(f.body, 20000)
    if (!body && !f._generated) {
      const written = await writeText(g, { mode: 'draft_reply', thread_id: t.id, language: f.language === 'en' ? 'en' : 'de', ...(str(f.instruction, 600) ? { instruction: str(f.instruction, 600) } : {}) })
      f._generated = true
      if (written) { body = written.text; f.body = body; if (written.previewOnly) out.warnings.push(c.warn.preview_only) } else out.warnings.push(c.warn.draft_failed)
    }
    const subject = str(f.subject, 300) ?? (/^(re|aw):/i.test(t.subject) ? t.subject : `Re: ${t.subject}`)
    out.editable = [field(g, 'subject', 'text', subject, c.row.subject), field(g, 'body', 'textarea', body, c.row.message)]
    out.rows.push({ label: c.row.conversation, value: t.subject || '—' }, { label: c.row.to, value: last.sender }, { label: c.row.recipientSource, value: c.value.fromConversation, tone: 'muted' }, { label: c.row.subject, value: subject }, { label: c.row.status, value: c.value.draftOnly, tone: 'muted' })
    if (body) out.body = { label: c.row.message, text: body }
    else out.missing.push('body')
    out.links = [{ label: c.row.conversation, href: `/os/inbox?thread=${t.id}` }]
    return settle(out, body ? { thread_id: t.id, mode: 'reply', source_message_id: last.id, to: [last.sender.toLowerCase()], subject, body, family: 'reply', language: f.language === 'en' ? 'en' : 'de' } : null)
  },
}

const emailDraft: ProposalTypeDef = {
  type: 'EMAIL_DRAFT', capabilities: ['email.compose'], confirmation: 'confirm', editable: ['to', 'subject', 'body'],
  fromModel(a, g) {
    const warn: string[] = []
    let to: string | undefined, trust: string | undefined
    const r = str(a.recipient_email, 254)?.toLowerCase()
    if (r && EMAIL.test(r)) {
      if (emailsIn(g.ownerText).includes(r)) { to = r; trust = 'owner' }
      else if (emailsIn(g.documentText ?? '').includes(r) || g.extraction?.fields.email === r) { to = r; trust = 'document'; warn.push('recipient_from_document') }
      else warn.push('recipient_dropped')
    }
    return { client: str(a.client, 200), lead: str(a.lead, 200), ...(to ? {} : screenFirst(g, str(a.client) ?? str(a.lead))), to, to_trust: trust, subject: str(a.subject, 300), instruction: str(a.instruction, 600) ?? str(g.ownerText, 600), language: lang(a.language) ?? g.lang, _warn: warn }
  },
  async ground(g, f) {
    const out = skeleton(g, 'EMAIL_DRAFT', 'email.compose', f)
    const c = T(g)
    let to = typeof f.to === 'string' && EMAIL.test(f.to) ? f.to.toLowerCase() : null
    let trust = typeof f.to_trust === 'string' ? f.to_trust : null
    let party: Party | null = null
    if (f.client || f.lead || f.client_id || f.lead_id || f.party) {
      const r = await resolveParty(g, f)
      if ('found' in r) party = r.found
      else if (!to) apply(out, r)
    }
    if (!to && party) {
      to = partyEmail(party)
      trust = party.kind === 'client' ? 'record' : 'lead'
      if (!to) out.warnings.push(c.warn.no_email_on_record)
    }
    if (!to && !out.choice) out.missing.push('to')
    let body = str(f.body, 20000)
    let subject = str(f.subject, 300)
    if (!body && !f._generated && (to || party)) {
      const facts = party ? `Recipient: ${partyLabel(party)} (${party.kind}).` : to ? `Recipient: ${to}.` : ''
      const written = await writeText(g, { mode: 'compose', instruction: str(f.instruction, 600) ?? '', text: facts || undefined, language: f.language === 'en' ? 'en' : 'de' })
      f._generated = true
      if (written) { body = written.text; f.body = body; if (!subject && written.subject) { subject = str(written.subject, 300); f.subject = subject } } else out.warnings.push(c.warn.draft_failed)
    }
    if (!body) out.missing.push('body')
    if (!subject) out.missing.push('subject')
    out.editable = [field(g, 'to', 'email', to, c.row.to), field(g, 'subject', 'text', subject, c.row.subject), field(g, 'body', 'textarea', body, c.row.message)]
    if (party) out.rows.push({ label: party.kind === 'client' ? c.row.client : c.row.lead, value: partyLabel(party) })
    if (to) out.rows.push({ label: c.row.to, value: to, tone: trust === 'document' ? 'warn' : undefined }, { label: c.row.recipientSource, value: trust === 'record' ? c.value.fromRecord : trust === 'lead' ? c.value.fromLead : trust === 'document' ? c.value.fromDocument : c.value.fromOwner, tone: 'muted' })
    if (subject) out.rows.push({ label: c.row.subject, value: subject })
    out.rows.push({ label: c.row.status, value: c.value.draftOnly, tone: 'muted' })
    if (body) out.body = { label: c.row.message, text: body }
    if (trust === 'document' && f.recipient_confirmed !== true) out.tick = { key: 'recipient_confirmed', label: c.tick.recipient }
    const entity = party ? { entity_kind: party.kind, entity_id: party.kind === 'client' ? party.client.id : party.lead.id } : {}
    const ready = to && body && subject && !(trust === 'document' && f.recipient_confirmed !== true)
    return settle(out, ready ? { mode: 'new', to: [to], subject, body, family: 'reply', language: f.language === 'en' ? 'en' : 'de', ...entity } : null)
  },
}

function trashType(type: 'EMAIL_TRASH' | 'EMAIL_RESTORE'): ProposalTypeDef {
  const action = type === 'EMAIL_TRASH' ? 'trash' : 'restore'
  return {
    type, capabilities: [type === 'EMAIL_TRASH' ? 'email.trash' : 'email.restore', 'email.bulk'], confirmation: 'confirm', editable: [],
    fromModel(a, g) {
      const ids = a.use_selection !== false && g.context.selection?.ids.length ? g.context.selection.ids : g.context.thread ? [g.context.thread.id] : []
      return { thread_ids: ids }
    },
    async ground(g, f) {
      const c = T(g)
      const out = skeleton(g, type, type === 'EMAIL_TRASH' ? 'email.trash' : 'email.restore', f)
      const threads = await threadsById(g, Array.isArray(f.thread_ids) ? f.thread_ids.filter((x): x is string => typeof x === 'string') : [])
      const usable = threads.filter(t => (action === 'trash' ? !t.trashed : t.trashed))
      if (!threads.length) { out.state = 'blocked'; out.warnings.push(c.warn.no_thread); return settle(out, null) }
      if (!usable.length) { out.state = 'blocked'; out.warnings.push(c.warn.nothing_selected); return settle(out, null) }
      out.rows.push({ label: usable.length === 1 ? c.row.conversation : c.row.conversations, value: usable.length === 1 ? usable[0].subject || '—' : `${usable.length}: ${usable.slice(0, 3).map(t => t.subject || '—').join(' · ')}${usable.length > 3 ? ' …' : ''}` })
      if (usable.length === 1) return settle(out, { thread_id: usable[0].id })
      out.capability = 'email.bulk'
      return settle(out, { thread_ids: usable.map(t => t.id), action })
    },
  }
}

/* ── invoices, quotes, money ─────────────────────────────────────────────── */

const invoiceDraft: ProposalTypeDef = {
  type: 'INVOICE_DRAFT', capabilities: ['invoice.create'], confirmation: 'confirm', editable: ['description', 'amount', 'due_date'],
  fromModel(a, g) {
    const warn: string[] = []
    const items = ownItems(a, g, warn)
    const amount = items ? undefined : ownAmount(a, g, warn)
    const percent = num(a.percent, 100)
    const currency = str(a.currency, 3)?.toUpperCase()
    return { client: str(a.client, 200), ...screenFirst(g, str(a.client)), items, amount, percent: percent && amountInText(percent, g.ownerText) ? percent : undefined, description: str(a.description, 300), currency, due_date: validDate(a.date) ?? undefined, _warn: [...new Set(warn)] }
  },
  async ground(g, f) {
    const out = skeleton(g, 'INVOICE_DRAFT', 'invoice.create', f)
    const c = T(g)
    const client = apply(out, await resolveClient(g, f))
    if (f.currency && f.currency !== 'EUR') { out.state = 'blocked'; out.warnings.push(c.warn.currency_unsupported) }
    const amount = num(f.amount), percent = num(f.percent, 100), description = str(f.description, 300)
    out.editable = [field(g, 'description', 'text', description, c.row.items), field(g, 'amount', 'amount', amount, c.row.amount), field(g, 'due_date', 'date', f.due_date, c.row.due)]
    let items = Array.isArray(f.items) ? (f.items as { description: string; amount: number }[]) : null
    let input: Record<string, unknown> | null = null
    if (client) {
      out.rows.push({ label: c.row.client, value: client.label })
      if (client.status === 'archived') out.warnings.push(c.warn.archived_client)
      /* "50 % upfront" on an accepted quote is that quote's deposit invoice — the existing rule. */
      if (percent && !items) {
        const accepted = await g.ctx.sql`SELECT a.id::text, a.angebot_number, a.total::float8 AS total FROM os_angebote a WHERE a.client_id = ${client.id}::uuid AND a.status = 'accepted'
          AND NOT EXISTS (SELECT 1 FROM os_invoices i WHERE i.angebot_id = a.id AND i.kind = 'deposit') ORDER BY a.accepted_at DESC NULLS LAST` as { id: string; angebot_number: string; total: number }[]
        const match = accepted.filter(a => !amount || Math.abs(a.total - amount) < 0.01)
        if (match.length === 1) {
          out.rows.push({ label: c.row.items, value: `${g.lang === 'de' ? 'Anzahlung' : 'Deposit'} ${percent} % · ${match[0].angebot_number}` }, { label: c.row.amount, value: money(Math.round(match[0].total * percent) / 100, 'EUR', g.lang) })
          input = { kind: 'deposit', angebot_id: match[0].id, percent }
        }
      }
      if (!input) {
        if (!items && amount && description) {
          if (percent) {
            const part = Math.round(amount * percent) / 100
            items = [{ description: g.lang === 'de' ? `${description} — Anzahlung ${percent} % von ${money(amount, 'EUR', 'de')}` : `${description} — ${percent}% deposit of ${money(amount, 'EUR', 'en')}`, amount: part }]
            out.warnings.push(c.warn.deposit_as_invoice)
          } else items = [{ description, amount }]
        }
        if (!items) { if (!amount) out.missing.push('amount'); if (!description) out.missing.push('items') }
        else {
          const total = Math.round(items.reduce((s, i) => s + i.amount, 0) * 100) / 100
          for (const i of items) out.rows.push({ label: c.row.items, value: `${i.description} — ${money(i.amount, 'EUR', g.lang)}` })
          out.rows.push({ label: c.row.total, value: money(total, 'EUR', g.lang) })
          const due = validDate(f.due_date)
          const days = due ? Math.round((Date.parse(due) - Date.parse(g.ctx.today)) / 86_400_000) : null
          if (due && (days! < 0 || days! > 90)) out.warnings.push(c.warn.date_invalid)
          out.rows.push({ label: c.row.due, value: due && days! >= 0 && days! <= 90 ? formatDate(due, g.lang) : formatDate(addDaysIso(g.ctx.today, 14), g.lang) })
          input = { kind: 'standard', client_id: client.id, items, ...(due && days! >= 0 && days! <= 90 ? { due_days: days } : {}) }
        }
      }
      out.rows.push({ label: c.row.tax, value: c.value.noTax, tone: 'muted' }, { label: c.row.status, value: c.value.draftOnly, tone: 'muted' })
    }
    return settle(out, input)
  },
}

const quoteDraft: ProposalTypeDef = {
  type: 'QUOTE_DRAFT', capabilities: ['proposal.create'], confirmation: 'confirm', editable: ['description', 'amount'],
  fromModel(a, g) {
    const warn: string[] = []
    const items = ownItems(a, g, warn)
    const currency = str(a.currency, 3)?.toUpperCase()
    return { client: str(a.client, 200), lead: str(a.lead, 200), ...screenFirst(g, str(a.client) ?? str(a.lead)), items, amount: items ? undefined : ownAmount(a, g, warn), description: str(a.description, 300), currency, language: lang(a.language), _warn: [...new Set(warn)] }
  },
  async ground(g, f) {
    const out = skeleton(g, 'QUOTE_DRAFT', 'proposal.create', f)
    const c = T(g)
    const party = apply(out, await resolveParty(g, f))
    const currency = typeof f.currency === 'string' ? f.currency : 'EUR'
    if (!['EUR', 'GBP'].includes(currency)) { out.state = 'blocked'; out.warnings.push(c.warn.currency_unsupported) }
    const amount = num(f.amount), description = str(f.description, 300)
    out.editable = [field(g, 'description', 'text', description, c.row.items), field(g, 'amount', 'amount', amount, c.row.amount)]
    let items = Array.isArray(f.items) ? (f.items as { description: string; amount: number }[]) : null
    if (!items && amount && description) items = [{ description, amount }]
    if (!items) { if (!amount) out.missing.push('amount'); if (!description) out.missing.push('items') }
    if (party) out.rows.push({ label: party.kind === 'client' ? c.row.client : c.row.lead, value: partyLabel(party) })
    if (items) {
      for (const i of items) out.rows.push({ label: c.row.items, value: `${i.description} — ${money(i.amount, currency, g.lang)}` })
      out.rows.push({ label: c.row.total, value: money(items.reduce((s, i) => s + i.amount, 0), currency, g.lang) }, { label: c.row.validUntil, value: formatDate(addDaysIso(g.ctx.today, 30), g.lang) })
    }
    out.rows.push({ label: c.row.tax, value: c.value.noTax, tone: 'muted' }, { label: c.row.status, value: c.value.draftOnly, tone: 'muted' })
    return settle(out, party && items ? { ...(party.kind === 'client' ? { client_id: party.client.id } : { lead_id: party.lead.id }), items, currency, ...(lang(f.language) ? { language: lang(f.language) } : {}) } : null)
  },
}

const followUp: ProposalTypeDef = {
  type: 'FOLLOW_UP_CREATE', capabilities: ['followup.create'], confirmation: 'confirm', editable: ['date', 'reason'],
  fromModel(a, g) {
    const warn: string[] = []
    const date = validDate(a.date)
    if (a.date && (!date || date < g.ctx.today)) warn.push('date_invalid')
    return {
      client: str(a.client, 200), lead: str(a.lead, 200), ...screenFirst(g, str(a.client) ?? str(a.lead)),
      ...(g.context.invoice && !str(a.client) && !str(a.lead) ? { invoice_id: g.context.invoice.id } : {}),
      date: date && date >= g.ctx.today ? date : undefined, reason: str(a.reason, 300) ?? str(a.note, 300), _warn: warn,
    }
  },
  async ground(g, f) {
    const out = skeleton(g, 'FOLLOW_UP_CREATE', 'followup.create', f)
    const c = T(g)
    let target: Record<string, string> | null = null
    const [inv] = typeof f.invoice_id === 'string' && UUID.test(f.invoice_id)
      ? await g.ctx.sql`SELECT id::text, invoice_number, client_id::text FROM os_invoices WHERE id = ${f.invoice_id}::uuid` as { id: string; invoice_number: string; client_id: string | null }[]
      : []
    if (inv) {
      target = { invoice_id: inv.id, ...(inv.client_id ? { client_id: inv.client_id } : {}) }
      out.rows.push({ label: c.row.invoice, value: inv.invoice_number })
    } else {
      const party = apply(out, await resolveParty(g, f))
      if (party) { target = party.kind === 'client' ? { client_id: party.client.id } : { lead_id: party.lead.id }; out.rows.push({ label: party.kind === 'client' ? c.row.client : c.row.lead, value: partyLabel(party) }) }
    }
    const date = validDate(f.date)
    const reason = str(f.reason, 300)
    if (!date || date < g.ctx.today || date > addDaysIso(g.ctx.today, 366)) out.missing.push('date')
    else out.rows.push({ label: c.row.date, value: formatDate(date, g.lang) })
    if (!reason) out.missing.push('reason')
    else out.rows.push({ label: c.row.reason, value: reason })
    out.editable = [field(g, 'date', 'date', date), field(g, 'reason', 'text', reason)]
    return settle(out, target && date && reason && !out.missing.includes('date') ? { ...target, due_on: date, reason } : null)
  },
}

const payment: ProposalTypeDef = {
  type: 'MONEY_RECORD_PAYMENT', capabilities: ['payment.record'], confirmation: 'approve', editable: ['amount', 'date', 'method'],
  fromModel(a, g) {
    const warn: string[] = []
    const date = validDate(a.date)
    if (a.date && (!date || date > g.ctx.today)) warn.push('date_future')
    return {
      client: str(a.client, 200), ...screenFirst(g, str(a.client)), ...(g.context.invoice ? { invoice_id: g.context.invoice.id } : {}),
      invoice_number: str(a.invoice_number, 30)?.toUpperCase(), amount: ownAmount(a, g, warn), currency: str(a.currency, 3)?.toUpperCase(),
      date: date && date <= g.ctx.today ? date : undefined, method: str(a.description, 60), _warn: warn,
    }
  },
  async ground(g, f) {
    const out = skeleton(g, 'MONEY_RECORD_PAYMENT', 'payment.record', f)
    const c = T(g)
    out.editable = [field(g, 'amount', 'amount', f.amount), field(g, 'date', 'date', f.date ?? g.ctx.today, c.row.received), field(g, 'method', 'text', f.method)]
    /* The invoice decides the client when it is named or on screen; otherwise the client decides
       which invoices are candidates. Nothing about an invoice comes from the model but its number. */
    const all = (await loadInvoicesForMoney(g.ctx)).map(i => ({ row: i, b: invoiceBalance(i, g.ctx.today) }))
    const open = all.filter(x => x.b.open > 0.004 && !['draft', 'cancelled', 'paid'].includes(x.b.state))
    let chosen = typeof f.invoice_id === 'string' ? all.find(x => x.row.id === f.invoice_id) ?? null : null
    if (!chosen && typeof f.invoice_number === 'string') chosen = all.find(x => x.row.invoice_number.toUpperCase() === f.invoice_number) ?? null
    let client: ClientLite | null = null
    if (chosen?.row.client_id) client = await clientById(g, chosen.row.client_id)
    if (!chosen) {
      client = apply(out, await resolveClient(g, f))
      if (client) {
        const mine = open.filter(x => x.row.client_id === client!.id)
        const amount = num(f.amount)
        if (mine.length === 1) chosen = mine[0]
        else if (mine.length > 1) {
          const exact = amount ? mine.filter(x => Math.abs(x.b.open - amount) < 0.005) : []
          if (exact.length === 1) chosen = exact[0]
          else out.choice = { field: 'invoice_id', prompt: c.choice.invoice, options: mine.map(x => ({ id: x.row.id, label: x.row.invoice_number, hint: `${money(x.b.open, x.b.currency, g.lang)} ${g.lang === 'de' ? 'offen' : 'open'}${x.b.daysOverdue > 0 ? ` · ${x.b.daysOverdue} ${g.lang === 'de' ? 'Tage überfällig' : 'days overdue'}` : ''}`, href: `/os/invoices/${x.row.id}` })) }
        } else { out.state = 'blocked'; out.warnings.push(c.warn.no_open_invoice) }
      }
    }
    if (client) out.rows.push({ label: c.row.client, value: client.label })
    if (!chosen) return settle(out, null)
    const b = chosen.b
    if (b.state === 'draft' || b.state === 'cancelled' || b.state === 'paid' || b.open <= 0.004) { out.state = 'blocked'; out.warnings.push(c.warn.no_open_invoice) }
    const amount = num(f.amount)
    const date = validDate(f.date) ?? g.ctx.today
    out.rows.push({ label: c.row.invoice, value: chosen.row.invoice_number })
    if (!amount) out.missing.push('amount')
    else out.rows.push({ label: c.row.amount, value: money(amount, b.currency, g.lang) })
    if (typeof f.currency === 'string' && f.currency !== b.currency) { out.state = 'blocked'; out.warnings.push(c.warn.currency_mismatch) }
    if (date > g.ctx.today) { out.state = 'blocked'; out.warnings.push(c.warn.date_future) }
    out.rows.push({ label: c.row.received, value: formatDate(date, g.lang) })
    if (str(f.method, 60)) out.rows.push({ label: c.row.method, value: str(f.method, 60)! })
    out.rows.push({ label: c.row.openBefore, value: money(b.open, b.currency, g.lang) })
    if (amount) {
      if (amount > b.open + 0.009) { out.state = 'blocked'; out.warnings.push(c.warn.amount_exceeds_open) }
      else out.rows.push({ label: c.row.openAfter, value: money(Math.round((b.open - amount) * 100) / 100, b.currency, g.lang) })
    }
    out.links = [{ label: chosen.row.invoice_number, href: `/os/invoices/${chosen.row.id}` }]
    return settle(out, amount ? { invoice_id: chosen.row.id, amount, received_on: date, ...(str(f.method, 60) ? { method: str(f.method, 60) } : {}) } : null)
  },
}

/* ── the registry ────────────────────────────────────────────────────────── */

const ALL: ProposalTypeDef[] = [
  clientCreate, clientUpdate, lifecycle('CLIENT_ARCHIVE'), lifecycle('CLIENT_RESTORE'), clientNote,
  leadCreate, leadUpdate, leadResearch, leadOutreach,
  emailDraft, emailReply, trashType('EMAIL_TRASH'), trashType('EMAIL_RESTORE'),
  invoiceDraft, quoteDraft, followUp, payment,
]

export const PROPOSALS: ReadonlyMap<ProposalTypeName, ProposalTypeDef> = (() => {
  const m = new Map<ProposalTypeName, ProposalTypeDef>()
  for (const p of ALL) {
    if (m.has(p.type)) throw new Error(`[max] proposal type ${p.type} registered twice`)
    m.set(p.type, p)
  }
  return m
})()

/** The capabilities Max can ever run — the allow-list of its routes. */
export const MAX_CAPABILITIES: ReadonlySet<string> = new Set(ALL.flatMap(p => p.capabilities))

export function proposalType(type: unknown): ProposalTypeDef | null {
  return isProposalType(type) ? PROPOSALS.get(type) ?? null : null
}

/** Instruction-like text in a text document (the image/PDF check is the extraction's). */
export const looksLikeInstructions = (text: string | null) => Boolean(text && INJECTION.test(text))
