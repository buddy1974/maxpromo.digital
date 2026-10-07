/**
 * lib/commercial/capabilities/documents.ts
 *
 * Angebote and Rechnungen through the OS's own document system — the same
 * numbering allocator, the same identity, the same email builders and the same
 * line-item provenance guard as the OS screens. There is no second numbering
 * system and no second document template here (ADR-0018).
 *
 * TAX. Maxpromo Digital is a Kleinunternehmer (§19 UStG). Nothing here
 * calculates, prints or infers VAT. The clause itself is part of the document
 * identity and is rendered by the existing builders.
 *
 * WHAT IS GREEN, WHAT IS AMBER
 *
 *   creating a draft Angebot or Rechnung      GREEN  — a numbered draft is an
 *     internal record; numbering it at creation is the OS's existing rule
 *     (a number is allocated when a document is saved).
 *   sending an Angebot or Rechnung            AMBER
 *   accepting an Angebot (won, client, project) AMBER
 *   recording a payment / marking paid        AMBER
 *   sending a payment reminder                AMBER
 *
 * A send is bound to the document as it was when prepared: if the Angebot or
 * Rechnung is edited in the OS afterwards, the old approval refuses to send it.
 */

import { sendEmail } from '@/lib/email'
import { matchExistingClient } from '@/lib/documents/client-match'
import { nextAngebotNumber, nextInvoiceNumber } from '@/lib/documents/allocate'
import { admitLineItems } from '@/lib/documents/extraction-guard'
import { buildAngebotEmail, buildInvoiceEmail, DOCUMENT_FROM_EMAIL, type AngebotRow } from '@/lib/documents/emails'
import { buildEmailBankBlockHtml, buildEmailFooterHtml, escHtml } from '@/lib/documents/emailHtml'
import { getLabels } from '@/lib/documents/labels'
import { fmtCurrency, fmtDocDate, splitClientName } from '@/lib/documents/format'
import type { CurrencyCode, DocumentLanguage } from '@/lib/documents/config'
import { writeAudit } from '../audit'
import { invoiceBalance, isoDate, receivables, formatPerCurrency, addPeriod, type InvoiceForMoney } from '../money'
import {
  addDays, documentClientName, eur, focus, getClient, leadLabel, logActivity, resolveLead, searchClients,
  type ClientRow, type LeadRow,
} from '../records'
import { payloadHash, sha256Hex, stableStringify } from '../signing'
import {
  CapabilityRefusal, UncertainOutcome,
  type CapabilityContext, type AnyCapability, type CapabilityDefinition, type CapabilityResult,
} from '../types'
import { v } from '../validate'

/* ── shared ─────────────────────────────────────────────────────────────── */

interface StoredLine { description: string; qty: number; unit?: string; unit_price?: number; total: number; isFixedPrice?: boolean }

interface AngebotFull extends AngebotRow {
  client_id: string | null
  lead_id: string | null
  job_id: string | null
  accepted_at: string | null
  payment_method: string
}

interface InvoiceRow {
  id: string
  invoice_number: string
  client_id: string | null
  client_name: string
  client_email: string | null
  client_address: string | null
  line_items: StoredLine[]
  subtotal: string
  total: string
  status: string
  due_date: Date | string | null
  paid_date: Date | string | null
  sent_at: Date | null
  created_at: Date
  notes: string | null
  anzahlung: string | null
  anzahlung_date: Date | string | null
  anzahlung_method: string | null
  restbetrag: string | null
  currency: string
  language: DocumentLanguage
  angebot_id: string | null
  job_id: string | null
  kind: string
  paid_amount?: string
}

/** What a send is bound to: the document's content, not its id alone. */
function documentVersion(row: { line_items: unknown; total: unknown; client_name: unknown; client_email: unknown; client_address?: unknown; notes?: unknown; status?: unknown }): string {
  return sha256Hex(stableStringify({
    l: row.line_items, t: String(row.total), n: row.client_name, e: row.client_email, a: row.client_address ?? null, o: row.notes ?? null,
  })).slice(0, 16)
}

async function getAngebot(ctx: CapabilityContext, id: string): Promise<AngebotFull> {
  const rows = await ctx.sql`SELECT * FROM os_angebote WHERE id = ${id}` as AngebotFull[]
  if (!rows.length) throw new CapabilityRefusal('No Angebot with that id.', 'not_found')
  return rows[0]
}

async function getInvoice(ctx: CapabilityContext, id: string): Promise<InvoiceRow> {
  const rows = await ctx.sql`
    SELECT i.*, coalesce((SELECT sum(amount) FROM os_payments p WHERE p.invoice_id = i.id), 0)::text AS paid_amount
    FROM os_invoices i WHERE i.id = ${id}` as InvoiceRow[]
  if (!rows.length) throw new CapabilityRefusal('No invoice with that id.', 'not_found')
  return rows[0]
}

async function resolveAngebot(ctx: CapabilityContext, ref: { angebot_id?: string; number?: string; query?: string }): Promise<{ row: AngebotFull } | { result: CapabilityResult }> {
  if (ref.angebot_id) return { row: await getAngebot(ctx, ref.angebot_id) }
  if (ref.number) {
    const rows = await ctx.sql`SELECT * FROM os_angebote WHERE upper(angebot_number) = upper(${ref.number})` as AngebotFull[]
    if (rows.length === 1) return { row: rows[0] }
    return { result: { summary: `No Angebot numbered ${ref.number}.` } }
  }
  if (!ref.query) throw new CapabilityRefusal('Which Angebot? Give its number or the client.')
  const q = `%${ref.query.toLowerCase()}%`
  const rows = await ctx.sql`SELECT * FROM os_angebote WHERE lower(client_name) LIKE ${q} OR lower(angebot_number) LIKE ${q}
                             ORDER BY created_at DESC LIMIT 6` as AngebotFull[]
  if (rows.length === 1) return { row: rows[0] }
  if (!rows.length) return { result: { summary: `No Angebot matches “${ref.query}”.` } }
  return { result: { summary: `${rows.length} Angebote match. Which one?`, choices: rows.map((a) => ({ id: a.id, kind: 'angebot' as const, label: `${a.angebot_number} · ${a.client_name} · ${eur(a.total, a.currency ?? 'EUR')} · ${a.status}` })) } }
}

async function resolveInvoice(ctx: CapabilityContext, ref: { invoice_id?: string; number?: string; query?: string }): Promise<{ row: InvoiceRow } | { result: CapabilityResult }> {
  if (ref.invoice_id) return { row: await getInvoice(ctx, ref.invoice_id) }
  let ids: { id: string; invoice_number: string; client_name: string; total: string; currency: string; status: string }[]
  if (ref.number) {
    ids = await ctx.sql`SELECT id, invoice_number, client_name, total, currency, status FROM os_invoices WHERE upper(invoice_number) = upper(${ref.number})` as typeof ids
  } else if (ref.query) {
    const q = `%${ref.query.toLowerCase()}%`
    ids = await ctx.sql`SELECT id, invoice_number, client_name, total, currency, status FROM os_invoices
                        WHERE lower(client_name) LIKE ${q} OR lower(invoice_number) LIKE ${q} ORDER BY created_at DESC LIMIT 6` as typeof ids
  } else throw new CapabilityRefusal('Which invoice? Give its number or the client.')
  if (ids.length === 1) return { row: await getInvoice(ctx, ids[0].id) }
  if (!ids.length) return { result: { summary: `No invoice matches “${ref.number ?? ref.query}”.` } }
  return { result: { summary: `${ids.length} invoices match. Which one?`, choices: ids.map((i) => ({ id: i.id, kind: 'invoice' as const, label: `${i.invoice_number} · ${i.client_name} · ${eur(i.total, i.currency)} · ${i.status}` })) } }
}

