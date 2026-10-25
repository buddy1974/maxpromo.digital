/**
 * lib/commercial/capabilities/clients.ts
 *
 * The client record: one canonical business entity the OS owns (foundation repair, 2026-10-25).
 * Every write to os_clients goes through here, so the client screens, document extraction, quotes
 * and invoices, and later Universal Max share one set of rules:
 *
 *   client.match     who could this already be? (lib/clients/match — deterministic evidence only)
 *   client.create    refuses to create a second record silently: candidates come back first and
 *                    Marcel either opens the existing client or confirms "a different client".
 *   client.update    three-state fields: absent = unchanged, null/"" = cleared, value = set.
 *   client.archive   out of the working lists; history, money and mail untouched. Reversible.
 *   client.restore   back into the working lists.
 *   client.show      "what is happening with this client?" — the records that point at it.
 *   client.delete    AMBER, and only for a client nothing points at (a mistake, a test). Anything
 *                    with business history is archived instead; the database refuses otherwise too
 *                    (0024: every reference is NO ACTION).
 *
 * Nothing here contacts anybody. Lifecycle changes are written to the client's timeline
 * (os_activities); a permanent delete is recorded in the append-only os_audit with the full record.
 */
import { writeAudit } from '../audit'
import { focus, logActivity, type ClientRow } from '../records'
import { CapabilityRefusal, type AnyCapability, type CapabilityContext, type CapabilityDefinition } from '../types'
import { v, InputError, type Validator } from '../validate'
import { clientDisplayLabel, findClientMatches, type ClientCandidate } from '@/lib/clients/match'

export interface FullClientRow extends ClientRow {
  website: string | null
  language: 'de' | 'en' | 'fr' | null
  source: string | null
  archived_at: string | null
  updated_at: string
}

/** A website as a normalised https URL; refused when it is not a plain public web address. */
export function websiteValidator(): Validator<string> {
  return {
    describe: 'website',
    parse(x, f) {
      const raw = v.string({ max: 300 }).parse(x, f)
      if (/\s/.test(raw)) throw new InputError(f, 'must be a web address')
      const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
      let u: URL
      try { u = new URL(withScheme) } catch { throw new InputError(f, 'must be a web address') }
      if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname)) {
        throw new InputError(f, 'must be a web address')
      }
      const path = u.pathname === '/' ? '' : u.pathname.replace(/\/+$/, '')
      return `${u.protocol}//${u.hostname.toLowerCase()}${path}${u.search}`
    },
  }
}

const COUNTRY = v.string({ max: 80 })
const LANG = v.enumOf(['de', 'en', 'fr'] as const)

const identity = {
  company: v.string({ max: 200 }),
  email: v.email(),
  phone: v.string({ max: 40 }),
  website: websiteValidator(),
  address: v.string({ max: 300 }),
  postcode: v.string({ max: 12 }),
  city: v.string({ max: 120 }),
  country: COUNTRY,
  language: LANG,
  notes: v.string({ max: 4000 }),
  source: v.string({ max: 60 }),
}
type IdentityKey = keyof typeof identity

const optionalShape = Object.fromEntries(Object.entries(identity).map(([k, val]) => [k, v.optional(val as Validator<unknown>)])) as { [K in IdentityKey]: Validator<ReturnType<(typeof identity)[K]['parse']> | undefined> }
const clearableShape = Object.fromEntries(Object.entries(identity).map(([k, val]) => [k, v.clearable(val as Validator<unknown>)])) as { [K in IdentityKey]: Validator<ReturnType<(typeof identity)[K]['parse']> | null | undefined> }

const FIELDS: readonly IdentityKey[] = Object.keys(identity) as IdentityKey[]

async function getFullClient(ctx: CapabilityContext, id: string): Promise<FullClientRow> {
  const rows = await ctx.sql`SELECT * FROM os_clients WHERE id = ${id}` as FullClientRow[]
  if (!rows[0]) throw new CapabilityRefusal('No client with that id.', 'not_found')
  return rows[0]
}

const candidateLine = (c: ClientCandidate) => `${c.label} · ${c.level} · ${c.reasons.join('+')}${c.archived ? ' · archived' : ''}`

/* ── client.match ───────────────────────────────────────────────────── */

