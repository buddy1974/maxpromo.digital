/**
 * lib/max/max.ts — Universal Max: capture → understand → ground → propose, and the governed path
 * from a confirmed proposal to its capability (ADR-0029). SERVER ONLY.
 *
 *   capture()  Marcel's words (typed, pasted or a voice transcript he has seen) and optionally one
 *              file. A question goes to Ask Max (lib/commercial/ask.ts) and changes nothing. An action
 *              becomes proposals, each grounded and stored. NOTHING EXECUTES HERE.
 *   act()      Marcel's decision on one stored proposal: edit, choose a candidate, reject, confirm —
 *              and for AMBER capabilities, approve the capability's own preview. Execution runs the
 *              type's registered capability through the engine (runCapability / executeApproval),
 *              only for the payload whose hash Marcel's preview carried, at most once.
 *   history()  recent interactions with their proposals and results.
 *
 * Files are ephemeral: read in memory for this request, never stored here (a client document is
 * stored only when Marcel keeps it on a created client, through the client documents route).
 */
import { createHash } from 'node:crypto'
import { resolveRoute } from '@maxpromo/ai'
import { ask, questionLanguage } from '@/lib/commercial/ask'
import { executeApproval, rejectApproval, runCapability } from '@/lib/commercial/engine'
import { writeAudit } from '@/lib/commercial/audit'
import { stableStringify } from '@/lib/commercial/signing'
import { berlinDate } from '@/lib/commercial/money'
import type { CapabilityContext, CapabilityResult, FocusRef, Sql } from '@/lib/commercial/types'
import { attachableType } from '@/lib/mail/draftAttachments'
import { extractClientCandidate, type ClientCandidate } from '@/lib/clients/extract'
import type { Fields, GroundCtx, Grounded, Lang, MaxContext, MaxEnvelope, ModelAction } from './contract'
import { contextSummary, verifyContext } from './context'
import { MAX_COPY } from './copy'
import { UUID, validDate, num, str, EMAIL } from './ground'
import { looksLikeInstructions, proposalType } from './proposals'
import { understand, UnderstandingUnavailable } from './understand'

export const MAX_FILE_BYTES = 4 * 1024 * 1024
const READABLE = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const TEXTUAL = new Set(['text/plain', 'text/csv'])
/** A proposal waits this long for Marcel; after that it is shown as expired and runs nothing. */
const PROPOSAL_HOURS = 24
/** With a document but no instruction, or when a document holds instructions, only these. */
const CAPTURE_ONLY = new Set(['CLIENT_CREATE', 'LEAD_CREATE'])

export interface CaptureInput {
  actor: string
  text: string
  inputKind: 'text' | 'voice' | 'file'
  file?: { filename: string; bytes: Uint8Array } | null
  envelope: MaxEnvelope
  screenLanguage: Lang
}

export interface ProposalView {
  id: string
  type: string
  title: string
  summary: string
  status: string
  confirmation: string
  capability: string
  payloadHash: string
  grounded: Omit<Grounded, 'input'>
  approval?: { summary: string; preview: [string, string][]; payloadHash: string; expiresAt: string }
  result?: { summary: string; links: { label: string; href: string }[]; error?: boolean }
  createdAt: string
}

export interface InteractionView {
  id: string
  createdAt: string
  input: string
  inputKind: string
  file: { name: string; type: string; size: number } | null
  context: Record<string, unknown>
  outcome: 'answer' | 'proposals' | 'clarify' | 'refused' | 'failed'
  reply: { text?: string; facts?: string[]; links?: { label: string; href: string }[]; phrased?: boolean; notes?: string[] }
  proposals: ProposalView[]
}

function capContext(sql: Sql, actor: string, lang: Lang, now = new Date()): CapabilityContext {
  return { sql, actor, channel: 'os-max', now, today: berlinDate(now), committed: () => {}, language: lang }
}