function docLanguage(lang: string | null | undefined): DocumentLanguage {
  return lang === 'en' ? 'en' : 'de'
}

function addressOf(c: ClientRow | null): string | null {
  if (!c) return null
  const cityLine = [c.postcode, c.city].filter(Boolean).join(' ')
  const lines = [c.address, cityLine, c.country && c.country !== 'Deutschland' ? c.country : null].filter(Boolean)
  return lines.length ? lines.join('\n') : null
}

async function sendDocumentEmail(p: { to: string[]; subject: string; html: string; approvalId: string; what: string }) {
  let result: Awaited<ReturnType<typeof sendEmail>>
  try {
    result = await sendEmail({
      to: p.to, from: DOCUMENT_FROM_EMAIL, replyTo: 'info@maxpromo.digital', subject: p.subject, html: p.html,
      bcc: ['info@maxpromo.digital'], idempotencyKey: `approval-${p.approvalId}`,
    })
  } catch (err) {
    throw new UncertainOutcome(`${p.what} may or may not have been sent: the mail provider did not answer (${err instanceof Error ? err.message : 'network'}).`)
  }
  if (!result.success) throw new CapabilityRefusal(`${p.what} was not sent: ${result.error ?? 'the provider refused it'}. Its status was not changed.`)
  return result
}

function deliveryNote(id: string | undefined): string {
  return id === 'evidence-sink' || id === 'dev-mock' ? ` (${id}: this environment does not deliver mail)` : ''
}

/* ── proposal.create ────────────────────────────────────────────────────── */

const itemInput = v.object({
  description: v.string({ max: 300 }),
  amount: v.optional(v.number({ min: 0, max: 1_000_000 })),
  qty: v.optional(v.number({ min: 0.01, max: 10_000 })),
  unit: v.optional(v.string({ max: 20 })),
  /** "Maintenance 49 monthly" — stated beside the one-off total, never added to it. */
  recurring: v.optional(v.enumOf(['monthly', 'quarterly', 'yearly'] as const)),
})

const proposalInput = v.object({
  lead_id: v.optional(v.uuid()),
  client_id: v.optional(v.uuid()),
  query: v.optional(v.string({ max: 200 })),
  items: v.array(itemInput, { min: 1, max: 30 }),
  /** The agreed one-off price, when Marcel states a total rather than prices per item. */
  total_agreed: v.optional(v.number({ min: 0, max: 10_000_000 })),
  valid_days: v.optional(v.integer({ min: 1, max: 180 })),
  language: v.optional(v.enumOf(['de', 'en'] as const)),
  currency: v.optional(v.enumOf(['EUR', 'GBP'] as const)),
  notes: v.optional(v.string({ max: 2000 })),
  payment_terms: v.optional(v.string({ max: 500 })),
  client_email: v.optional(v.email()),
})

const RECURRING_LABEL = {
  de: { monthly: 'monatlich', quarterly: 'vierteljährlich', yearly: 'jährlich' },
  en: { monthly: 'per month', quarterly: 'per quarter', yearly: 'per year' },
} as const

export const proposalCreate: CapabilityDefinition<ReturnType<typeof proposalInput.parse>> = {
  id: 'proposal.create',
  family: 'PROPOSAL',
  title: 'Create an Angebot',
  description: 'Creates a numbered draft Angebot for a lead or client from stated items and prices. Never invents a price or a split.',
  risk: 'GREEN',
  input: proposalInput,
  async run(ctx, input) {
    let lead: LeadRow | null = null
    let client: ClientRow | null = null
    if (input.client_id) client = await getClient(ctx.sql, input.client_id)
    else {
      const r = await resolveLead(ctx.sql, input)
      if ('result' in r) {
        if (input.query) {
          const cs = await searchClients(ctx.sql, input.query)
          if (cs.length === 1) client = cs[0]
          else return r.result
        } else return r.result
      } else {
        lead = r.lead
        if (lead.client_id) client = await getClient(ctx.sql, lead.client_id)
      }
    }

    const oneOff = input.items.filter((i) => !i.recurring)
    const recurring = input.items.filter((i) => i.recurring)
    const priced = oneOff.filter((i) => i.amount !== undefined)
    let lines: StoredLine[]
    if (oneOff.length === 0) throw new CapabilityRefusal('An Angebot needs at least one one-off item. Recurring services are stated beside it.')
    if (priced.length === oneOff.length) {
      lines = oneOff.map((i) => {
        const qty = i.qty ?? 1
        return { description: i.description, qty, unit: i.unit ?? (qty === 1 ? 'Pauschal' : 'Stk.'), unit_price: i.amount!, total: Math.round(i.amount! * qty * 100) / 100, isFixedPrice: qty === 1 }
      })
      const sum = lines.reduce((s, l) => s + l.total, 0)
      if (input.total_agreed !== undefined && Math.abs(sum - input.total_agreed) > 0.009) {
        throw new CapabilityRefusal(`The item prices add up to ${eur(sum)}, but the agreed total is ${eur(input.total_agreed)}. Which is right?`)
      }
    } else if (priced.length === 0 && input.total_agreed !== undefined) {
      /* A package at an agreed price. The items are named together on one
         line; no per-item split is invented. */
      lines = [{ description: oneOff.map((i) => i.description).join(', '), qty: 1, unit: 'Pauschal', unit_price: input.total_agreed, total: input.total_agreed, isFixedPrice: true }]
    } else {
      throw new CapabilityRefusal('Some items have a price and some do not. Give a price for each, or one agreed total for all.')
    }

    const admitted = admitLineItems(lines)
    if (admitted.held.length > 0) throw new CapabilityRefusal('Line items hold content the source does not support.')
    const total = Math.round(lines.reduce((s, l) => s + l.total, 0) * 100) / 100
    const language: DocumentLanguage = input.language ?? docLanguage(lead?.language)
    const currency = input.currency ?? (lead?.currency === 'GBP' ? 'GBP' : 'EUR')
    const recurringNote = recurring.map((r) =>
      language === 'de'
        ? `${r.description}: ${fmtCurrency(r.amount ?? 0, currency)} ${RECURRING_LABEL.de[r.recurring!]} (nicht im Gesamtbetrag enthalten)`
        : `${r.description}: ${fmtCurrency(r.amount ?? 0, currency)} ${RECURRING_LABEL.en[r.recurring!]} (not included in the total)`)
    if (recurring.some((r) => r.amount === undefined)) throw new CapabilityRefusal('A recurring service needs its price.')
    const notes = [input.notes, ...recurringNote].filter(Boolean).join('\n') || null

    const clientName = client ? documentClientName(client.name, client.company) : documentClientName(lead?.name, lead?.company)
    const clientEmail = input.client_email ?? client?.email ?? lead?.email ?? null
    const validUntil = addDays(ctx.today, input.valid_days ?? 30)

    const angebot_number = await nextAngebotNumber()
    const rows = await ctx.sql`
      INSERT INTO os_angebote
        (angebot_number, client_id, lead_id, client_name, client_email, client_address, line_items, subtotal, total,
         status, valid_until, notes, payment_terms, currency, language, payment_method)
      VALUES
        (${angebot_number}, ${client?.id ?? null}, ${lead?.id ?? null}, ${clientName}, ${clientEmail}, ${addressOf(client)},
         ${JSON.stringify(admitted.items)}::jsonb, ${total}, ${total}, 'draft', ${validUntil}, ${notes},
         ${input.payment_terms ?? null}, ${currency}, ${language}, 'bank')
      RETURNING id, angebot_number` as { id: string; angebot_number: string }[]
    const a = rows[0]
    await logActivity(ctx.sql, {
      lead_id: lead?.id, client_id: client?.id, angebot_id: a.id, kind: 'proposal_drafted', actor: ctx.actor, channel: ctx.channel,
      summary: `Angebot ${a.angebot_number} drafted: ${eur(total, currency)}`,
      detail: { recurring: recurring.map((r) => ({ service: r.description, amount: r.amount, frequency: r.recurring })) },
    })
    return {
      summary: `Angebot ${a.angebot_number} drafted for ${clientName}: ${eur(total, currency)}, valid until ${validUntil}. Not sent.`,
      lines: [
        ...lines.map((l) => `${l.description} — ${eur(l.total, currency)}`),
        ...recurringNote,
        clientEmail ? `Send to: ${clientEmail}` : 'No email address on record yet.',
      ],
      focus: [focus('angebot', a.id, a.angebot_number), ...(lead ? [focus('lead', lead.id, leadLabel(lead))] : [])],
      data: { angebot_id: a.id, number: a.angebot_number, total, currency, preview_path: `/os/angebote/${a.id}/print` },
      next: ['Send it', 'Show the Angebot'],
    }
  },
}