const matchInput = v.object({
  name: v.optional(v.string({ max: 200 })),
  company: v.optional(v.string({ max: 200 })),
  email: v.optional(v.string({ max: 254 })),
  phone: v.optional(v.string({ max: 40 })),
  website: v.optional(v.string({ max: 300 })),
  city: v.optional(v.string({ max: 120 })),
  postcode: v.optional(v.string({ max: 12 })),
  exclude_id: v.optional(v.uuid()),
})

export const clientMatch: CapabilityDefinition<ReturnType<typeof matchInput.parse>> = {
  id: 'client.match', family: 'CRM', title: 'Is this an existing client?', risk: 'GREEN', input: matchInput,
  description: 'Finds existing clients (active or archived) by email, website, phone, company and address. Never merges; reports evidence.',
  async run(ctx, input) {
    const result = await findClientMatches(ctx.sql, input, { excludeIds: input.exclude_id ? [input.exclude_id] : [] })
    return {
      summary: result.level === 'none' ? 'No existing client matches.' : `${result.candidates.length} existing client(s) could be the same (${result.level}).`,
      lines: result.candidates.map(candidateLine),
      data: result,
      choices: result.candidates.map(c => ({ id: c.id, kind: 'client' as const, label: candidateLine(c) })),
    }
  },
}

/* ── client.create ──────────────────────────────────────────────────── */

const createInput = v.object({
  name: v.string({ max: 200 }),
  ...optionalShape,
  /** Set only after Marcel has seen these candidates and said it is a different client. */
  confirmed_distinct_from: v.optional(v.array(v.uuid(), { max: 10 })),
})

export const clientCreate: CapabilityDefinition<ReturnType<typeof createInput.parse>> = {
  id: 'client.create', family: 'CRM', title: 'Save a client', risk: 'GREEN', input: createInput,
  description: 'Creates a client after checking it is not already one. Existing candidates are returned instead of a silent second record.',
  async run(ctx, input) {
    const matches = await findClientMatches(ctx.sql, input)
    const confirmed = new Set(input.confirmed_distinct_from ?? [])
    const open = matches.candidates.filter(c => !confirmed.has(c.id))
    if (open.length) {
      return {
        summary: open.length === 1 ? `Already in Maxpromo: ${open[0].label} (${open[0].reasons.join(', ')}). Nothing was saved.` : `${open.length} existing clients could be the same. Nothing was saved.`,
        lines: open.map(candidateLine),
        data: { created: false, level: matches.level, candidates: open },
        choices: open.map(c => ({ id: c.id, kind: 'client' as const, label: candidateLine(c) })),
        next: ['Open the existing client', 'It is a different client — save anyway'],
      }
    }
    const rows = await ctx.sql`
      INSERT INTO os_clients (name, company, email, phone, website, address, postcode, city, country, language, notes, source, status)
      VALUES (${input.name}, ${input.company ?? null}, ${input.email ?? null}, ${input.phone ?? null}, ${input.website ?? null},
              ${input.address ?? null}, ${input.postcode ?? null}, ${input.city ?? null}, ${input.country ?? 'Deutschland'},
              ${input.language ?? null}, ${input.notes ?? null}, ${input.source ?? ctx.channel}, 'active')
      RETURNING *` as FullClientRow[]
    const c = rows[0]
    await logActivity(ctx.sql, {
      client_id: c.id, kind: 'client_created', channel: ctx.channel, actor: ctx.actor,
      summary: `Client created (${ctx.channel})`, detail: { confirmed_distinct_from: input.confirmed_distinct_from ?? [] },
    })
    return {
      summary: `Saved ${clientDisplayLabel(c)} as a client.`,
      data: { created: true, client: c },
      focus: [focus('client', c.id, clientDisplayLabel(c))],
    }
  },
}

/* ── client.update ──────────────────────────────────────────────────── */

const updateInput = v.object({ client_id: v.uuid(), name: v.optional(v.string({ max: 200 })), ...clearableShape })