export const hashOf = (type: string, capability: string, input: unknown) =>
  createHash('sha256').update(`${type}\n${capability}\n${stableStringify(input ?? null)}`).digest('hex')

const log = (event: string, data: Record<string, unknown>) => console.info(`[max] ${event} ${JSON.stringify(data)}`)

/* ── capture ─────────────────────────────────────────────────────────────── */

/** Seams for the proofs: the model steps can be replaced; everything else is the real path. */
export interface CaptureDeps { understand?: typeof understand; extract?: typeof extractClientCandidate; hasModel?: () => boolean }

export async function capture(sql: Sql, input: CaptureInput, deps: CaptureDeps = {}): Promise<InteractionView> {
  const understandFn = deps.understand ?? understand
  const extract = deps.extract ?? extractClientCandidate
  const hasModel = deps.hasModel ?? (() => Boolean(resolveRoute()))
  const started = Date.now()
  const requestId = crypto.randomUUID()
  const text = input.text.trim().slice(0, 4000)
  const context = await verifyContext(sql, input.envelope)
  const lang: Lang = text ? questionLanguage(text, input.screenLanguage) : input.screenLanguage
  const copy = MAX_COPY[lang]
  const ctx = capContext(sql, input.actor, lang)

  /* The file, read once in memory. Type by bytes; Office files are kept out of the model. */
  let fileMeta: { name: string; type: string; size: number; sha256: string } | null = null
  let document: Parameters<typeof understand>[0]['document'] = null
  let documentText: string | null = null
  let extraction: Promise<ClientCandidate | null> = Promise.resolve(null)
  if (input.file) {
    const type = attachableType(input.file.filename, input.file.bytes)
    if (!type || input.file.bytes.byteLength > MAX_FILE_BYTES) {
      return record(sql, input, context, lang, { outcome: 'refused', reply: { text: notReadable(lang) } }, null, started, requestId)
    }
    fileMeta = { name: input.file.filename, type, size: input.file.bytes.byteLength, sha256: createHash('sha256').update(input.file.bytes).digest('hex') }
    if (READABLE.has(type)) {
      const data = Buffer.from(input.file.bytes).toString('base64')
      document = type === 'application/pdf' ? { kind: 'pdf', mediaType: type, data } : { kind: 'image', mediaType: type, data }
      /* The contact in a document comes from the one extraction contract. Started now, used only
         if a client or lead is proposed. */
      extraction = extract({ filename: input.file.filename, bytes: input.file.bytes }).catch(() => null)
    } else if (TEXTUAL.has(type)) {
      documentText = new TextDecoder().decode(input.file.bytes).slice(0, 20_000)
      document = { kind: 'text', text: documentText }
      extraction = extract({ text: documentText }).catch(() => null)
    } else {
      return record(sql, input, context, lang, { outcome: 'refused', reply: { text: copy === MAX_COPY.de ? 'Word-, Excel- und PowerPoint-Dateien kann Max noch nicht lesen. Hänge sie im Kundenprofil als Dokument an oder schicke ein PDF.' : 'Max cannot read Word, Excel or PowerPoint files yet. Attach them to a client as a document, or send a PDF.' } }, fileMeta, started, requestId)
    }
  }

  if (!hasModel()) {
    /* No model: questions are still answered from the records (keyword routing); nothing else. */
    if (text && !input.file) {
      const a = await ask(ctx, text, lang)
      return record(sql, input, context, lang, { outcome: 'answer', reply: { text: a.answer, facts: a.facts, links: a.links, phrased: a.phrased } }, fileMeta, started, requestId)
    }
    return record(sql, input, context, lang, { outcome: 'failed', reply: { text: unavailable(lang) } }, fileMeta, started, requestId)
  }

  let u
  try {
    u = await understandFn({ text, screenLanguage: lang, today: ctx.today, context, document })
  } catch (e) {
    log('understand_failed', { request_id: requestId, error: e instanceof UnderstandingUnavailable ? 'provider' : 'unexpected' })
    return record(sql, input, context, lang, { outcome: 'failed', reply: { text: unavailable(lang) } }, fileMeta, started, requestId)
  }

  if (u.mode === 'question' && text) {
    const a = await ask(ctx, text, lang)
    return record(sql, input, context, lang, { outcome: 'answer', reply: { text: a.answer, facts: a.facts, links: a.links, phrased: a.phrased } }, fileMeta, started, requestId, u.model)
  }

  /* Deterministic limits on what a proposal may be, whatever the model said. */
  const injected = u.instructionsFound || looksLikeInstructions(documentText)
  const restricted = !text || injected
  const notes: string[] = []
  let actions = u.actions
  if (restricted) {
    const dropped = actions.filter(a => !CAPTURE_ONLY.has(a.type))
    actions = actions.filter(a => CAPTURE_ONLY.has(a.type))
    if (dropped.length) notes.push(lang === 'de' ? `${dropped.length} Aktion(en) aus dem Dokument wurden nicht übernommen: Ein Dokument kann Max nichts auftragen.` : `${dropped.length} action(s) from the document were not taken: a document cannot instruct Max.`)
  }
  if (!text && document && !actions.length) actions = [{ type: 'CLIENT_CREATE', summary: '' }]
  if (injected) notes.push(copy.warn.instructions_in_document)
  if (u.unsupported.length) notes.push(`${lang === 'de' ? 'Das kann Max nicht' : 'Max cannot do this'}: ${u.unsupported.join('; ')}.`)

  if (!actions.length) {
    const ask_ = u.clarification ?? (u.unsupported.length ? null : lang === 'de' ? 'Was soll ich damit tun? Zum Beispiel einen Kunden anlegen, eine E-Mail entwerfen oder eine Wiedervorlage setzen.' : 'What should I do with it? For example create a client, draft an email or set a follow-up.')
    return record(sql, input, context, lang, { outcome: u.unsupported.length ? 'refused' : 'clarify', reply: { text: ask_ ?? notes.pop() ?? '', notes } }, fileMeta, started, requestId, u.model)
  }

  const ex = actions.some(a => CAPTURE_ONLY.has(a.type)) ? await extraction : null
  const g: GroundCtx = { ctx, lang, context, ownerText: text, documentText, extraction: ex }
  const proposals = await Promise.all(actions.map(async (a, i) => {
    const def = proposalType(a.type)!
    const fields: Fields = { ...def.fromModel(a, g), _summary: a.summary }
    if (injected) fields._warn = [...new Set([...(Array.isArray(fields._warn) ? fields._warn as string[] : []), 'instructions_in_document'])]
    const grounded = await groundSafely(def, g, fields)
    return { position: i, def, fields, grounded }
  }))
  return record(sql, input, context, lang, { outcome: 'proposals', reply: { notes } }, fileMeta, started, requestId, u.model, proposals)
}

