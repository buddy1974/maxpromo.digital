/**
 * /api/channels/whatsapp — the WhatsApp Cloud API webhook.
 *
 *   GET   Meta's verification handshake (hub.mode / hub.verify_token / hub.challenge)
 *   POST  events. Order of checks, each failing closed:
 *           size → configuration → signature over the raw body → shape →
 *           durable, idempotent ingest → 200 → answer after the response
 *
 * Nothing reaches the conversation engine, a model or Maxpromo OS before the
 * signature has been verified. A database failure during ingest answers 500,
 * so Meta redelivers (for up to seven days) and no message is lost; a repeated
 * delivery is a no-op because every message is stored once by its id.
 *
 * Outside the locale and OS middleware by its path (middleware matcher).
 */

import { after, NextResponse, type NextRequest } from 'next/server'
import { isEvidenceMode } from '@maxpromo/config'
import { newTrace } from '@maxpromo/observability'
import { isDatabaseConfigured, getDb } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { loadWhatsAppConfig } from '@/lib/channels/config'
import { ingest, processConversation } from '@/lib/channels/orchestrator'
import { channelLog, productionDeps } from '@/lib/channels/runtime'
import { eraseExpiredContent } from '@/lib/channels/store'
import { MAX_BODY_BYTES, normalizeWebhook, verifyChallenge, verifyWebhook } from '@/lib/channels/whatsapp'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function config() {
  return loadWhatsAppConfig(process.env, { evidenceMode: isEvidenceMode() })
}

export async function GET(req: NextRequest) {
  const trace = newTrace()
  const c = config()
  if (!c.ok) {
    channelLog(trace)('wa.webhook.not_configured', { problem: c.problem })
    return new NextResponse('not configured', { status: 503 })
  }
  const v = verifyChallenge(req.nextUrl.searchParams, c.config.verifyToken)
  if (!v.ok) {
    channelLog(trace)('wa.webhook.challenge_refused', {})
    return new NextResponse('forbidden', { status: 403 })
  }
  channelLog(trace)('wa.webhook.challenge_ok', {})
  return new NextResponse(v.challenge, { status: 200, headers: { 'content-type': 'text/plain' } })
}

export async function POST(req: NextRequest) {
  const trace = newTrace()
  const say = channelLog(trace)

  /* Generous — Meta delivers from many addresses — but a flood from one
     address stops here, before any work. */
  const limited = enforceRateLimit(req, { scope: 'whatsapp-webhook', limit: 600, windowMs: 60_000 })
  if (limited) { say('wa.webhook.rate_limited', {}); return limited }

  const declared = Number(req.headers.get('content-length') ?? '0')
  if (declared > MAX_BODY_BYTES) { say('wa.webhook.rejected', { reason: 'too_large' }); return new NextResponse(null, { status: 413 }) }
  const raw = await req.text()
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) { say('wa.webhook.rejected', { reason: 'too_large' }); return new NextResponse(null, { status: 413 }) }

  const c = config()
  if (!c.ok) {
    say('wa.webhook.not_configured', { problem: c.problem })
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const sig = verifyWebhook(raw, req.headers.get('x-hub-signature-256'), c.config.appSecret)
  if (!sig.ok) {
    /* Which check failed is for the operator; the caller learns nothing. */
    say('wa.webhook.rejected', { reason: `signature_${sig.reason}` })
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let payload: unknown
  try { payload = JSON.parse(raw) } catch {
    /* Signed but unreadable. Redelivery would not make it readable. */
    say('wa.webhook.rejected', { reason: 'invalid_json' })
    return NextResponse.json({ ok: true, ignored: 'invalid_json' })
  }

  const { events, ignored } = normalizeWebhook(payload, { phoneNumberId: c.config.phoneNumberId, businessAccountId: c.config.businessAccountId })
  say('wa.webhook.received', { events: events.length, ignored: ignored.length, reasons: [...new Set(ignored.map((i) => i.reason))].join(',') })
  if (!events.length) return NextResponse.json({ ok: true })

  if (!isDatabaseConfigured()) {
    say('wa.webhook.no_database', {})
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const depsFor = productionDeps(c.config, trace)
  let conversations: string[]
  try {
    const started = Date.now()
    const r = await ingest(events, depsFor())
    conversations = r.conversations
    say('wa.webhook.ingested', { ms: Date.now() - started, inbound: r.inbound, duplicates: r.duplicates, echoes: r.echoes, statuses: r.statuses })
  } catch (err) {
    say('wa.webhook.ingest_failed', { error: err instanceof Error ? err.message.slice(0, 200) : 'unknown' })
    return NextResponse.json({ error: 'retry' }, { status: 500 })
  }

  if (conversations.length || Math.random() < 0.02) {
    after(async () => {
      for (const id of conversations) {
        try {
          const started = Date.now()
          const out = await processConversation(id, depsFor(id))
          say('wa.process.done', { conversation: id, ms: Date.now() - started, outcomes: out.map((o) => o.kind === 'replied' ? `replied:${o.delivery}${o.handover ? `:handover:${o.handover}` : ''}` : o.kind === 'held' ? `held:${o.hold}` : o.kind).join(',') })
        } catch (err) {
          /* The messages stay pending and are picked up by the next webhook for
             this conversation; owner.notices reports them if they wait too long. */
          say('wa.process.failed', { conversation: id, error: err instanceof Error ? err.message.slice(0, 200) : 'unknown' })
        }
      }
      /* Retention, opportunistically and bounded. */
      if (Math.random() < 0.05) {
        try { say('wa.retention', { erased: await eraseExpiredContent(getDb(), c.config.retentionDays) }) } catch { say('wa.retention.failed', {}) }
      }
    })
  }
  return NextResponse.json({ ok: true })
}
