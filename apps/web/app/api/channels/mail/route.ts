import { NextResponse, type NextRequest } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { MAX_MAIL_BYTES } from '@/lib/mail/normalization'
import { readBoundedPayload, verifyWebhookBearer } from '@/lib/mail/provider'
import { parseHostingerWebhook } from '@/lib/mail/hostingerWebhook'
import { acceptHostingerMail, HOSTINGER_MAILBOX } from '@/lib/mail/hostingerIngestion'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'
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
    return NextResponse.json({ error: 'invalid_payload' }, { status: error instanceof Error && error.message === 'Payload too large' ? 413 : 400 })
  }
  let event: ReturnType<typeof parseHostingerWebhook>
  try { event=parseHostingerWebhook(JSON.parse(raw),HOSTINGER_MAILBOX) } catch {
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