async function groundSafely(def: NonNullable<ReturnType<typeof proposalType>>, g: GroundCtx, fields: Fields): Promise<Grounded> {
  try { return await def.ground(g, fields) } catch (e) {
    console.error('[max] ground failed', def.type, e instanceof Error ? e.message : e)
    return { state: 'blocked', capability: def.capabilities[0], title: MAX_COPY[g.lang].type[def.type], rows: [], warnings: [g.lang === 'de' ? 'Max konnte das gerade nicht vorbereiten. Nichts wurde geändert.' : 'Max could not prepare this right now. Nothing was changed.'], missing: [], editable: [] }
  }
}

function notReadable(lang: Lang) {
  return lang === 'de' ? 'Diese Datei kann Max nicht lesen. Möglich sind PDF, JPEG, PNG, WebP, GIF und Text bis 4 MB.' : 'Max cannot read this file. PDF, JPEG, PNG, WebP, GIF and text up to 4 MB are supported.'
}
function unavailable(lang: Lang) {
  return lang === 'de' ? 'Max konnte deine Anfrage gerade nicht verstehen (KI nicht erreichbar). Nichts wurde geändert. Versuche es gleich noch einmal oder nutze die Bildschirme.' : 'Max could not interpret your request right now (AI unavailable). Nothing was changed. Try again shortly or use the screens.'
}

