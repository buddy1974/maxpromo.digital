import { NextResponse, after, type NextRequest } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { MAX_MAIL_BYTES } from '@/lib/mail/normalization'
import { readBoundedPayload, verifyWebhookBearer } from '@/lib/mail/provider'
import { parseHostingerWebhook } from '@/lib/mail/hostingerWebhook'
import { describeHostingerStructure, unknownDataKeys } from '@/lib/mail/hostingerDiagnostics'
import { acceptHostingerMail, hostingerReceiptReady, HOSTINGER_MAILBOX } from '@/lib/mail/hostingerIngestion'
import { scheduleProviderCheck } from '@/lib/mail/providerSchedule'
import { getDb } from '@/lib/db'
import { applyLeadReply } from '@/lib/leads/workflow'

export const dynamic = 'force-dynamic'
const noStore = { 'Cache-Control': 'no-store' }
// Only fixed codes, structural shapes and the opaque provider delivery id may reach logs.
// Never log request/exception objects, headers, addresses, subjects, bodies or URLs.
const validationReasons = new Set([
  'invalid_webhook', 'unsupported_webhook_event', 'invalid_delivery_id', 'invalid_event_id',
  'wrong_mailbox', 'invalid_event_date',
])
function log(level: 'info' | 'warn', entry: Record<string, unknown>) {
  console[level](JSON.stringify(entry))
}
// Read-only methods must not touch configuration, storage or the provider.
export function GET() {
  return NextResponse.json({error:'method_not_allowed'},{status:405,headers:{Allow:'POST',...noStore}})
}
export function HEAD() {
  return new Response(null,{status:405,headers:{Allow:'POST',...noStore}})
}
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, { scope: 'mail-webhook', limit: 120, windowMs: 60_000 })
  if (limited) return limited
  const secret = process.env.HOSTINGER_WEBHOOK_SECRET
  // A deployed but unconfigured receiver is locked, not an unavailable service.
  if (!secret || secret.length > 4096 || /\s/.test(secret)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!verifyWebhookBearer(req.headers.get('authorization'), secret)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let raw: string
  try { raw = await readBoundedPayload(req, MAX_MAIL_BYTES) } catch (error) {
    const tooLarge = error instanceof Error && error.message === 'Payload too large'
    log('warn', { event: 'mail.webhook.rejected', stage: 'body', reason: tooLarge ? 'payload_too_large' : 'body_decode_failed' })
    return NextResponse.json({ error: 'invalid_payload' }, { status: tooLarge ? 413 : 400 })
  }
  let payload: unknown
  try { payload=JSON.parse(raw) } catch {
    log('warn', { event: 'mail.webhook.rejected', stage: 'validation', reason: 'invalid_json' })
    return NextResponse.json({error:'invalid_event'}, {status:400})
  }
  let event: ReturnType<typeof parseHostingerWebhook>
  try { event=parseHostingerWebhook(payload,HOSTINGER_MAILBOX) } catch (error) {
    const reason=error instanceof Error && validationReasons.has(error.message) ? error.message : 'invalid_event'
    log('warn', { event: 'mail.webhook.rejected', stage: 'validation', reason, structure: describeHostingerStructure(payload, HOSTINGER_MAILBOX) })
    return NextResponse.json({error:'invalid_event'}, {status:400})
  }
  const encryptionSecret=process.env.OS_SESSION_SECRET
  if(process.env.EMAIL_PROVIDER!=='hostinger' || !encryptionSecret || encryptionSecret.length<32) {
    return NextResponse.json({error:'not_configured'},{status:503})
  }
  try {
    const sql=getDb()
    if(!event.eventId) {
      // No mailbox message identity (Hostinger Test sends exactly this): nothing can be
      // stored idempotently. Prove readiness read-only, acknowledge, never ingest.
      if(!await hostingerReceiptReady(sql)) return NextResponse.json({error:'not_configured'},{status:503})
      log('info', { event: 'mail.webhook.acknowledged', disposition: 'no_mailbox_identity', deliveryId: event.deliveryId, degraded: event.degraded })
      return NextResponse.json({ok:true,ingested:false},{status:200,headers:noStore})
    }
    const result=await acceptHostingerMail(sql,event,encryptionSecret)
    // unknownDataKeys is a count, never names: a new provider field (e.g. a folder) becomes visible.
    log('info', { event: 'mail.webhook.accepted', created: result.created, deliveryId: event.deliveryId, degraded: event.degraded, unknownDataKeys: unknownDataKeys(payload) })
    // The webhook carries no spam/folder state; the provider's folder is read after the response.
    if(result.created) scheduleProviderCheck('webhook', undefined, { notify: true })
    // A reply from a lead stops what was waiting to go to them (ADR-0027 §3, rule 5).
    if(result.created && result.messageId) after(() => applyLeadReply(sql, result.messageId).then(() => undefined).catch(() => undefined))
    return NextResponse.json({ok:true},{status:200,headers:noStore})
  } catch {
    // Deliberately no driver error, payload, signed URL or token in logs/responses.
    log('warn', { event: 'mail.webhook.unavailable', deliveryId: event.deliveryId })
    return NextResponse.json({error:'receipt_unavailable'},{status:503})
  }
}
