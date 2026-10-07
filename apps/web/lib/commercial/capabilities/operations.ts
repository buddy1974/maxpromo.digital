/**
 * lib/commercial/capabilities/operations.ts
 *
 * Projects, client files, incidents, recurring services and upsell ideas.
 *
 * Files: the OS records what a file is, whose it is and where its bytes are —
 * never the bytes, and never a pointer into Telegram (the table refuses a
 * `telegram:` storage reference). Today the bytes live in the OpenClaw
 * attachment store on Marcel's machine; that is named honestly as a risk in
 * known-risks.md until a durable store is chosen.
 *
 * Upsell suggestions are derived from recorded facts only — a project without
 * a maintenance contract, a client with an open incident and no monitoring —
 * and are returned to Marcel. Nothing here contacts a client.
 */

import { addPeriod, formatPerCurrency, monthlyEquivalent, receivables, type PerCurrency } from '../money'
import {
  addDays, clientLabel, eur, focus, isoDate, logActivity, resolveClient, type ClientRow,
} from '../records'
import { loadInvoicesForMoney } from './documents'
import { CapabilityRefusal, type AnyCapability, type CapabilityContext, type CapabilityDefinition, type CapabilityResult } from '../types'
import { v } from '../validate'
import { writeAudit } from '../audit'
import { payloadHash } from '../signing'

interface JobRow {
  id: string
  title: string
  client_id: string | null
  client_name: string | null
  description: string | null
  stage: string
  priority: string
  value: string | null
  due_date: string | null
  lead_id: string | null
  angebot_id: string | null
  repository: string | null
  domain: string | null
  notes: string | null
  created_at: Date
}

async function resolveJob(ctx: CapabilityContext, ref: { job_id?: string; query?: string }): Promise<{ job: JobRow } | { result: CapabilityResult }> {
  if (ref.job_id) {
    const rows = await ctx.sql`SELECT *, due_date::text AS due_date FROM os_jobs WHERE id = ${ref.job_id}` as JobRow[]
    if (!rows.length) throw new CapabilityRefusal('No project with that id.', 'not_found')
    return { job: rows[0] }
  }
  if (!ref.query) throw new CapabilityRefusal('Which project? Give the client or project name.')
  const q = `%${ref.query.toLowerCase()}%`
  const rows = await ctx.sql`
    SELECT j.*, j.due_date::text AS due_date FROM os_jobs j LEFT JOIN os_clients c ON c.id = j.client_id
    WHERE lower(j.title) LIKE ${q} OR lower(coalesce(j.client_name,'')) LIKE ${q} OR lower(coalesce(c.company,'')) LIKE ${q}
    ORDER BY (j.stage IN ('completed', 'invoiced')), j.created_at DESC LIMIT 6` as JobRow[]
  if (rows.length === 1) return { job: rows[0] }
  if (!rows.length) return { result: { summary: `No project matches “${ref.query}”.` } }
  return { result: { summary: `${rows.length} projects match. Which one?`, choices: rows.map((j) => ({ id: j.id, kind: 'job' as const, label: `${j.title} · ${j.stage}` })) } }
}

/* ── project.status ─────────────────────────────────────────────────────── */

const jobRef = { job_id: v.optional(v.uuid()), query: v.optional(v.string({ max: 200 })) }
const statusInput = v.object(jobRef)

