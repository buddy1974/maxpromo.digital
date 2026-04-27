export interface EmailPayload {
  to: string | string[]
  from: string
  subject: string
  html: string
  replyTo?: string
  bcc?: string[]
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
          New Enquiry — Maxpromo Digital
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
          Sent via Maxpromo Digital contact form · maxpromo.digital
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
          Sent via Maxpromo Digital Automation Audit · maxpromo.digital
        </p>
      </div>
    </div>
  `
}

export function buildFullReportEmailHtml(fields: {
  name: string
  email: string
  company: string
  auditResults: Array<{
    title?: string
    problem: string
    solution: string
    tools: string[]
    roi?: string
    complexity?: string
    timeline?: string
  }>
  estimate: {
    estimateTitle: string
    estimateDate: string
    validUntil: string
    currency: string
    lineItems: Array<{
      category: string
      items: Array<{
        id: string
        description: string
        detail: string
        unit: string
        priceMin: number
        priceMax: number
        recommended: boolean
        included: boolean
        note?: string
      }>
    }>
    totals: {
      oneTimeMin: number
      oneTimeMax: number
      monthlyMin: number
      monthlyMax: number
      yearOneMin: number
      yearOneMax: number
    }
    vatNotice: string
    paymentTerms: string
    validityNote: string
    scopeNote: string
    estimateScope: string
    includedInAll: string[]
  }
}): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

  const opportunityRows = fields.auditResults
    .map(
      (r, i) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eeeeee; vertical-align: top; width: 30px; color: #F97316; font-weight: bold; font-family: monospace;">${String(i + 1).padStart(2, '0')}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eeeeee; vertical-align: top;">
          <strong style="color: #111111;">${escapeHtml(r.title ?? `Opportunity ${i + 1}`)}</strong>
          ${r.roi ? `<span style="float: right; background: #FFF3EC; color: #F97316; padding: 2px 8px; font-size: 12px; font-family: monospace;">${escapeHtml(r.roi)}</span>` : ''}
          <div style="margin-top: 6px; font-size: 13px; color: #666666;">${escapeHtml(r.solution)}</div>
          <div style="margin-top: 6px;">
            ${r.tools.map((t) => `<span style="display: inline-block; margin: 2px; padding: 2px 8px; background: #FFF3EC; color: #F97316; font-size: 11px; font-family: monospace;">${escapeHtml(t)}</span>`).join('')}
          </div>
        </td>
      </tr>
    `
    )
    .join('')

  const lineItemRows = fields.estimate.lineItems
    .map(
      (group) => `
      <tr>
        <td colspan="2" style="padding: 12px 12px 4px; background: #f5f5f5; font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.1em; color: #888888;">
          ${escapeHtml(group.category)}
        </td>
      </tr>
      ${group.items
        .map(
          (item) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eeeeee; vertical-align: top;">
            <strong style="color: #111111; font-size: 13px;">${escapeHtml(item.description)}</strong>
            <div style="font-size: 12px; color: #888888; margin-top: 3px;">${escapeHtml(item.detail)}</div>
            <div style="font-size: 11px; color: #aaaaaa; margin-top: 2px; font-family: monospace;">${escapeHtml(item.unit)}</div>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eeeeee; text-align: right; vertical-align: top; white-space: nowrap;">
            <strong style="color: #111111;">${fmt(item.priceMin)} – ${fmt(item.priceMax)}</strong>
          </td>
        </tr>
      `
        )
        .join('')}
    `
    )
    .join('')

  const includedList = fields.estimate.includedInAll
    .map((item) => `<li style="padding: 3px 0; color: #444444; font-size: 13px;">${escapeHtml(item)}</li>`)
    .join('')

  return `
    <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: #0A0A0A; padding: 32px; border-bottom: 3px solid #F97316;">
        <p style="font-family: monospace; font-size: 10px; color: #F97316; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 8px;">
          Maxpromo Digital — Full Report
        </p>
        <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 22px; font-weight: 700;">
          ${escapeHtml(fields.estimate.estimateTitle)}
        </h1>
        <p style="color: #888888; margin: 0; font-size: 13px;">
          Prepared for: ${escapeHtml(fields.name)} · ${escapeHtml(fields.company)}<br>
          Date: ${escapeHtml(fields.estimate.estimateDate)} · Valid until: ${escapeHtml(fields.estimate.validUntil)}
        </p>
      </div>

      <!-- Audit Results -->
      <div style="padding: 32px 32px 0;">
        <h2 style="color: #F97316; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; font-family: monospace; margin: 0 0 16px;">
          Automation Opportunities
        </h2>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #eeeeee;">
          ${opportunityRows}
        </table>
      </div>

      <!-- Cost Estimate -->
      <div style="padding: 32px;">
        <h2 style="color: #F97316; font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; font-family: monospace; margin: 0 0 4px;">
          Kostenvoranschlag / Cost Estimate
        </h2>
        <p style="font-size: 12px; color: #888888; margin: 0 0 16px;">Scope: ${escapeHtml(fields.estimate.estimateScope)}</p>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #eeeeee;">
          ${lineItemRows}
        </table>

        <!-- Totals -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; border: 1px solid #F97316;">
          <tr style="background: #0A0A0A;">
            <td style="padding: 12px 16px; color: #888888; font-size: 12px; font-family: monospace;">One-time total</td>
            <td style="padding: 12px 16px; text-align: right; color: #ffffff; font-weight: bold;">${fmt(fields.estimate.totals.oneTimeMin)} – ${fmt(fields.estimate.totals.oneTimeMax)}</td>
          </tr>
          <tr style="background: #111111;">
            <td style="padding: 12px 16px; color: #888888; font-size: 12px; font-family: monospace;">Monthly recurring</td>
            <td style="padding: 12px 16px; text-align: right; color: #ffffff; font-weight: bold;">${fmt(fields.estimate.totals.monthlyMin)} – ${fmt(fields.estimate.totals.monthlyMax)}/mo</td>
          </tr>
          <tr style="background: #F97316;">
            <td style="padding: 14px 16px; color: #000000; font-size: 13px; font-weight: bold; font-family: monospace;">Year 1 Total</td>
            <td style="padding: 14px 16px; text-align: right; color: #000000; font-size: 16px; font-weight: bold;">${fmt(fields.estimate.totals.yearOneMin)} – ${fmt(fields.estimate.totals.yearOneMax)}</td>
          </tr>
        </table>

        <!-- Scope note -->
        <p style="font-size: 13px; color: #666666; margin: 16px 0; font-style: italic;">${escapeHtml(fields.estimate.scopeNote)}</p>

        <!-- Included in all -->
        <div style="background: #f9f9f9; border-left: 3px solid #F97316; padding: 16px; margin-top: 16px;">
          <p style="font-family: monospace; font-size: 11px; color: #F97316; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 10px;">Included in all packages</p>
          <ul style="margin: 0; padding-left: 20px;">
            ${includedList}
          </ul>
        </div>

        <!-- Legal notices -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #eeeeee;">
          <p style="font-size: 12px; color: #888888; margin: 4px 0;">${escapeHtml(fields.estimate.vatNotice)}</p>
          <p style="font-size: 12px; color: #888888; margin: 4px 0;">${escapeHtml(fields.estimate.paymentTerms)}</p>
          <p style="font-size: 12px; color: #888888; margin: 4px 0;">${escapeHtml(fields.estimate.validityNote)}</p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #0A0A0A; padding: 24px 32px; text-align: center;">
        <p style="color: #444444; font-size: 12px; margin: 0 0 8px;">
          Questions? Reply to this email or book a call.
        </p>
        <a href="https://maxpromo.digital/contact" style="color: #F97316; font-size: 13px; font-family: monospace;">
          maxpromo.digital/contact
        </a>
        <p style="color: #333333; font-size: 11px; margin: 16px 0 0; font-family: monospace;">
          Maxpromo Digital · Körnerstr. 8 · 45143 Essen · info@maxpromo.digital
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
