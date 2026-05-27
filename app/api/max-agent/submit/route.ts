import { NextRequest, NextResponse } from 'next/server'

// ── In-memory rate limiter (resets on cold start — intentional for simplicity)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT    = 5
const WINDOW_MS     = 60_000

function isRateLimited(ip: string): boolean {
  const now   = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  if (entry.count >= RATE_LIMIT) return true
  entry.count++
  return false
}

// ── Field constraints
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

function scoreLabel(score: number): string {
  if (score >= 90) return '🔥 HIGH-INTENT LEAD — REPLY FAST'   // FIX 9
  if (score >= 80) return '🔥 HIGH-INTENT LEAD — REPLY FAST'   // FIX 9
  return `📊 Score: ${score}/100`
}

function buildMessage(p: LeadPayload): string {
  return [
    `${scoreLabel(p.score)}`,
    `Score: ${p.score}/100`,
    ``,
    `🏢 Business : ${p.business}`,
    `⚠️  Problem  : ${p.pain}`,
    `📊 Volume   : ${p.volume}`,
    `🔧 System   : ${p.system}`,
    ``,
    `👤 Name    : ${p.name}`,
    `📞 Contact : ${p.phone}`,
    `🌐 Language: ${p.locale}`,
    ``,
    `// MaxAgent — guided audit`,
  ].join('\n')
}

export async function POST(req: NextRequest) {
  // ── Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  // ── Body size guard
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 })
  }

  // ── Parse
  let raw: Record<string, unknown>
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // ── Validate score
  const score = typeof raw.score === 'number' ? Math.round(raw.score) : 0
  if (score < 0 || score > 100) {
    return NextResponse.json({ error: 'invalid_score' }, { status: 400 })
  }

  // ── Sanitize all text fields
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

  // Reject if no contact info at all
  if (!payload.name && !payload.phone) {
    return NextResponse.json({ error: 'missing_contact' }, { status: 400 })
  }

  // ── Telegram notification
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId   = process.env.TELEGRAM_CHAT_ID

  if (botToken && chatId) {
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:    chatId,
          text:       buildMessage(payload),
          parse_mode: 'Markdown',
        }),
      })
    } catch (err) {
      console.error('[MaxAgent] Telegram send failed:', err)
    }
  } else {
    console.log('[MaxAgent] Lead received (Telegram not configured):')
    console.log(buildMessage(payload))
  }

  return NextResponse.json({ ok: true })
}