export const projectStatus: CapabilityDefinition<ReturnType<typeof statusInput.parse>> = {
  id: 'project.status',
  family: 'PROJECT',
  title: 'Status of a project',
  description: 'One project: stage, deadline, scope, money owed in both directions, open follow-ups, incidents, files, repository and domain.',
  risk: 'GREEN',
  input: statusInput,
  async run(ctx, input) {
    const r = await resolveJob(ctx, input)
    if ('result' in r) return r.result
    const j = r.job
    const [invoices, incidents, files, fups, recurring] = await Promise.all([
      loadInvoicesForMoney(ctx).then((all) => all),
      ctx.sql`SELECT title, severity, status FROM os_incidents WHERE job_id = ${j.id} AND status <> 'closed' ORDER BY created_at DESC`,
      ctx.sql`SELECT filename, label, created_at FROM os_files WHERE job_id = ${j.id} ORDER BY created_at DESC LIMIT 5`,
      ctx.sql`SELECT due_on::text AS due_on, reason FROM os_followups WHERE status = 'open' AND (client_id = ${j.client_id} OR invoice_id IN (SELECT id FROM os_invoices WHERE job_id = ${j.id})) ORDER BY due_on LIMIT 5`,
      ctx.sql`SELECT service, amount, currency, frequency FROM os_recurring WHERE job_id = ${j.id} AND status = 'active'`,
    ]) as [Awaited<ReturnType<typeof loadInvoicesForMoney>>, { title: string; severity: string; status: string }[], { filename: string; label: string | null; created_at: Date }[], { due_on: string; reason: string }[], { service: string; amount: string; currency: string; frequency: string }[]]
    const jobInvoiceIds = new Set((await ctx.sql`SELECT id FROM os_invoices WHERE job_id = ${j.id}` as { id: string }[]).map((x) => x.id))
    const rec = receivables(invoices.filter((i) => jobInvoiceIds.has(i.id)), ctx.today)
    const invoicedCount = jobInvoiceIds.size
    const blocking: string[] = []
    if (j.due_date && j.due_date < ctx.today && !['completed', 'invoiced'].includes(j.stage)) blocking.push(`past its deadline ${j.due_date}`)
    if (incidents.some((i) => ['high', 'critical'].includes(i.severity))) blocking.push('a high-severity incident is open')
    if (rec.overdueInvoices.length) blocking.push(`${rec.overdueInvoices.length} overdue invoice(s)`)
    if (j.stage === 'completed' && invoicedCount === 0) blocking.push('completed but not invoiced')
    return {
      summary: `${j.title} — ${j.stage}${j.due_date ? `, due ${j.due_date}` : ''}${j.value ? `, value ${eur(j.value)}` : ''}.`,
      lines: [
        blocking.length ? `Blocking: ${blocking.join('; ')}` : 'Nothing blocking on record.',
        `They owe: ${Object.keys(rec.outstanding).length ? formatPerCurrency(rec.outstanding) : 'nothing on issued invoices'}${rec.drafts.length ? ` (+${rec.drafts.length} draft invoice(s))` : ''}`,
        invoicedCount === 0 ? 'No invoice yet.' : `${invoicedCount} invoice(s) issued or drafted.`,
        ...recurring.map((x) => `Recurring: ${x.service} ${eur(x.amount, x.currency)} ${x.frequency}`),
        ...incidents.map((i) => `Incident (${i.severity}, ${i.status}): ${i.title}`),
        ...fups.map((f) => `Follow-up ${f.due_on}: ${f.reason}`),
        j.repository ? `Repository: ${j.repository}` : '',
        j.domain ? `Domain: ${j.domain}` : '',
        files.length ? `Files: ${files.map((f) => f.label ?? f.filename).join(', ')}` : '',
        j.description ? `Scope:\n${j.description}` : '',
      ].filter(Boolean),
      focus: [focus('job', j.id, j.title), ...(j.client_id ? [focus('client', j.client_id, j.client_name ?? 'client')] : [])],
      data: { job_id: j.id, repository: j.repository, domain: j.domain, outstanding: rec.outstanding },
    }
  },
}

/* ── project.update ─────────────────────────────────────────────────────── */

const JOB_STAGES = ['lead', 'discovery', 'proposal', 'in progress', 'review', 'completed', 'invoiced'] as const
const projectUpdateInput = v.object({
  ...jobRef,
  stage: v.optional(v.enumOf(JOB_STAGES)),
  due_date: v.optional(v.date()),
  repository: v.optional(v.string({ max: 300 })),
  domain: v.optional(v.string({ max: 200 })),
  note: v.optional(v.string({ max: 2000 })),
})

