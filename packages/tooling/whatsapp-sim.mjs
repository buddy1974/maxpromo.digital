/**
 * packages/tooling/whatsapp-sim.mjs
 *
 * The local WhatsApp simulator: what Meta would send, without Meta.
 *
 *   payloads     Cloud API webhook bodies (messages, echoes, statuses) shaped
 *                as documented, for any test number — never the real one
 *   memoryStore  an in-memory ConversationStore with the database's
 *                semantics: insert-once by provider id and by reply key, a
 *                conditional lease, monotonic delivery states
 *   graphMock    a loopback HTTP server that answers like the Graph send API,
 *                scriptable per call (success, 5xx, 131047, timeout)
 *
 * Used by prove-whatsapp-gateway (offline, every merge) and
 * prove-whatsapp-live (the real route, evidence database, real model).
 */

import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'

/** Test numbers: the reserved fictional range +49 1520 000xxxx. Never the business number. */
export const TEST_BUSINESS = { phoneNumberId: '100000000000001', waba: '200000000000001', display: '4915200000000' }
export const testPhone = (n) => `491520000${String(n).padStart(4, '0')}`

export const wamid = () => `wamid.SIM${randomBytes(12).toString('hex').toUpperCase()}`
const unix = (d) => String(Math.floor((d ?? new Date()).getTime() / 1000))

function envelope(field, value, opts = {}) {
  return {
    object: 'whatsapp_business_account',
    entry: [{
      id: opts.waba ?? TEST_BUSINESS.waba,
      changes: [{
        field,
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: TEST_BUSINESS.display, phone_number_id: opts.phoneNumberId ?? TEST_BUSINESS.phoneNumberId },
          ...value,
        },
      }],
    }],
  }
}

/** One or more customer messages. `m`: { from, text?, type?, id?, at?, name?, userId? } */
export function inbound(messages, opts) {
  const list = Array.isArray(messages) ? messages : [messages]
  return envelope('messages', {
    contacts: list.map((m) => ({ profile: { name: m.name ?? 'Sim Kunde' }, wa_id: m.from ?? '', ...(m.userId ? { user_id: m.userId } : {}) })),
    messages: list.map((m) => {
      const type = m.type ?? 'text'
      const base = { from: m.from ?? '', id: m.id ?? wamid(), timestamp: unix(m.at), type, ...(m.userId ? { from_user_id: m.userId } : {}) }
      if (type === 'text') return { ...base, text: { body: m.text ?? '' } }
      if (type === 'audio') return { ...base, audio: { id: 'media1', mime_type: 'audio/ogg' } }
      if (type === 'image') return { ...base, image: { id: 'media2', mime_type: 'image/jpeg', ...(m.text ? { caption: m.text } : {}) } }
      if (type === 'reaction') return { ...base, reaction: { message_id: 'x', emoji: '👍' } }
      if (type === 'sticker') return { ...base, sticker: { id: 'st' } }
      if (type === 'interactive') return { ...base, interactive: { type: 'button_reply', button_reply: { id: 'b1', title: m.text ?? 'Yes' } } }
      return base
    }),
  }, opts)
}

/** The business typing in the WhatsApp Business App (coexistence echo). */
export function echo({ to, text, id, at }, opts) {
  return envelope('smb_message_echoes', {
    message_echoes: [{ from: TEST_BUSINESS.display, to, id: id ?? wamid(), timestamp: unix(at), type: 'text', text: { body: text } }],
  }, opts)
}

export function status({ id, state, at, code }, opts) {
  return envelope('messages', {
    statuses: [{ id, status: state, timestamp: unix(at), recipient_id: testPhone(1), ...(code ? { errors: [{ code, title: 'x' }] } : {}) }],
  }, opts)
}

/* ── in-memory store ───────────────────────────────────────────────────── */