export const clientUpdate: CapabilityDefinition<ReturnType<typeof updateInput.parse>> = {
  id: 'client.update', family: 'CRM', title: 'Update a client', risk: 'GREEN', input: updateInput,
  description: 'Changes client details. A field left out stays as it is; a field sent empty is cleared. The name cannot be cleared.',
  async run(ctx, input) {
    const before = await getFullClient(ctx, input.client_id)
    const changes: Partial<Record<IdentityKey | 'name', string | null>> = {}
    if (input.name !== undefined && input.name !== before.name) changes.name = input.name
    for (const k of FIELDS) {
      const next = (input as Record<string, unknown>)[k]
      if (next === undefined) continue
      if (k === 'country' && next === null) throw new CapabilityRefusal('A client always has a country; choose one instead of clearing it.')
      if ((before as unknown as Record<string, unknown>)[k] !== next) changes[k] = next as string | null
    }
    const changed = Object.keys(changes)
    if (!changed.length) return { summary: 'Nothing changed.', data: { client: before, changed: [] }, focus: [focus('client', before.id, clientDisplayLabel(before))] }
    const has = (k: string) => k in changes
    const val = (k: IdentityKey | 'name') => (changes[k] ?? null)
    /* One statement, each column either kept or set to exactly what was sent — including NULL. */
    const rows = await ctx.sql`
      UPDATE os_clients SET
        name     = CASE WHEN ${has('name')}     THEN ${val('name')}     ELSE name     END,
        company  = CASE WHEN ${has('company')}  THEN ${val('company')}  ELSE company  END,
        email    = CASE WHEN ${has('email')}    THEN ${val('email')}    ELSE email    END,
        phone    = CASE WHEN ${has('phone')}    THEN ${val('phone')}    ELSE phone    END,
        website  = CASE WHEN ${has('website')}  THEN ${val('website')}  ELSE website  END,
        address  = CASE WHEN ${has('address')}  THEN ${val('address')}  ELSE address  END,
        postcode = CASE WHEN ${has('postcode')} THEN ${val('postcode')} ELSE postcode END,
        city     = CASE WHEN ${has('city')}     THEN ${val('city')}     ELSE city     END,
        country  = CASE WHEN ${has('country')}  THEN ${val('country')}  ELSE country  END,
        language = CASE WHEN ${has('language')} THEN ${val('language')} ELSE language END,
        notes    = CASE WHEN ${has('notes')}    THEN ${val('notes')}    ELSE notes    END,
        source   = CASE WHEN ${has('source')}   THEN ${val('source')}   ELSE source   END,
        updated_at = now()
      WHERE id = ${before.id}
      RETURNING *` as FullClientRow[]
    const after = rows[0]
    await logActivity(ctx.sql, {
      client_id: after.id, kind: 'client_updated', channel: ctx.channel, actor: ctx.actor,
      summary: `Client details changed: ${changed.join(', ')}`,
      detail: { changed, cleared: changed.filter(k => changes[k as IdentityKey] === null) },
    })
    return { summary: `Updated ${clientDisplayLabel(after)} (${changed.join(', ')}).`, data: { client: after, changed }, focus: [focus('client', after.id, clientDisplayLabel(after))] }
  },
}

/* ── client.archive / client.restore ────────────────────────────────── */

const idInput = v.object({ client_id: v.uuid() })

export const clientArchive: CapabilityDefinition<ReturnType<typeof idInput.parse>> = {
  id: 'client.archive', family: 'CRM', title: 'Archive a client', risk: 'GREEN', input: idInput,
  description: 'Takes a client out of the working lists. Quotes, invoices, payments, mail and history stay exactly as they are. Reversible.',
  async run(ctx, input) {
    const c = await getFullClient(ctx, input.client_id)
    if (c.archived_at) return { summary: `${clientDisplayLabel(c)} is already archived.`, data: { client: c } }
    const rows = await ctx.sql`UPDATE os_clients SET status = 'archived', archived_at = now(), updated_at = now() WHERE id = ${c.id} AND archived_at IS NULL RETURNING *` as FullClientRow[]
    const after = rows[0] ?? await getFullClient(ctx, c.id)
    await logActivity(ctx.sql, { client_id: c.id, kind: 'client_archived', channel: ctx.channel, actor: ctx.actor, summary: 'Client archived', detail: { previous_status: c.status } })
    const open = await openWork(ctx, c.id)
    return {
      summary: `Archived ${clientDisplayLabel(after)}. Nothing was deleted.`,
      lines: open.length ? [`Still open: ${open.join(', ')} — they stay visible where they are.`] : [],
      data: { client: after, open },
      focus: [focus('client', c.id, clientDisplayLabel(after))],
    }
  },
}

