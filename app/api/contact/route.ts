import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, buildContactEmailHtml } from '@/lib/email'
import { getDb } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { sendTelegramNotification, buildContactMessage, buildProductInquiryMessage } from '@/lib/telegram'

interface ContactBody {
  name: string
  email: string
  organisation: string
  message: string
  automation?: string
  /** Product slug from ?system= param — e.g. 'restaurant-os', 'taxkontrol' */
  system?: string
}

const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? 'info@maxpromo.digital'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

export async function POST(request: NextRequest) {
  const blocked = enforceRateLimit(request, { scope: 'contact', limit: 5, windowMs: 60_000 })
  if (blocked) return blocked

  try {
    const body = (await request.json()) as ContactBody
    const { name, email, organisation, message, automation, system } = body

    if (!name?.trim() || !email?.trim() || !organisation?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    const sanitised = {
      name:         name.trim().slice(0, 200),
      email:        email.trim().slice(0, 200),
      organisation: organisation.trim().slice(0, 200),
      message:      message.trim().slice(0, 5000),
      automation:   automation?.trim().slice(0, 200),
      system:       system?.trim().slice(0, 100),
    }

    // Subject includes system context when present
    const subject = sanitised.system
      ? `[${sanitised.system}] New enquiry from ${sanitised.name} — Maxpromo Digital`
      : `New enquiry from ${sanitised.name} — Maxpromo Digital`

    const result = await sendEmail({
      to: CONTACT_EMAIL,
      from: FROM_EMAIL,
      replyTo: sanitised.email,
      subject,
      html: buildContactEmailHtml(sanitised),
    })

    if (!result.success) {
      throw new Error(result.error ?? 'Email delivery failed')
    }

    // Derive lead source — product-specific when system is present
    const leadSource = sanitised.system
      ? `${sanitised.system}_consultation_request`
      : 'contact_form'

    // Pipe to OS leads (non-blocking)
    try {
      const db = getDb()
      await db`
        INSERT INTO os_leads (name, email, company, source, summary, status)
        VALUES (${sanitised.name}, ${sanitised.email}, ${sanitised.organisation},
                ${leadSource}, ${sanitised.message.slice(0, 500)}, 'new')`
    } catch { /* DB may not be configured - ignore */ }

    // Send Telegram notification (non-blocking; fire-and-forget)
    // Product-specific system inquiry uses richer buildProductInquiryMessage
    if (sanitised.system) {
      sendTelegramNotification(
        buildProductInquiryMessage({
          systemName: sanitised.system,
          name:       sanitised.name,
          company:    sanitised.organisation,
          email:      sanitised.email,
          message:    sanitised.message,
          source:     leadSource,
        }),
      ).catch(console.error)
    } else {
      sendTelegramNotification(
        buildContactMessage({
          name:    sanitised.name,
          company: sanitised.organisation,
          email:   sanitised.email,
          message: sanitised.message,
        }),
      ).catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/contact]', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again or contact us directly.' },
      { status: 500 }
    )
  }
}
