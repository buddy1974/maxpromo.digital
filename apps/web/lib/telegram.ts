/**
 * lib/telegram.ts — Centralised Telegram notification helper
 *
 * Server-side only. Never import from client components.
 * Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from env.
 * Fail-safe: errors are caught and logged; calling route always continues.
 */

const TELEGRAM_API = 'https://api.telegram.org'

export interface TelegramResult {
  sent: boolean
  error?: string
}

export async function sendTelegramNotification(
  message: string,
): Promise<TelegramResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.warn(
      '[Telegram] notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured',
    )
    return { sent: false, error: 'not_configured' }
  }

  try {
    const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    })

    if (!res.ok) {
      console.error(`[Telegram] API error ${res.status}`)
      return { sent: false, error: `api_${res.status}` }
    }

    return { sent: true }
  } catch (err) {
    console.error('[Telegram] Send failed:', err instanceof Error ? err.message : 'unknown error')
    return { sent: false, error: 'network_error' }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ts(): string {
  return new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }) + ' (Berlin)'
}

function e(s: string | null | undefined): string {
  if (!s) return '—'
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Clickable mailto: link — tap in Telegram to open email client */
function emailLink(email: string | null | undefined): string {
  if (!email?.trim()) return '—'
  const safe = e(email.trim())
  return `<a href="mailto:${safe}">${safe}</a>`
}

/** Clickable tel: link — tap in Telegram to call */
function phoneLink(phone: string | null | undefined): string {
  if (!phone?.trim()) return '—'
  const safe = e(phone.trim())
  return `<a href="tel:${phone.trim()}">${safe}</a>`
}

// ── Business Diagnostic ────────────────────────────────────────────────────

export interface DiagnosticNotificationData {
  name: string
  company: string
  email: string
  phone?: string
  ceoQuestion?: string
  detectedCategories?: string[]
}

export function buildDiagnosticMessage(d: DiagnosticNotificationData): string {
  const cats = (d.detectedCategories ?? []).map((c) => `  - ${e(c)}`).join('\n') || '  —'
  return [
    '<b>New Business Diagnostic</b>',
    '',
    `<b>Company:</b> ${e(d.company)}`,
    `<b>Contact:</b> ${e(d.name)}`,
    `<b>Email:</b> ${emailLink(d.email)}`,
    d.phone?.trim() ? `<b>Phone:</b> ${phoneLink(d.phone)}` : null,
    '',
    '<b>Main frustration:</b>',
    `  ${e(d.ceoQuestion?.slice(0, 400))}`,
    '',
    '<b>Detected opportunities:</b>',
    cats,
    '',
    `<b>Source:</b> business_diagnostic`,
    `<b>Time:</b> ${ts()}`,
  ].filter((l) => l !== null).join('\n')
}

// ── Automation Audit ───────────────────────────────────────────────────────

export interface AuditNotificationData {
  name: string
  company: string
  email: string
  orgType?: string
  timeDrains?: string[]
  goal?: string
}

export function buildAuditMessage(d: AuditNotificationData): string {
  return [
    '<b>New Automation Audit Lead</b>',
    '',
    `<b>Company:</b> ${e(d.company)}`,
    `<b>Name:</b> ${e(d.name)}`,
    `<b>Email:</b> ${emailLink(d.email)}`,
    '',
    d.orgType ? `<b>Org type:</b> ${e(d.orgType)}` : null,
    d.timeDrains?.length ? `<b>Time drains:</b> ${e(d.timeDrains.join(', '))}` : null,
    d.goal ? `<b>Goal:</b> ${e(d.goal.slice(0, 300))}` : null,
    '',
    `<b>Source:</b> automation_audit`,
    `<b>Time:</b> ${ts()}`,
  ].filter((l) => l !== null).join('\n')
}

// ── Contact Form ───────────────────────────────────────────────────────────

export interface ContactNotificationData {
  name: string
  company: string
  email: string
  phone?: string
  preferredContactMethod?: string
  painPoints?: string[]
  message?: string
}

export function buildContactMessage(d: ContactNotificationData): string {
  return [
    '<b>New Contact Message</b>',
    '',
    `<b>Name:</b> ${e(d.name)}`,
    `<b>Company:</b> ${e(d.company)}`,
    `<b>Email:</b> ${emailLink(d.email)}`,
    d.phone?.trim() ? `<b>Phone:</b> ${phoneLink(d.phone)}` : null,
    d.preferredContactMethod ? `<b>Preferred contact:</b> ${e(d.preferredContactMethod)}` : null,
    d.painPoints?.length ? `<b>Help requested:</b> ${e(d.painPoints.join(', '))}` : null,
    '',
    '<b>Message:</b>',
    `  ${e(d.message?.slice(0, 600))}`,
    '',
    `<b>Source:</b> contact_form`,
    `<b>Time:</b> ${ts()}`,
  ].filter((l) => l !== null).join('\n')
}

// ── Product / System Inquiry ───────────────────────────────────────────────

export interface ProductInquiryNotificationData {
  systemName: string
  name: string
  company: string
  email: string
  phone?: string
  preferredContactMethod?: string
  painPoints?: string[]
  message?: string
  source: string
}

export function buildProductInquiryMessage(d: ProductInquiryNotificationData): string {
  return [
    '<b>New Product Inquiry</b>',
    '',
    `<b>System:</b> ${e(d.systemName)}`,
    '',
    `<b>Name:</b> ${e(d.name)}`,
    `<b>Company:</b> ${e(d.company)}`,
    `<b>Email:</b> ${emailLink(d.email)}`,
    d.phone?.trim() ? `<b>Phone:</b> ${phoneLink(d.phone)}` : null,
    d.preferredContactMethod ? `<b>Preferred contact:</b> ${e(d.preferredContactMethod)}` : null,
    d.painPoints?.length ? `<b>Help requested:</b> ${e(d.painPoints.join(', '))}` : null,
    '',
    d.message ? '<b>Details:</b>' : null,
    d.message ? `  ${e(d.message.slice(0, 500))}` : null,
    '',
    `<b>Source:</b> ${e(d.source)}`,
    `<b>Time:</b> ${ts()}`,
  ].filter((l) => l !== null).join('\n')
}

// ── Newsletter Subscriber ──────────────────────────────────────────────────

export interface NewsletterNotificationData {
  email: string
  name?: string
}

export function buildNewsletterMessage(d: NewsletterNotificationData): string {
  return [
    '<b>New Newsletter Subscriber</b>',
    '',
    `<b>Email:</b> ${emailLink(d.email)}`,
    d.name?.trim() ? `<b>Name:</b> ${e(d.name)}` : null,
    '',
    `<b>Source:</b> newsletter`,
    `<b>Time:</b> ${ts()}`,
  ].filter((l) => l !== null).join('\n')
}
