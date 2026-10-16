/**
 * lib/channels/orchestrator.ts
 *
 * The conversation engine behind every messaging channel.
 *
 *   ingest    channel events → durable records, idempotent on the provider's
 *             message id. Called inside the webhook request, before 200.
 *   process   one conversation's unanswered messages → at most one reply.
 *             Called after the response, under a per-conversation lease, so
 *             rapid messages coalesce into one answer and two webhook
 *             deliveries never answer twice.
 *
 * Every dependency is a port (store, OS, model, provider, clock), so the
 * production wiring (runtime.ts) and the offline proof run this same file.
 *
 * The order inside `process` is the safety argument:
 *
 *   1. may Max speak at all?       automation, pilot list, human in chat,
 *                                  waiting for Marcel, stale, window
 *   2. who is this?                OS lookup by phone, once; never by name
 *   3. a person asked for a person → handover, whatever the model says
 *   4. the model writes and reports; validated field by field
 *   5. the guard checks the words
 *   6. OS writes, from an allow-list, idempotent per message
 *   7. state is persisted BEFORE anything claiming it is sent
 *   8. the send re-checks that Marcel has not started typing meanwhile
 *
 * Pure apart from its ports.
 */

import * as copy from './copy.ts'
import type { WhatsAppConfig } from './config.ts'
import { guardReply, type GuardFlag } from './guard.ts'
import {
  effectiveState, guessLanguage, isNativeAutoReply, isOpen, mayAnswer, takeoverSignal, windowOpen,
  type HandoverState, type Hold, type Lang, type TakeoverReason,
} from './policy.ts'
import type { ChannelEvent, ChannelProvider, ContactRef, DeliveryStatus, EchoMessage, InboundKind, InboundMessage } from './types.ts'
import {
  asCustomerData, buildSystemPrompt, isQualified, mergeFacts, parseUnderstanding,
  type Facts, type Intent, type Understanding,
} from './understanding.ts'

/* ── ports ────────────────────────────────────────────────────────────── */

export type Identity = 'unresolved' | 'new' | 'lead' | 'client' | 'ambiguous'
export type TurnState = 'pending' | 'answered' | 'held'
export type OutboundStatus = 'sending' | 'sent' | 'draft' | 'failed' | 'uncertain' | 'suppressed'

export interface StoredMessage {
  id: string
  externalId: string | null
  role: 'user' | 'assistant' | 'human_agent' | 'system'
  kind: InboundKind
  text: string
  at: Date
}

export interface Conversation {
  id: string
  contact: ContactRef
  handoverState: HandoverState
  handoverReason: string | null
  handoverAt: Date | null
  humanLastAt: Date | null
  lastInboundAt: Date | null
  language: Lang | null
  identity: Identity
  leadId: string | null
  clientId: string | null
  knownFirstName: string | null
  facts: Facts
  intent: Intent | null
  qualifiedAt: Date | null
  disclosedAt: Date | null
  modelTurnsDay: string | null
  modelTurns: number
}

export type ConversationPatch = Partial<Omit<Conversation, 'id' | 'contact' | 'lastInboundAt' | 'humanLastAt'>>

/** Events written to the conversation's own trail; the alert kinds become notices to Marcel. */
export type TrailKind =
  | 'wa.handover' | 'wa.qualified' | 'wa.lead_linked' | 'wa.identity_ambiguous' | 'wa.guard_blocked'
  | 'wa.sensitive_data' | 'wa.os_failed' | 'wa.send_failed' | 'wa.send_uncertain' | 'wa.model_failed'
  | 'wa.held' | 'wa.automation_resumed' | 'wa.suppressed_for_human' | 'wa.incident_opened' | 'wa.possible_duplicate'