type Pending = { position: number; def: NonNullable<ReturnType<typeof proposalType>>; fields: Fields; grounded: Grounded }

async function record(sql: Sql, input: CaptureInput, context: MaxContext, lang: Lang, r: { outcome: InteractionView['outcome']; reply: InteractionView['reply'] },
  file: { name: string; type: string; size: number; sha256: string } | null, started: number, requestId: string, model?: string, proposals: Pending[] = []): Promise<InteractionView> {
  const latency = Date.now() - started
  const [row] = await sql`INSERT INTO os_max_interactions (actor, input_kind, input_text, file_meta, context, outcome, reply, language, model, latency_ms, request_id)
    VALUES (${input.actor}, ${input.inputKind}, ${input.text.trim().slice(0, 4000)}, ${file ? JSON.stringify(file) : null}::jsonb, ${JSON.stringify(contextSummary(context))}::jsonb,
            ${r.outcome}, ${JSON.stringify(r.reply)}::jsonb, ${lang}, ${model ?? null}, ${latency}, ${requestId})
    RETURNING id::text, created_at` as { id: string; created_at: Date }[]
  const views: ProposalView[] = []
  for (const p of proposals) {
    const hash = hashOf(p.def.type, p.grounded.capability, p.grounded.input)
    const [pr] = await sql`INSERT INTO os_max_proposals (interaction_id, position, type, capability, confirmation, fields, grounded, payload_hash, status)
      VALUES (${row.id}::uuid, ${p.position}, ${p.def.type}, ${p.grounded.capability}, ${p.def.confirmation}, ${JSON.stringify(p.fields)}::jsonb, ${JSON.stringify(p.grounded)}::jsonb, ${hash},
              ${p.grounded.state === 'blocked' ? 'refused' : 'proposed'})
      RETURNING id::text, status, created_at` as { id: string; status: string; created_at: Date }[]
    views.push(viewOf({ id: pr.id, type: p.def.type, capability: p.grounded.capability, confirmation: p.def.confirmation, fields: p.fields, grounded: p.grounded, payload_hash: hash, status: pr.status, result: null, created_at: pr.created_at }))
  }
  log('capture', { request_id: requestId, outcome: r.outcome, kind: input.inputKind, file: file?.type ?? null, types: proposals.map(p => `${p.def.type}:${p.grounded.state}`), latency_ms: latency, model: model ?? null })
  return { id: row.id, createdAt: new Date(row.created_at).toISOString(), input: input.text.trim().slice(0, 4000), inputKind: input.inputKind, file: file ? { name: file.name, type: file.type, size: file.size } : null, context: contextSummary(context), outcome: r.outcome, reply: r.reply, proposals: views }
}

interface ProposalRow {
  id: string; type: string; capability: string; confirmation: string; fields: Fields; grounded: Grounded; payload_hash: string; status: string
  result: { summary: string; links: { label: string; href: string }[]; error?: boolean; approval?: ProposalView['approval'] } | null; created_at: Date | string
  approval_id?: string | null; interaction_id?: string; input_text?: string; language?: Lang
}

function viewOf(p: ProposalRow): ProposalView {
  const { input: _input, ...grounded } = p.grounded
  void _input
  const expired = p.status === 'proposed' && Date.now() - new Date(p.created_at).getTime() > PROPOSAL_HOURS * 3_600_000
  return {
    id: p.id, type: p.type, title: grounded.title, summary: typeof p.fields._summary === 'string' ? p.fields._summary : '',
    status: expired ? 'expired' : p.status, confirmation: p.confirmation, capability: p.capability, payloadHash: p.payload_hash, grounded,
    ...(p.result?.approval ? { approval: p.result.approval } : {}),
    ...(p.result && p.status !== 'awaiting_approval' ? { result: { summary: p.result.summary, links: p.result.links, ...(p.result.error ? { error: true } : {}) } } : {}),
    createdAt: new Date(p.created_at).toISOString(),
  }
}

