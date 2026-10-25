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
import { ask } from '@/lib/commercial/ask'
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
import { loadWork, reconcileWork, type WorkRow } from '@/lib/agents/work'

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
  /** Delegated agent work this proposal started (AGENT_WORK, ADR-0030), as the OS knows it now. */
  work?: MaxWorkView
  createdAt: string
}

/** What the card shows of delegated work: words in the screen language, made here from the record. */
export interface MaxWorkView {
  id: string
  state: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  stateLabel: string
  open: boolean
  lead: { label: string; href: string }
  outcome?: { score: string; confidence: string; qualified: boolean; qualifiedLabel: string }
  evidence: { kind: string; text: string; quote: string; url: string }[]
  evidenceLabel: string
  recommendation?: { code: string; text: string }
  warning?: string
  failure?: { text: string; retryable: boolean }
  /** A separate governed next step Marcel may ask for — never started by the result itself. */
  offer?: { label: string; done: boolean }
  footnote: string
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
  /* Previews, warnings and results follow the screen language. Answers follow the language of the
     question (Ask Max decides that), and drafts the language Marcel asks for (understanding). */
  const lang: Lang = input.screenLanguage
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

  /* A plain question ("Wer schuldet mir Geld?", "What should I handle next?") goes straight to Ask Max:
     reading only, so no interpretation step is needed — it saves a model call. */
  if (!input.file && looksLikeQuestion(text)) {
    const a = await ask(ctx, text, lang)
    return record(sql, input, context, lang, { outcome: 'answer', reply: { text: a.answer, facts: a.facts, links: a.links, phrased: a.phrased } }, fileMeta, started, requestId, 'ask')
  }

  let u
  try {
    u = await understandFn({ text, screenLanguage: lang, today: ctx.today, context, document })
  } catch (e) {
    log('understand_failed', { request_id: requestId, error: e instanceof UnderstandingUnavailable ? 'provider' : 'unexpected' })
    return record(sql, input, context, lang, { outcome: 'failed', reply: { text: unavailable(lang) } }, fileMeta, started, requestId)
  }

  log('understood', { request_id: requestId, mode: u.mode, actions: u.actions.length, unsupported: u.unsupported.length, instructions: u.instructionsFound })

  if (u.mode === 'question' && text) {
    const a = await ask(ctx, text, lang)
    return record(sql, input, context, lang, { outcome: 'answer', reply: { text: a.answer, facts: a.facts, links: a.links, phrased: a.phrased } }, fileMeta, started, requestId, u.model)
  }

