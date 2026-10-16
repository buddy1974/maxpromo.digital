/**
 * lib/channels/policy.ts
 *
 * The rules that decide whether Max may speak, written once and as pure
 * functions so each one is proved directly.
 *
 *   window        free-form replies only inside the customer-service window
 *                 opened by the customer's own last message
 *   mode          bot · pending (asked for Marcel) · human (Marcel is typing)
 *   takeover      an echo from the Business App means Marcel is in the chat;
 *                 the agent goes silent and stays silent until he has been
 *                 quiet for the configured hours
 *   hours         Maxpromo's published opening hours, Berlin time
 *
 * Nothing here sends, stores or calls a model.
 */

import { normaliseForMatch, type WhatsAppConfig } from './config.ts'

export type HandoverState = 'bot' | 'pending' | 'human'

/** The free-form window. Meta defines it as 24 h; a margin keeps us clear of the edge. */
export const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000
const WINDOW_MARGIN_MS = 10 * 60 * 1000
/** A message older than this when we get to it is recorded but not answered automatically. */
export const STALE_AFTER_MS = 6 * 60 * 60 * 1000

export function windowOpen(lastInboundAt: Date | null, now: Date): boolean {
  if (!lastInboundAt) return false
  const age = now.getTime() - lastInboundAt.getTime()
  return age >= -5 * 60 * 1000 && age < SERVICE_WINDOW_MS - WINDOW_MARGIN_MS
}

/* ── opening hours ────────────────────────────────────────────────────── */

/** Mon–Fri 09–18, Sat 12–16, Sun closed — as published on the WhatsApp Business profile. */
export const OPENING_HOURS: Record<number, [number, number] | null> = {
  0: null, 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [12, 16],
}

function berlinParts(at: Date): { weekday: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(at)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  return { weekday, hour: Number(get('hour')) % 24, minute: Number(get('minute')) }
}

export function isOpen(at: Date): boolean {
  const { weekday, hour } = berlinParts(at)
  const h = OPENING_HOURS[weekday]
  return !!h && hour >= h[0] && hour < h[1]
}

/** When Marcel is next reachable: { weekday, hour } in Berlin, or null if open now. */
export function nextOpening(at: Date): { weekday: number; hour: number; sameDay: boolean; tomorrow: boolean } | null {
  if (isOpen(at)) return null
  const { weekday, hour } = berlinParts(at)
  for (let d = 0; d < 8; d++) {
    const wd = (weekday + d) % 7
    const h = OPENING_HOURS[wd]
    if (!h) continue
    if (d === 0 && hour >= h[0]) continue
    return { weekday: wd, hour: h[0], sameDay: d === 0, tomorrow: d === 1 }
  }
  return null
}

/* ── language ─────────────────────────────────────────────────────────── */

export type Lang = 'de' | 'en'

/**
 * A fallback only. The model decides the conversation's language; this
 * decides which fixed sentence to use when the model is not there to ask,
 * so it only has to tell German from English well enough not to answer a
 * German speaker in English.
 */
export function guessLanguage(text: string, fallback: Lang = 'de'): Lang {
  const t = ` ${text.toLowerCase()} `
  if (/[äöüß]/.test(t)) return 'de'
  const de = (t.match(/\s(ich|und|nicht|wir|ist|das|die|der|mit|hallo|guten|moin|bitte|danke|haben|kann|mein|meine|unsere?|wie|was|für|auf|eine?)\s/g) ?? []).length
  const en = (t.match(/\s(i|and|not|we|is|the|with|hello|hi|please|thanks|have|can|my|our|how|what|for|on|an?)\s/g) ?? []).length
  if (de === en) return fallback
  return de > en ? 'de' : 'en'
}

/* ── takeover ─────────────────────────────────────────────────────────── */

/**
 * An echo is Marcel typing — unless it is the Business App's own greeting or
 * away message, whose echoes must not silence Max. Matched on the configured
 * openings of those texts, normalised.
 */
export function isNativeAutoReply(text: string, config: Pick<WhatsAppConfig, 'nativeAutoReplyPrefixes'>): boolean {
  const n = normaliseForMatch(text)
  if (!n) return false
  return config.nativeAutoReplyPrefixes.some((p) => n.startsWith(p) || p.startsWith(n.slice(0, Math.max(p.length, 24))))
}

export interface ConversationView {
  handoverState: HandoverState
  humanLastAt: Date | null
  handoverAt: Date | null
  lastInboundAt: Date | null
}

/**
 * The state a conversation is in *now*: a human who has been quiet for the
 * configured hours hands the conversation back. Returned, not written — the
 * caller persists it, so the rule is stated once.
 */