export const projectUpdate: CapabilityDefinition<ReturnType<typeof projectUpdateInput.parse>> = {
  id: 'project.update',
  family: 'PROJECT',
  title: 'Update a project',
  description: 'Moves a project’s stage or deadline, or records its repository and domain.',
  risk: 'GREEN',
  input: projectUpdateInput,
  async run(ctx, input) {
    const r = await resolveJob(ctx, input)
    if ('result' in r) return r.result
    const j = r.job
    await ctx.sql`UPDATE os_jobs SET
      stage = COALESCE(${input.stage ?? null}, stage), due_date = COALESCE(${input.due_date ?? null}::date, due_date),
      repository = COALESCE(${input.repository ?? null}, repository), domain = COALESCE(${input.domain ?? null}, domain),
      updated_at = now() WHERE id = ${j.id}`
    const changes = Object.entries(input).filter(([k]) => !['job_id', 'query', 'note'].includes(k)).map(([k, val]) => `${k} → ${val}`)
    await logActivity(ctx.sql, {
      job_id: j.id, client_id: j.client_id, kind: input.note ? 'note' : 'project_updated', actor: ctx.actor, channel: ctx.channel,
      summary: [changes.join(', '), input.note].filter(Boolean).join(' · ').slice(0, 300) || 'updated', detail: { note: input.note ?? null },
    })
    const next = input.stage === 'completed' ? ['Create final invoice'] : undefined
    return { summary: `${j.title}: ${[...changes, input.note ? 'note added' : ''].filter(Boolean).join(', ') || 'nothing changed'}.`, focus: [focus('job', j.id, j.title)], next }
  },
}

/* ── files ──────────────────────────────────────────────────────────────── */

const fileInput = v.object({
  lead_id: v.optional(v.uuid()),
  client_id: v.optional(v.uuid()),
  job_id: v.optional(v.uuid()),
  query: v.optional(v.string({ max: 200 })),
  filename: v.string({ max: 255 }),
  mime_type: v.string({ max: 100 }),
  size_bytes: v.integer({ min: 0, max: 200 * 1024 * 1024 }),
  sha256: v.string({ min: 64, max: 64 }),
  storage_ref: v.string({ max: 300 }),
  label: v.optional(v.string({ max: 120 })),
})

export const fileAttach: CapabilityDefinition<ReturnType<typeof fileInput.parse>> = {
  id: 'file.attach',
  family: 'FILES',
  title: 'Add a file to a client or project',
  description: 'Records a stored file against a lead, client or project. The bytes must already be in durable storage.',
  risk: 'GREEN',
  input: fileInput,
  async run(ctx, input) {
    if (/^telegram:/i.test(input.storage_ref)) throw new CapabilityRefusal('A file must be stored outside Telegram before it is recorded.')
    if (!/^[0-9a-f]{64}$/i.test(input.sha256)) throw new CapabilityRefusal('sha256 must be a hex digest.')
    let jobId = input.job_id ?? null
    let clientId = input.client_id ?? null
    if (!jobId && !clientId && !input.lead_id) {
      const r = await resolveJob(ctx, { query: input.query })
      if ('result' in r) {
        const c = await resolveClient(ctx.sql, { query: input.query })
        if ('result' in c) return r.result
        clientId = c.client.id
      } else {
        jobId = r.job.id
        clientId = r.job.client_id
      }
    }
    const rows = await ctx.sql`
      INSERT INTO os_files (lead_id, client_id, job_id, filename, mime_type, size_bytes, sha256, storage_ref, label, actor)
      VALUES (${input.lead_id ?? null}, ${clientId}, ${jobId}, ${input.filename}, ${input.mime_type}, ${input.size_bytes},
              ${input.sha256.toLowerCase()}, ${input.storage_ref}, ${input.label ?? null}, ${ctx.actor})
      ON CONFLICT DO NOTHING RETURNING id` as { id: string }[]
    if (!rows.length) return { summary: `${input.filename} is already filed there.` }
    await logActivity(ctx.sql, { lead_id: input.lead_id, client_id: clientId, job_id: jobId, kind: 'file_added', actor: ctx.actor, channel: ctx.channel, summary: `File added: ${input.label ?? input.filename}` })
    return { summary: `Filed ${input.label ?? input.filename}.`, data: { file_id: rows[0].id } }
  },
}