/* ── act ─────────────────────────────────────────────────────────────────── */

export type MaxAction =
  | { action: 'edit'; proposal_id: string; edits: Record<string, unknown> }
  | { action: 'choose'; proposal_id: string; choice: string }
  | { action: 'reject'; proposal_id: string }
  | { action: 'confirm'; proposal_id: string; payload_hash: string }
  | { action: 'approve'; proposal_id: string; payload_hash: string }

export class MaxRefusal extends Error { constructor(public readonly code: string, message: string) { super(message) } }

async function load(sql: Sql, actor: string, id: string): Promise<ProposalRow> {
  if (!UUID.test(id)) throw new MaxRefusal('not_found', 'No such proposal.')
  const rows = await sql`SELECT p.id::text, p.type, p.capability, p.confirmation, p.fields, p.grounded, p.payload_hash, p.status, p.result, p.created_at, p.approval_id::text,
      i.id::text AS interaction_id, i.input_text, i.language
    FROM os_max_proposals p JOIN os_max_interactions i ON i.id = p.interaction_id WHERE p.id = ${id}::uuid AND i.actor = ${actor}` as ProposalRow[]
  if (!rows[0]) throw new MaxRefusal('not_found', 'No such proposal.')
  return rows[0]
}

async function reground(sql: Sql, actor: string, p: ProposalRow, fields: Fields, screenLanguage?: Lang): Promise<{ grounded: Grounded; hash: string }> {
  const def = proposalType(p.type)
  if (!def) throw new MaxRefusal('unknown_type', 'This proposal type is not registered.')
  const lang: Lang = p.language ?? screenLanguage ?? 'de'
  /* Re-grounding reads the records again: a duplicate created meanwhile, a payment recorded
     meanwhile, an archived client — the new preview says so before anything runs. */
  const g: GroundCtx = { ctx: capContext(sql, actor, lang), lang, context: { route: '/os/ask' }, ownerText: p.input_text ?? '', documentText: null, extraction: null }
  const grounded = await groundSafely(def, g, fields)
  if (!def.capabilities.includes(grounded.capability)) throw new MaxRefusal('capability_mismatch', 'Refused: the proposal maps to a capability it is not registered for.')
  return { grounded, hash: hashOf(def.type, grounded.capability, grounded.input) }
}

async function save(sql: Sql, id: string, fields: Fields, grounded: Grounded, hash: string, status = 'proposed') {
  await sql`UPDATE os_max_proposals SET fields = ${JSON.stringify(fields)}::jsonb, grounded = ${JSON.stringify(grounded)}::jsonb, capability = ${grounded.capability},
    payload_hash = ${hash}, status = ${status}, updated_at = now() WHERE id = ${id}::uuid`
}