/* ── proposal.show / proposal.list ──────────────────────────────────────── */

const angebotRef = {
  angebot_id: v.optional(v.uuid()),
  number: v.optional(v.string({ max: 30 })),
  query: v.optional(v.string({ max: 200 })),
}
const showInput = v.object(angebotRef)

export const proposalShow: CapabilityDefinition<ReturnType<typeof showInput.parse>> = {
  id: 'proposal.show',
  family: 'PROPOSAL',
  title: 'Show an Angebot',
  description: 'Summarises one Angebot and links to its print preview in the OS.',
  risk: 'GREEN',
  input: showInput,
  async run(ctx, input) {
    const r = await resolveAngebot(ctx, input)
    if ('result' in r) return r.result
    const a = r.row
    const cur = (a.currency ?? 'EUR') as CurrencyCode
    return {
      summary: `Angebot ${a.angebot_number} · ${a.client_name} · ${eur(a.total, cur)} · ${a.status}${a.valid_until ? ` · valid until ${isoDate(a.valid_until)}` : ''}`,
      lines: [...(a.line_items ?? []).map((l) => `${l.description} — ${eur(l.total, cur)}`), ...(a.notes ? [a.notes] : [])],
      focus: [focus('angebot', a.id, a.angebot_number)],
      data: { angebot_id: a.id, preview_path: `/os/angebote/${a.id}/print`, client_email: a.client_email },
    }
  },
}

const listInput = v.object({ status: v.optional(v.enumOf(['draft', 'sent', 'accepted', 'rejected', 'expired', 'open'] as const)) })

export const proposalList: CapabilityDefinition<ReturnType<typeof listInput.parse>> = {
  id: 'proposal.list',
  family: 'PROPOSAL',
  title: 'Angebote',
  description: 'Lists Angebote; "open" means sent and waiting for an answer.',
  risk: 'GREEN',
  input: listInput,
  async run(ctx, input) {
    const status = input.status === 'open' ? 'sent' : input.status
    const rows = await ctx.sql`
      SELECT id, angebot_number, client_name, total, currency, status, sent_at, valid_until::text AS valid_until FROM os_angebote
      WHERE (${status ?? null}::text IS NULL OR status = ${status ?? null})
      ORDER BY created_at DESC LIMIT 15` as { id: string; angebot_number: string; client_name: string; total: string; currency: string; status: string; sent_at: Date | null; valid_until: string | null }[]
    return {
      summary: rows.length ? `${rows.length} Angebot(e)${input.status ? ` (${input.status})` : ''}.` : 'No Angebote.',
      lines: rows.map((a) => `${a.angebot_number} · ${a.client_name} · ${eur(a.total, a.currency)} · ${a.status}${a.sent_at ? ` · sent ${isoDate(a.sent_at)}` : ''}${a.status === 'sent' && a.valid_until && a.valid_until < ctx.today ? ' · EXPIRED' : ''}`),
      choices: rows.slice(0, 8).map((a) => ({ id: a.id, kind: 'angebot' as const, label: `${a.angebot_number} · ${a.client_name}` })),
    }
  },
}

/* ── proposal.send ──────────────────────────────────────────────────────── */

const proposalSendInput = v.object({ ...angebotRef, to: v.optional(v.array(v.email(), { min: 1, max: 3 })) })

export const proposalSend: CapabilityDefinition<ReturnType<typeof proposalSendInput.parse>> = {
  id: 'proposal.send',
  family: 'PROPOSAL',
  title: 'Send an Angebot',
  description: 'Emails one Angebot exactly as stored, marks it sent, moves its lead to Proposal and sets a follow-up.',
  risk: 'AMBER',
  input: proposalSendInput,
  async prepare(ctx, input) {
    const r = await resolveAngebot(ctx, input)
    if ('result' in r) return r.result
    const a = r.row
    if (a.status === 'accepted') throw new CapabilityRefusal(`Angebot ${a.angebot_number} is already accepted.`, 'conflict')
    const to = input.to ?? (a.client_email ? [a.client_email] : [])
    if (!to.length) throw new CapabilityRefusal(`Angebot ${a.angebot_number} has no recipient email. Give one with the send.`)
    const cur = (a.currency ?? 'EUR') as CurrencyCode
    return {
      summary: `Send Angebot ${a.angebot_number} to ${a.client_name}`,
      preview: {
        ACTION: a.status === 'sent' ? 'Send Angebot again' : 'Send Angebot',
        ANGEBOT: a.angebot_number,
        CLIENT: a.client_name,
        TO: to.join(', '),
        TOTAL: eur(a.total, cur),
        'VALID UNTIL': isoDate(a.valid_until) ?? '—',
        COPY: 'info@maxpromo.digital (bcc)',
      },
      payload: { angebot_id: a.id, to, version: documentVersion(a) },
      dedupeKey: a.id,
      expiresInMinutes: 120,
    }
  },
  async execute(ctx, payload, approvalId) {
    const p = payload as { angebot_id: string; to: string[]; version: string }
    const a = await getAngebot(ctx, p.angebot_id)
    if (documentVersion(a) !== p.version) throw new CapabilityRefusal(`Angebot ${a.angebot_number} was changed after this send was prepared. Nothing was sent; prepare it again.`, 'conflict')
    const lang = docLanguage(a.language)
    const result = await sendDocumentEmail({
      to: p.to, subject: getLabels(lang).emailSubjectQuote(a.angebot_number), html: buildAngebotEmail(a),
      approvalId, what: `Angebot ${a.angebot_number}`,
    })
    await ctx.sql`UPDATE os_angebote SET status = 'sent', sent_at = now() WHERE id = ${a.id}`
    await logActivity(ctx.sql, {
      lead_id: a.lead_id, client_id: a.client_id, angebot_id: a.id, kind: 'proposal_sent', channel: 'email', actor: ctx.actor,
      external_ref: result.id ?? null, summary: `Angebot ${a.angebot_number} sent to ${p.to.join(', ')}`, detail: { approval_id: approvalId },
    })
    const followOn = addDays(ctx.today, 5)
    if (a.lead_id) {
      await ctx.sql`UPDATE os_leads SET status = CASE WHEN status IN ('negotiation') THEN status ELSE 'proposal' END,
                    last_interaction_at = now(), next_action = ${`Chase Angebot ${a.angebot_number}`}, next_action_at = ${followOn}, updated_at = now()
                    WHERE id = ${a.lead_id}`
    }
    await ctx.sql`
      INSERT INTO os_followups (due_on, reason, lead_id, angebot_id, unless_reply, actor)
      VALUES (${followOn}, ${`Chase Angebot ${a.angebot_number}`}, ${a.lead_id}, ${a.id}, true, ${ctx.actor})
      ON CONFLICT DO NOTHING`
    await writeAudit(ctx.sql, {
      actor: ctx.actor, channel: ctx.channel, operation: 'proposal.send', entityType: 'angebot', entityId: a.id,
      before: { status: a.status }, after: { status: 'sent' }, approvalId, payloadHash: payloadHash('proposal.send', payload),
      outcome: 'succeeded', externalRef: result.id,
    })
    return {
      summary: `Angebot ${a.angebot_number} sent to ${p.to.join(', ')}${deliveryNote(result.id)}. Follow-up set for ${followOn}.`,
      focus: [focus('angebot', a.id, a.angebot_number)],
    }
  },
}