const fileListInput = v.object({ ...jobRef, client_id: v.optional(v.uuid()), lead_id: v.optional(v.uuid()), name: v.optional(v.string({ max: 100 })) })

export const fileList: CapabilityDefinition<ReturnType<typeof fileListInput.parse>> = {
  id: 'file.list',
  family: 'FILES',
  title: 'Show client files',
  description: 'Files recorded for a client, project or lead, optionally filtered by name (e.g. "logo", "contract").',
  risk: 'GREEN',
  input: fileListInput,
  async run(ctx, input) {
    let jobId = input.job_id ?? null
    let clientId = input.client_id ?? null
    if (!jobId && !clientId && !input.lead_id) {
      const r = await resolveJob(ctx, input)
      if ('result' in r) return r.result
      jobId = r.job.id
      clientId = r.job.client_id
    }
    const name = input.name ? `%${input.name.toLowerCase()}%` : '%'
    const rows = await ctx.sql`
      SELECT id, filename, label, mime_type, storage_ref, created_at FROM os_files
      WHERE ((${jobId}::uuid IS NOT NULL AND job_id = ${jobId}) OR (${clientId}::uuid IS NOT NULL AND client_id = ${clientId})
             OR (${input.lead_id ?? null}::uuid IS NOT NULL AND lead_id = ${input.lead_id ?? null}))
        AND (lower(filename) LIKE ${name} OR lower(coalesce(label,'')) LIKE ${name})
      ORDER BY created_at DESC LIMIT 20` as { id: string; filename: string; label: string | null; mime_type: string; storage_ref: string; created_at: Date }[]
    return {
      summary: rows.length ? `${rows.length} file(s).` : 'No files recorded there.',
      lines: rows.map((f) => `${isoDate(f.created_at)} · ${f.label ?? f.filename} (${f.mime_type})`),
      data: { files: rows.map((f) => ({ id: f.id, filename: f.filename, storage_ref: f.storage_ref })) },
    }
  },
}

/* ── incidents ──────────────────────────────────────────────────────────── */

const incidentInput = v.object({
  client_id: v.optional(v.uuid()),
  job_id: v.optional(v.uuid()),
  query: v.optional(v.string({ max: 200 })),
  title: v.string({ max: 200 }),
  severity: v.optional(v.enumOf(['low', 'medium', 'high', 'critical'] as const)),
  source: v.optional(v.string({ max: 200 })),
  /** Same key while open → same incident. Twenty alerts are one outage. */
  dedupe_key: v.optional(v.string({ max: 200 })),
  detail: v.optional(v.string({ max: 4000 })),
})

export const incidentCreate: CapabilityDefinition<ReturnType<typeof incidentInput.parse>> = {
  id: 'incident.create',
  family: 'SUPPORT',
  title: 'Open an incident',
  description: 'Opens a lightweight incident for a client system, or adds to the open one with the same key.',
  risk: 'GREEN',
  input: incidentInput,
  async run(ctx, input) {
    let jobId = input.job_id ?? null
    let clientId = input.client_id ?? null
    if (!jobId && !clientId && input.query) {
      const r = await resolveJob(ctx, { query: input.query })
      if ('result' in r) {
        const c = await resolveClient(ctx.sql, { query: input.query })
        if ('result' in c) return r.result
        clientId = c.client.id
      } else { jobId = r.job.id; clientId = r.job.client_id }
    }
    const entry = { at: ctx.now.toISOString(), by: ctx.actor, text: input.detail ?? input.title }
    if (input.dedupe_key) {
      const open = await ctx.sql`
        UPDATE os_incidents SET timeline = timeline || ${JSON.stringify([entry])}::jsonb, updated_at = now()
        WHERE dedupe_key = ${input.dedupe_key} AND status <> 'closed' RETURNING id, title, status` as { id: string; title: string; status: string }[]
      if (open.length) return { summary: `Already open: ${open[0].title} (${open[0].status}). Added to its timeline.`, focus: [focus('incident', open[0].id, open[0].title)] }
    }
    const rows = await ctx.sql`
      INSERT INTO os_incidents (client_id, job_id, title, severity, source, dedupe_key, timeline, actor)
      VALUES (${clientId}, ${jobId}, ${input.title}, ${input.severity ?? 'medium'}, ${input.source ?? ctx.channel},
              ${input.dedupe_key ?? null}, ${JSON.stringify([entry])}::jsonb, ${ctx.actor})
      ON CONFLICT DO NOTHING RETURNING id` as { id: string }[]
    if (!rows.length) return { summary: 'An incident with that key was opened at the same moment; it was not duplicated.' }
    if (clientId || jobId) {
      await logActivity(ctx.sql, { client_id: clientId, job_id: jobId, kind: 'incident_opened', actor: ctx.actor, summary: input.title })
    }
    return {
      summary: `Incident opened (${input.severity ?? 'medium'}): ${input.title}.`,
      focus: [focus('incident', rows[0].id, input.title)],
      next: ['Investigate', 'Draft a reply to the client'],
    }
  },
}