/** Marcel's edits, converted per field kind. Only the type's editable keys and its tick are accepted. */
function applyEdits(p: ProposalRow, edits: Record<string, unknown>): Fields {
  const def = proposalType(p.type)!
  const f: Fields = JSON.parse(JSON.stringify(p.fields))
  const editable = new Set([...def.editable, ...def.editable.map(k => `set.${k}`)])
  const kinds = new Map(p.grounded.editable.map(e => [e.key, e.kind]))
  for (const [key, raw] of Object.entries(edits)) {
    if (key === 'recipient_confirmed' && p.grounded.tick?.key === key) { f.recipient_confirmed = raw === true; continue }
    if (!kinds.has(key) || !(editable.has(key) || editable.has(key.replace(/^set\./, '')))) throw new MaxRefusal('not_editable', `Field ${key.slice(0, 40)} cannot be edited.`)
    const kind = kinds.get(key)
    let val: unknown
    if (raw === '' || raw === null) val = undefined
    else if (kind === 'amount') { val = num(raw); if (val === undefined) throw new MaxRefusal('invalid', 'That amount is not valid.') }
    else if (kind === 'date') { val = validDate(raw); if (!val) throw new MaxRefusal('invalid', 'That date is not valid.') }
    else if (kind === 'email') { val = typeof raw === 'string' ? raw.trim().toLowerCase() : undefined; if (val && !EMAIL.test(val as string)) throw new MaxRefusal('invalid', 'That email address is not valid.') }
    else val = str(raw, kind === 'textarea' ? 20000 : 300)
    if (key.startsWith('set.')) { const set = { ...(f.set as Record<string, unknown> ?? {}) }; set[key.slice(4)] = val; f.set = set }
    else f[key] = val
    /* What Marcel typed himself is his: an amount he enters is his amount; an address he types is his. */
    if (kind === 'amount') f._warn = (Array.isArray(f._warn) ? f._warn as string[] : []).filter(w => w !== 'amount_not_in_text')
    if (key === 'to') { f.to_trust = val ? 'owner' : undefined; f._warn = (Array.isArray(f._warn) ? f._warn as string[] : []).filter(w => w !== 'recipient_from_document' && w !== 'recipient_dropped'); delete f.recipient_confirmed }
  }
  return f
}

