/**
 * Maxpromo outbound email identity (ADR-0023). One renderer, two styles:
 *
 *   relationship   a letter: greeting, Marcel's words, signature. Reads like a person wrote it.
 *   transactional  a notice: inked wordmark band, a reference block, optional action, legal footer.
 *
 * Constraints, all deliberate:
 *   - multipart: the plain-text part carries the same words, not "view in browser";
 *   - no images at all: the wordmark is set in type (brands.ts DOCUMENT_MARK_NOTE), so nothing is
 *     blocked, nothing tracks, nothing is fetched;
 *   - tables and inline styles only, 600px column, system font stack: what Gmail, Outlook and
 *     Apple Mail render alike;
 *   - colours come from the design-token mirror (documents/config), never restated here;
 *   - every value from a person or a record is escaped; links only to Maxpromo's own domains.
 */
import { BUSINESS, UST_CLAUSE } from '@maxpromo/config'
import { BRAND_COLORS } from '@/lib/documents/config'
import { COMMERCIAL_FAMILIES, FAMILIES, type FamilyId, type Language } from './families'

export interface QuotedMessage { from: string; at: Date; text: string }
export interface RenderInput {
  family: FamilyId
  language: Language
  /** Marcel's text, plain. Paragraphs separated by a blank line. */
  body: string
  recipientName?: string | null
  /** Transactional reference rows, e.g. [["Rechnung", "MP-2026-002"], ["Betrag", "156,00 €"]]. */
  reference?: [string, string][]
  /** One action, only to maxpromo.digital or one of its subdomains. */
  action?: { label: string; url: string } | null
  quoted?: QuotedMessage | null
}
export interface RenderedEmail { html: string; text: string }

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, Helvetica, Arial, sans-serif"
const SIGNER = { name: BUSINESS.legalName, title: { de: 'Inhaber, Maxpromo Digital', en: 'Founder, Maxpromo Digital' } }
const COPY = {
  de: { hello: (n?: string | null) => (n ? `Guten Tag ${n},` : 'Guten Tag,'), closeRel: 'Viele Grüße', closeTx: 'Freundliche Grüße', wrote: (who: string, when: string) => `Am ${when} schrieb ${who}:`, legal: 'Inhaber', imprint: 'Impressum' },
  en: { hello: (n?: string | null) => (n ? `Hello ${n},` : 'Hello,'), closeRel: 'Best regards', closeTx: 'Kind regards', wrote: (who: string, when: string) => `On ${when}, ${who} wrote:`, legal: 'Proprietor', imprint: 'Legal notice' },
} as const

export function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Only Maxpromo's own https URLs become links; anything else is refused before rendering. */
export function safeActionUrl(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (u.protocol !== 'https:' || u.username || u.password || (host !== 'maxpromo.digital' && !host.endsWith('.maxpromo.digital'))) return null
    return u.href
  } catch { return null }
}

function prepareBody(body: string, language: Language): string {
  const clean = body.replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  // English sentences start upper-case after the greeting; German letters continue lower-case.
  return language === 'en' && clean ? clean[0].toUpperCase() + clean.slice(1) : clean
}

