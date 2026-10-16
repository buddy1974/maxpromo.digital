/**
 * lib/channels/whatsapp.ts — the WhatsApp Cloud API adapter. SERVER ONLY.
 *
 * The only file that knows Meta's shapes. It does four things:
 *
 *   verifyChallenge    the GET handshake Meta performs when the callback URL is saved
 *   verifyWebhook      X-Hub-Signature-256 = HMAC-SHA256(app secret, raw body)
 *   normalizeWebhook   Meta payload → channel-neutral events (lib/channels/types.ts)
 *   createWhatsAppProvider   one free-form text send, with every outcome classified
 *
 * Everything past this file is provider-neutral. Another channel is another
 * adapter beside this one, not a change to the conversation engine.
 *
 * Pure apart from `fetch`, which is injected, and node:crypto.
 */

import { createHmac, timingSafeEqual } from 'node:crypto'
import type {
  ChannelEvent, ChannelProvider, ContactRef, DeliveryState, InboundKind, NormalizeResult, Rejection, SendResult,
} from './types.ts'

/** WhatsApp's own limit on a text body. */
export const MAX_TEXT = 4096
/** A webhook body above this is refused before it is parsed. Meta batches are far smaller. */
export const MAX_BODY_BYTES = 512 * 1024

/* ── handshake ────────────────────────────────────────────────────────── */

/**
 * Meta saves a callback URL with GET ?hub.mode=subscribe&hub.verify_token=…&hub.challenge=….
 * The answer is the challenge, verbatim, as text — or nothing.
 */
export function verifyChallenge(params: URLSearchParams, verifyToken: string): { ok: true; challenge: string } | { ok: false } {
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token') ?? ''
  const challenge = params.get('hub.challenge') ?? ''
  if (mode !== 'subscribe' || !challenge || challenge.length > 200 || !/^[A-Za-z0-9_-]+$/.test(challenge)) return { ok: false }
  if (!safeEqual(token, verifyToken)) return { ok: false }
  return { ok: true, challenge }
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a, 'utf8')
  const y = Buffer.from(b, 'utf8')
  return x.length === y.length && timingSafeEqual(x, y)
}

/* ── signature ────────────────────────────────────────────────────────── */

export type SignatureVerdict = { ok: true } | { ok: false; reason: 'not_configured' | 'missing' | 'malformed' | 'mismatch' }

/**
 * Verifies over the RAW body bytes. Re-serialising parsed JSON would change
 * Meta's escaping of non-ASCII text and fail every German message with an
 * umlaut — the signature is over what arrived, so that is what is hashed.
 */
export function verifyWebhook(rawBody: string, header: string | null, appSecret: string | undefined): SignatureVerdict {
  if (!appSecret || appSecret.length < 32) return { ok: false, reason: 'not_configured' }
  if (!header) return { ok: false, reason: 'missing' }
  const m = /^sha256=([0-9a-f]{64})$/i.exec(header.trim())
  if (!m) return { ok: false, reason: 'malformed' }
  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest()
  const given = Buffer.from(m[1].toLowerCase(), 'hex')
  return given.length === expected.length && timingSafeEqual(given, expected) ? { ok: true } : { ok: false, reason: 'mismatch' }
}

/** For the simulator and the proof: what Meta would send. */
export function signWebhook(rawBody: string, appSecret: string): string {
  return `sha256=${createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex')}`
}

/* ── normalisation ────────────────────────────────────────────────────── */

type J = Record<string, unknown>
const obj = (x: unknown): J | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as J) : null)
const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])
const s = (x: unknown): string => (typeof x === 'string' ? x : '')

const WAMID = /^[A-Za-z0-9._=:+/-]{8,256}$/
const PHONE = /^\d{6,15}$/
/* Meta's business-scoped user id: ISO country code, a period, then alphanumerics. */
const BSUID = /^[A-Z]{2}\.[A-Za-z0-9]{1,128}$/

/**
 * Clean text from an untrusted sender: control characters and bidi overrides
 * removed (they hide text from a reader, not from a model), length capped.
 */
