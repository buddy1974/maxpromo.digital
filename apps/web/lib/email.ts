import { isEvidenceMode } from '@maxpromo/config'
import { token, space } from '@maxpromo/design-tokens'

export interface EmailPayload {
  to: string | string[]
  from: string
  subject: string
  html: string
  replyTo?: string
  bcc?: string[]
  /**
   * Sent to Resend as `Idempotency-Key`. A retried request with the same key
   * is not delivered twice. Set by every send that follows an approval.
   */
  idempotencyKey?: string
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
  /* The outbound boundary of the evidence environment.
     Placed inside the transport rather than at the call sites because this is
     the only function in the application that reaches the mail API, which is
     not an assumption: check:token-inputs computes this module's import graph
     from that fact and fails if a second transport appears (ADR-0015).
     A caller cannot forget this, and a disabled button cannot replace it. */
  if (isEvidenceMode()) {
    console.log('[email] evidence mode: delivery suppressed', {
      to: Array.isArray(payload.to) ? payload.to.length + ' recipient(s)' : '1 recipient',
      subject: payload.subject?.slice(0, 80),
    })
    return { success: true, id: 'evidence-sink' }
  }

  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[email] delivery unavailable: RESEND_API_KEY is not configured')
      return { success: false, error: 'email_not_configured' }
    }
    console.log('[email] RESEND_API_KEY not set; using development mock delivery')
    return { success: true, id: 'dev-mock' }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(payload.idempotencyKey ? { 'Idempotency-Key': payload.idempotencyKey.slice(0, 256) } : {}),
    },
    body: JSON.stringify({
      from: payload.from,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      reply_to: payload.replyTo,
      ...(payload.bcc?.length ? { bcc: payload.bcc } : {}),
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
  company: string
  phone?: string
  preferredContactMethod: string
  painPoints: string[]
  message: string
  /** Product slug from ?system= param — e.g. 'restaurant-os', 'taxkontrol' */
  system?: string
}): string {
  const systemRow = fields.system
    ? `<tr>
        <td style="padding: ${space[2]} 0; font-weight: bold; color: ${token.primaryText}; width: 160px; vertical-align: top;">System:</td>
        <td style="padding: ${space[2]} 0; color: ${token.text}; font-weight: bold;">${escapeHtml(fields.system)}</td>
      </tr>
      <tr>
        <td style="padding: ${space[2]} 0; font-weight: bold; color: ${token.textSecondary}; width: 160px; vertical-align: top;">Source:</td>
        <td style="padding: ${space[2]} 0; color: ${token.text};">${escapeHtml(fields.system)}_consultation_request</td>
      </tr>`
    : ''

  const phoneRow = fields.phone
    ? `<tr>
        <td style="padding: ${space[2]} 0; font-weight: bold; color: ${token.textSecondary};">Phone:</td>
        <td style="padding: ${space[2]} 0; color: ${token.text};">${escapeHtml(fields.phone)}</td>
      </tr>`
    : ''

  const painPointsRow = fields.painPoints.length
    ? `<tr>
        <td style="padding: ${space[2]} 0; font-weight: bold; color: ${token.textSecondary}; vertical-align: top;">Help requested:</td>
        <td style="padding: ${space[2]} 0; color: ${token.text};">${fields.painPoints.map(escapeHtml).join('<br>')}</td>
      </tr>`
    : ''

  const headingLabel = fields.system
    ? `Consultation Request — ${escapeHtml(fields.system)}`
    : 'New Enquiry — Maxpromo Digital'

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: ${token.surface};">
      <div style="background: ${token.text}; padding: ${space[5]}; border-bottom: 3px solid ${token.primary};">
        <h2 style="color: ${token.surface}; margin: 0; font-size: 20px; font-weight: 700;">
          ${headingLabel}
        </h2>
        <p style="color: ${token.textMuted}; margin: ${space[1]} 0 0; font-size: 13px;">
          Submitted: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}
        </p>
      </div>
      <div style="padding: ${space[5]};">
        <table style="width: 100%; border-collapse: collapse;">
          ${systemRow}
          <tr>
            <td style="padding: ${space[2]} 0; font-weight: bold; color: ${token.textSecondary}; width: 160px;">Name:</td>
            <td style="padding: ${space[2]} 0; color: ${token.text};">${escapeHtml(fields.name)}</td>
          </tr>
          <tr>
            <td style="padding: ${space[2]} 0; font-weight: bold; color: ${token.textSecondary};">Email:</td>
            <td style="padding: ${space[2]} 0; color: ${token.text};">
              <a href="mailto:${escapeHtml(fields.email)}" style="color: ${token.primaryText};">${escapeHtml(fields.email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: ${space[2]} 0; font-weight: bold; color: ${token.textSecondary};">Organisation:</td>
            <td style="padding: ${space[2]} 0; color: ${token.text};">${escapeHtml(fields.company)}</td>
          </tr>
          ${phoneRow}
          <tr>
            <td style="padding: ${space[2]} 0; font-weight: bold; color: ${token.textSecondary};">Preferred contact:</td>
            <td style="padding: ${space[2]} 0; color: ${token.text};">${escapeHtml(fields.preferredContactMethod)}</td>
          </tr>
          ${painPointsRow}
        </table>
        <div style="margin-top: 20px; border-top: 1px solid ${token.border}; padding-top: 20px;">
          <p style="font-weight: bold; color: ${token.textSecondary}; margin-bottom: 10px;">Message:</p>
          <div style="background: ${token.surfaceSubtle}; border-left: 4px solid ${token.primary}; padding: ${space[4]}; color: ${token.text}; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">
            ${escapeHtml(fields.message)}
          </div>
        </div>
        <p style="margin-top: ${space[5]}; font-size: 12px; color: ${token.textMuted}; border-top: 1px solid ${token.border}; padding-top: ${space[4]};">
          Sent via Maxpromo Digital contact form · maxpromo.digital
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
