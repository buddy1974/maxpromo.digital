import type { MailCopy } from '@/lib/os-i18n/mail'

const berlinDay = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' })

/** Today → time, yesterday → "Yesterday", this year → day and month, else the full date. */
export function shortDate(value: string, intlLocale: string, today: string, copy: MailCopy): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  const day = berlinDay(d)
  if (day === today) return d.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })
  const y = new Date(`${today}T12:00:00Z`); y.setUTCDate(y.getUTCDate() - 1)
  if (day === y.toISOString().slice(0, 10)) return copy.date.yesterday
  return d.toLocaleDateString(intlLocale, day.slice(0, 4) === today.slice(0, 4) ? { day: 'numeric', month: 'short', timeZone: 'Europe/Berlin' } : { dateStyle: 'medium', timeZone: 'Europe/Berlin' })
}

export function fullDate(value: string, intlLocale: string): string {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(intlLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' })
}

export function isoDay(value: string, intlLocale: string): string {
  const d = new Date(`${value}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(intlLocale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

export function money(amount: number, currency: string, intlLocale: string): string {
  try { return new Intl.NumberFormat(intlLocale, { style: 'currency', currency }).format(amount) } catch { return `${amount.toFixed(2)} ${currency}` }
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10)
}