/* ── proposal.accept ────────────────────────────────────────────────────── */

const acceptInput = v.object({
  ...angebotRef,
  /** Link to this existing client instead of the one the OS would choose or create. */
  client_id: v.optional(v.uuid()),
  project_title: v.optional(v.string({ max: 200 })),
  due_date: v.optional(v.date()),
})

export const proposalAccept: CapabilityDefinition<ReturnType<typeof acceptInput.parse>> = {
  id: 'proposal.accept',
  family: 'PROPOSAL',
  title: 'They accepted',
  description: 'Records an Angebot as accepted: lead won, client created or linked, project created with the Angebot’s scope and value, recurring services recorded.',
  risk: 'AMBER',
  input: acceptInput,
  async prepare(ctx, input) {
    const r = await resolveAngebot(ctx, input)
    if ('result' in r) return r.result
    const a = r.row
    if (a.status === 'accepted') {
      const job = a.job_id ? (await ctx.sql`SELECT title FROM os_jobs WHERE id = ${a.job_id}` as { title: string }[])[0] : null
      return { summary: `Angebot ${a.angebot_number} is already accepted${job ? `; project “${job.title}” exists` : ''}. Nothing to do.`, focus: [focus('angebot', a.id, a.angebot_number)] }
    }
    if (['rejected', 'expired'].includes(a.status)) throw new CapabilityRefusal(`Angebot ${a.angebot_number} is ${a.status}. Reopen it in the OS first.`)

    const lead = a.lead_id ? (await ctx.sql`SELECT * FROM os_leads WHERE id = ${a.lead_id}` as LeadRow[])[0] ?? null : null
    /* Which client. Explicit beats linked beats an exact match; anything
       ambiguous is asked, never chosen. */
    let clientId: string | null = input.client_id ?? a.client_id ?? lead?.client_id ?? null
    let clientLine: string
    let newClient: Record<string, string | null> | null = null
    if (clientId) {
      const c = await getClient(ctx.sql, clientId)
      clientLine = `Existing client: ${c.company ?? c.name}`
    } else {
      const { name, company } = splitClientName(a.client_name)
      const all = await ctx.sql`SELECT id, name, company, email FROM os_clients` as { id: string; name: string; company: string | null; email: string | null }[]
      const m = matchExistingClient({ clientName: name, clientCompany: company || lead?.company || undefined, clientEmail: a.client_email ?? lead?.email ?? undefined }, all)
      if (m.kind === 'linked') {
        clientId = m.client.id
        clientLine = `Existing client: ${m.client.company ?? m.client.name} (matched on ${m.basis})`
      } else if (m.kind === 'ambiguous') {
        return {
          summary: `More than one client could be ${a.client_name}. Which one — or a new client?`,
          choices: m.candidates.map((c) => ({ id: c.id, kind: 'client' as const, label: c.company ?? c.name ?? c.id })),
          next: ['New client'],
        }
      } else {
        newClient = {
          id: crypto.randomUUID(),
          name: name || company || a.client_name,
          company: company || lead?.company || null,
          email: a.client_email ?? lead?.email ?? null,
          phone: lead?.phone ?? null,
          city: lead?.city ?? null,
        }
        clientLine = `New client: ${newClient.company ?? newClient.name}`
      }
    }

    const drafted = await ctx.sql`SELECT detail FROM os_activities WHERE angebot_id = ${a.id} AND kind = 'proposal_drafted' ORDER BY created_at DESC LIMIT 1` as { detail: { recurring?: { service: string; amount: number; frequency: 'monthly' | 'quarterly' | 'yearly' }[] } }[]
    const recurring = drafted[0]?.detail.recurring ?? []
    const title = input.project_title ?? `${splitClientName(a.client_name).company || splitClientName(a.client_name).name} — ${(a.line_items ?? [])[0]?.description ?? 'Projekt'}`.slice(0, 200)
    const cur = (a.currency ?? 'EUR') as CurrencyCode

    return {
      summary: `Accept Angebot ${a.angebot_number}`,
      preview: {
        ACTION: 'Record acceptance',
        ANGEBOT: `${a.angebot_number} · ${eur(a.total, cur)}`,
        LEAD: lead ? `${leadLabel(lead)} → Won` : 'no lead linked',
        CLIENT: clientLine,
        PROJECT: `${title}${input.due_date ? ` · due ${input.due_date}` : ''}`,
        ...(recurring.length ? { RECURRING: recurring.map((r) => `${r.service} ${eur(r.amount, cur)} ${r.frequency}`).join('; ') } : {}),
        ...(a.status === 'draft' ? { NOTE: 'This Angebot was never sent from the OS.' } : {}),
      },
      payload: {
        angebot_id: a.id, version: documentVersion(a), lead_id: lead?.id ?? null, client_id: clientId, new_client: newClient,
        job_id: crypto.randomUUID(), title, due_date: input.due_date ?? null, recurring,
      },
      dedupeKey: a.id,
    }
  },
  async execute(ctx, payload, approvalId) {
    const p = payload as {
      angebot_id: string; version: string; lead_id: string | null; client_id: string | null
      new_client: { id: string; name: string; company: string | null; email: string | null; phone: string | null; city: string | null } | null
      job_id: string; title: string; due_date: string | null
      recurring: { service: string; amount: number; frequency: 'monthly' | 'quarterly' | 'yearly' }[]
    }
    const a = await getAngebot(ctx, p.angebot_id)
    if (a.status === 'accepted') return { summary: `Angebot ${a.angebot_number} was already accepted.` }
    if (documentVersion(a) !== p.version) throw new CapabilityRefusal(`Angebot ${a.angebot_number} changed after this was prepared. Prepare the acceptance again.`, 'conflict')
    const clientId = p.client_id ?? p.new_client!.id
    const cur = a.currency ?? 'EUR'
    const queries = []
    if (p.new_client) {
      const c = p.new_client
      queries.push(ctx.sql`INSERT INTO os_clients (id, name, company, email, phone, city, notes, status)
        VALUES (${c.id}, ${c.name}, ${c.company}, ${c.email}, ${c.phone}, ${c.city}, ${`Client since Angebot ${a.angebot_number}`}, 'active')`)
    }
    queries.push(ctx.sql`INSERT INTO os_jobs (id, title, client_id, client_name, description, stage, priority, value, due_date, lead_id, angebot_id)
      VALUES (${p.job_id}, ${p.title}, ${clientId}, ${a.client_name},
              ${(a.line_items ?? []).map((l) => `• ${l.description}`).join('\n')}, 'in progress', 'high', ${a.total}, ${p.due_date}, ${p.lead_id}, ${a.id})`)
    queries.push(ctx.sql`UPDATE os_angebote SET status = 'accepted', accepted_at = now(), client_id = ${clientId}, job_id = ${p.job_id} WHERE id = ${a.id} AND status <> 'accepted'`)
    if (p.lead_id) {
      queries.push(ctx.sql`UPDATE os_leads SET status = 'won', client_id = ${clientId}, converted = true, next_action = NULL, next_action_at = NULL,
                           last_interaction_at = now(), updated_at = now() WHERE id = ${p.lead_id}`)
      queries.push(ctx.sql`UPDATE os_followups SET status = 'done', done_at = now() WHERE lead_id = ${p.lead_id} AND status = 'open'`)
    }
    for (const r of p.recurring) {
      queries.push(ctx.sql`INSERT INTO os_recurring (client_id, job_id, service, amount, currency, frequency, starts_on, next_renewal, notes)
        VALUES (${clientId}, ${p.job_id}, ${r.service}, ${r.amount}, ${cur}, ${r.frequency}, ${ctx.today}, ${addPeriod(ctx.today, r.frequency)},
                ${`From Angebot ${a.angebot_number}`})`)
    }
    queries.push(ctx.sql`INSERT INTO os_activities (lead_id, client_id, job_id, angebot_id, kind, summary, detail, actor)
      VALUES (${p.lead_id}, ${clientId}, ${p.job_id}, ${a.id}, 'proposal_accepted', ${`Angebot ${a.angebot_number} accepted: ${eur(a.total, cur)}`},
              ${JSON.stringify({ approval_id: approvalId })}::jsonb, ${ctx.actor})`)
    /* One transaction: either the client, project, stage and links all
       exist, or none of them do. */
    await ctx.sql.transaction(queries)
    await writeAudit(ctx.sql, {
      actor: ctx.actor, channel: ctx.channel, operation: 'proposal.accept', entityType: 'angebot', entityId: a.id,
      before: { status: a.status }, after: { status: 'accepted', client_id: clientId, job_id: p.job_id, new_client: Boolean(p.new_client) },
      approvalId, payloadHash: payloadHash('proposal.accept', payload), outcome: 'succeeded',
    })
    return {
      summary: `Angebot ${a.angebot_number} accepted. ${p.new_client ? 'New client created' : 'Client linked'}, project “${p.title}” created${p.recurring.length ? `, ${p.recurring.length} recurring service(s) recorded` : ''}.`,
      focus: [focus('job', p.job_id, p.title), focus('client', clientId, a.client_name)],
      next: ['Invoice 50% deposit', 'Show the project'],
    }
  },
}

