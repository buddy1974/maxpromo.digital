import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, buildAuditLeadEmailHtml } from '@/lib/email'
import { getDb } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { DIAGNOSTIC_CATEGORIES } from '@/internal/questionnaire/audit-diagnostic'
import type { DiagnosticPayload } from '@/internal/questionnaire/audit-diagnostic'
import { sendTelegramNotification, buildDiagnosticMessage } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { scope: 'diagnostic', limit: 3, windowMs: 60_000 })
  if (blocked) return blocked

  try {
    const body = (await request.json()) as DiagnosticPayload
    const { contact, selections, ceoQuestion, detectedCategories } = body

    if (!contact?.email || !contact?.name) {
      return NextResponse.json({ error: 'Contact details required.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contact.email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    if (
      contact.name.length > 200 ||
      contact.email.length > 254 ||
      (contact.company && contact.company.length > 200) ||
      (contact.phone && contact.phone.length > 50) ||
      (ceoQuestion && ceoQuestion.length > 3000)
    ) {
      return NextResponse.json({ error: 'Field too long.' }, { status: 400 })
    }

    const { name, email, company, phone } = contact

    const questionnaireEntries: Record<string, string> = {}
    for (const [sectionId, opts] of Object.entries(selections)) {
      if (opts && opts.length > 0) {
        questionnaireEntries[sectionId] = opts.join(', ')
      }
    }
    if (ceoQuestion?.trim()) {
      questionnaireEntries['CEO Question'] = ceoQuestion.trim()
    }
    if (phone?.trim()) {
      questionnaireEntries['Phone'] = phone.trim()
    }

    const categoryLabels = (detectedCategories ?? [])
      .map((id) => DIAGNOSTIC_CATEGORIES[id]?.label ?? id)
      .join(', ')

    if (categoryLabels) {
      questionnaireEntries['Detected Opportunities'] = categoryLabels
    }

    // Email is the primary delivery channel. Do not report success when the
    // configured production mail channel rejects the submission.
    const emailResult = await sendEmail({
      to: process.env.CONTACT_EMAIL ?? 'info@maxpromo.digital',
      from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
      subject: `New Business Diagnostic: ${name} - ${company}`,
      html: buildAuditLeadEmailHtml({
        name,
        email,
        company,
        questionnaire: questionnaireEntries,
      }),
    })

    if (!emailResult.success) {
      console.error('[/api/diagnostic] primary delivery failed')
      return NextResponse.json({ error: 'delivery_unavailable' }, { status: 503 })
    }

    // Telegram notification (non-blocking)
    sendTelegramNotification(
      buildDiagnosticMessage({
        name,
        company,
        email,
        phone: phone?.trim() || undefined,
        ceoQuestion: ceoQuestion?.trim() || undefined,
        detectedCategories: (detectedCategories ?? []).map(
          (id) => DIAGNOSTIC_CATEGORIES[id]?.label ?? id,
        ),
      }),
    ).catch(console.error)

    // Persist to os_leads (non-blocking)
    const summary = `Opportunities: ${categoryLabels}`.slice(0, 600)
    try {
      const db = getDb()
      await db`
        INSERT INTO os_leads (name, email, company, source, category, summary, status)
        VALUES (
          ${name},
          ${email},
          ${company},
          'business_diagnostic',
          ${detectedCategories?.join(',') ?? ''},
          ${summary},
          'new'
        )
        ON CONFLICT DO NOTHING`
    } catch { /* DB may not be configured */ }

    return NextResponse.json({ success: true })
  } catch (error) {
    const reason = error instanceof SyntaxError ? 'invalid_json' : 'internal'
    console.error('[/api/diagnostic] failed', { reason })
    return NextResponse.json(
      { error: reason === 'invalid_json' ? 'invalid_body' : 'submission_failed' },
      { status: reason === 'invalid_json' ? 400 : 500 },
    )
  }
}