  /* Deterministic limits on what a proposal may be, whatever the model said. */
  /* Only an attached document can carry foreign instructions; Marcel's own words are the instruction. */
  const injected = Boolean(document) && (u.instructionsFound || looksLikeInstructions(documentText))
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

const QUESTION_WORD = /^(wer|wem|wen|wessen|was|wie|wann|welche[rsmn]?|wo|wohin|woher|warum|wieso|weshalb|who|whom|whose|what|how|when|which|where|why)\b/i
/** A question by its form: a question word first and a question mark last. "Can you…?" is a request, not this. */
/** "Is X worth contacting?" asks for work (research), not for what the records already say. */
const WORK_WORDS = /(recherch|research|worth contacting|lohnt sich|qualifizier|qualify)/i
export const looksLikeQuestion = (text: string) => QUESTION_WORD.test(text.trim()) && /\?\s*$/.test(text) && !WORK_WORDS.test(text)

/** IBAN-like strings are not kept in Max's history, even when Marcel typed one. */
const IBANISH = /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/g
const mask = (s: string) => s.replace(IBANISH, '[IBAN]')

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
    VALUES (${input.actor}, ${input.inputKind}, ${mask(input.text.trim().slice(0, 4000))}, ${file ? JSON.stringify(file) : null}::jsonb, ${JSON.stringify(contextSummary(context))}::jsonb,
            ${r.outcome}, ${mask(JSON.stringify(r.reply))}::jsonb, ${lang}, ${model ?? null}, ${latency}, ${requestId})
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
  return { id: row.id, createdAt: new Date(row.created_at).toISOString(), input: mask(input.text.trim().slice(0, 4000)), inputKind: input.inputKind, file: file ? { name: file.name, type: file.type, size: file.size } : null, context: contextSummary(context), outcome: r.outcome, reply: JSON.parse(mask(JSON.stringify(r.reply))) as InteractionView['reply'], proposals: views }
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

/* ── delegated work ──────────────────────────────────────────────────────── */

function workViewOf(w: WorkRow, lang: Lang, followed: boolean): MaxWorkView {
  const c = MAX_COPY[lang].agent
  const s = w.summary
  const open = w.state === 'queued' || w.state === 'running'
  return {
    id: w.id, state: w.state, stateLabel: c.state[w.state] ?? w.state, open,
    lead: { label: s?.lead ?? '', href: `/os/leads?lead=${w.subject_id}` },
    ...(s ? {
      outcome: { score: `${s.score}/100`, confidence: `${c.confidence} ${c.conf[s.confidence] ?? s.confidence}`, qualified: s.qualified, qualifiedLabel: s.qualified ? c.qualified : c.notQualified },
      recommendation: { code: s.recommendation, text: c.next[s.recommendation] ?? '' },
      ...(s.injectionSuspected ? { warning: c.injection } : {}),
    } : {}),
    evidence: s?.evidence ?? [], evidenceLabel: c.evidence,
    /* The category in the screen language; the agent's own reason (technical, English) follows it. */
    ...(w.state === 'failed' || w.state === 'cancelled' ? { failure: { text: [c.failure[w.failure?.category ?? 'internal'] ?? c.state[w.state], w.failure?.detail ? `(${w.failure.detail})` : '', w.failure?.retryable ? c.again : ''].filter(Boolean).join(' '), retryable: w.failure?.retryable ?? false } } : {}),
    ...(s?.recommendation === 'outreach_draft' ? { offer: { label: c.draftOffer, done: followed } } : {}),
    footnote: c.nothingSent,
  }
}

/** Attach the work each AGENT_WORK proposal started; open work is reconciled with the Bureau first. */
async function withWork(sql: Sql, views: ProposalView[], rows: ProposalRow[], lang: Lang, reconcile: boolean): Promise<ProposalView[]> {
  const ids = views.filter(v => v.type === 'AGENT_WORK' && v.status === 'done').map(v => v.id)
  if (!ids.length) return views
  const found = await sql`SELECT id::text, max_proposal::text FROM os_agent_work WHERE max_proposal = ANY(${ids}::uuid[]) ORDER BY created_at DESC` as { id: string; max_proposal: string }[]
  const out: ProposalView[] = []
  for (const v of views) {
    const link = found.find(f => f.max_proposal === v.id)
    const w = link ? (reconcile ? await reconcileWork(sql, link.id) : await loadWork(sql, link.id)) : null
    const row = rows.find(r => r.id === v.id)
    out.push(w ? { ...v, work: workViewOf(w, row?.language ?? lang, typeof row?.fields?.followed === 'string') } : v)
  }
  return out
}

/** One proposal as the card shows it now, with its work reconciled. For the card's status poll. */
export async function proposalNow(sql: Sql, actor: string, id: string, screenLanguage?: Lang): Promise<ProposalView> {
  const p = await load(sql, actor, id)
  return (await withWork(sql, [viewOf(p)], [p], p.language ?? screenLanguage ?? 'de', true))[0]
}

/* ── act ─────────────────────────────────────────────────────────────────── */

export type MaxAction =
  | { action: 'edit'; proposal_id: string; edits: Record<string, unknown> }
  | { action: 'choose'; proposal_id: string; choice: string }
  | { action: 'reject'; proposal_id: string }
  | { action: 'confirm'; proposal_id: string; payload_hash: string }
  | { action: 'approve'; proposal_id: string; payload_hash: string }
  /** A completed research recommends an introduction: propose it as its own card (runs nothing). */
  | { action: 'follow'; proposal_id: string }

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
    /* Max's one-line summary described the proposal before Marcel changed it. */
    if (key !== 'recipient_confirmed') delete f._summary
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