export async function act(sql: Sql, actor: string, a: MaxAction, screenLanguage?: Lang): Promise<ProposalView> {
  const p = await load(sql, actor, a.proposal_id)
  const def = proposalType(p.type)
  if (!def) throw new MaxRefusal('unknown_type', 'This proposal type is not registered.')
  const expired = Date.now() - new Date(p.created_at).getTime() > PROPOSAL_HOURS * 3_600_000

  if (a.action === 'reject') {
    if (p.status === 'awaiting_approval' && p.approval_id) await rejectApproval(sql, { approvalId: p.approval_id, actor, channel: 'os-max' })
    else if (p.status !== 'proposed') throw new MaxRefusal('not_open', 'This proposal is no longer open.')
    await sql`UPDATE os_max_proposals SET status = 'rejected', updated_at = now() WHERE id = ${p.id}::uuid AND status IN ('proposed', 'awaiting_approval')`
    return viewOf(await load(sql, actor, p.id))
  }

  if (a.action === 'edit' || a.action === 'choose') {
    if (p.status !== 'proposed' || expired) throw new MaxRefusal('not_open', 'This proposal is no longer open.')
    let fields: Fields
    if (a.action === 'edit') fields = applyEdits(p, a.edits)
    else {
      const choice = p.grounded.choice
      if (!choice) throw new MaxRefusal('no_choice', 'There is nothing to choose.')
      fields = JSON.parse(JSON.stringify(p.fields))
      if (a.choice === '__none__' && choice.allowNone && choice.field === 'distinct') {
        fields.confirmed_distinct_from = [...new Set([...(Array.isArray(fields.confirmed_distinct_from) ? fields.confirmed_distinct_from as string[] : []), ...choice.options.map(o => o.id)])]
      } else {
        /* Only an option the server offered. */
        if (choice.field === 'distinct' || !choice.options.some(o => o.id === a.choice)) throw new MaxRefusal('invalid_choice', 'That is not one of the options.')
        fields[choice.field] = a.choice
      }
    }
    const { grounded, hash } = await reground(sql, actor, p, fields, screenLanguage)
    await save(sql, p.id, fields, grounded, hash, grounded.state === 'blocked' ? 'refused' : 'proposed')
    return viewOf(await load(sql, actor, p.id))
  }

  if (a.action === 'confirm') {
    if (p.status !== 'proposed') throw new MaxRefusal('not_open', 'This proposal is no longer open.')
    if (expired) { await sql`UPDATE os_max_proposals SET status = 'expired', updated_at = now() WHERE id = ${p.id}::uuid AND status = 'proposed'`; throw new MaxRefusal('expired', 'This proposal has expired. Ask Max again.') }
    if (a.payload_hash !== p.payload_hash) throw new MaxRefusal('payload_changed', 'The proposal changed since you saw it. Review it again.')
    /* Fresh grounding against the records as they are now. A different result is shown, not run. */
    const fresh = await reground(sql, actor, p, p.fields, screenLanguage)
    if (fresh.grounded.state !== 'ready' || fresh.hash !== p.payload_hash || !fresh.grounded.input) {
      await save(sql, p.id, p.fields, fresh.grounded, fresh.hash, fresh.grounded.state === 'blocked' ? 'refused' : 'proposed')
      throw new MaxRefusal('changed', 'Something changed since the preview. Review the updated proposal.')
    }
    const claimed = await sql`UPDATE os_max_proposals SET status = 'executing', updated_at = now() WHERE id = ${p.id}::uuid AND status = 'proposed' AND payload_hash = ${p.payload_hash} RETURNING id` as { id: string }[]
    if (!claimed.length) throw new MaxRefusal('in_progress', 'This proposal is already being carried out.')
    const started = Date.now()
    const response = await runCapability(sql, { requestId: `max:${p.id}`, actor, channel: 'os-max', capability: fresh.grounded.capability, input: fresh.grounded.input, language: p.language ?? screenLanguage })
    let status: string, result: NonNullable<ProposalRow['result']>, approvalId: string | null = null
    if (response.status === 'done') {
      const refusedLike = (response.result.data as { created?: boolean } | undefined)?.created === false || Boolean(response.result.choices?.length)
      status = refusedLike ? 'refused' : 'done'
      /* Max says what happened in the screen language; the capability's own words stay in the audit. */
      result = { summary: refusedLike ? response.result.summary : `${MAX_COPY[p.language ?? screenLanguage ?? 'de'].done[def.type]} ${detail(response.result)}`.trim(), links: linksOf(response.result), ...(refusedLike ? { error: true } : {}) }
    } else if (response.status === 'approval_required') {
      status = 'awaiting_approval'
      approvalId = response.approval.id
      result = { summary: response.approval.summary, links: [], approval: { summary: response.approval.summary, preview: Object.entries(response.approval.preview), payloadHash: response.approval.payloadHash, expiresAt: response.approval.expiresAt } }
    } else {
      status = response.status === 'refused' ? 'refused' : 'failed'
      result = { summary: response.message, links: [], error: true }
    }
    await sql`UPDATE os_max_proposals SET status = ${status}, result = ${JSON.stringify(result)}::jsonb, approval_id = ${approvalId}::uuid,
      executed_at = CASE WHEN ${status} = 'done' THEN now() ELSE executed_at END, updated_at = now() WHERE id = ${p.id}::uuid`
    await audit(sql, actor, p, fresh.grounded.capability, status, response.status === 'done' ? response.result.focus?.[0] : undefined, result.summary)
    log('execute', { proposal_id: p.id, type: p.type, capability: fresh.grounded.capability, status, latency_ms: Date.now() - started })
    return viewOf(await load(sql, actor, p.id))
  }

  /* approve: the AMBER capability's own preview, confirmed with the hash it was shown with. */
  if (p.status !== 'awaiting_approval' || !p.approval_id || !p.result?.approval) throw new MaxRefusal('not_open', 'Nothing is waiting for your approval here.')
  if (a.payload_hash !== p.result.approval.payloadHash) throw new MaxRefusal('payload_changed', 'The approval changed since you saw it.')
  const response = await executeApproval(sql, { approvalId: p.approval_id, payloadHash: a.payload_hash, actor, channel: 'os-max' })
  const done = response.status === 'done'
  const result = done ? { summary: `${MAX_COPY[p.language ?? screenLanguage ?? 'de'].done[def.type]} ${detail(response.result)}`.trim(), links: linksOf(response.result) } : { summary: response.status === 'approval_required' ? '' : response.message, links: [], error: true }
  const status = done ? 'done' : response.status === 'refused' ? 'refused' : 'failed'
  await sql`UPDATE os_max_proposals SET status = ${status}, result = ${JSON.stringify(result)}::jsonb, executed_at = CASE WHEN ${done} THEN now() ELSE executed_at END, updated_at = now() WHERE id = ${p.id}::uuid`
  await audit(sql, actor, p, p.capability, status, done ? response.result.focus?.[0] : undefined, result.summary)
  log('approve', { proposal_id: p.id, type: p.type, capability: p.capability, status })
  return viewOf(await load(sql, actor, p.id))
}

