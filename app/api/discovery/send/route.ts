import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { buildFullReportEmailHtml } from '@/lib/email'
import { getDb } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import type { AuditResult } from '@/components/AuditResults'
import type { EstimateData } from '@/components/CostEstimate'
import { sendTelegramNotification, buildProductInquiryMessage } from '@/lib/telegram'

interface SendRequestBody {
  name: string
  email: string
  company: string
  auditResults: AuditResult[]
  estimate: EstimateData
}

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { scope: 'discovery-send', limit: 8, windowMs: 10 * 60_000 })
  if (blocked) return blocked

  const rawBody = await request.text()
  if (!rawBody || rawBody.trim().length === 0) {
    return NextResponse.json({ error: 'Request body required.' }, { status: 400 })
  }
  if (rawBody.length > 5000) {
    return NextResponse.json({ error: 'Request body too large.' }, { status: 400 })
  }

  try {
    const body = JSON.parse(rawBody) as SendRequestBody
    const { name, email, company, auditResults, estimate } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email required.' }, { status: 400 })
    }

    if (name.length > 200 || (company && company.length > 200) || email.length > 254) {
      return NextResponse.json({ error: 'Field too long.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    const html = buildFullReportEmailHtml({ name, email, company, auditResults, estimate })

    // Each channel is isolated -- one failing must not prevent the others
    // from being attempted, and the response must honestly reflect whether
    // anything was actually delivered/recorded.
    let emailOk = false
    try {
      const result = await sendEmail({
        to: email,
        from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
        replyTo: 'info@maxpromo.digital',
        subject: `Your Maxpromo Digital Report & Estimate -- ${company || name}`,
        html,
      })
      emailOk = result.success
      if (!result.success) console.error('[/api/discovery/send] email failed:', result.error)
    } catch (err) {
      console.error('[/api/discovery/send] email threw:', err)
    }

    // Pipe to OS leads
    let dbOk = false
    try {
      const db = getDb()
      const summary = `Discovery wizard -- ${estimate.estimateTitle}. Year 1: EUR${estimate.totals.yearOneMin}-EUR${estimate.totals.yearOneMax}`
      await db`
        INSERT INTO os_leads (name, email, company, source, summary, status)
        VALUES (${name}, ${email}, ${company}, 'discovery_wizard', ${summary}, 'new')
        ON CONFLICT DO NOTHING`
      dbOk = true
    } catch (err) {
      console.error('[/api/discovery/send] db insert failed:', err) /* DB may not be configured */
    }

    // Telegram notification -- own try/catch, never blocks the response
    try {
      await sendTelegramNotification(
        buildProductInquiryMessage({
          systemName: `Discovery Wizard -- ${estimate.estimateTitle}`,
          name,
          company,
          email,
          message: `Year 1 estimate: EUR${estimate.totals.yearOneMin}-EUR${estimate.totals.yearOneMax}. Scope: ${estimate.estimateScope}`,
          source: 'discovery_wizard',
        }),
      )
    } catch (err) {
      console.error('[/api/discovery/send] telegram failed:', err)
    }

    if (!emailOk && !dbOk) {
      return NextResponse.json(
        { error: 'Failed to send report. Please try again or contact us directly.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/discovery/send]', error)
    return NextResponse.json({ error: 'Failed to send report.' }, { status: 500 })
  }
}