  if (a.action === 'follow') return follow(sql, actor, p, screenLanguage)

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
      /* A reply draft lives in its conversation: link there rather than to the drafts list. */
      const links = p.type === 'EMAIL_REPLY_DRAFT' && fresh.grounded.links?.length ? fresh.grounded.links : linksOf(response.result)
      result = { summary: refusedLike ? response.result.summary : `${MAX_COPY[p.language ?? screenLanguage ?? 'de'].done[def.type]}${p.type === 'EMAIL_REPLY_DRAFT' ? '' : ` ${detail(response.result)}`}`.trim(), links, ...(refusedLike ? { error: true } : {}) }
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
    /* Delegated work belongs to this card: link it, so the card follows the work to its result. */
    const workId = response.status === 'done' ? (response.result.data as { work_id?: string } | undefined)?.work_id : undefined
    if (workId && UUID.test(workId)) await sql`UPDATE os_agent_work SET max_proposal = ${p.id}::uuid WHERE id = ${workId}::uuid AND max_proposal IS NULL`
    const after = await load(sql, actor, p.id)
    return (await withWork(sql, [viewOf(after)], [after], p.language ?? screenLanguage ?? 'de', false))[0]
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

/**
 * The research recommends an introduction. Max proposes LEAD_OUTREACH_DRAFT as a NEW card in the same
 * interaction, grounded like any other — Marcel confirms it or not. The recommendation itself never
 * runs anything, and sending stays outside Max entirely (drafts only; the send policy decides later).
 */
async function follow(sql: Sql, actor: string, p: ProposalRow, screenLanguage?: Lang): Promise<ProposalView> {
  if (p.type !== 'AGENT_WORK' || p.status !== 'done') throw new MaxRefusal('not_open', 'There is no finished agent work on this card.')
  if (typeof p.fields.followed === 'string') return viewOf(await load(sql, actor, p.fields.followed))
  const works = await sql`SELECT id::text FROM os_agent_work WHERE max_proposal = ${p.id}::uuid ORDER BY created_at DESC LIMIT 1` as { id: string }[]
  const w = works[0] ? await loadWork(sql, works[0].id) : null
  if (!w || w.state !== 'completed' || w.summary?.recommendation !== 'outreach_draft') throw new MaxRefusal('not_recommended', 'The research does not recommend an introduction.')
  const def = proposalType('LEAD_OUTREACH_DRAFT')!
  const lang: Lang = p.language ?? screenLanguage ?? 'de'
  const fields: Fields = { lead_id: w.subject_id, language: lang }
  const g: GroundCtx = { ctx: capContext(sql, actor, lang), lang, context: { route: '/os/ask' }, ownerText: '', documentText: null, extraction: null }
  const grounded = await groundSafely(def, g, fields)
  const hash = hashOf(def.type, grounded.capability, grounded.input)
  /* Claim the follow-up on the card first: two taps make one proposal. */
  const marked = await sql`UPDATE os_max_proposals SET fields = fields || jsonb_build_object('followed', 'pending') WHERE id = ${p.id}::uuid AND NOT (fields ? 'followed') RETURNING id` as { id: string }[]
  if (!marked.length) throw new MaxRefusal('in_progress', 'The introduction was already proposed.')
  const [pr] = await sql`INSERT INTO os_max_proposals (interaction_id, position, type, capability, confirmation, fields, grounded, payload_hash, status)
    VALUES (${p.interaction_id}::uuid, (SELECT coalesce(max(position), 0) + 1 FROM os_max_proposals WHERE interaction_id = ${p.interaction_id}::uuid), ${def.type}, ${grounded.capability},
            ${def.confirmation}, ${JSON.stringify(fields)}::jsonb, ${JSON.stringify(grounded)}::jsonb, ${hash}, ${grounded.state === 'blocked' ? 'refused' : 'proposed'})
    RETURNING id::text` as { id: string }[]
  await sql`UPDATE os_max_proposals SET fields = fields || jsonb_build_object('followed', ${pr.id}::text) WHERE id = ${p.id}::uuid`
  log('follow', { proposal_id: p.id, work_id: w.id, new_proposal: pr.id })
  return viewOf(await load(sql, actor, pr.id))
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
  const rows = await sql`SELECT id::text, created_at, input_text, input_kind, file_meta, context, outcome, reply, language FROM os_max_interactions
    WHERE actor = ${actor} ORDER BY created_at DESC LIMIT ${Math.min(Math.max(limit, 1), 50)}` as
    { id: string; created_at: Date; input_text: string; input_kind: string; file_meta: { name: string; type: string; size: number } | null; context: Record<string, unknown>; outcome: InteractionView['outcome']; reply: InteractionView['reply']; language: Lang | null }[]
  if (!rows.length) return []
  const props = await sql`SELECT id::text, interaction_id::text, type, capability, confirmation, fields, grounded, payload_hash, status, result, created_at FROM os_max_proposals
    WHERE interaction_id = ANY(${rows.map(r => r.id)}::uuid[]) ORDER BY position` as (ProposalRow & { interaction_id: string })[]
  /* Bounded growth: interactions matter for a season, the audit keeps executions for good. */
  if (Math.random() < 0.02) {
    await sql`DELETE FROM os_max_proposals WHERE interaction_id IN (SELECT id FROM os_max_interactions WHERE created_at < now() - interval '180 days')`
    await sql`DELETE FROM os_max_interactions WHERE created_at < now() - interval '180 days'`
  }
  const out: InteractionView[] = []
  for (const r of rows.reverse()) {
    const own = props.filter(p => p.interaction_id === r.id).map(p => ({ ...p, language: r.language ?? undefined }))
    out.push({
      id: r.id, createdAt: new Date(r.created_at).toISOString(), input: r.input_text, inputKind: r.input_kind,
      file: r.file_meta ? { name: r.file_meta.name, type: r.file_meta.type, size: r.file_meta.size } : null,
      context: r.context, outcome: r.outcome, reply: r.reply,
      /* Open delegated work is asked about once here; the card polls while it stays open. */
      proposals: await withWork(sql, own.map(viewOf), own, r.language ?? 'de', true),
    })
  }
  return out
}

export type { ModelAction }