const incidentUpdateInput = v.object({
  incident_id: v.uuid(),
  status: v.optional(v.enumOf(['open', 'investigating', 'fixed', 'monitoring', 'closed'] as const)),
  cause: v.optional(v.string({ max: 2000 })),
  resolution: v.optional(v.string({ max: 2000 })),
  note: v.optional(v.string({ max: 2000 })),
})

export const incidentUpdate: CapabilityDefinition<ReturnType<typeof incidentUpdateInput.parse>> = {
  id: 'incident.update',
  family: 'SUPPORT',
  title: 'Update an incident',
  description: 'Records an incident’s status, cause or resolution.',
  risk: 'GREEN',
  input: incidentUpdateInput,
  async run(ctx, input) {
    const entry = { at: ctx.now.toISOString(), by: ctx.actor, text: [input.status && `→ ${input.status}`, input.cause && `cause: ${input.cause}`, input.resolution && `fix: ${input.resolution}`, input.note].filter(Boolean).join(' · ') }
    const rows = await ctx.sql`
      UPDATE os_incidents SET status = COALESCE(${input.status ?? null}, status), cause = COALESCE(${input.cause ?? null}, cause),
        resolution = COALESCE(${input.resolution ?? null}, resolution), timeline = timeline || ${JSON.stringify([entry])}::jsonb, updated_at = now()
      WHERE id = ${input.incident_id} RETURNING title, status` as { title: string; status: string }[]
    if (!rows.length) throw new CapabilityRefusal('No such incident.', 'not_found')
    return { summary: `${rows[0].title}: ${rows[0].status}.` }
  },
}

const incidentListInput = v.object({ include_closed: v.optional(v.boolean()) })

export const incidentList: CapabilityDefinition<ReturnType<typeof incidentListInput.parse>> = {
  id: 'incident.list',
  family: 'MONITORING',
  title: 'Any incidents?',
  description: 'Open client incidents, most severe first.',
  risk: 'GREEN',
  input: incidentListInput,
  async run(ctx, input) {
    const rows = await ctx.sql`
      SELECT i.id, i.title, i.severity, i.status, i.created_at, c.company, c.name
      FROM os_incidents i LEFT JOIN os_clients c ON c.id = i.client_id
      WHERE ${input.include_closed ?? false} OR i.status <> 'closed'
      ORDER BY array_position(ARRAY['critical','high','medium','low'], i.severity), i.created_at DESC LIMIT 20` as
      { id: string; title: string; severity: string; status: string; created_at: Date; company: string | null; name: string | null }[]
    return {
      summary: rows.length ? `${rows.length} open incident(s).` : 'No open incidents.',
      lines: rows.map((r) => `${r.severity.toUpperCase()} · ${r.status} · ${r.company ?? r.name ?? 'internal'} · ${r.title}`),
      choices: rows.slice(0, 6).map((r) => ({ id: r.id, kind: 'incident' as const, label: r.title })),
    }
  },
}

/* ── recurring ──────────────────────────────────────────────────────────── */