export const clientRestore: CapabilityDefinition<ReturnType<typeof idInput.parse>> = {
  id: 'client.restore', family: 'CRM', title: 'Restore an archived client', risk: 'GREEN', input: idInput,
  description: 'Brings an archived client back into the working lists.',
  async run(ctx, input) {
    const c = await getFullClient(ctx, input.client_id)
    if (!c.archived_at) return { summary: `${clientDisplayLabel(c)} is active.`, data: { client: c } }
    const rows = await ctx.sql`UPDATE os_clients SET status = 'active', archived_at = NULL, updated_at = now() WHERE id = ${c.id} RETURNING *` as FullClientRow[]
    await logActivity(ctx.sql, { client_id: c.id, kind: 'client_restored', channel: ctx.channel, actor: ctx.actor, summary: 'Client restored from the archive' })
    return { summary: `${clientDisplayLabel(rows[0])} is active again.`, data: { client: rows[0] }, focus: [focus('client', c.id, clientDisplayLabel(rows[0]))] }
  },
}

async function openWork(ctx: CapabilityContext, id: string): Promise<string[]> {
  const rows = await ctx.sql`
    SELECT
      (SELECT count(*)::int FROM os_invoices WHERE client_id = ${id} AND status NOT IN ('draft', 'cancelled', 'paid')) AS invoices,
      (SELECT count(*)::int FROM os_angebote WHERE client_id = ${id} AND status = 'sent') AS quotes,
      (SELECT count(*)::int FROM os_jobs WHERE client_id = ${id} AND stage NOT IN ('completed', 'invoiced')) AS jobs` as { invoices: number; quotes: number; jobs: number }[]
  const r = rows[0]
  return [r.invoices && `${r.invoices} unpaid invoice(s)`, r.quotes && `${r.quotes} quote(s) waiting`, r.jobs && `${r.jobs} active job(s)`].filter(Boolean) as string[]
}

/* ── client.delete (AMBER, empty clients only) ──────────────────────── */

const LIFECYCLE_KINDS = ['client_created', 'client_updated', 'client_archived', 'client_restored']

/** Everything that points at a client. A client with any of it is archived, never deleted. Any other
 * reference (a website chat linked to the client, where that column exists) is still protected by the
 * database: every foreign key onto os_clients is NO ACTION (0024), so the delete is refused, never cascaded. */
export async function clientDependencies(sql: CapabilityContext['sql'], id: string): Promise<Record<string, number>> {
  const rows = await sql`
    SELECT
      (SELECT count(*)::int FROM os_invoices   WHERE client_id = ${id}) AS invoices,
      (SELECT count(*)::int FROM os_angebote   WHERE client_id = ${id}) AS quotes,
      (SELECT count(*)::int FROM os_jobs       WHERE client_id = ${id}) AS jobs,
      (SELECT count(*)::int FROM os_leads      WHERE client_id = ${id}) AS leads,
      (SELECT count(*)::int FROM os_followups  WHERE client_id = ${id}) AS followups,
      (SELECT count(*)::int FROM os_recurring  WHERE client_id = ${id}) AS recurring,
      (SELECT count(*)::int FROM os_files      WHERE client_id = ${id}) AS documents,
      (SELECT count(*)::int FROM os_incidents  WHERE client_id = ${id}) AS incidents,
      (SELECT count(*)::int FROM mail.business_links WHERE entity_kind = 'client' AND entity_id = ${id}::text) AS conversations,
      (SELECT count(*)::int FROM os_activities WHERE client_id = ${id} AND kind <> ALL(${LIFECYCLE_KINDS})) AS history` as Record<string, number>[]
  return Object.fromEntries(Object.entries(rows[0]).filter(([, n]) => Number(n) > 0))
}