export function cleanText(raw: string, max = MAX_TEXT): string {
  return raw
    .normalize('NFC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
    .slice(0, max)
}

function timestamp(x: unknown): Date | null {
  const n = Number(s(x) || x)
  if (!Number.isFinite(n) || n < 1_500_000_000 || n > 4_000_000_000) return null
  return new Date(n * 1000)
}

function contactOf(phoneRaw: unknown, userIdRaw: unknown, profileName?: string): ContactRef | null {
  const phone = s(phoneRaw).replace(/^\+/, '')
  const userId = s(userIdRaw)
  const c: ContactRef = {}
  if (PHONE.test(phone)) c.phone = phone
  if (BSUID.test(userId)) c.userId = userId
  if (!c.phone && !c.userId) return null
  if (profileName) {
    const n = cleanText(profileName, 80)
    if (n) c.profileName = n
  }
  return c
}

/** What a message says, by kind. Media is described, never downloaded. */
function content(m: J): { kind: InboundKind; text: string } {
  const type = s(m.type)
  switch (type) {
    case 'text': return { kind: 'text', text: cleanText(s(obj(m.text)?.body)) }
    case 'button': return { kind: 'interactive', text: cleanText(s(obj(m.button)?.text), 200) }
    case 'interactive': {
      const i = obj(m.interactive)
      const reply = obj(i?.button_reply) ?? obj(i?.list_reply)
      return { kind: 'interactive', text: cleanText(s(reply?.title), 200) }
    }
    case 'audio': return { kind: 'voice', text: '' }
    case 'image': return { kind: 'image', text: cleanText(s(obj(m.image)?.caption), 1000) }
    case 'video': return { kind: 'video', text: cleanText(s(obj(m.video)?.caption), 1000) }
    case 'document': return { kind: 'document', text: cleanText(s(obj(m.document)?.caption), 1000) }
    case 'sticker': return { kind: 'sticker', text: '' }
    case 'location': return { kind: 'location', text: '' }
    case 'contacts': return { kind: 'contacts', text: '' }
    case 'reaction': return { kind: 'reaction', text: '' }
    default: return { kind: 'unsupported', text: '' }
  }
}

const DELIVERY: Record<string, DeliveryState> = { sent: 'sent', delivered: 'delivered', read: 'read', failed: 'failed' }

/**
 * Meta payload → events. Anything not addressed to the configured number, or
 * not shaped as documented, is ignored with a reason; nothing malformed is
 * passed on. The caller has already verified the signature.
 */
export function normalizeWebhook(
  payload: unknown,
  scope: { phoneNumberId: string; businessAccountId: string | null },
): NormalizeResult {
  const events: ChannelEvent[] = []
  const ignored: Rejection[] = []
  const root = obj(payload)
  if (!root || root.object !== 'whatsapp_business_account') {
    return { events, ignored: [{ reason: 'not_a_whatsapp_business_account_payload' }] }
  }
  const entries = arr(root.entry)
  if (!entries.length || entries.length > 50) return { events, ignored: [{ reason: 'entry_count' }] }

  for (const e of entries) {
    const entry = obj(e)
    if (!entry) { ignored.push({ reason: 'entry_shape' }); continue }
    if (scope.businessAccountId && s(entry.id) !== scope.businessAccountId) { ignored.push({ reason: 'foreign_business_account' }); continue }
    for (const c of arr(entry.changes).slice(0, 50)) {
      const change = obj(c)
      const field = s(change?.field)
      const value = obj(change?.value)
      if (!value) { ignored.push({ reason: 'change_shape' }); continue }
      if (field !== 'messages' && field !== 'smb_message_echoes') { ignored.push({ reason: `field_${field || 'missing'}` }); continue }

      /* The business boundary: one app can carry several numbers. Only ours is ours. */
      const meta = obj(value.metadata)
      const account = s(meta?.phone_number_id)
      if (account !== scope.phoneNumberId) { ignored.push({ reason: 'foreign_phone_number' }); continue }

      const names = new Map<string, string>()
      for (const ct of arr(value.contacts)) {
        const o = obj(ct)
        const name = s(obj(o?.profile)?.name)
        if (name) { names.set(s(o?.wa_id), name); names.set(s(o?.user_id), name) }
      }

      for (const raw of arr(value.messages).slice(0, 100)) {
        const m = obj(raw)
        const id = s(m?.id)
        const at = timestamp(m?.timestamp)
        if (!m || !WAMID.test(id) || !at) { ignored.push({ reason: 'message_shape' }); continue }
        const from = s(m.from)
        const contact = contactOf(from, m.from_user_id ?? m.user_id, names.get(from) ?? names.get(s(m.from_user_id ?? m.user_id)))
        if (!contact) { ignored.push({ reason: 'sender_shape' }); continue }
        events.push({ type: 'message', channel: 'whatsapp', account, externalId: id, contact, ...content(m), sentAt: at })
      }

      for (const raw of arr(value.message_echoes).slice(0, 100)) {
        const m = obj(raw)
        const id = s(m?.id)
        const at = timestamp(m?.timestamp)
        if (!m || !WAMID.test(id) || !at) { ignored.push({ reason: 'echo_shape' }); continue }
        const contact = contactOf(m.to, m.to_user_id, undefined)
        if (!contact) { ignored.push({ reason: 'echo_recipient_shape' }); continue }
        events.push({ type: 'echo', channel: 'whatsapp', account, externalId: id, contact, ...content(m), sentAt: at })
      }

      for (const raw of arr(value.statuses).slice(0, 200)) {
        const st = obj(raw)
        const id = s(st?.id)
        const state = DELIVERY[s(st?.status)]
        const at = timestamp(st?.timestamp)
        if (!st || !WAMID.test(id) || !state || !at) { ignored.push({ reason: 'status_shape' }); continue }
        const code = Number(obj(arr(st.errors)[0])?.code)
        events.push({ type: 'status', channel: 'whatsapp', account, externalId: id, state, at, ...(Number.isFinite(code) ? { errorCode: code } : {}) })
      }
    }
  }
  return { events, ignored }
}

/* ── transport ────────────────────────────────────────────────────────── */

/**
 * Meta error codes → what the orchestrator should do. Codes not listed fall
 * back on the HTTP status. The table is the documented meaning as of
 * 2026-10; an unknown code is never treated as success.
 */
export function classifySendError(status: number, code: number | undefined): { kind: Exclude<SendResult, { ok: true }>['kind']; retryable: boolean } {
  if (code === 131047) return { kind: 'window_closed', retryable: false }
  if (code === 130429 || code === 131056 || code === 80007 || code === 4 || status === 429) return { kind: 'rate_limited', retryable: true }
  if (code === 190 || code === 10 || code === 200 || code === 131005 || status === 401 || status === 403) return { kind: 'auth', retryable: false }
  if (code === 131026 || code === 131021 || code === 131030 || code === 131045 || code === 131031) return { kind: 'recipient', retryable: false }
  if (code === 131000 || code === 131016 || code === 1 || code === 2 || status >= 500) return { kind: 'provider_down', retryable: true }
  return { kind: 'invalid', retryable: false }
}

export interface ProviderOptions {
  baseUrl: string
  graphVersion: string
  phoneNumberId: string
  accessToken: string | null
  /** Evidence mode: refuse anything but a loopback simulator. */
  evidenceMode: boolean
  fetch?: typeof fetch
  timeoutMs?: number
}

export function createWhatsAppProvider(o: ProviderOptions): ChannelProvider {
  const doFetch = o.fetch ?? fetch
  const timeoutMs = o.timeoutMs ?? 10_000
  return {
    channel: 'whatsapp',
    async sendText(to, text) {
      /* The evidence boundary sits inside the transport, before any network
         call (packages/config/evidence.ts): in evidence mode nothing reaches a
         real number, whatever the caller decided. */
      if (o.evidenceMode && !/^http:\/\/(127\.0\.0\.1|localhost)/.test(o.baseUrl)) {
        return { ok: false, kind: 'blocked', retryable: false, detail: 'evidence mode: WhatsApp send suppressed' }
      }
      if (!o.accessToken) return { ok: false, kind: 'blocked', retryable: false, detail: 'no access token configured' }
      /* A username-only contact has no phone. Sending by business-scoped id
         is not enabled until it has been verified against the live API. */
      if (!to.phone) return { ok: false, kind: 'blocked', retryable: false, detail: 'contact has no phone number; BSUID sending not enabled' }
      const body = cleanText(text)
      if (!body) return { ok: false, kind: 'invalid', retryable: false, detail: 'empty message' }

      const ctl = new AbortController()
      const timer = setTimeout(() => ctl.abort(), timeoutMs)
      let res: Response
      try {
        res = await doFetch(`${o.baseUrl}/${o.graphVersion}/${o.phoneNumberId}/messages`, {
          method: 'POST',
          headers: { authorization: `Bearer ${o.accessToken}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.phone,
            type: 'text',
            text: { body, preview_url: false },
          }),
          signal: ctl.signal,
        })
      } catch (err) {
        /* No answer: the request may or may not have been accepted. A second
           send could deliver the message twice, so this is never retried. */
        return { ok: false, kind: 'uncertain', retryable: false, detail: err instanceof Error && err.name === 'AbortError' ? 'timeout' : 'network error' }
      } finally {
        clearTimeout(timer)
      }

      let json: J | null = null
      try { json = obj(await res.json()) } catch { /* not json */ }
      if (res.ok) {
        const id = s(obj(arr(json?.messages)[0])?.id)
        if (WAMID.test(id)) return { ok: true, providerMessageId: id }
        /* 200 without an id: accepted or not, we cannot tell. */
        return { ok: false, kind: 'uncertain', retryable: false, detail: 'accepted without a message id' }
      }
      const err = obj(json?.error)
      const code = Number(err?.code)
      const c = classifySendError(res.status, Number.isFinite(code) ? code : undefined)
      /* The provider's message is for the log; it never carries the token. */
      return { ok: false, ...c, ...(Number.isFinite(code) ? { code } : {}), detail: `${res.status} ${s(err?.message).slice(0, 200)}` }
    },
  }
}