function paragraphsHtml(text: string, style: string): string {
  return text.split(/\n{2,}/).map(p => `<p style="${style}">${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n')
}

function firstName(name?: string | null): string | null {
  const n = (name ?? '').trim()
  return n && !n.includes('@') ? n : null
}

function when(at: Date, language: Language): string {
  return at.toLocaleString(language === 'de' ? 'de-DE' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' })
}

export function renderEmail(input: RenderInput): RenderedEmail {
  const family = FAMILIES[input.family]
  const lang = input.language
  const c = COPY[lang]
  const transactional = family.style === 'transactional'
  const body = prepareBody(input.body, lang)
  const greeting = c.hello(firstName(input.recipientName))
  const closing = transactional ? c.closeTx : c.closeRel
  const action = input.action ? { label: input.action.label, url: safeActionUrl(input.action.url) } : null
  if (input.action && !action?.url) throw new Error('unsafe_action_url')
  const commercial = COMMERCIAL_FAMILIES.includes(input.family)
  const legalLine = `Maxpromo Digital · ${c.legal}: ${BUSINESS.legalName} · ${BUSINESS.street}, ${BUSINESS.city} · ${BUSINESS.website}`
  const quoted = input.quoted ? { head: c.wrote(input.quoted.from, when(input.quoted.at, lang)), text: input.quoted.text.slice(0, 4000).trim() } : null

  /* ── plain text ── */
  const text = [
    greeting, '', body, '',
    ...(input.reference?.length ? [...input.reference.map(([k, v]) => `${k}: ${v}`), ''] : []),
    ...(action?.url ? [`${action.label}: ${action.url}`, ''] : []),
    closing, SIGNER.name, '',
    '-- ',
    `${SIGNER.name} · ${SIGNER.title[lang]}`,
    `${BUSINESS.phone} · ${BUSINESS.email} · https://${BUSINESS.website}`,
    legalLine,
    ...(commercial ? [UST_CLAUSE[lang]] : []),
    ...(quoted ? ['', quoted.head, ...quoted.text.split('\n').map(l => `> ${l}`)] : []),
  ].join('\n')

  /* The line a mail client shows next to the subject: for a notice, its reference facts ("Rechnung
     MP-2026-002 · Betrag 156,00 €"), not the greeting. A letter keeps its natural opening. */
  const preheader = transactional && input.reference?.length ? input.reference.slice(0, 3).map(([k, v]) => `${k} ${v}`).join(' · ') : ''

  /* ── html ── */
  const ink = BRAND_COLORS.ink, muted = BRAND_COLORS.muted, faint = BRAND_COLORS.faint, border = BRAND_COLORS.border
  const p = `margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.6;color:${ink};`
  const wordmark = (onInk: boolean) =>
    `<span style="font-family:${FONT};font-weight:800;font-size:16px;letter-spacing:0.04em;color:${onInk ? BRAND_COLORS.white : ink};">MAXPROMO</span>` +
    `<span style="font-family:${FONT};font-weight:600;font-size:10px;letter-spacing:0.32em;color:${onInk ? BRAND_COLORS.textInverted : muted};padding-left:8px;">DIGITAL</span>`
  const header = transactional
    ? `<tr><td style="background:${ink};padding:20px 32px;border-bottom:4px solid ${BRAND_COLORS.accent};">${wordmark(true)}</td></tr>`
    : `<tr><td style="padding:0 32px;"><div style="height:4px;width:48px;background:${BRAND_COLORS.accent};line-height:4px;font-size:0;">&nbsp;</div></td></tr>`
  const referenceHtml = input.reference?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;border:1px solid ${border};">${input.reference.map(([k, v]) =>
        `<tr><td style="padding:10px 14px;font-family:${FONT};font-size:13px;color:${muted};border-bottom:1px solid ${border};width:40%;">${esc(k)}</td><td style="padding:10px 14px;font-family:${FONT};font-size:14px;font-weight:600;color:${ink};border-bottom:1px solid ${border};">${esc(v)}</td></tr>`).join('')}</table>`
    : ''
  const actionHtml = action?.url
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="background:${BRAND_COLORS.accent};border-radius:4px;"><a href="${esc(action.url)}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:14px;font-weight:700;color:${BRAND_COLORS.onAccent};text-decoration:none;">${esc(action.label)}</a></td></tr></table>`
    : ''
  const signature = `
      <tr><td style="padding:8px 32px 0;">
        <p style="${p}margin-bottom:4px;">${esc(closing)}</p>
        <p style="${p}margin-bottom:20px;">${esc(SIGNER.name)}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-top:1px solid ${border};padding-top:14px;width:100%;"><tr><td style="padding-top:14px;">
          ${transactional ? '' : `<div style="margin:0 0 6px;">${wordmark(false)}</div>`}
          <p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.5;color:${ink};font-weight:600;">${esc(SIGNER.name)}</p>
          <p style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.5;color:${muted};">${esc(SIGNER.title[lang])}</p>
          <p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.6;color:${muted};">${esc(BUSINESS.phone)} &nbsp;·&nbsp; <a href="mailto:${esc(BUSINESS.email)}" style="color:${ink};text-decoration:underline;">${esc(BUSINESS.email)}</a> &nbsp;·&nbsp; <a href="https://${esc(BUSINESS.website)}" style="color:${ink};text-decoration:underline;">${esc(BUSINESS.website)}</a></p>
        </td></tr></table>
      </td></tr>`
  const footer = `
      <tr><td style="padding:20px 32px 28px;">
        <p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.5;color:${faint};">${esc(legalLine)} · <a href="https://${esc(BUSINESS.website)}/impressum" style="color:${faint};text-decoration:underline;">${esc(c.imprint)}</a></p>
        ${commercial ? `<p style="margin:6px 0 0;font-family:${FONT};font-size:11px;line-height:1.5;color:${faint};">${esc(UST_CLAUSE[lang])}</p>` : ''}
      </td></tr>`
  const quotedHtml = quoted
    ? `<tr><td style="padding:0 32px 8px;"><div style="border-left:3px solid ${border};padding:4px 0 4px 14px;margin-top:8px;">
        <p style="margin:0 0 8px;font-family:${FONT};font-size:12px;color:${faint};">${esc(quoted.head)}</p>
        ${paragraphsHtml(quoted.text, `margin:0 0 10px;font-family:${FONT};font-size:13px;line-height:1.5;color:${muted};`)}
      </div></td></tr>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="${lang}" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<meta name="x-apple-disable-message-reformatting">
<title>Maxpromo Digital</title>
<!--[if mso]><style>table,td,p,a,span{font-family:Arial,Helvetica,sans-serif!important;mso-line-height-rule:exactly;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${BRAND_COLORS.surfaceSubtle};-webkit-text-size-adjust:100%;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BRAND_COLORS.surfaceSubtle};opacity:0;">${esc(preheader)}</div>
` : ''}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_COLORS.surfaceSubtle};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${BRAND_COLORS.white};border:1px solid ${border};">
    ${header}
    <tr><td style="padding:28px 32px 4px;">
      <p style="${p}">${esc(greeting)}</p>
      ${paragraphsHtml(body, p)}
      ${referenceHtml}
      ${actionHtml}
    </td></tr>
    ${signature}
    ${quotedHtml}
    ${footer}
  </table>
</td></tr>
</table>
</body>
</html>`
  return { html, text }
}