/* ── invoice.create ─────────────────────────────────────────────────────── */

const invoiceInput = v.object({
  angebot_id: v.optional(v.uuid()),
  /** An existing Angebot, by its number. Never the number of the invoice. */
  from_angebot: v.optional(v.string({ max: 30 })),
  job_id: v.optional(v.uuid()),
  client_id: v.optional(v.uuid()),
  kind: v.enumOf(['deposit', 'final', 'standard'] as const),
  percent: v.optional(v.number({ min: 1, max: 100 })),
  items: v.optional(v.array(v.object({ description: v.string({ max: 300 }), amount: v.number({ min: 0, max: 1_000_000 }), qty: v.optional(v.number({ min: 0.01, max: 10_000 })) }), { min: 1, max: 30 })),
  due_days: v.optional(v.integer({ min: 0, max: 90 })),
})

export const invoiceCreate: CapabilityDefinition<ReturnType<typeof invoiceInput.parse>> = {
  id: 'invoice.create',
  family: 'INVOICE',
  title: 'Create a Rechnung',
  description: 'Creates a numbered draft invoice: a deposit or final invoice from an accepted Angebot, or a standard invoice from stated items.',
  risk: 'GREEN',
  input: invoiceInput,
  async run(ctx, input) {
    const dueDate = addDays(ctx.today, input.due_days ?? 14)
    let a: AngebotFull | null = null
    if (input.angebot_id) a = await getAngebot(ctx, input.angebot_id)
    else if (input.from_angebot) {
      const r = await resolveAngebot(ctx, { number: input.from_angebot })
      if ('result' in r) return r.result
      a = r.row
    } else if (input.job_id) {
      const rows = await ctx.sql`SELECT * FROM os_angebote WHERE job_id = ${input.job_id} OR id = (SELECT angebot_id FROM os_jobs WHERE id = ${input.job_id})` as AngebotFull[]
      a = rows[0] ?? null
    }

    let lines: StoredLine[]
    let anzahlung = 0
    let anzahlungDate: string | null = null
    const kind = input.kind
    let clientName: string, clientEmail: string | null, clientAddress: string | null, clientId: string | null
    let currency: string, language: DocumentLanguage, paymentMethod: string
    let jobId: string | null = input.job_id ?? null

    if (kind === 'standard') {
      if (!input.items) throw new CapabilityRefusal('A standard invoice needs its items and prices.')
      const client = input.client_id ? await getClient(ctx.sql, input.client_id) : null
      if (!client && !a) throw new CapabilityRefusal('Which client is this invoice for?')
      lines = input.items.map((i) => ({ description: i.description, qty: i.qty ?? 1, unit: 'Pauschal', unit_price: i.amount, total: Math.round(i.amount * (i.qty ?? 1) * 100) / 100, isFixedPrice: (i.qty ?? 1) === 1 }))
      clientId = client?.id ?? a?.client_id ?? null
      clientName = client ? documentClientName(client.name, client.company) : a!.client_name
      clientEmail = client?.email ?? a?.client_email ?? null
      clientAddress = client ? addressOf(client) : a?.client_address ?? null
      currency = a?.currency ?? 'EUR'; language = docLanguage(a?.language); paymentMethod = a?.payment_method ?? 'bank'
      if (a) { /* a standard invoice is not tied to the Angebot's deposit/final pair */ a = null }
    } else {
      if (!a) throw new CapabilityRefusal('Which Angebot is this invoice for?')
      if (a.status !== 'accepted') throw new CapabilityRefusal(`Angebot ${a.angebot_number} is ${a.status}, not accepted. Record the acceptance first.`)
      clientId = a.client_id; clientName = a.client_name; clientEmail = a.client_email; clientAddress = a.client_address
      currency = a.currency ?? 'EUR'; language = docLanguage(a.language); paymentMethod = a.payment_method ?? 'bank'
      jobId = jobId ?? a.job_id
      const base = Number(a.total)
      if (kind === 'deposit') {
        const pct = input.percent ?? 50
        const amount = Math.round(base * pct) / 100
        const label = language === 'de' ? `Anzahlung ${pct} % gemäß Angebot ${a.angebot_number}` : `Deposit ${pct}% per quotation ${a.angebot_number}`
        lines = [{ description: label, qty: 1, unit: 'Pauschal', unit_price: amount, total: amount, isFixedPrice: true }]
      } else {
        lines = (a.line_items ?? []).map((l) => ({ ...l }))
        const deposits = await ctx.sql`
          SELECT i.id, i.status, i.total, i.paid_date::text AS paid_date,
                 coalesce((SELECT sum(amount) FROM os_payments p WHERE p.invoice_id = i.id), 0)::numeric AS paid,
                 (SELECT max(received_on)::text FROM os_payments p WHERE p.invoice_id = i.id) AS last_paid
          FROM os_invoices i WHERE i.angebot_id = ${a.id} AND i.kind = 'deposit'` as { id: string; status: string; total: string; paid_date: string | null; paid: string; last_paid: string | null }[]
        for (const d of deposits) {
          /* Only money actually received is acknowledged as a deposit on the
             final invoice. An unpaid deposit invoice stays owed on its own. */
          const received = d.status === 'paid' ? Number(d.total) : Number(d.paid)
          anzahlung += received
          anzahlungDate = [anzahlungDate, d.last_paid, d.status === 'paid' ? d.paid_date : null].filter(Boolean).sort().pop() ?? null
        }
        anzahlung = Math.round(anzahlung * 100) / 100
      }
    }

    const admitted = admitLineItems(lines)
    if (admitted.held.length > 0) throw new CapabilityRefusal('Line items hold content the source does not support.')
    const total = Math.round(lines.reduce((s, l) => s + Number(l.total), 0) * 100) / 100
    const restbetrag = Math.round((total - anzahlung) * 100) / 100

    if (a) {
      const existing = await ctx.sql`SELECT id, invoice_number, status FROM os_invoices WHERE angebot_id = ${a.id} AND kind = ${kind}` as { id: string; invoice_number: string; status: string }[]
      if (existing.length) {
        return {
          summary: `${kind === 'deposit' ? 'A deposit' : 'A final'} invoice for Angebot ${a.angebot_number} already exists: ${existing[0].invoice_number} (${existing[0].status}). No second one was created.`,
          focus: [focus('invoice', existing[0].id, existing[0].invoice_number)],
        }
      }
    }

    const invoice_number = await nextInvoiceNumber()
    const rows = await ctx.sql`
      INSERT INTO os_invoices
        (invoice_number, client_id, client_name, client_email, client_address, line_items, subtotal, total, status, due_date,
         anzahlung, anzahlung_date, anzahlung_method, restbetrag, payment_method, currency, language, angebot_id, job_id, kind)
      VALUES
        (${invoice_number}, ${clientId}, ${clientName}, ${clientEmail}, ${clientAddress}, ${JSON.stringify(admitted.items)}::jsonb,
         ${total}, ${total}, 'draft', ${dueDate}, ${anzahlung}, ${anzahlungDate}, ${anzahlung > 0 ? (language === 'de' ? 'Überweisung' : 'Bank transfer') : null},
         ${restbetrag}, ${paymentMethod}, ${currency}, ${language}, ${a?.id ?? null}, ${jobId}, ${kind})
      RETURNING id, invoice_number` as { id: string; invoice_number: string }[]
    const inv = rows[0]
    await logActivity(ctx.sql, {
      client_id: clientId, job_id: jobId, invoice_id: inv.id, angebot_id: a?.id ?? null,
      kind: 'invoice_drafted', actor: ctx.actor, channel: ctx.channel,
      summary: `Rechnung ${inv.invoice_number} (${kind}) drafted: ${eur(restbetrag, currency)} due`,
    }).catch(() => undefined)
    return {
      summary: `Rechnung ${inv.invoice_number} drafted for ${clientName}: ${eur(restbetrag, currency)}${anzahlung ? ` (total ${eur(total, currency)} less ${eur(anzahlung, currency)} received)` : ''}, due ${dueDate}. Not sent.`,
      lines: lines.map((l) => `${l.description} — ${eur(l.total, currency)}`),
      focus: [focus('invoice', inv.id, inv.invoice_number)],
      data: { invoice_id: inv.id, number: inv.invoice_number, preview_path: `/os/invoices/${inv.id}/print` },
      next: ['Send the invoice'],
    }
  },
}