export interface ConversationStore {
  recordInbound(m: InboundMessage, answerable: boolean): Promise<{ conversationId: string; duplicate: boolean }>
  recordEcho(e: EchoMessage, isHuman: boolean): Promise<{ conversationId: string; duplicate: boolean }>
  recordStatus(s: DeliveryStatus): Promise<boolean>
  acquire(conversationId: string, now: Date, ttlMs: number): Promise<boolean>
  release(conversationId: string): Promise<void>
  load(conversationId: string): Promise<Conversation>
  pending(conversationId: string): Promise<StoredMessage[]>
  history(conversationId: string, limit: number): Promise<StoredMessage[]>
  update(conversationId: string, patch: ConversationPatch): Promise<void>
  settle(messageIds: string[], state: Exclude<TurnState, 'pending'>, note?: string): Promise<void>
  /** Insert-once by key. `existing` is the earlier row's status when the key was already used. */
  claimOutbound(conversationId: string, key: string, text: string): Promise<{ id: string; existing: OutboundStatus | null }>
  finishOutbound(id: string, r: { status: Exclude<OutboundStatus, 'sending'>; providerMessageId?: string; error?: string }): Promise<void>
  trail(conversationId: string, kind: TrailKind, detail: Record<string, unknown>): Promise<void>
}

export interface LeadInput {
  company: string; name?: string; phone?: string; business_type?: string; city?: string
  language?: Lang; summary?: string; service_interest?: string
}

export type OsIdentity = { kind: 'none' } | { kind: 'lead' | 'client'; id: string; firstName: string | null } | { kind: 'ambiguous'; count: number }

/**
 * The only things a public conversation may do in Maxpromo OS. Each is one
 * GREEN capability of the commercial registry, run under a request id derived
 * from the customer's message, so a redelivered webhook repeats nothing.
 */
export interface OsPort {
  identify(requestId: string, contact: ContactRef): Promise<OsIdentity>
  /** lead.create as the OS answers it: created, or the existing records it matched and on what basis. */
  createLead(requestId: string, input: LeadInput & { distinctFrom?: string[] }): Promise<
    | { created: true; id: string }
    | { created: false; matches: { kind: 'lead' | 'client'; id: string; basis: string }[] }>
  recordQualification(requestId: string, leadId: string, summary: string): Promise<void>
  openIncident(requestId: string, clientId: string, input: { title: string; detail: string; severity: 'medium' | 'high'; dedupeKey: string }): Promise<void>
}

export interface ModelTurn { role: 'user' | 'assistant'; content: string }
export type ModelPort = (system: string, turns: ModelTurn[]) => Promise<unknown>

export interface Deps {
  store: ConversationStore
  os: OsPort
  model: ModelPort
  provider: ChannelProvider
  config: WhatsAppConfig
  now: () => Date
  log: (event: string, fields: Record<string, unknown>) => void
  canary: () => string
  sleep?: (ms: number) => Promise<void>
}

/* ── ingest ───────────────────────────────────────────────────────────── */

const ANSWERABLE: ReadonlySet<InboundKind> = new Set(['text', 'interactive', 'voice', 'image', 'video', 'document', 'location', 'contacts', 'sticker', 'unsupported'])

export async function ingest(events: ChannelEvent[], deps: Deps): Promise<{ conversations: string[]; inbound: number; duplicates: number; echoes: number; statuses: number }> {
  const conversations = new Set<string>()
  let inbound = 0, duplicates = 0, echoes = 0, statuses = 0
  for (const e of events) {
    if (e.type === 'message') {
      /* A reaction is recorded but never answered. */
      const r = await deps.store.recordInbound(e, ANSWERABLE.has(e.kind))
      if (r.duplicate) { duplicates++; continue }
      inbound++
      conversations.add(r.conversationId)
    } else if (e.type === 'echo') {
      const human = !isNativeAutoReply(e.text, deps.config)
      const r = await deps.store.recordEcho(e, human)
      if (r.duplicate) { duplicates++; continue }
      echoes++
    } else {
      if (await deps.store.recordStatus(e)) statuses++
    }
  }
  return { conversations: [...conversations], inbound, duplicates, echoes, statuses }
}

/* ── process ──────────────────────────────────────────────────────────── */

export type Outcome =
  | { kind: 'busy' }
  | { kind: 'idle' }
  | { kind: 'held'; hold: Hold }
  | { kind: 'replied'; delivery: Delivery; handover: string | null; guarded: GuardFlag[] }

type Delivery = 'sent' | 'draft' | 'suppressed' | 'failed' | 'uncertain' | 'duplicate'