export function memoryStore(clock) {
  const sessions = new Map()
  const messages = []
  const events = []
  let seq = 0
  let sid = 0
  const rank = { sent: 1, delivered: 2, read: 3 }

  function sessionFor(contact) {
    if (contact.userId) {
      for (const s of sessions.values()) {
        if (s.contact.userId === contact.userId) {
          if (!s.contact.phone && contact.phone) s.contact.phone = contact.phone
          if (contact.profileName) s.contact.profileName = contact.profileName
          return s.id
        }
      }
    }
    const originId = contact.phone ?? `u:${contact.userId}`
    for (const s of sessions.values()) {
      if (s.originId === originId) {
        if (!s.contact.userId && contact.userId) s.contact.userId = contact.userId
        if (contact.profileName) s.contact.profileName = contact.profileName
        return s.id
      }
    }
    const id = `00000000-0000-4000-8000-${String(++sid).padStart(12, '0')}`
    sessions.set(id, {
      id, originId, contact: { ...contact }, handoverState: 'bot', handoverReason: null, handoverAt: null, humanLastAt: null,
      lastInboundAt: null, language: null, identity: 'unresolved', leadId: null, clientId: null, knownFirstName: null,
      facts: {}, intent: null, qualifiedAt: null, disclosedAt: null, modelTurnsDay: null, modelTurns: 0, leaseUntil: 0,
    })
    return id
  }
  const byExternal = (ext) => messages.find((m) => m.externalId === ext)

  const store = {
    async recordInbound(m, answerable) {
      const conversationId = sessionFor(m.contact)
      if (byExternal(m.externalId)) return { conversationId, duplicate: true }
      messages.push({ id: String(++seq), session: conversationId, externalId: m.externalId, role: 'user', kind: m.kind, text: m.text, at: m.sentAt, turnState: answerable ? 'pending' : 'held' })
      const s = sessions.get(conversationId)
      if (!s.lastInboundAt || m.sentAt > s.lastInboundAt) s.lastInboundAt = m.sentAt
      return { conversationId, duplicate: false }
    },
    async recordEcho(e, isHuman) {
      const conversationId = sessionFor(e.contact)
      if (byExternal(e.externalId)) return { conversationId, duplicate: true }
      messages.push({ id: String(++seq), session: conversationId, externalId: e.externalId, role: isHuman ? 'human_agent' : 'system', kind: e.kind, text: e.text, at: e.sentAt })
      if (isHuman) {
        const s = sessions.get(conversationId)
        s.handoverState = 'human'
        s.handoverReason ??= 'marcel_replied'
        s.handoverAt ??= clock()
        if (!s.humanLastAt || e.sentAt > s.humanLastAt) s.humanLastAt = e.sentAt
      }
      return { conversationId, duplicate: false }
    },
    async recordStatus(st) {
      const m = byExternal(st.externalId)
      if (!m) return false
      if (m.delivery && st.state !== 'failed' && !((rank[st.state] ?? 0) > (rank[m.delivery] ?? 0))) return false
      m.delivery = st.state
      if (st.state === 'failed') events.push({ session: m.session, kind: 'wa.send_failed', detail: { kind: 'delivery', code: st.errorCode ?? null } })
      return true
    },
    async acquire(id, _now, ttl) {
      const s = sessions.get(id)
      const t = clock().getTime()
      if (s.leaseUntil > t) return false
      s.leaseUntil = t + ttl
      return true
    },
    async release(id) { sessions.get(id).leaseUntil = 0 },
    async load(id) {
      const s = sessions.get(id)
      if (!s) throw new Error('conversation not found')
      const { originId, leaseUntil, ...c } = s
      return structuredClone(c)
    },
    async pending(id) {
      return messages.filter((m) => m.session === id && m.turnState === 'pending')
        .sort((a, b) => a.at - b.at || Number(a.id) - Number(b.id)).slice(0, 20).map(view)
    },
    async history(id, limit) {
      return messages.filter((m) => m.session === id && (!m.outStatus || ['sent', 'draft', 'uncertain'].includes(m.outStatus)))
        .sort((a, b) => a.at - b.at || Number(a.id) - Number(b.id)).slice(-limit).map(view)
    },
    async update(id, patch) {
      const s = sessions.get(id)
      for (const [k, v] of Object.entries(patch)) {
        if (!(k in s) || ['id', 'contact', 'lastInboundAt', 'humanLastAt'].includes(k)) throw new Error(`unknown conversation field ${k}`)
        s[k] = v
      }
    },
    async settle(ids, state, note) {
      for (const m of messages) if (ids.includes(m.id) && m.turnState === 'pending') { m.turnState = state; m.turnNote = note }
    },
    async claimOutbound(id, key, text) {
      const prior = messages.find((m) => m.session === id && m.outKey === key)
      if (prior) return { id: prior.id, existing: prior.outStatus }
      const m = { id: String(++seq), session: id, role: 'assistant', kind: 'text', text, at: clock(), outKey: key, outStatus: 'sending' }
      messages.push(m)
      return { id: m.id, existing: null }
    },
    async finishOutbound(id, r) {
      const m = messages.find((x) => x.id === id)
      if (m.outStatus !== 'sending') return
      m.outStatus = r.status
      if (r.providerMessageId) m.externalId = r.providerMessageId
      m.outError = r.error
    },
    async trail(id, kind, detail) { events.push({ session: id, kind, detail }) },
  }
  function view(m) { return { id: m.id, externalId: m.externalId ?? null, role: m.role, kind: m.kind, text: m.text, at: m.at } }
  return { store, sessions, messages, events }
}

/* ── loopback Graph mock ──────────────────────────────────────────────── */

/**
 * Answers POST /<version>/<phone-id>/messages like the Graph API. `script`
 * is consulted per call: return { status, body } or 'hang' to never answer.
 */
export async function graphMock(script = () => ({ status: 200 })) {
  const calls = []
  const server = createServer((req, res) => {
    let body = ''
    req.on('data', (c) => { body += c })
    req.on('end', () => {
      const call = { path: req.url, auth: req.headers.authorization ?? '', body: body ? JSON.parse(body) : null }
      calls.push(call)
      const r = script(call, calls.length)
      if (r === 'hang') return
      const id = wamid()
      res.writeHead(r.status ?? 200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(r.body ?? (r.status && r.status >= 400 ? { error: { code: r.code ?? 131000, message: 'sim error' } } : { messaging_product: 'whatsapp', contacts: [{ wa_id: call.body?.to }], messages: [{ id }] })))
    })
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const { port } = server.address()
  return { url: `http://127.0.0.1:${port}`, calls, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r) }) }
}
