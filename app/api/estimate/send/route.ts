import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { getDb } from '@/lib/db'

interface AddonItem {
  label: string
  price: number
}

interface OptItem {
  label: string
  price: number
  period: string
}

interface SendEstimateBody {
  clientName: string
  clientEmail: string
  clientPhone: string
  businessName: string
  businessType: string
  city: string
  pkg: string
  pkgPrice: number
  addons: AddonItem[]
  domain: OptItem
  hosting: OptItem
  maintenance: OptItem
  totals: {
    oneTime: number
    monthly: number
    annual: number
  }
}

const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? 'info@maxpromo.digital'
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmt(n: number): string {
  return `€${n.toLocaleString('de-DE')}`
}

function buildEstimateEmailHtml(data: SendEstimateBody, isInternal: boolean): string {
  const today = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 30)
  const validUntilStr = validUntil.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const addonRows = data.addons
    .map(
      (a) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 13px;">${esc(a.label)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eeeeee; text-align: right; font-family: monospace; color: #111111; font-size: 13px;">+${fmt(a.price)}</td>
      </tr>`,
    )
    .join('')

  const recurringRows: string[] = []
  if (data.hosting.price > 0) {
    recurringRows.push(`
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 13px;">${esc(data.hosting.label)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eeeeee; text-align: right; font-family: monospace; color: #111111; font-size: 13px;">${fmt(data.hosting.price)}${esc(data.hosting.period)}</td>
      </tr>`)
  }
  if (data.maintenance.price > 0) {
    recurringRows.push(`
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 13px;">${esc(data.maintenance.label)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eeeeee; text-align: right; font-family: monospace; color: #111111; font-size: 13px;">${fmt(data.maintenance.price)}${esc(data.maintenance.period)}</td>
      </tr>`)
  }
  if (data.domain.price > 0) {
    recurringRows.push(`
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 13px;">${esc(data.domain.label)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #eeeeee; text-align: right; font-family: monospace; color: #111111; font-size: 13px;">${fmt(data.domain.price)}${esc(data.domain.period)}</td>
      </tr>`)
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff;">

      <!-- Header -->
      <div style="background: #0A0A0A; padding: 32px; border-bottom: 3px solid #F97316;">
        <p style="font-family: monospace; font-size: 10px; color: #F97316; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 6px;">
          Maxpromo Digital
        </p>
        <h1 style="color: #ffffff; margin: 0 0 6px; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">
          Kostenvoranschlag
        </h1>
        <p style="color: #888888; margin: 0; font-size: 12px; font-family: monospace;">
          ${esc(data.businessName)} · Erstellt: ${today} · Gültig bis: ${validUntilStr}
        </p>
      </div>

      <!-- Client info -->
      <div style="padding: 24px 32px; background: #f9f9f9; border-bottom: 1px solid #eeeeee;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: #888888; font-size: 12px; width: 160px;">Unternehmen:</td>
            <td style="padding: 5px 0; color: #111111; font-size: 13px; font-weight: bold;">${esc(data.businessName)}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #888888; font-size: 12px;">Ansprechpartner:</td>
            <td style="padding: 5px 0; color: #111111; font-size: 13px;">${esc(data.clientName)}</td>
          </tr>
          ${data.city ? `<tr><td style="padding:5px 0;color:#888888;font-size:12px;">Stadt:</td><td style="padding:5px 0;color:#111111;font-size:13px;">${esc(data.city)}</td></tr>` : ''}
          ${isInternal && data.clientPhone ? `<tr><td style="padding:5px 0;color:#888888;font-size:12px;">Telefon:</td><td style="padding:5px 0;color:#111111;font-size:13px;">${esc(data.clientPhone)}</td></tr>` : ''}
          ${isInternal ? `<tr><td style="padding:5px 0;color:#888888;font-size:12px;">E-Mail:</td><td style="padding:5px 0;font-size:13px;"><a href="mailto:${esc(data.clientEmail)}" style="color:#F97316;">${esc(data.clientEmail)}</a></td></tr>` : ''}
        </table>
      </div>

      <!-- Einmalige Kosten -->
      <div style="padding: 24px 32px 0;">
        <p style="font-family: monospace; font-size: 10px; color: #F97316; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 12px;">
          Einmalige Kosten / One-time Costs
        </p>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #eeeeee;">
          <tr style="background: #f5f5f5;">
            <td style="padding: 8px 12px; font-size: 11px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 0.08em;">Leistung</td>
            <td style="padding: 8px 12px; font-size: 11px; font-family: monospace; color: #888888; text-align: right; text-transform: uppercase; letter-spacing: 0.08em;">Preis</td>
          </tr>
          <tr>
            <td style="padding: 10px 12px; border-bottom: 1px solid #eeeeee; color: #111111; font-size: 13px; font-weight: bold;">
              Website-Paket: ${esc(data.pkg)}
            </td>
            <td style="padding: 10px 12px; border-bottom: 1px solid #eeeeee; text-align: right; font-family: monospace; color: #111111; font-size: 13px;">
              ${fmt(data.pkgPrice)}
            </td>
          </tr>
          ${addonRows}
          <tr style="background: #F97316;">
            <td style="padding: 12px; color: #000000; font-weight: bold; font-family: monospace; font-size: 13px; letter-spacing: 0.06em;">
              GESAMT EINMALIG
            </td>
            <td style="padding: 12px; text-align: right; color: #000000; font-weight: bold; font-size: 16px; font-family: monospace;">
              ${fmt(data.totals.oneTime)}
            </td>
          </tr>
        </table>
      </div>

      <!-- Laufende Kosten -->
      ${
        recurringRows.length > 0
          ? `<div style="padding: 24px 32px 0;">
        <p style="font-family: monospace; font-size: 10px; color: #888888; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 12px;">
          Laufende Kosten / Recurring Costs
        </p>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #eeeeee;">
          ${recurringRows.join('')}
          ${data.totals.monthly > 0 ? `<tr style="background: #0A0A0A;">
            <td style="padding: 10px 12px; color: #ffffff; font-family: monospace; font-size: 12px;">Monatlich / Monthly</td>
            <td style="padding: 10px 12px; text-align: right; color: #F97316; font-weight: bold; font-family: monospace;">${fmt(data.totals.monthly)}/Mon</td>
          </tr>` : ''}
        </table>
      </div>`
          : ''
      }

      <!-- Legal + terms -->
      <div style="padding: 24px 32px;">
        <p style="font-size: 11px; color: #aaaaaa; margin: 4px 0; font-family: monospace;">
          Gemäß §19 UStG wird keine Umsatzsteuer berechnet.
        </p>
        <p style="font-size: 11px; color: #aaaaaa; margin: 4px 0; font-family: monospace;">
          Zahlungsbedingungen: 50% Anzahlung bei Auftragserteilung, 50% bei Abnahme.
        </p>
        <p style="font-size: 11px; color: #aaaaaa; margin: 4px 0; font-family: monospace;">
          Dieses Angebot ist 30 Tage gültig (bis ${validUntilStr}).
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #0A0A0A; padding: 24px 32px; border-top: 1px solid #1a1a1a;">
        <p style="color: #666666; font-size: 12px; margin: 0 0 4px; font-family: monospace;">
          Erstellt von Maxpromo Digital
        </p>
        <p style="color: #444444; font-size: 11px; margin: 0; font-family: monospace;">
          maxpromo.digital · info@maxpromo.digital · +49 173 3645698
        </p>
      </div>
    </div>
  `
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendEstimateBody

    const { clientName, clientEmail, businessName } = body

    // Validate required fields
    if (!clientName?.trim() || !businessName?.trim() || !clientEmail?.trim()) {
      return NextResponse.json({ error: 'Required fields missing.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(clientEmail)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    // Send to client
    const clientResult = await sendEmail({
      to: clientEmail.trim(),
      from: FROM_EMAIL,
      replyTo: CONTACT_EMAIL,
      subject: `Ihr Kostenvoranschlag — Maxpromo Digital`,
      html: buildEstimateEmailHtml(body, false),
    })

    // Send internal copy to info@maxpromo.digital
    await sendEmail({
      to: CONTACT_EMAIL,
      from: FROM_EMAIL,
      replyTo: clientEmail.trim(),
      subject: `Neues Angebot: ${businessName.trim()} — Maxpromo Digital`,
      html: buildEstimateEmailHtml(body, true),
    })

    if (!clientResult.success) {
      throw new Error(clientResult.error ?? 'Email delivery failed')
    }

    // Pipe to OS leads
    try {
      const db = getDb()
      const summary = `Website estimate — ${body.pkg} (€${body.pkgPrice}). Total: €${body.totals.oneTime} one-time.`
      await db`
        INSERT INTO os_leads (name, email, company, source, summary, status)
        VALUES (${body.clientName}, ${body.clientEmail}, ${body.businessName}, 'estimate_tool', ${summary}, 'new')
        ON CONFLICT DO NOTHING`
    } catch { /* DB may not be configured — ignore */ }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[/api/estimate/send]', error)
    return NextResponse.json(
      { error: 'Failed to send estimate. Please try again.' },
      { status: 500 },
    )
  }
}