export const clientDelete: CapabilityDefinition<ReturnType<typeof idInput.parse>> = {
  id: 'client.delete', family: 'CRM', title: 'Permanently delete an empty client', risk: 'AMBER', input: idInput,
  description: 'Only for a client with no quotes, invoices, jobs, leads, mail, documents or history (a mistake or a test). Anything else is archived instead.',
  async prepare(ctx, input) {
    const c = await getFullClient(ctx, input.client_id)
    const deps = await clientDependencies(ctx.sql, c.id)
    if (Object.keys(deps).length) {
      return {
        summary: `${clientDisplayLabel(c)} has business history and cannot be deleted: ${Object.entries(deps).map(([k, n]) => `${n} ${k}`).join(', ')}. Archive it instead — nothing is lost and it can be restored.`,
        data: { deletable: false, dependencies: deps },
        next: ['Archive this client'],
      }
    }
    return {
      summary: `Permanently delete ${clientDisplayLabel(c)}?`,
      preview: { ACTION: 'Delete permanently', CLIENT: clientDisplayLabel(c), RECORDS: 'none attached', UNDO: 'not possible — archive keeps the record' },
      payload: { client_id: c.id },
      dedupeKey: `client-delete:${c.id}`,
      expiresInMinutes: 10,
    }
  },
  async execute(ctx, payload, approvalId) {
    const id = (payload as { client_id: string }).client_id
    const before = await getFullClient(ctx, id)
    const deps = await clientDependencies(ctx.sql, id)
    if (Object.keys(deps).length) throw new CapabilityRefusal('Something was attached to this client since the confirmation; archive it instead.', 'conflict')
    /* One statement: its own lifecycle notes and the row. Any reference created in between makes
       the database refuse the whole statement (0024, NO ACTION) — nothing is orphaned. */
    const rows = await ctx.sql`
      WITH notes AS (DELETE FROM os_activities WHERE client_id = ${id} AND kind = ANY(${LIFECYCLE_KINDS}) RETURNING id)
      DELETE FROM os_clients WHERE id = ${id} AND (SELECT count(*) FROM notes) >= 0 RETURNING id` as { id: string }[]
    if (!rows[0]) throw new CapabilityRefusal('The client was already removed.', 'conflict')
    await writeAudit(ctx.sql, { actor: ctx.actor, channel: ctx.channel, operation: 'client.delete', entityType: 'client', entityId: id, before, after: null, approvalId, outcome: 'succeeded' })
    return { summary: `${clientDisplayLabel(before)} was deleted. The full record is kept in the audit log.`, data: { deleted: id } }
  },
}

/* ── client.show — "what is happening with this client?" ────────────── */

