import { token } from '@maxpromo/design-tokens'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { enforceRateLimit } from '@/lib/rate-limit'
import { sendTelegramNotification, buildNewsletterMessage } from '@/lib/telegram'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

function buildWelcomeEmail(name: string): string {
  const display = name ? ` ${name}` : ''
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:${token.surface};">
      <div style="background:${token.text};padding:28px 32px;border-bottom:3px solid ${token.primary};">
        <p style="font-family:monospace;font-size:10px;color:${token.primaryText};letter-spacing:0.2em;text-transform:uppercase;margin:0 0 6px;">Maxpromo Digital</p>
        <h1 style="color:${token.surface};margin:0;font-size:20px;font-weight:700;letter-spacing:-0.02em;">You're subscribed.</h1>
      </div>
      <div style="padding:28px 32px;">
        <p style="color:var(--brand-text-secondary);font-size:15px;line-height:1.7;margin:0 0 16px;">
          Hey${display},<br><br>
          You're now subscribed to <strong>Maxpromo Digital Weekly Automation Insights</strong>.<br>
          Real builds. Real results. Every week.
        </p>
        <p style="color:var(--brand-text-secondary);font-size:13px;line-height:1.7;margin:0 0 24px;">
          You'll hear from us with practical automation tips, AI workflow breakdowns,
          and case studies from real client projects.
        </p>
        <a href="https://maxpromo.digital" style="display:inline-block;background:${token.primary};color:var(--brand-surface-inverted);font-family:monospace;font-weight:700;font-size:12px;letter-spacing:0.1em;padding:12px 24px;text-decoration:none;text-transform:uppercase;">
          Explore our work &rarr;
        </a>
      </div>
      <div style="background:${token.text};padding:16px 32px;">
        <p style="font-family:monospace;font-size:10px;color:var(--brand-text-muted);margin:0;">
          Maxpromo Digital &middot; Koernerstr. 8 &middot; 45143 Essen &middot; info@maxpromo.digital
        </p>
      </div>
    </div>`
}

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { scope: 'newsletter-subscribe', limit: 5, windowMs: 600_000 })
  if (blocked) return blocked

  try {
    const body = await request.json() as { email: string; name?: string; website?: string; company_url?: string }

    // Honeypot -- hidden field that only bots fill in. Not currently wired up
    // in the frontend form (components/NewsletterSignup.tsx has no hidden
    // field for this), so it's a no-op today, but accepting/rejecting on it
    // now means the frontend can add the hidden input later with zero
    // backend changes. Reject silently with a fake-success response so bots
    // don't learn anything from the response shape.
    if (body.website?.trim() || body.company_url?.trim()) {
      return NextResponse.json({ success: true, status: 'subscribed' })
    }

    if (!body.email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (body.email.trim().length > 254) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const email = body.email.trim().toLowerCase()
    const name  = body.name?.trim().slice(0, 200) || null
    const sql   = getDb()

    // Upsert -- return 'already_subscribed' if duplicate
    const existing = await sql`SELECT id, status FROM os_newsletter WHERE email = ${email}`

    if (existing.length > 0) {
      const sub = existing[0] as { id: string; status: string }
      if (sub.status === 'active') {
        return NextResponse.json({ success: true, status: 'already_subscribed' })
      }
      // Reactivate
      await sql`UPDATE os_newsletter SET status = 'active' WHERE id = ${sub.id}`
      return NextResponse.json({ success: true, status: 'reactivated' })
    }

    await sql`
      INSERT INTO os_newsletter (email, name, source, status)
      VALUES (${email}, ${name}, 'website', 'active')`

    // Welcome email (non-blocking)
    sendEmail({
      to: email,
      from: FROM_EMAIL,
      replyTo: 'info@maxpromo.digital',
      subject: 'Welcome to Maxpromo Digital Weekly',
      html: buildWelcomeEmail(name ?? ''),
    }).catch(console.error)

    // Send Telegram notification (non-blocking; fire-and-forget)
    sendTelegramNotification(
      buildNewsletterMessage({ email, name: name ?? undefined }),
    ).catch(console.error)

    return NextResponse.json({ success: true, status: 'subscribed' })
  } catch (error) {
    console.error('[/api/newsletter/subscribe]', error)
    return NextResponse.json({ error: 'Subscription failed. Please try again.' }, { status: 500 })
  }
}
