import type { Metadata } from 'next'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { berlinDate } from '@/lib/commercial/money'
import { fmtCurrency, fmtDocDate } from '@/lib/documents/format'
import { BANK_TRANSFER } from '@/lib/documents/identity'
import type { CurrencyCode } from '@/lib/documents/config'
import { isPayToken, payPageState, type PayPageState } from '@/lib/money/links'
import { railStatus } from '@/lib/money/stripe/client'

/**
 * The payment request page (ADR-0025): https://maxpromo.digital/<lang>/pay/<token>.
 *
 * Shows only what a payer needs — invoice number, the CURRENT open amount, due date, bank details —
 * and, when card payment is connected, one button that POSTs to start a checkout. A GET never
 * creates anything at the provider: mail scanners and link previews open links.
 * Private by construction: noindex, no referrer, disallowed in robots.txt.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: 'Zahlung · Payment — Maxpromo Digital' },
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

const COPY = {
  de: {
    eyebrow: 'Zahlung', invoice: 'Rechnung', open: 'Offener Betrag', due: 'Fällig am',
    card: 'Mit Karte bezahlen', cardNote: 'Sichere Zahlung über Stripe. Sie werden weitergeleitet.',
    testMode: 'Testmodus: Kartenzahlungen laufen über die Stripe-Sandbox. Es wird kein Geld bewegt.',
    bank: 'Oder per Überweisung', bankOnly: 'Per Überweisung', holder: 'Kontoinhaber', reference: 'Verwendungszweck',
    unknown: 'Dieser Zahlungslink ist nicht gültig. Bitte prüfen Sie den Link aus Ihrer E-Mail oder antworten Sie auf die E-Mail.',
    revoked: 'Dieser Zahlungslink ist nicht mehr aktiv. Bitte antworten Sie auf die E-Mail mit der Rechnung.',
    draft: 'Diese Rechnung ist noch nicht ausgestellt.', cancelled: 'Diese Rechnung wurde storniert.',
    paid: (n: string) => `Rechnung ${n} ist vollständig bezahlt. Vielen Dank!`,
    thanks: 'Vielen Dank! Ihre Zahlung wird bestätigt — das kann einen Moment dauern.',
    processing: 'Eine Zahlung wird gerade bearbeitet. Bitte zahlen Sie nicht noch einmal.',
    errors: {
      not_connected: 'Die Kartenzahlung ist gerade nicht verfügbar. Bitte überweisen Sie den Betrag.',
      busy: 'Die Zahlung wird gerade vorbereitet. Bitte versuchen Sie es in einem Moment erneut.',
      uncertain: 'Der Zahlungsdienst hat nicht geantwortet. Bitte versuchen Sie es in einem Moment erneut.',
      refused: 'Die Kartenzahlung konnte nicht gestartet werden. Bitte überweisen Sie den Betrag oder antworten Sie auf die E-Mail.',
      amount: 'Dieser Betrag kann nicht per Karte bezahlt werden. Bitte überweisen Sie ihn.',
      unavailable: 'Diese Rechnung kann nicht mehr bezahlt werden.', paid: 'Diese Rechnung ist bereits bezahlt.', unknown: 'Dieser Zahlungslink ist nicht gültig.',
      limited: 'Zu viele Versuche. Bitte warten Sie einen Moment.',
    } as Record<string, string>,
    contact: 'Fragen? Antworten Sie einfach auf die E-Mail mit der Rechnung.',
  },
  en: {
    eyebrow: 'Payment', invoice: 'Invoice', open: 'Amount open', due: 'Due date',
    card: 'Pay by card', cardNote: 'Secure payment through Stripe. You will be redirected.',
    testMode: 'Test mode: card payments run in the Stripe sandbox. No money moves.',
    bank: 'Or by bank transfer', bankOnly: 'By bank transfer', holder: 'Account holder', reference: 'Payment reference',
    unknown: 'This payment link is not valid. Please check the link from your email or reply to the email.',
    revoked: 'This payment link is no longer active. Please reply to the email with the invoice.',
    draft: 'This invoice has not been issued yet.', cancelled: 'This invoice has been cancelled.',
    paid: (n: string) => `Invoice ${n} is paid in full. Thank you!`,
    thanks: 'Thank you! Your payment is being confirmed — this can take a moment.',
    processing: 'A payment is being processed. Please do not pay again.',
    errors: {
      not_connected: 'Card payment is not available right now. Please pay by bank transfer.',
      busy: 'The payment is being prepared. Please try again in a moment.',
      uncertain: 'The payment service did not answer. Please try again in a moment.',
      refused: 'Card payment could not be started. Please pay by bank transfer or reply to the email.',
      amount: 'This amount cannot be paid by card. Please pay by bank transfer.',
      unavailable: 'This invoice can no longer be paid.', paid: 'This invoice is already paid.', unknown: 'This payment link is not valid.',
      limited: 'Too many attempts. Please wait a moment.',
    } as Record<string, string>,
    contact: 'Questions? Simply reply to the email with the invoice.',
  },
} as const

const box: React.CSSProperties = { maxWidth: '560px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }
const card: React.CSSProperties = { border: '1px solid var(--brand-border)', background: 'var(--brand-surface)', padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }
const row: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--brand-border)' }
const label: React.CSSProperties = { color: 'var(--brand-text-secondary)', fontSize: 'var(--text-small)' }
const value: React.CSSProperties = { color: 'var(--brand-text)', fontWeight: 600, textAlign: 'right', overflowWrap: 'anywhere' }
const notice = (tone: 'info' | 'danger'): React.CSSProperties => ({
  padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', border: `1px solid var(${tone === 'danger' ? '--semantic-danger' : '--brand-border'})`,
  color: tone === 'danger' ? 'var(--semantic-danger)' : 'var(--brand-text)', background: 'var(--brand-surface)',
})

export default async function PayPage({ params, searchParams }: { params: Promise<{ locale: string; token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { locale, token } = await params
  const query = await searchParams
  const t = COPY[locale === 'en' ? 'en' : 'de']
  let state: PayPageState = { kind: 'unknown' }
  if (isPayToken(token) && isDatabaseConfigured()) {
    try { state = await payPageState(getDb(), token, berlinDate(), true) } catch { state = { kind: 'unknown' } }
  }
  const error = typeof query.e === 'string' ? t.errors[query.e] : undefined
  const thanks = query.paid === '1'
  const rail = railStatus()
  const cardOn = rail.connected

  return (
    <section className="section surface-plain">
      <div style={box}>
        <p style={{ fontSize: 'var(--text-micro)', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--brand-text-secondary)', marginBottom: 'var(--space-2)' }}>{t.eyebrow} · Maxpromo Digital</p>
        {state.kind === 'unknown' && <p style={notice('info')}>{t.unknown}</p>}
        {state.kind === 'unavailable' && <p style={notice('info')}>{state.reason === 'revoked' ? t.revoked : state.reason === 'draft' ? t.draft : t.cancelled}</p>}
        {state.kind === 'paid' && <><h1 style={{ marginBottom: 'var(--space-3)' }}>{t.invoice} {state.number}</h1><p style={notice('info')}>{t.paid(state.number)}</p></>}
        {state.kind === 'open' && (
          <>
            <h1 style={{ marginBottom: 'var(--space-4)' }}>{t.invoice} {state.number}</h1>
            {thanks && <p style={notice('info')} role="status">{t.thanks}</p>}
            {!thanks && state.processing && <p style={notice('info')} role="status">{t.processing}</p>}
            {error && <p style={notice('danger')} role="alert">{error}</p>}
            <div style={card}>
              <div style={row}><span style={label}>{t.open}</span><span style={{ ...value, fontSize: 'var(--text-h4)' }}>{fmtCurrency(state.open, state.currency as CurrencyCode)}</span></div>
              {state.dueDate && <div style={{ ...row, borderBottom: 'none' }}><span style={label}>{t.due}</span><span style={value}>{fmtDocDate(state.dueDate, state.language)}</span></div>}
            </div>
            {cardOn && rail.mode === 'test' && <p style={notice('info')} role="note">{t.testMode}</p>}
            {cardOn && !thanks && !state.processing && (
              <form method="post" action="/api/pay/checkout" style={{ marginBottom: 'var(--space-5)' }}>
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="lang" value={locale === 'en' ? 'en' : 'de'} />
                <button type="submit" style={{ width: '100%', minHeight: '48px', background: 'var(--brand-primary)', color: 'var(--brand-on-primary)', border: 'none', fontWeight: 'var(--weight-heading)', fontSize: 'var(--text-body)', cursor: 'pointer' }}>
                  {t.card} · {fmtCurrency(state.open, state.currency as CurrencyCode)}
                </button>
                <p style={{ ...label, marginTop: 'var(--space-2)' }}>{t.cardNote}</p>
              </form>
            )}
            <h2 style={{ fontSize: 'var(--text-h4)', marginBottom: 'var(--space-2)' }}>{cardOn && !thanks && !state.processing ? t.bank : t.bankOnly}</h2>
            <div style={card}>
              <div style={row}><span style={label}>{t.holder}</span><span style={value}>{BANK_TRANSFER.beneficiary}</span></div>
              <div style={row}><span style={label}>IBAN</span><span style={value}>{BANK_TRANSFER.iban}</span></div>
              <div style={row}><span style={label}>BIC</span><span style={value}>{BANK_TRANSFER.bic}</span></div>
              <div style={{ ...row, borderBottom: 'none' }}><span style={label}>{t.reference}</span><span style={value}>{state.number}</span></div>
            </div>
          </>
        )}
        <p style={label}>{t.contact}</p>
      </div>
    </section>
  )
}