/* ── invoice.send ───────────────────────────────────────────────────────── */

const invoiceRef = {
  invoice_id: v.optional(v.uuid()),
  number: v.optional(v.string({ max: 30 })),
  query: v.optional(v.string({ max: 200 })),
}
const invoiceSendInput = v.object({ ...invoiceRef, to: v.optional(v.array(v.email(), { min: 1, max: 3 })) })

export const invoiceSend: CapabilityDefinition<ReturnType<typeof invoiceSendInput.parse>> = {
  id: 'invoice.send',
  family: 'INVOICE',
  title: 'Send a Rechnung',
  description: 'Issues and emails one invoice exactly as stored, and sets a payment check on its due date.',
  risk: 'AMBER',
  input: invoiceSendInput,
  async prepare(ctx, input) {
    const r = await resolveInvoice(ctx, input)
    if ('result' in r) return r.result
    const i = r.row
    if (['paid', 'cancelled'].includes(i.status)) throw new CapabilityRefusal(`Rechnung ${i.invoice_number} is ${i.status}.`, 'conflict')
    const to = input.to ?? (i.client_email ? [i.client_email] : [])
    if (!to.length) throw new CapabilityRefusal(`Rechnung ${i.invoice_number} has no recipient email. Give one with the send.`)
    const due = isoDate(i.due_date)
    const b = invoiceBalance(i, ctx.today)
    return {
      summary: `Send Rechnung ${i.invoice_number} to ${i.client_name}`,
      preview: {
        ACTION: i.status === 'draft' ? 'Issue and send invoice' : 'Send invoice again',
        RECHNUNG: i.invoice_number,
        CLIENT: i.client_name,
        TO: to.join(', '),
        AMOUNT: eur(b.open || i.restbetrag || i.total, i.currency),
        DUE: due ?? '—',
        ...(due && due < ctx.today ? { WARNING: `The due date ${due} is already past.` } : {}),
        COPY: 'info@maxpromo.digital (bcc)',
      },
      payload: { invoice_id: i.id, to, version: documentVersion(i) },
      dedupeKey: i.id,
      expiresInMinutes: 120,
    }
  },
  async execute(ctx, payload, approvalId) {
    const p = payload as { invoice_id: string; to: string[]; version: string }
    const i = await getInvoice(ctx, p.invoice_id)
    if (documentVersion(i) !== p.version) throw new CapabilityRefusal(`Rechnung ${i.invoice_number} was changed after this send was prepared. Nothing was sent.`, 'conflict')
    const lang = docLanguage(i.language)
    const html = buildInvoiceEmail({
      invoice_number: i.invoice_number, client_name: i.client_name, address: i.client_address ?? undefined,
      date: isoDate(i.created_at) ?? ctx.today, due_date: isoDate(i.due_date) ?? ctx.today,
      line_items: (i.line_items ?? []).map((l) => ({ description: l.description, qty: l.qty, unit_price: Number(l.unit_price ?? l.total), total: Number(l.total) })),
      subtotal: Number(i.subtotal ?? i.total), total: Number(i.total),
      anzahlung: Number(i.anzahlung ?? 0) || undefined, anzahlung_date: isoDate(i.anzahlung_date) ?? undefined,
      anzahlung_method: i.anzahlung_method ?? undefined, restbetrag: i.restbetrag !== null ? Number(i.restbetrag) : undefined,
      currency: i.currency as CurrencyCode, language: lang,
    })
    const result = await sendDocumentEmail({ to: p.to, subject: getLabels(lang).emailSubjectInvoice(i.invoice_number), html, approvalId, what: `Rechnung ${i.invoice_number}` })
    await ctx.sql`UPDATE os_invoices SET status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END, sent_at = now() WHERE id = ${i.id}`
    const check = isoDate(i.due_date) && isoDate(i.due_date)! >= ctx.today ? addDays(isoDate(i.due_date)!, 1) : addDays(ctx.today, 7)
    await ctx.sql`INSERT INTO os_followups (due_on, reason, client_id, invoice_id, actor)
                  VALUES (${check}, ${`Check payment of ${i.invoice_number}`}, ${i.client_id}, ${i.id}, ${ctx.actor}) ON CONFLICT DO NOTHING`
    await logActivity(ctx.sql, {
      client_id: i.client_id, job_id: i.job_id, invoice_id: i.id, kind: 'invoice_sent', channel: 'email', actor: ctx.actor,
      external_ref: result.id ?? null, summary: `Rechnung ${i.invoice_number} sent to ${p.to.join(', ')}`, detail: { approval_id: approvalId },
    }).catch(() => undefined)
    await writeAudit(ctx.sql, {
      actor: ctx.actor, channel: ctx.channel, operation: 'invoice.send', entityType: 'invoice', entityId: i.id,
      before: { status: i.status }, after: { status: i.status === 'draft' ? 'sent' : i.status }, approvalId,
      payloadHash: payloadHash('invoice.send', payload), outcome: 'succeeded', externalRef: result.id,
    })
    return { summary: `Rechnung ${i.invoice_number} sent to ${p.to.join(', ')}${deliveryNote(result.id)}. Payment check set for ${check}.`, focus: [focus('invoice', i.id, i.invoice_number)] }
  },
}

/* ── payment.record ─────────────────────────────────────────────────────── */

const paymentInput = v.object({
  ...invoiceRef,
  /** Omitted means the full open balance — stated in the preview, never assumed silently. */
  amount: v.optional(v.number({ min: 0.01, max: 10_000_000 })),
  received_on: v.optional(v.date()),
  method: v.optional(v.string({ max: 60 })),
  reference: v.optional(v.string({ max: 200 })),
})

