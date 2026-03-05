export interface EmailPayload {
  to: string
  from: string
  subject: string
  html: string
  replyTo?: string
}

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Send an email using the Resend API.
 * Requires RESEND_API_KEY environment variable.
 *
 * To use Resend: https://resend.com
 * Set RESEND_API_KEY in your Vercel environment variables.
 * Set RESEND_FROM_EMAIL to a verified sender address (e.g. noreply@maxpromo.digital)
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    // Development fallback — log to console
    console.log('[email] RESEND_API_KEY not set. Email would have been sent:')
    console.log('[email] To:', payload.to)
    console.log('[email] Subject:', payload.subject)
    console.log('[email] Body:', payload.html)
    return { success: true, id: 'dev-mock' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      reply_to: payload.replyTo,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error('[email] Resend API error:', error)
    return { success: false, error: `Resend error ${res.status}` }
  }

  const data = await res.json()
  return { success: true, id: data.id as string }
}

export function buildContactEmailHtml(fields: {
  name: string
  email: string
  organisation: string
  message: string
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e293b; border-bottom: 2px solid #4f46e5; padding-bottom: 8px;">
        New Contact Form Submission
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 140px;">Name:</td>
          <td style="padding: 8px 0; color: #1e293b;">${escapeHtml(fields.name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td>
          <td style="padding: 8px 0; color: #1e293b;">
            <a href="mailto:${escapeHtml(fields.email)}">${escapeHtml(fields.email)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #475569;">Organisation:</td>
          <td style="padding: 8px 0; color: #1e293b;">${escapeHtml(fields.organisation)}</td>
        </tr>
      </table>
      <div style="margin-top: 16px;">
        <p style="font-weight: bold; color: #475569; margin-bottom: 8px;">Message:</p>
        <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 4px; color: #1e293b; white-space: pre-wrap;">
          ${escapeHtml(fields.message)}
        </div>
      </div>
      <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
        Sent via MaxPromo Digital contact form
      </p>
    </div>
  `
}

export function buildAuditLeadEmailHtml(fields: {
  name: string
  email: string
  company: string
  questionnaire: Record<string, string>
}): string {
  const questionnaireRows = Object.entries(fields.questionnaire)
    .map(
      ([key, value]) => `
        <tr>
          <td style="padding: 6px 0; font-weight: bold; color: #475569; width: 180px; vertical-align: top;">
            ${escapeHtml(camelToLabel(key))}:
          </td>
          <td style="padding: 6px 0; color: #1e293b;">${escapeHtml(value)}</td>
        </tr>
      `
    )
    .join('')

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e293b; border-bottom: 2px solid #4f46e5; padding-bottom: 8px;">
        New Automation Audit Lead
      </h2>
      <h3 style="color: #4f46e5;">Lead Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 140px;">Name:</td>
          <td style="padding: 8px 0; color: #1e293b;">${escapeHtml(fields.name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td>
          <td style="padding: 8px 0; color: #1e293b;">
            <a href="mailto:${escapeHtml(fields.email)}">${escapeHtml(fields.email)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #475569;">Company:</td>
          <td style="padding: 8px 0; color: #1e293b;">${escapeHtml(fields.company)}</td>
        </tr>
      </table>
      <h3 style="color: #4f46e5; margin-top: 24px;">Questionnaire Responses</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${questionnaireRows}
      </table>
      <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
        Sent via MaxPromo Digital Automation Audit
      </p>
    </div>
  `
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function camelToLabel(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}