/** The one thing worth repeating from a capability result: the record it is about. */
const detail = (r: CapabilityResult) => (r.focus?.[0]?.label ? `— ${r.focus[0].label}` : '')

const HREF: Partial<Record<FocusRef['kind'], (id: string) => string>> = {
  client: id => `/os/clients/${id}`, invoice: id => `/os/invoices/${id}`, angebot: id => `/os/angebote/${id}`, lead: () => '/os/leads',
  email_thread: id => `/os/inbox?thread=${id}`, email_draft: () => '/os/inbox?view=drafts', job: () => '/os/jobs',
}
function linksOf(r: CapabilityResult): { label: string; href: string }[] {
  return (r.focus ?? []).filter(f => HREF[f.kind]).map(f => ({ label: f.label, href: HREF[f.kind]!(f.id) })).slice(0, 4)
}

async function audit(sql: Sql, actor: string, p: ProposalRow, capability: string, status: string, focus: FocusRef | undefined, summary: string) {
  await writeAudit(sql, {
    actor, channel: 'os-max', operation: `max.${p.type}`, entityType: focus?.kind, entityId: focus?.id,
    after: { proposal_id: p.id, interaction_id: p.interaction_id, capability, status, summary: summary.slice(0, 300) },
    payloadHash: p.payload_hash, outcome: status === 'done' || status === 'awaiting_approval' ? 'succeeded' : status === 'failed' ? 'failed' : 'refused',
  })
}

/* ── history ─────────────────────────────────────────────────────────────── */

export async function history(sql: Sql, actor: string, limit = 20): Promise<InteractionView[]> {
  const rows = await sql`SELECT id::text, created_at, input_text, input_kind, file_meta, context, outcome, reply FROM os_max_interactions
    WHERE actor = ${actor} ORDER BY created_at DESC LIMIT ${Math.min(Math.max(limit, 1), 50)}` as
    { id: string; created_at: Date; input_text: string; input_kind: string; file_meta: { name: string; type: string; size: number } | null; context: Record<string, unknown>; outcome: InteractionView['outcome']; reply: InteractionView['reply'] }[]
  if (!rows.length) return []
  const props = await sql`SELECT id::text, interaction_id::text, type, capability, confirmation, fields, grounded, payload_hash, status, result, created_at FROM os_max_proposals
    WHERE interaction_id = ANY(${rows.map(r => r.id)}::uuid[]) ORDER BY position` as (ProposalRow & { interaction_id: string })[]
  /* Bounded growth: interactions matter for a season, the audit keeps executions for good. */
  if (Math.random() < 0.02) {
    await sql`DELETE FROM os_max_proposals WHERE interaction_id IN (SELECT id FROM os_max_interactions WHERE created_at < now() - interval '180 days')`
    await sql`DELETE FROM os_max_interactions WHERE created_at < now() - interval '180 days'`
  }
  return rows.reverse().map(r => ({
    id: r.id, createdAt: new Date(r.created_at).toISOString(), input: r.input_text, inputKind: r.input_kind,
    file: r.file_meta ? { name: r.file_meta.name, type: r.file_meta.type, size: r.file_meta.size } : null,
    context: r.context, outcome: r.outcome, reply: r.reply, proposals: props.filter(p => p.interaction_id === r.id).map(viewOf),
  }))
}

export type { ModelAction }