const recurringCreateInput = v.object({
  client_id: v.optional(v.uuid()),
  query: v.optional(v.string({ max: 200 })),
  job_id: v.optional(v.uuid()),
  service: v.string({ max: 200 }),
  amount: v.number({ min: 0, max: 1_000_000 }),
  currency: v.optional(v.enumOf(['EUR', 'GBP'] as const)),
  frequency: v.enumOf(['monthly', 'quarterly', 'yearly'] as const),
  starts_on: v.date(),
})

export const recurringCreate: CapabilityDefinition<ReturnType<typeof recurringCreateInput.parse>> = {
  id: 'recurring.create',
  family: 'FINANCE',
  title: 'Record a recurring service',
  description: 'Records contracted recurring revenue (maintenance, hosting, retainer) for a client.',
  risk: 'AMBER',
  input: recurringCreateInput,
  async prepare(ctx, input) {
    const r = await resolveClient(ctx.sql, input)
    if ('result' in r) return r.result
    const cur = input.currency ?? 'EUR'
    /* The next renewal on or after today — a service that started long ago
       does not renew in the past. Bounded: at most 50 years of periods. */
    let next = input.starts_on
    for (let n = 0; next < ctx.today && n < 600; n++) next = addPeriod(next, input.frequency)
    return {
      summary: `Record ${input.service} for ${clientLabel(r.client)}`,
      preview: {
        ACTION: 'Record recurring service',
        CLIENT: clientLabel(r.client),
        SERVICE: input.service,
        AMOUNT: `${eur(input.amount, cur)} ${input.frequency}`,
        STARTS: input.starts_on,
        'NEXT RENEWAL': next,
      },
      payload: { client_id: r.client.id, job_id: input.job_id ?? null, service: input.service, amount: input.amount, currency: cur, frequency: input.frequency, starts_on: input.starts_on, next_renewal: next },
      dedupeKey: `${r.client.id}:${input.service.toLowerCase()}`,
    }
  },
  async execute(ctx, payload, approvalId) {
    const p = payload as { client_id: string; job_id: string | null; service: string; amount: number; currency: string; frequency: 'monthly' | 'quarterly' | 'yearly'; starts_on: string; next_renewal: string }
    const rows = await ctx.sql`
      INSERT INTO os_recurring (client_id, job_id, service, amount, currency, frequency, starts_on, next_renewal)
      VALUES (${p.client_id}, ${p.job_id}, ${p.service}, ${p.amount}, ${p.currency}, ${p.frequency}, ${p.starts_on}, ${p.next_renewal})
      RETURNING id` as { id: string }[]
    ctx.committed(`Recorded ${p.service} for the client`)
    await writeAudit(ctx.sql, { actor: ctx.actor, channel: ctx.channel, operation: 'recurring.create', entityType: 'recurring', entityId: rows[0].id, after: p, approvalId, payloadHash: payloadHash('recurring.create', payload), outcome: 'succeeded' })
    return { summary: `Recorded ${p.service}: ${eur(p.amount, p.currency)} ${p.frequency}, next renewal ${p.next_renewal}.` }
  },
}

const recurringShowInput = v.object({ due_within_days: v.optional(v.integer({ min: 0, max: 365 })) })

export const recurringShow: CapabilityDefinition<ReturnType<typeof recurringShowInput.parse>> = {
  id: 'recurring.show',
  family: 'FINANCE',
  title: 'Show recurring revenue',
  description: 'Active recurring services, monthly recurring revenue per currency, and renewals due soon.',
  risk: 'GREEN',
  input: recurringShowInput,
  async run(ctx, input) {
    const rows = await ctx.sql`
      SELECT r.id, r.service, r.amount, r.currency, r.frequency, r.next_renewal::text AS next_renewal, c.name, c.company
      FROM os_recurring r JOIN os_clients c ON c.id = r.client_id WHERE r.status = 'active' ORDER BY r.next_renewal NULLS LAST` as
      { id: string; service: string; amount: string; currency: string; frequency: 'monthly' | 'quarterly' | 'yearly'; next_renewal: string | null; name: string; company: string | null }[]
    const mrr: PerCurrency = {}
    for (const r of rows) mrr[r.currency] = Math.round(((mrr[r.currency] ?? 0) + monthlyEquivalent(Number(r.amount), r.frequency)) * 100) / 100
    const until = addDays(ctx.today, input.due_within_days ?? 30)
    const due = rows.filter((r) => r.next_renewal && r.next_renewal <= until)
    return {
      summary: rows.length
        ? `${rows.length} active recurring service(s): ${formatPerCurrency(mrr)} per month. ${due.length} renewal(s) due by ${until}.`
        : 'No recurring services recorded yet.',
      lines: [
        ...due.map((r) => `RENEWS ${r.next_renewal} · ${r.company ?? r.name} · ${r.service} · ${eur(r.amount, r.currency)} ${r.frequency}`),
        ...rows.filter((r) => !due.includes(r)).slice(0, 10).map((r) => `${r.company ?? r.name} · ${r.service} · ${eur(r.amount, r.currency)} ${r.frequency}`),
      ],
      data: { mrr },
    }
  },
}