export function effectiveState(c: ConversationView, now: Date, idleHours: number): { state: HandoverState; resumed: boolean } {
  if (c.handoverState === 'bot') return { state: 'bot', resumed: false }
  const since = c.handoverState === 'human' ? c.humanLastAt : (c.humanLastAt ?? c.handoverAt)
  if (since && now.getTime() - since.getTime() > idleHours * 3600_000) return { state: 'bot', resumed: true }
  return { state: c.handoverState, resumed: false }
}

export type Hold =
  | 'automation_off'
  | 'not_on_pilot_list'
  | 'human_in_chat'
  | 'waiting_for_marcel'
  | 'stale'
  | 'window_closed'
  | 'no_text_to_answer'

/**
 * Whether Max may answer the pending messages at all, before a model is asked.
 * The first matching reason wins; the order is the order of authority.
 */
export function mayAnswer(p: {
  config: Pick<WhatsAppConfig, 'automation' | 'testAllowlist'>
  state: HandoverState
  contactPhone: string | null
  newestPendingAt: Date
  lastInboundAt: Date | null
  anyAnswerable: boolean
  now: Date
}): { ok: true } | { ok: false; hold: Hold } {
  if (p.config.automation === 'off') return { ok: false, hold: 'automation_off' }
  if (p.config.testAllowlist.size && !(p.contactPhone && p.config.testAllowlist.has(p.contactPhone))) return { ok: false, hold: 'not_on_pilot_list' }
  if (p.state === 'human') return { ok: false, hold: 'human_in_chat' }
  if (p.state === 'pending') return { ok: false, hold: 'waiting_for_marcel' }
  if (p.now.getTime() - p.newestPendingAt.getTime() > STALE_AFTER_MS) return { ok: false, hold: 'stale' }
  if (!windowOpen(p.lastInboundAt, p.now)) return { ok: false, hold: 'window_closed' }
  if (!p.anyAnswerable) return { ok: false, hold: 'no_text_to_answer' }
  return { ok: true }
}

/**
 * Deterministic takeover signals, checked before and independently of the
 * model: if the model is down, misreads, or is talked out of it, a person who
 * asks for a person still gets one. Deliberately narrow — the model catches
 * the rest; this catches the unmistakable.
 */
const HUMAN_ASK = [
  /* Marcel by name only together with asking for him — "Marcel told me to
     write to you" is the live demo's opening line, not a request for Marcel. */
  /\b(want|need|speak|talk|reach|call|möchte|will|sprechen|erreichen|anrufen)\b[^.?!\n]{0,25}\bmarcel\b/i,
  /\bmarcel\s+(soll|sollte|möge|kann|könnte|should|could|can|please|bitte)\b[^.?!\n]{0,20}\b(call|ring|contact|anrufen|zurückrufen|melden)\b/i,
  /\b(can|could|kann|könnte)\s+marcel\b[^.?!\n]{0,20}\b(call|ring|contact|anrufen|zurückrufen|melden)\b/i,
  /\b(can|could|kann|könnte)\s+(i|ich)\s+(speak|talk|sprechen)\b[^.?!\n]{0,20}\bmarcel\b/i,
  /\bmit\s+(herrn\s+)?marcel\s+(sprechen|reden|telefonieren)\b/i,
  /\b(speak|talk)\s+(to|with)\s+marcel\b/i,
  /\b(echte[nrm]?|richtige[nrm]?)\s+(mensch|person|mitarbeiter)/i,
  /\b(mit|an)\s+(einem|einer|einen)\s+(mensch|menschen|person|mitarbeiter)/i,
  /\b(menschen|mensch)\s+sprechen\b/i,
  /\bruf(t|en sie)?\s+(mich|uns)\s+(bitte\s+)?(an|zurück)\b/i,
  /\brückruf\b/i,
  /\b(real|actual|human)\s+(person|human|being|agent)\b/i,
  /\b(speak|talk)\s+(to|with)\s+(a\s+)?(person|human|someone|somebody|marcel|the owner)\b/i,
  /\bcall\s+me\b/i,
]
const URGENT = [/\b(dringend|notfall|sofort|eilig)\b/i, /\b(urgent|emergency|asap|right now|immediately)\b/i]
const COMPLAINT = [/\b(beschwerde|reklamation|unzufrieden|enttäuscht)\b/i, /\b(complaint|complain|unacceptable|refund|disappointed)\b/i]

export type TakeoverReason = 'asked_for_person' | 'urgent' | 'complaint'

export function takeoverSignal(text: string): TakeoverReason | null {
  if (HUMAN_ASK.some((r) => r.test(text))) return 'asked_for_person'
  if (COMPLAINT.some((r) => r.test(text))) return 'complaint'
  if (URGENT.some((r) => r.test(text))) return 'urgent'
  return null
}
