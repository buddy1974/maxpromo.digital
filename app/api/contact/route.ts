import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, buildContactEmailHtml } from '@/lib/email'

interface ContactBody {
  name: string
  email: string
  organisation: string
  message: string
}

// Contact email is server-side only — never exposed to the client
const CONTACT_EMAIL = process.env.CONTACT_EMAIL!
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'contact@maxpromo.digital'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactBody
    const { name, email, organisation, message } = body

    // Validate
    if (!name?.trim() || !email?.trim() || !organisation?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    // Sanitise inputs (prevent header injection)
    const sanitised = {
      name: name.trim().slice(0, 200),
      email: email.trim().slice(0, 200),
      organisation: organisation.trim().slice(0, 200),
      message: message.trim().slice(0, 5000),
    }

    const result = await sendEmail({
      to: CONTACT_EMAIL,
      from: FROM_EMAIL,
      replyTo: sanitised.email,
      subject: `New enquiry from ${sanitised.name} — ${sanitised.organisation}`,
      html: buildContactEmailHtml(sanitised),
    })

    if (!result.success) {
      throw new Error(result.error ?? 'Email delivery failed')
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