/* ── upsell.suggest ─────────────────────────────────────────────────────── */

const upsellInput = v.object({ client_id: v.optional(v.uuid()), query: v.optional(v.string({ max: 200 })) })

export const upsellSuggest: CapabilityDefinition<ReturnType<typeof upsellInput.parse>> = {
  id: 'upsell.suggest',
  family: 'REPORTING',
  title: 'Upsell ideas',
  description: 'Legitimate next offers derived from recorded facts about clients (no maintenance, open incidents, completed project with nothing recurring). Suggestions only.',
  risk: 'GREEN',
  input: upsellInput,
  async run(ctx, input) {
    let clients: ClientRow[]
    if (input.client_id || input.query) {
      const r = await resolveClient(ctx.sql, input)
      if ('result' in r) return r.result
      clients = [r.client]
    } else {
      clients = await ctx.sql`SELECT * FROM os_clients WHERE status = 'active' ORDER BY created_at DESC LIMIT 100` as ClientRow[]
    }
    const ids = clients.map((c) => c.id)
    if (!ids.length) return { summary: 'No clients yet.' }
    const [jobs, recurring, incidents] = await Promise.all([
      ctx.sql`SELECT client_id, title, stage, domain FROM os_jobs WHERE client_id = ANY(${ids})`,
      ctx.sql`SELECT client_id, service FROM os_recurring WHERE client_id = ANY(${ids}) AND status = 'active'`,
      ctx.sql`SELECT client_id, count(*)::int AS n FROM os_incidents WHERE client_id = ANY(${ids}) AND created_at > now() - interval '180 days' GROUP BY client_id`,
    ]) as [{ client_id: string; title: string; stage: string; domain: string | null }[], { client_id: string; service: string }[], { client_id: string; n: number }[]]
    const ideas: string[] = []
    for (const c of clients) {
      const cj = jobs.filter((j) => j.client_id === c.id)
      const cr = recurring.filter((r) => r.client_id === c.id)
      const ci = incidents.find((i) => i.client_id === c.id)?.n ?? 0
      const name = clientLabel(c)
      const delivered = cj.filter((j) => ['completed', 'invoiced'].includes(j.stage))
      if (delivered.length && !cr.length) ideas.push(`${name}: project “${delivered[0].title}” delivered, no maintenance or hosting contract on record → offer maintenance.`)
      if (ci >= 2 && !cr.some((r) => /monitor|wartung|maint|support/i.test(r.service))) ideas.push(`${name}: ${ci} incidents in 6 months and no support/monitoring contract → offer monitoring & support.`)
      if (cj.some((j) => j.domain) && !cr.some((r) => /host/i.test(r.service))) ideas.push(`${name}: a domain is recorded but no hosting contract → check who hosts it.`)
    }
    return {
      summary: ideas.length ? `${ideas.length} upsell idea(s) from what is on record. Nothing has been sent.` : 'No upsell ideas from the recorded facts.',
      lines: ideas.slice(0, 12),
    }
  },
}

export const OPERATIONS_CAPABILITIES: AnyCapability[] = [
  projectStatus, projectUpdate, fileAttach, fileList, incidentCreate, incidentUpdate, incidentList,
  recurringCreate, recurringShow, upsellSuggest,
]