export const paymentRecord: CapabilityDefinition<ReturnType<typeof paymentInput.parse>> = {
  id: 'payment.record',
  family: 'PAYMENT',
  title: 'Record a payment',
  description: 'Records money received against one invoice. Marks the invoice paid only when nothing remains open.',
  risk: 'AMBER',
  input: paymentInput,
  async prepare(ctx, input) {
    const r = await resolveInvoice(ctx, input)
    if ('result' in r) return r.result
    const i = r.row
    if (i.status === 'draft') throw new CapabilityRefusal(`Rechnung ${i.invoice_number} is still a draft — it has not been issued.`)
    if (i.status === 'cancelled') throw new CapabilityRefusal(`Rechnung ${i.invoice_number} is cancelled.`)
    const b = invoiceBalance(i, ctx.today)
    if (b.open <= 0) return { summary: `Rechnung ${i.invoice_number} has nothing open. Nothing to record.`, focus: [focus('invoice', i.id, i.invoice_number)] }
    const amount = input.amount ?? b.open
    if (amount > b.open + 0.009) throw new CapabilityRefusal(`${eur(amount, b.currency)} is more than the ${eur(b.open, b.currency)} open on ${i.invoice_number}. Check the amount.`)
    const receivedOn = input.received_on ?? ctx.today
    if (receivedOn > ctx.today) throw new CapabilityRefusal('A payment cannot be received in the future.')
    const after = Math.round((b.open - amount) * 100) / 100
    return {
      summary: `Record ${eur(amount, b.currency)} received on ${i.invoice_number}`,
      preview: {
        ACTION: after === 0 ? 'Record payment and mark PAID' : 'Record part payment',
        RECHNUNG: `${i.invoice_number} · ${i.client_name}`,
        AMOUNT: `${eur(amount, b.currency)}${input.amount === undefined ? ' (the full open balance)' : ''}`,
        RECEIVED: receivedOn,
        'OPEN BEFORE': eur(b.open, b.currency),
        'OPEN AFTER': eur(after, b.currency),
        ...(input.reference ? { REFERENCE: input.reference } : {}),
      },
      payload: { invoice_id: i.id, amount, currency: b.currency, received_on: receivedOn, method: input.method ?? null, reference: input.reference ?? null, open_before: b.open },
      dedupeKey: `${i.id}:${amount}:${receivedOn}`,
    }
  },
  async execute(ctx, payload, approvalId) {
    const p = payload as { invoice_id: string; amount: number; currency: string; received_on: string; method: string | null; reference: string | null; open_before: number }
    const i = await getInvoice(ctx, p.invoice_id)
    const b = invoiceBalance(i, ctx.today)
    if (Math.abs(b.open - p.open_before) > 0.009) {
      throw new CapabilityRefusal(`The open balance on ${i.invoice_number} changed since this was prepared (${eur(p.open_before, b.currency)} → ${eur(b.open, b.currency)}). Nothing was recorded.`, 'conflict')
    }
    const after = Math.round((b.open - p.amount) * 100) / 100
    const queries = [
      ctx.sql`INSERT INTO os_payments (invoice_id, amount, currency, received_on, method, reference, actor, approval_id)
              VALUES (${i.id}, ${p.amount}, ${p.currency}, ${p.received_on}, ${p.method}, ${p.reference}, ${ctx.actor}, ${approvalId})`,
    ]
    if (after === 0) queries.push(ctx.sql`UPDATE os_invoices SET status = 'paid', paid_date = ${p.received_on} WHERE id = ${i.id}`)
    queries.push(ctx.sql`UPDATE os_followups SET status = 'done', done_at = now() WHERE invoice_id = ${i.id} AND status = 'open' AND ${after === 0}`)
    await ctx.sql.transaction(queries)
    await logActivity(ctx.sql, {
      client_id: i.client_id, job_id: i.job_id, invoice_id: i.id, kind: 'payment_received', actor: ctx.actor,
      summary: `${eur(p.amount, p.currency)} received on ${i.invoice_number}${after === 0 ? ' — paid in full' : `, ${eur(after, p.currency)} open`}`,
    }).catch(() => undefined)
    await writeAudit(ctx.sql, {
      actor: ctx.actor, channel: ctx.channel, operation: 'payment.record', entityType: 'invoice', entityId: i.id,
      before: { status: i.status, open: b.open }, after: { status: after === 0 ? 'paid' : i.status, open: after, amount: p.amount },
      approvalId, payloadHash: payloadHash('payment.record', payload), outcome: 'succeeded',
    })
    return { summary: `Recorded ${eur(p.amount, p.currency)} on ${i.invoice_number}. ${after === 0 ? 'Marked PAID.' : `${eur(after, p.currency)} still open.`}`, focus: [focus('invoice', i.id, i.invoice_number)] }
  },
}

/* ── reminder.send ──────────────────────────────────────────────────────── */

const reminderInput = v.object({ ...invoiceRef, to: v.optional(v.array(v.email(), { min: 1, max: 3 })) })