const LEASE_MS = 90_000
const SUBSTANTIVE: ReadonlySet<Intent> = new Set(['BUSINESS_PROBLEM', 'LEAD_CUSTOMER_PROBLEM', 'SYSTEM_PROBLEM', 'BUILD_REQUEST'])
const CLIENT_NEEDS: ReadonlySet<Intent> = new Set(['SUPPORT', 'SYSTEM_PROBLEM', 'EXISTING_CLIENT'])
const MEDIA: ReadonlySet<InboundKind> = new Set(['voice', 'image', 'video', 'document', 'location', 'contacts', 'sticker', 'unsupported'])

function berlinDay(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

export async function processConversation(conversationId: string, deps: Deps): Promise<Outcome[]> {
  const outcomes: Outcome[] = []
  if (!(await deps.store.acquire(conversationId, deps.now(), LEASE_MS))) {
    /* Another invocation holds this conversation. It re-reads pending
       messages before it lets go, so these will be answered by it. */
    deps.log('wa.process.busy', { conversation: conversationId })
    return [{ kind: 'busy' }]
  }
  try {
    /* Bounded: messages arriving while we answer are picked up, but a
       sender cannot keep one invocation busy indefinitely. */
    for (let round = 0; round < 3; round++) {
      const pending = await deps.store.pending(conversationId)
      if (!pending.length) { if (round === 0) outcomes.push({ kind: 'idle' }); break }
      outcomes.push(await answer(conversationId, pending, deps))
    }
  } finally {
    await deps.store.release(conversationId)
  }
  return outcomes
}

async function answer(conversationId: string, pending: StoredMessage[], deps: Deps): Promise<Outcome> {
  const { store, config } = deps
  const now = deps.now()
  const ids = pending.map((p) => p.id)
  const newest = pending[pending.length - 1]
  let conv = await store.load(conversationId)

  const eff = effectiveState(conv, now, config.humanIdleHours)
  if (eff.resumed) {
    await store.update(conversationId, { handoverState: 'bot', handoverReason: null, handoverAt: null })
    await store.trail(conversationId, 'wa.automation_resumed', { idleHours: config.humanIdleHours })
    conv = { ...conv, handoverState: 'bot', handoverReason: null }
  }

  const text = pending.map((p) => p.text).filter(Boolean).join('\n').trim()
  const gate = mayAnswer({
    config, state: conv.handoverState, contactPhone: conv.contact.phone ?? null,
    newestPendingAt: newest.at, lastInboundAt: conv.lastInboundAt, anyAnswerable: pending.length > 0, now,
  })
  if (!gate.ok) {
    await store.settle(ids, 'held', gate.hold)
    /* Held because the window passed or the message waited too long: Marcel
       must see it, or it is a message nobody answers. */
    if (gate.hold === 'stale' || gate.hold === 'window_closed') await store.trail(conversationId, 'wa.held', { hold: gate.hold, messages: ids.length })
    deps.log('wa.process.held', { conversation: conversationId, hold: gate.hold, count: ids.length })
    return { kind: 'held', hold: gate.hold }
  }

  const replyKey = `reply:${newest.externalId ?? newest.id}`
  const rid = (op: string) => `wa:${newest.externalId ?? newest.id}:${op}`.slice(0, 120)
  const fallbackLang: Lang = conv.language ?? guessLanguage(text || '', 'de')

  /* Allowance: an endless conversation is a cost and an abuse vector. */
  const today = berlinDay(now)
  const turns = conv.modelTurnsDay === today ? conv.modelTurns : 0
  if (turns >= config.dailyModelTurns) {
    return handover(conv, ids, replyKey, 'model', copy.allowanceReached(fallbackLang, now), deps, { allowance: true })
  }

  /* 2. Who is this — asked once per conversation, by phone, never by name. */
  if (conv.identity === 'unresolved') {
    try {
      const who = conv.contact.phone ? await deps.os.identify(rid('identify'), conv.contact) : { kind: 'none' as const }
      const patch: ConversationPatch =
        who.kind === 'none' ? { identity: 'new' }
          : who.kind === 'ambiguous' ? { identity: 'ambiguous' }
            : who.kind === 'lead' ? { identity: 'lead', leadId: who.id, knownFirstName: who.firstName }
              : { identity: 'client', clientId: who.id, knownFirstName: who.firstName }
      await store.update(conversationId, patch)
      conv = { ...conv, ...patch }
      if (who.kind === 'ambiguous') await store.trail(conversationId, 'wa.identity_ambiguous', { matches: who.count })
    } catch (err) {
      /* Unknown is not "new": the conversation continues without a link and
         lead creation still deduplicates by phone inside the OS. */
      deps.log('wa.identify.failed', { conversation: conversationId, error: errText(err) })
    }
  }

  /* Only media: nothing to understand, a fixed answer that is true. */
  if (!text) {
    const voice = pending.some((p) => p.kind === 'voice')
    const onlyNoise = pending.every((p) => p.kind === 'sticker')
    if (onlyNoise) { await store.settle(ids, 'held', 'sticker'); return { kind: 'held', hold: 'no_text_to_answer' } }
    const delivery = await deliver(conv, replyKey, withDisclosure(conv, fallbackLang, copy.mediaOnly(fallbackLang, voice ? 'voice' : 'other')), deps)
    await afterDelivery(conv, ids, delivery, { language: fallbackLang }, deps)
    return { kind: 'replied', delivery, handover: null, guarded: [] }
  }

  /* 3. The deterministic floor: a person who asks for a person gets one. */
  const signal = takeoverSignal(text)

  /* 4. The model. */
  let u: Understanding | null = null
  const canary = deps.canary()
  const started = Date.now()
  try {
    const history = await store.history(conversationId, 20)
    const system = buildSystemPrompt({
      canary,
      relationship: conv.identity === 'client' ? 'client' : conv.identity === 'lead' ? 'lead' : conv.identity === 'new' ? 'new' : 'unknown',
      knownFirstName: conv.knownFirstName,
      facts: conv.facts,
      language: conv.language,
      nativeGreetingAlreadySent: config.nativeGreetingActive && !conv.disclosedAt,
      firstReply: !conv.disclosedAt,
      openNow: isOpen(now),
    })
    u = parseUnderstanding(await deps.model(system, toTurns(history, pending)))
    if (!u) deps.log('wa.model.invalid', { conversation: conversationId })
  } catch (err) {
    deps.log('wa.model.failed', { conversation: conversationId, error: errText(err) })
  }
  deps.log('wa.model.done', { conversation: conversationId, ms: Date.now() - started, ok: !!u })
  await store.update(conversationId, { modelTurnsDay: today, modelTurns: turns + 1 })

  if (!u) {
    await store.trail(conversationId, 'wa.model_failed', {})
    return handover(conv, ids, replyKey, 'model', copy.unavailable(fallbackLang, now), deps, {})
  }

  const lang = u.language
  const { facts, changed } = mergeFacts(conv.facts, u.facts)
  const asksForPerson = signal === 'asked_for_person' || u.wants_human || u.intent === 'HUMAN_REQUEST'
  const urgentSupport = u.urgency === 'high' && (u.intent === 'SUPPORT' || u.intent === 'SYSTEM_PROBLEM')
  /* Most specific first: a complaint or an emergency says so; a client who
     needs anything is "a client" (Marcel's notice reads differently); then a
     plain request for a person. */
  const reason: TakeoverReason | 'existing_client' | null =
    signal === 'complaint' || signal === 'urgent' ? signal
      : conv.identity === 'client' && (asksForPerson || urgentSupport || (CLIENT_NEEDS.has(u.intent) && (facts.problem || u.problem_summary))) ? 'existing_client'
        : asksForPerson ? 'asked_for_person'
          : urgentSupport ? 'urgent'
            : null

  if (u.sensitive_data) await store.trail(conversationId, 'wa.sensitive_data', {})

  /* 5. The guard. */
  const g = guardReply(u.reply, { canary })
  if (!g.ok) {
    await store.trail(conversationId, 'wa.guard_blocked', { flags: g.flags, intent: u.intent })
    deps.log('wa.guard.blocked', { conversation: conversationId, flags: g.flags.join(',') })
  }

  /* 6. OS writes. Never throws; a failure is recorded and retried next turn. */
  const qualifiedNow = !conv.qualifiedAt && conv.identity !== 'client' && isQualified(facts, u.qualification_complete)
  const osPatch = await osActions(conv, u, facts, qualifiedNow, !!reason, rid, deps)
  conv = { ...conv, ...osPatch }

  const statePatch: ConversationPatch = {
    language: lang, intent: u.intent, facts,
    ...(qualifiedNow ? { qualifiedAt: now } : {}),
  }
  if (changed.length || qualifiedNow) deps.log('wa.qualification', { conversation: conversationId, changed: changed.join(','), qualified: qualifiedNow })

  if (reason) {
    await store.update(conversationId, statePatch)
    conv = { ...conv, ...statePatch }
    return handover(conv, ids, replyKey, reason, copy.handoverAcknowledged(lang, reason, now), deps, { intent: u.intent, summary: u.problem_summary })
  }

  if (!g.ok) {
    /* The guarded copy says Marcel was told; the trail entry above is that notice. */
    await store.update(conversationId, statePatch)
    conv = { ...conv, ...statePatch }
    const delivery = await deliver(conv, replyKey, withDisclosure(conv, lang, copy.guarded(lang)), deps)
    await afterDelivery(conv, ids, delivery, {}, deps)
    return { kind: 'replied', delivery, handover: null, guarded: g.flags }
  }

  await store.update(conversationId, statePatch)
  conv = { ...conv, ...statePatch }
  if (qualifiedNow) await store.trail(conversationId, 'wa.qualified', { summary: u.problem_summary, leadId: conv.leadId })
  const delivery = await deliver(conv, replyKey, withDisclosure(conv, lang, g.text), deps)
  await afterDelivery(conv, ids, delivery, {}, deps)
  return { kind: 'replied', delivery, handover: null, guarded: [] }
}

/** Persist the handover first, then say so. */
async function handover(
  conv: Conversation, ids: string[], key: string, reason: TakeoverReason | 'existing_client' | 'model',
  text: string, deps: Deps, detail: Record<string, unknown>,
): Promise<Outcome> {
  const now = deps.now()
  await deps.store.update(conv.id, { handoverState: 'pending', handoverReason: reason, handoverAt: now })
  await deps.store.trail(conv.id, 'wa.handover', { reason, ...detail })
  deps.log('wa.handover', { conversation: conv.id, reason })
  const next = { ...conv, handoverState: 'pending' as const }
  const delivery = await deliver(next, key, withDisclosure(conv, conv.language ?? guessLanguage(text), text), deps)
  await afterDelivery(next, ids, delivery, {}, deps)
  return { kind: 'replied', delivery, handover: reason, guarded: [] }
}

function withDisclosure(conv: Conversation, lang: Lang, text: string): string {
  return conv.disclosedAt ? text : `${copy.disclosure(lang)}\n\n${text}`
}

async function afterDelivery(conv: Conversation, ids: string[], delivery: Delivery, patch: ConversationPatch, deps: Deps): Promise<void> {
  /* Only a delivered message discloses. A shadow-mode draft was never seen,
     so the first real reply after switching to `on` still carries it. */
  if (delivery === 'sent' && !conv.disclosedAt) patch = { ...patch, disclosedAt: deps.now() }
  if (Object.keys(patch).length) await deps.store.update(conv.id, patch)
  /* Suppressed (Marcel typed) and failed are settled too: a failed send is an
     alert to Marcel, not a loop that tries again on every webhook. */
  await deps.store.settle(ids, delivery === 'suppressed' ? 'held' : 'answered', delivery)
}

/* ── delivery ─────────────────────────────────────────────────────────── */

async function deliver(conv: Conversation, key: string, text: string, deps: Deps): Promise<Delivery> {
  const { store, config, provider } = deps
  const now = deps.now()

  /* 8. Marcel may have started typing while the model was thinking. He wins. */
  const fresh = await store.load(conv.id)
  if (fresh.handoverState === 'human') {
    await store.trail(conv.id, 'wa.suppressed_for_human', {})
    deps.log('wa.send.suppressed', { conversation: conv.id })
    return 'suppressed'
  }
  if (!windowOpen(fresh.lastInboundAt, now)) {
    await store.trail(conv.id, 'wa.send_failed', { kind: 'window_closed' })
    return 'failed'
  }

  const claim = await store.claimOutbound(conv.id, key, text)
  if (claim.existing) {
    if (claim.existing === 'sending') {
      /* A previous attempt started and never finished. It may have been
         delivered; sending again could deliver twice. */
      await store.trail(conv.id, 'wa.send_uncertain', { reason: 'interrupted_attempt' })
      return 'uncertain'
    }
    deps.log('wa.send.duplicate', { conversation: conv.id, status: claim.existing })
    return 'duplicate'
  }

  if (config.automation === 'shadow') {
    await store.finishOutbound(claim.id, { status: 'draft' })
    deps.log('wa.send.draft', { conversation: conv.id })
    return 'draft'
  }

  const started = Date.now()
  let r = await provider.sendText(fresh.contact, text)
  if (!r.ok && r.retryable) {
    /* Retryable means the provider said no — it did not take the message. */
    await (deps.sleep ?? ((ms) => new Promise((res) => setTimeout(res, ms))))(800)
    r = await provider.sendText(fresh.contact, text)
  }
  deps.log('wa.send.done', { conversation: conv.id, ms: Date.now() - started, ok: r.ok, kind: r.ok ? 'sent' : r.kind })
  if (r.ok) {
    await store.finishOutbound(claim.id, { status: 'sent', providerMessageId: r.providerMessageId })
    return 'sent'
  }
  if (r.kind === 'uncertain') {
    await store.finishOutbound(claim.id, { status: 'uncertain', error: r.detail })
    await store.trail(conv.id, 'wa.send_uncertain', { detail: r.detail })
    return 'uncertain'
  }
  await store.finishOutbound(claim.id, { status: 'failed', error: `${r.kind}${r.code ? ` ${r.code}` : ''}` })
  await store.trail(conv.id, 'wa.send_failed', { kind: r.kind, code: r.code ?? null })
  return 'failed'
}

/* ── Maxpromo OS ──────────────────────────────────────────────────────── */

async function osActions(
  conv: Conversation, u: Understanding, facts: Facts, qualifiedNow: boolean, handingOver: boolean,
  rid: (op: string) => string, deps: Deps,
): Promise<ConversationPatch> {
  const patch: ConversationPatch = {}
  const fail = async (op: string, err: unknown) => {
    deps.log('wa.os.failed', { conversation: conv.id, op, error: errText(err) })
    await deps.store.trail(conv.id, 'wa.os_failed', { op })
  }

  /* A lead is created only when there is something to record — a real
     business problem, or a person asking for Marcel — never for "Hi". */
  const substantive = !!facts.problem || SUBSTANTIVE.has(u.intent) || handingOver
  const unlinked = !conv.leadId && !conv.clientId && (conv.identity === 'new' || conv.identity === 'unresolved')
  if (unlinked && substantive) {
    try {
      const phone = conv.contact.phone ? `+${conv.contact.phone}` : undefined
      /* The profile name is the sender's own choice and is never used as the
         company: the OS deduplicates by company name, and a display name must
         not decide whose record this is. It may stand as the contact's name. */
      const company = facts.company ?? (facts.business_type ? `${facts.business_type} (WhatsApp)` : `WhatsApp ${phone ?? 'contact'}`)
      const input: LeadInput = {
        company: company.slice(0, 200),
        ...(facts.contact_name || conv.contact.profileName ? { name: (facts.contact_name ?? conv.contact.profileName)!.slice(0, 200) } : {}),
        ...(phone ? { phone } : {}),
        ...(facts.business_type ? { business_type: facts.business_type.slice(0, 100) } : {}),
        ...(facts.city ? { city: facts.city.slice(0, 100) } : {}),
        language: u.language,
        ...(u.problem_summary ? { summary: u.problem_summary } : {}),
      }
      let r = await deps.os.createLead(rid('lead.create'), input)
      let possibleDuplicates = 0
      if (!r.created) {
        /* The identity rule for a public channel: an existing record is this
           person only if it carries the number WhatsApp verified. A match on a
           name they typed is a coincidence or an impersonation — a separate
           lead is recorded and Marcel decides. */
        const byPhone = r.matches.filter((m) => m.basis.split('+').includes('phone'))
        if (byPhone.length === 1) {
          Object.assign(patch, byPhone[0].kind === 'client' ? { identity: 'client', clientId: byPhone[0].id } : { identity: 'lead', leadId: byPhone[0].id })
        } else if (byPhone.length > 1) {
          patch.identity = 'ambiguous'
          await deps.store.trail(conv.id, 'wa.identity_ambiguous', { matches: byPhone.length })
        } else {
          possibleDuplicates = r.matches.length
          r = await deps.os.createLead(rid('lead.create.distinct'), { ...input, distinctFrom: r.matches.map((m) => m.id) })
        }
      }
      if (r.created) {
        Object.assign(patch, { identity: 'lead', leadId: r.id })
        if (possibleDuplicates) await deps.store.trail(conv.id, 'wa.possible_duplicate', { leadId: r.id, matches: possibleDuplicates })
      }
      if (patch.leadId) await deps.store.trail(conv.id, 'wa.lead_linked', { leadId: patch.leadId, created: r.created })
    } catch (err) { await fail('lead.create', err) }
  }

  const leadId = patch.leadId ?? conv.leadId
  if (qualifiedNow && leadId) {
    try {
      const summary = [u.problem_summary, ...Object.entries(facts).map(([k, v]) => `${k.replace('_', ' ')}: ${v}`)].filter(Boolean).join('\n')
      await deps.os.recordQualification(rid('qualify'), leadId, summary.slice(0, 3800))
    } catch (err) { await fail('qualify', err) }
  }

  const clientId = patch.clientId ?? conv.clientId
  if (clientId && CLIENT_NEEDS.has(u.intent) && (facts.problem || u.problem_summary)) {
    try {
      await deps.os.openIncident(rid('incident'), clientId, {
        title: `WhatsApp: ${(u.problem_summary ?? facts.problem ?? 'support request').slice(0, 180)}`,
        detail: [u.problem_summary, facts.problem, facts.urgency].filter(Boolean).join('\n').slice(0, 3800),
        severity: u.urgency === 'high' ? 'high' : 'medium',
        /* One open incident per conversation; later messages join its timeline. */
        dedupeKey: `whatsapp:${conv.id}`,
      })
      await deps.store.trail(conv.id, 'wa.incident_opened', {})
    } catch (err) { await fail('incident.create', err) }
  }
  if (Object.keys(patch).length) await deps.store.update(conv.id, patch)
  return patch
}

/* ── model input ──────────────────────────────────────────────────────── */

const KIND_NOTE: Partial<Record<InboundKind, string>> = {
  voice: '[sent a voice message]', image: '[sent an image]', video: '[sent a video]', document: '[sent a document]',
  location: '[shared a location]', contacts: '[shared a contact card]', sticker: '[sent a sticker]', unsupported: '[sent an unsupported message]',
}

/**
 * Conversation → alternating model turns. Customer text is wrapped as data.
 * Marcel's own messages are shown as the business's side, labelled, so the
 * model continues his thread instead of contradicting it.
 */
export function toTurns(history: StoredMessage[], pending: StoredMessage[]): ModelTurn[] {
  const seen = new Set(pending.map((p) => p.id))
  const all = [...history.filter((h) => !seen.has(h.id)), ...pending]
  const turns: ModelTurn[] = []
  for (const m of all) {
    if (m.role === 'system') continue
    const role: ModelTurn['role'] = m.role === 'user' ? 'user' : 'assistant'
    const body = m.role === 'user'
      ? asCustomerData([m.text, MEDIA.has(m.kind) ? KIND_NOTE[m.kind] : ''].filter(Boolean).join(' '))
      : m.role === 'human_agent' ? `(Marcel, in person:) ${m.text}` : m.text
    if (!body.trim()) continue
    const last = turns[turns.length - 1]
    if (last && last.role === role) last.content += `\n${body}`
    else turns.push({ role, content: body })
  }
  while (turns.length && turns[0].role !== 'user') turns.shift()
  return turns
}

function errText(err: unknown): string {
  return (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).slice(0, 200)
}
