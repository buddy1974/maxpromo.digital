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
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.log('[email] RESEND_API_KEY not set. Email would have been sent:')
    console.log('[email] To:', payload.to)
    console.log('[email] Subject:', payload.subject)
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
  automation?: string
}): string {
  const automationRow = fields.automation
    ? `<tr>
        <td style="padding: 8px 0; font-weight: bold; color: #666666; width: 160px; vertical-align: top;">Automation Interest:</td>
        <td style="padding: 8px 0; color: #111111;">${escapeHtml(fields.automation)}</td>
      </tr>`
    : ''

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #0A0A0A; padding: 24px; border-bottom: 3px solid #F97316;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">
          New Enquiry — MaxPromo Digital
        </h2>
        <p style="color: #888888; margin: 4px 0 0; font-size: 13px;">
          Submitted: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
        </p>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666666; width: 160px;">Name:</td>
            <td style="padding: 8px 0; color: #111111;">${escapeHtml(fields.name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666666;">Email:</td>
            <td style="padding: 8px 0; color: #111111;">
              <a href="mailto:${escapeHtml(fields.email)}" style="color: #F97316;">${escapeHtml(fields.email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666666;">Organisation:</td>
            <td style="padding: 8px 0; color: #111111;">${escapeHtml(fields.organisation)}</td>
          </tr>
          ${automationRow}
        </table>
        <div style="margin-top: 20px; border-top: 1px solid #eeeeee; padding-top: 20px;">
          <p style="font-weight: bold; color: #666666; margin-bottom: 10px;">Message:</p>
          <div style="background: #f9f9f9; border-left: 4px solid #F97316; padding: 16px; color: #111111; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">
            ${escapeHtml(fields.message)}
          </div>
        </div>
        <p style="margin-top: 24px; font-size: 12px; color: #aaaaaa; border-top: 1px solid #eeeeee; padding-top: 16px;">
          Sent via MaxPromo Digital contact form · maxpromo.digital
        </p>
      </div>
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
          <td style="padding: 6px 0; font-weight: bold; color: #666666; width: 200px; vertical-align: top;">
            ${escapeHtml(camelToLabel(key))}:
          </td>
          <td style="padding: 6px 0; color: #111111;">${escapeHtml(value)}</td>
        </tr>
      `
    )
    .join('')

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #0A0A0A; padding: 24px; border-bottom: 3px solid #F97316;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">
          New Automation Audit Lead
        </h2>
        <p style="color: #888888; margin: 4px 0 0; font-size: 13px;">
          Submitted: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
        </p>
      </div>
      <div style="padding: 24px;">
        <h3 style="color: #F97316; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Lead Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666666; width: 160px;">Name:</td>
            <td style="padding: 8px 0; color: #111111;">${escapeHtml(fields.name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666666;">Email:</td>
            <td style="padding: 8px 0; color: #111111;">
              <a href="mailto:${escapeHtml(fields.email)}" style="color: #F97316;">${escapeHtml(fields.email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #666666;">Company:</td>
            <td style="padding: 8px 0; color: #111111;">${escapeHtml(fields.company)}</td>
          </tr>
        </table>
        <h3 style="color: #F97316; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Questionnaire</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${questionnaireRows}
        </table>
        <p style="margin-top: 24px; font-size: 12px; color: #aaaaaa; border-top: 1px solid #eeeeee; padding-top: 16px;">
          Sent via MaxPromo Digital Automation Audit · maxpromo.digital
        </p>
      </div>
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
