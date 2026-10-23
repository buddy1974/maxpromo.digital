import { NextResponse, type NextRequest } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { MAX_MAIL_BYTES } from '@/lib/mail/normalization'
import { readBoundedPayload, verifyWebhookBearer } from '@/lib/mail/provider'
import { parseHostingerWebhook } from '@/lib/mail/hostingerWebhook'
import { acceptHostingerMail, HOSTINGER_MAILBOX } from '@/lib/mail/hostingerIngestion'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'
// Only fixed codes may reach logs. Never log request/exception objects or their text.
const validationReasons = new Set([
  'invalid_webhook', 'invalid_webhook_field', 'invalid_message_header', 'invalid_address',
  'invalid_recipients', 'unsupported_webhook_event', 'invalid_delivery_id', 'invalid_event_id',
  'wrong_mailbox', 'invalid_event_date', 'invalid_references', 'invalid_preview',
  'invalid_attachments', 'unsafe_filename', 'invalid_attachment_size', 'invalid_signed_content',
])
function rejection(stage: 'body' | 'validation', reason: string) {
  console.warn(JSON.stringify({ event: 'mail.webhook.rejected', stage, reason }))
}
// Read-only methods must not touch configuration, storage or the provider.
export function GET() {
  return NextResponse.json({error:'method_not_allowed'},{status:405,headers:{Allow:'POST','Cache-Control':'no-store'}})
}
export function HEAD() {
  return new Response(null,{status:405,headers:{Allow:'POST','Cache-Control':'no-store'}})
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
    rejection('body', error instanceof Error && error.message === 'Payload too large' ? 'payload_too_large' : 'body_decode_failed')
    return NextResponse.json({ error: 'invalid_payload' }, { status: error instanceof Error && error.message === 'Payload too large' ? 413 : 400 })
  }
  let event: ReturnType<typeof parseHostingerWebhook>
  let payload: unknown
  try { payload=JSON.parse(raw) } catch {
    rejection('validation', 'invalid_json')
    return NextResponse.json({error:'invalid_event'}, {status:400})
  }
  try { event=parseHostingerWebhook(payload,HOSTINGER_MAILBOX) } catch (error) {
    const reason=error instanceof Error && validationReasons.has(error.message) ? error.message : 'invalid_event'
    rejection('validation', reason)
    return NextResponse.json({error:'invalid_event'}, {status:400})
  }
  if(process.env.EMAIL_PROVIDER!=='hostinger' || !process.env.OS_SESSION_SECRET || process.env.OS_SESSION_SECRET.length<32) {
    return NextResponse.json({error:'not_configured'},{status:503})
  }
  try {
    await acceptHostingerMail(getDb(),event,process.env.OS_SESSION_SECRET)
    return NextResponse.json({ok:true},{status:200})
  } catch {
    // Deliberately no driver error, payload, signed URL or token in logs/responses.
    return NextResponse.json({error:'receipt_unavailable'},{status:503})
  }
}
