import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramNotification } from '@/lib/telegram'
import { enforceRateLimit } from '@/lib/rate-limit'

const MAX_FIELD_LENGTH = 200
const MAX_BODY_BYTES   = 4096

function sanitize(val: unknown): string {
  if (typeof val !== 'string') return ''
  return val.trim().slice(0, MAX_FIELD_LENGTH).replace(/[\r\n]/g, ' ')
}

interface LeadPayload {
  score:    number
  business: string
  pain:     string
  volume:   string
  system:   string
  name:     string
  phone:    string
  locale:   string
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function scoreLabel(score: number): string {
  if (score >= 80) return '<b>FIRE HIGH-INTENT LEAD</b>'
  return `Score: ${score}/100`
}

function buildMessage(p: LeadPayload): string {
  const phoneLink = p.phone
    ? `<a href="tel:${esc(p.phone)}">${esc(p.phone)}</a>`
    : '—'

  return [
    scoreLabel(p.score),
    `Score: ${p.score}/100`,
    '',
    `<b>Business:</b> ${esc(p.business)}`,
    `<b>Problem:</b> ${esc(p.pain)}`,
    `<b>Volume:</b> ${esc(p.volume)}`,
    `<b>System:</b> ${esc(p.system)}`,
    '',
    `<b>Name:</b> ${esc(p.name)}`,
    `<b>Contact:</b> ${phoneLink}`,
    `<b>Language:</b> ${esc(p.locale)}`,
    '',
    '// MaxAgent — guided audit',
  ].join('\n')
}

export async function POST(req: NextRequest) {
  const blocked = enforceRateLimit(req, { scope: 'max-agent-submit', limit: 5, windowMs: 60_000 })
  if (blocked) return blocked

  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 })
  }

  let raw: Record<string, unknown>
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const score = typeof raw.score === 'number' ? Math.round(raw.score) : 0
  if (score < 0 || score > 100) {
    return NextResponse.json({ error: 'invalid_score' }, { status: 400 })
  }

  const payload: LeadPayload = {
    score,
    business: sanitize(raw.business),
    pain:     sanitize(raw.pain),
    volume:   sanitize(raw.volume),
    system:   sanitize(raw.system),
    name:     sanitize(raw.name),
    phone:    sanitize(raw.phone),
    locale:   sanitize(raw.locale) || 'en',
  }

  if (!payload.name && !payload.phone) {
    return NextResponse.json({ error: 'missing_contact' }, { status: 400 })
  }

  // Telegram is the only delivery channel for this route — if it fails,
  // nothing was actually recorded, so the response must say so honestly.
  let telegramOk = false
  try {
    const result = await sendTelegramNotification(buildMessage(payload))
    telegramOk = result.sent
  } catch (err) {
    console.error('[MaxAgent] Telegram send failed:', err)
  }

  if (!telegramOk) {
    return NextResponse.json({ ok: false, error: 'delivery_failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