export const clientShow: CapabilityDefinition<ReturnType<typeof idInput.parse>> = {
  id: 'client.show', family: 'CRM', title: 'Client overview', risk: 'GREEN', input: idInput,
  description: 'The client and every record that points at it: conversations, quotes, invoices with what is paid, payments, jobs, leads, follow-ups, documents and timeline.',
  async run(ctx, input) {
    const c = await getFullClient(ctx, input.client_id)
    const email = (c.email ?? '').toLowerCase()
    const [threads, quotes, invoices, payments, jobs, leads, followups, documents, activity, deps] = await Promise.all([
      ctx.sql`
        SELECT t.id, t.subject, t.needs_reply, t.waiting, t.follow_up_on::text AS follow_up_on, t.archived, t.trashed,
               (SELECT max(m.received_at) FROM mail.messages m WHERE m.thread_id = t.id) AS last_at,
               bool_or(l.match_status = 'owner_confirmed') AS confirmed
        FROM mail.threads t JOIN mail.business_links l ON l.thread_id = t.id AND l.entity_kind = 'client' AND l.entity_id = ${c.id}::text
        WHERE t.quarantine IS NULL AND t.trashed = false
        GROUP BY t.id
        UNION
        SELECT t.id, t.subject, t.needs_reply, t.waiting, t.follow_up_on::text, t.archived, t.trashed,
               (SELECT max(m.received_at) FROM mail.messages m WHERE m.thread_id = t.id), false
        FROM mail.threads t
        WHERE ${email} <> '' AND t.quarantine IS NULL AND t.trashed = false
          AND EXISTS (SELECT 1 FROM mail.messages m WHERE m.thread_id = t.id AND (lower(m.sender) = ${email} OR m.recipients::text ILIKE ${'%' + email + '%'}))
          AND NOT EXISTS (SELECT 1 FROM mail.business_links l WHERE l.thread_id = t.id AND l.entity_kind = 'client' AND l.entity_id = ${c.id}::text)
        ORDER BY last_at DESC NULLS LAST LIMIT 20`,
      ctx.sql`SELECT id, angebot_number AS number, status, total::float8 AS total, currency, created_at, valid_until::text AS valid_until FROM os_angebote WHERE client_id = ${c.id} ORDER BY created_at DESC LIMIT 30`,
      ctx.sql`SELECT id, invoice_number AS number, status, total::float8 AS total, currency, due_date::text AS due_date, created_at, money.invoice_paid(id)::float8 AS paid FROM os_invoices WHERE client_id = ${c.id} ORDER BY created_at DESC LIMIT 30`,
      ctx.sql`SELECT p.id, p.amount::float8 AS amount, p.currency, p.received_on::text AS received_on, p.method, i.invoice_number, p.invoice_id FROM os_payments p JOIN os_invoices i ON i.id = p.invoice_id WHERE i.client_id = ${c.id} ORDER BY p.received_on DESC LIMIT 30`,
      ctx.sql`SELECT id, title, stage, value::float8 AS value, due_date::text AS due_date FROM os_jobs WHERE client_id = ${c.id} ORDER BY created_at DESC LIMIT 30`,
      ctx.sql`SELECT id, coalesce(company, name) AS label, status, created_at FROM os_leads WHERE client_id = ${c.id} OR (${email} <> '' AND lower(email) = ${email}) ORDER BY created_at DESC LIMIT 10`,
      ctx.sql`SELECT id, due_on::text AS due_on, reason FROM os_followups WHERE client_id = ${c.id} AND status = 'open' ORDER BY due_on LIMIT 10`,
      ctx.sql`SELECT id, filename, mime_type, size_bytes, label, created_at FROM os_files WHERE client_id = ${c.id} ORDER BY created_at DESC LIMIT 50`,
      ctx.sql`SELECT id, kind, summary, actor, created_at FROM os_activities WHERE client_id = ${c.id} ORDER BY created_at DESC LIMIT 40`,
      clientDependencies(ctx.sql, c.id),
    ]) as [
      { id: string; subject: string; needs_reply: boolean; waiting: boolean; follow_up_on: string | null; archived: boolean; last_at: string | null; confirmed: boolean }[],
      { id: string; number: string; status: string; total: number; currency: string; valid_until: string | null }[],
      { id: string; number: string; status: string; total: number; currency: string; due_date: string | null; paid: number }[],
      unknown[], { id: string; title: string; stage: string }[], unknown[], { id: string; due_on: string; reason: string }[], unknown[], unknown[], Record<string, number>,
    ]
    const today = ctx.today
    const attention: { kind: string; label: string; ref: string; amount?: number; currency?: string }[] = []
    for (const t of threads) if (t.needs_reply && !t.archived) attention.push({ kind: 'reply', label: t.subject, ref: t.id })
    for (const i of invoices) {
      const open = Number(i.total) - Number(i.paid)
      if (!['draft', 'cancelled', 'paid'].includes(i.status) && open > 0.004) attention.push({ kind: i.due_date && i.due_date < today ? 'overdue' : 'unpaid', label: i.number, amount: Math.round(open * 100) / 100, currency: i.currency || 'EUR', ref: i.id })
    }
    for (const q of quotes) if (q.status === 'sent') attention.push({ kind: 'quote', label: q.number, ref: q.id })
    for (const f of followups) attention.push({ kind: f.due_on <= today ? 'followup_due' : 'followup', label: `${f.due_on} · ${f.reason}`, ref: f.id })
    for (const j of jobs) if (!['completed', 'invoiced'].includes(j.stage)) attention.push({ kind: 'job', label: j.title, ref: j.id })
    return {
      summary: `${clientDisplayLabel(c)}${c.archived_at ? ' (archived)' : ''}: ${attention.length ? `${attention.length} open item(s)` : 'nothing open'}.`,
      data: { client: c, attention, threads, quotes, invoices, payments, jobs, leads, followups, documents, activity, dependencies: deps, deletable: Object.keys(deps).length === 0 },
      focus: [focus('client', c.id, clientDisplayLabel(c))],
    }
  },
}

export const CLIENT_CAPABILITIES: AnyCapability[] = [clientMatch, clientCreate, clientUpdate, clientArchive, clientRestore, clientDelete, clientShow] as AnyCapability[]
