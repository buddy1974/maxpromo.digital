import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { buildFullReportEmailHtml } from '@/lib/email'
import { getDb } from '@/lib/db'
import type { AuditResult } from '@/components/AuditResults'
import type { EstimateData } from '@/components/CostEstimate'

interface SendRequestBody {
  name: string
  email: string
  company: string
  auditResults: AuditResult[]
  estimate: EstimateData
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendRequestBody
    const { name, email, company, auditResults, estimate } = body

    if (!email || !name) {
      return NextResponse.json({ error: 'Name and email required.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    const html = buildFullReportEmailHtml({ name, email, company, auditResults, estimate })

    await sendEmail({
      to: email,
      from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
      replyTo: 'info@maxpromo.digital',
      subject: `Your MaxPromo Digital Report & Estimate — ${company || name}`,
      html,
    })

    // Pipe to OS leads
    try {
      const db = getDb()
      const summary = `Discovery wizard — ${estimate.estimateTitle}. Year 1: €${estimate.totals.yearOneMin}–€${estimate.totals.yearOneMax}`
      await db`
        INSERT INTO os_leads (name, email, company, source, summary, status)
        VALUES (${name}, ${email}, ${company}, 'discovery_wizard', ${summary}, 'new')
        ON CONFLICT DO NOTHING`
    } catch { /* DB may not be configured — ignore */ }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/discovery/send]', error)
    return NextResponse.json({ error: 'Failed to send report.' }, { status: 500 })
  }
}