function buildReminderEmail(i: InvoiceRow, open: number, lang: DocumentLanguage): { subject: string; html: string } {
  const cur = i.currency as CurrencyCode
  const { name, company } = splitClientName(i.client_name)
  const greeting = lang === 'de'
    ? (company ? 'Sehr geehrte Damen und Herren,' : `Guten Tag ${escHtml(name)},`)
    : (company ? 'Dear Sir or Madam,' : `Dear ${escHtml(name.split(' ')[0])},`)
  const due = fmtDocDate(isoDate(i.due_date), lang)
  const body = lang === 'de'
    ? `sicher ist es Ihnen im Alltag entgangen: Zu unserer Rechnung Nr. <strong>${escHtml(i.invoice_number)}</strong>, fällig am ${due}, ist ein Betrag von <strong>${fmtCurrency(open, cur)}</strong> noch offen.<br><br>Wir bitten Sie, den Betrag in den nächsten Tagen auf das unten genannte Konto zu überweisen. Sollte sich Ihre Zahlung mit dieser Nachricht überschnitten haben, betrachten Sie sie bitte als gegenstandslos.`
    : `this is a friendly reminder that <strong>${fmtCurrency(open, cur)}</strong> remains open on our invoice no. <strong>${escHtml(i.invoice_number)}</strong>, due on ${due}.<br><br>We would be grateful if you could transfer the amount to the account below in the next few days. If your payment has crossed with this message, please disregard it.`
  const t = getLabels(lang)
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
    <div style="padding:24px 32px;">
      <p style="font-size:14px;margin:0 0 16px;">${greeting}</p>
      <p style="font-size:14px;line-height:1.7;margin:0 0 20px;">${body}</p>
      ${buildEmailBankBlockHtml(i.invoice_number, lang)}
      <p style="font-size:14px;line-height:1.7;">${escHtml(t.closing)}<br><strong>Marcel Akwe</strong><br>MAXPROMO DIGITAL</p>
    </div>
    ${buildEmailFooterHtml(lang)}
  </div>`
  return { subject: lang === 'de' ? `Zahlungserinnerung — Rechnung Nr. ${i.invoice_number}` : `Payment reminder — invoice no. ${i.invoice_number}`, html }
}

export const reminderSend: CapabilityDefinition<ReturnType<typeof reminderInput.parse>> = {
  id: 'reminder.send',
  family: 'PAYMENT',
  title: 'Send a payment reminder',
  description: 'Emails a polite payment reminder for one open invoice, stating only the stored number, open amount and due date.',
  risk: 'AMBER',
  input: reminderInput,
  async prepare(ctx, input) {
    const r = await resolveInvoice(ctx, input)
    if ('result' in r) return r.result
    const i = r.row
    const b = invoiceBalance(i, ctx.today)
    if (b.open <= 0 || ['draft', 'cancelled', 'paid'].includes(b.state)) return { summary: `Rechnung ${i.invoice_number} has nothing to remind about (${b.state}).` }
    const to = input.to ?? (i.client_email ? [i.client_email] : [])
    if (!to.length) throw new CapabilityRefusal(`Rechnung ${i.invoice_number} has no email address on it.`)
    const lang = docLanguage(i.language)
    const email = buildReminderEmail(i, b.open, lang)
    return {
      summary: `Send payment reminder for ${i.invoice_number}`,
      preview: {
        ACTION: 'Send payment reminder',
        TO: to.join(', '),
        SUBJECT: email.subject,
        RECHNUNG: `${i.invoice_number} · ${i.client_name}`,
        OPEN: eur(b.open, b.currency),
        DUE: `${b.dueDate ?? '—'}${b.daysOverdue ? ` (${b.daysOverdue} days overdue)` : ''}`,
      },
      payload: { invoice_id: i.id, to, open: b.open, version: documentVersion(i) },
      dedupeKey: `${i.id}:${ctx.today}`,
      expiresInMinutes: 240,
    }
  },
  async execute(ctx, payload, approvalId) {
    const p = payload as { invoice_id: string; to: string[]; open: number; version: string }
    const i = await getInvoice(ctx, p.invoice_id)
    const b = invoiceBalance(i, ctx.today)
    if (documentVersion(i) !== p.version || Math.abs(b.open - p.open) > 0.009) {
      throw new CapabilityRefusal(`Rechnung ${i.invoice_number} changed since the reminder was prepared (open now ${eur(b.open, b.currency)}). Nothing was sent.`, 'conflict')
    }
    const email = buildReminderEmail(i, b.open, docLanguage(i.language))
    const result = await sendDocumentEmail({ to: p.to, subject: email.subject, html: email.html, approvalId, what: `The reminder for ${i.invoice_number}` })
    const next = addDays(ctx.today, 7)
    await ctx.sql`INSERT INTO os_followups (due_on, reason, client_id, invoice_id, actor)
                  VALUES (${next}, ${`Check payment after reminder for ${i.invoice_number}`}, ${i.client_id}, ${i.id}, ${ctx.actor}) ON CONFLICT DO NOTHING`
    await logActivity(ctx.sql, {
      client_id: i.client_id, job_id: i.job_id, invoice_id: i.id, kind: 'payment_reminder_sent', channel: 'email', actor: ctx.actor,
      external_ref: result.id ?? null, summary: `Payment reminder for ${i.invoice_number} sent to ${p.to.join(', ')}`,
    }).catch(() => undefined)
    await writeAudit(ctx.sql, { actor: ctx.actor, channel: ctx.channel, operation: 'reminder.send', entityType: 'invoice', entityId: i.id, approvalId, payloadHash: payloadHash('reminder.send', payload), outcome: 'succeeded', externalRef: result.id })
    return { summary: `Reminder for ${i.invoice_number} sent${deliveryNote(result.id)}. I will bring it up again on ${next}.` }
  },
}

/* ── receivables & payments views ───────────────────────────────────────── */

const noInput = v.object({})

export async function loadInvoicesForMoney(ctx: CapabilityContext): Promise<InvoiceForMoney[]> {
  return await ctx.sql`
    SELECT i.id, i.invoice_number, i.client_name, i.client_id, i.status, i.total, i.anzahlung, i.restbetrag, i.currency,
           i.due_date::text AS due_date, i.sent_at, i.created_at,
           coalesce((SELECT sum(amount) FROM os_payments p WHERE p.invoice_id = i.id), 0)::text AS paid_amount
    FROM os_invoices i WHERE i.status <> 'cancelled'` as InvoiceForMoney[]
}

export const receivablesShow: CapabilityDefinition<ReturnType<typeof noInput.parse>> = {
  id: 'receivables.show',
  family: 'FINANCE',
  title: 'Who owes me money?',
  description: 'Open balances of issued invoices per currency, overdue first, derived from due dates and recorded payments.',
  risk: 'GREEN',
  input: noInput,
  async run(ctx) {
    const rec = receivables(await loadInvoicesForMoney(ctx), ctx.today)
    const lines = rec.invoices.slice(0, 12).map((b) =>
      `${b.state === 'overdue' ? `OVERDUE ${b.daysOverdue}d` : b.state === 'due' ? `due ${b.dueDate}` : b.state.replace('_', ' ')} · ${b.client} · ${b.number} · ${eur(b.open, b.currency)}`)
    if (rec.drafts.length) lines.push(`${rec.drafts.length} draft invoice(s) not yet sent — not counted as owed`)
    if (rec.reconcile.length) lines.push(`${rec.reconcile.length} invoice(s) need reconciling (status and recorded payments disagree)`)
    return {
      summary: rec.invoices.length
        ? `Outstanding ${formatPerCurrency(rec.outstanding)} on ${rec.invoices.length} invoice(s); overdue ${formatPerCurrency(rec.overdue)}.`
        : 'Nobody owes you money on an issued invoice.',
      lines,
      choices: rec.overdueInvoices.slice(0, 6).map((b) => ({ id: b.id, kind: 'invoice' as const, label: `${b.number} · ${b.client}` })),
      data: { outstanding: rec.outstanding, overdue: rec.overdue },
      next: rec.overdueInvoices.length ? ['Prepare reminders'] : undefined,
    }
  },
}

const paymentsInput = v.object({ from: v.optional(v.date()), to: v.optional(v.date()) })

export const paymentsList: CapabilityDefinition<ReturnType<typeof paymentsInput.parse>> = {
  id: 'payments.list',
  family: 'FINANCE',
  title: 'What money came in?',
  description: 'Payments recorded in a period (default: this month), per currency.',
  risk: 'GREEN',
  input: paymentsInput,
  async run(ctx, input) {
    const from = input.from ?? `${ctx.today.slice(0, 7)}-01`
    const to = input.to ?? ctx.today
    const rows = await ctx.sql`
      SELECT p.amount, p.currency, p.received_on::text AS received_on, i.invoice_number, i.client_name
      FROM os_payments p JOIN os_invoices i ON i.id = p.invoice_id
      WHERE p.received_on BETWEEN ${from} AND ${to} ORDER BY p.received_on DESC` as { amount: string; currency: string; received_on: string; invoice_number: string; client_name: string }[]
    /* Invoices marked paid in the OS screens before payments were recorded
       as rows are counted too, at their paid date, so the month is complete. */
    const legacy = await ctx.sql`
      SELECT coalesce(restbetrag, total) AS amount, currency, paid_date::text AS received_on, invoice_number, client_name
      FROM os_invoices i WHERE status = 'paid' AND paid_date BETWEEN ${from} AND ${to}
        AND NOT EXISTS (SELECT 1 FROM os_payments p WHERE p.invoice_id = i.id)` as typeof rows
    const all = [...rows, ...legacy]
    const totals: Record<string, number> = {}
    for (const r of all) totals[r.currency] = Math.round(((totals[r.currency] ?? 0) + Number(r.amount)) * 100) / 100
    return {
      summary: all.length ? `Received ${formatPerCurrency(totals)} between ${from} and ${to} (${all.length} payment(s)).` : `No payments recorded between ${from} and ${to}.`,
      lines: all.map((r) => `${r.received_on} · ${r.client_name} · ${r.invoice_number} · ${eur(r.amount, r.currency)}`),
      data: { totals, from, to },
    }
  },
}

export const DOCUMENT_CAPABILITIES: AnyCapability[] = [
  proposalCreate, proposalShow, proposalList, proposalSend, proposalAccept,
  invoiceCreate, invoiceSend, paymentRecord, reminderSend, receivablesShow, paymentsList,
]

