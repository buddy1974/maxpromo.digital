import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, buildContactEmailHtml } from '@/lib/email'
import { getDb } from '@/lib/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { sendTelegramNotification, buildContactMessage, buildProductInquiryMessage } from '@/lib/telegram'
import {
  CONTACT_PAIN_POINTS,
  PREFERRED_CONTACT_METHODS,
  type ContactPainPoint,
  type PreferredContactMethod,
} from '@/lib/contact-options'

interface ContactBody {
  name: string
  email: string
  company: string
  phone?: string
  preferredContactMethod: PreferredContactMethod
  painPoints?: ContactPainPoint[]
  message: string
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
    const {
      name,
      email,
      company,
      phone,
      preferredContactMethod,
      painPoints,
      message,
      system,
    } = body

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof company !== 'string' ||
      typeof message !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      !company.trim() ||
      !message.trim()
    ) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    if (
      !PREFERRED_CONTACT_METHODS.includes(preferredContactMethod) ||
      (phone !== undefined && typeof phone !== 'string') ||
      (painPoints !== undefined &&
        (!Array.isArray(painPoints) ||
          painPoints.length > CONTACT_PAIN_POINTS.length ||
          painPoints.some((item) => !CONTACT_PAIN_POINTS.includes(item))))
    ) {
      return NextResponse.json({ error: 'Invalid contact preferences.' }, { status: 400 })
    }

    const sanitised = {
      name:         name.trim().slice(0, 200),
      email:        email.trim().slice(0, 200),
      company:      company.trim().slice(0, 200),
      phone:        phone?.trim().slice(0, 50),
      preferredContactMethod,
      painPoints:   painPoints ?? [],
      message:      message.trim().slice(0, 5000),
      system:       system?.trim().slice(0, 100),
    }

    // Subject includes system context when present
    const subject = sanitised.system
      ? `[${sanitised.system}] New enquiry from ${sanitised.name} — Maxpromo Digital`
      : `New enquiry from ${sanitised.name} — Maxpromo Digital`

    // Derive lead source — product-specific when system is present
    const leadSource = sanitised.system
      ? `${sanitised.system}_consultation_request`
      : 'contact_form'

    // Retain the lead first. Database delivery is optional, but its failure
    // must never prevent the independent email and Telegram channels.
    let databaseSaved = false
    try {
      const db = getDb()
      await db`
        INSERT INTO os_leads (name, email, company, source, summary, status)
        VALUES (${sanitised.name}, ${sanitised.email}, ${sanitised.company},
                ${leadSource}, ${`${sanitised.painPoints.join(', ')}\n${sanitised.message}`.slice(0, 500)}, 'new')`
      databaseSaved = true
    } catch (error) {
      console.error('[/api/contact] database delivery failed:', error instanceof Error ? error.message : 'unknown')
    }

    const telegramMessage = sanitised.system
      ? buildProductInquiryMessage({
          systemName: sanitised.system,
          name:       sanitised.name,
          company:    sanitised.company,
          email:      sanitised.email,
          phone:      sanitised.phone,
          preferredContactMethod: sanitised.preferredContactMethod,
          painPoints: sanitised.painPoints,
          message:    sanitised.message,
          source:     leadSource,
        })
      : buildContactMessage({
          name:    sanitised.name,
          company: sanitised.company,
          email:   sanitised.email,
          phone:   sanitised.phone,
          preferredContactMethod: sanitised.preferredContactMethod,
          painPoints: sanitised.painPoints,
          message: sanitised.message,
        })

    // Notification channels are independent. Await both so the response
    // accurately reflects whether the required email delivery succeeded.
    const [emailResult, telegramResult] = await Promise.all([
      sendEmail({
        to: CONTACT_EMAIL,
        from: FROM_EMAIL,
        replyTo: sanitised.email,
        subject,
        html: buildContactEmailHtml(sanitised),
      }).catch((error: unknown) => {
        console.error(
          '[/api/contact] email transport failed:',
          error instanceof Error ? error.message : 'unknown',
        )
        return { success: false, error: 'email_transport_failed' }
      }),
      sendTelegramNotification(telegramMessage),
    ])

    if (!emailResult.success) {
      console.error('[/api/contact] email delivery unavailable:', emailResult.error ?? 'unknown')
      return NextResponse.json(
        {
          success: false,
          code: 'CONTACT_DELIVERY_UNAVAILABLE',
          retained: databaseSaved || telegramResult.sent,
        },
        { status: 503 },
      )
    }

    return NextResponse.json({
      success: true,
      delivery: {
        email: true,
        database: databaseSaved,
        telegram: telegramResult.sent,
      },
    })
  } catch (error) {
    console.error('[/api/contact]', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again or contact us directly.' },
      { status: 500 }
    )
  }
}
