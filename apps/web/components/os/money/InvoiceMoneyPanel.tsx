'use client'
/**
 * One invoice's money (ADR-0025): its payment link, every payment and refund recorded against it,
 * and the card payment attempts. Refunds prepare an approval and need Marcel's confirmation.
 */
import { useCallback, useEffect, useState } from 'react'
import { useOsLocale } from '@/lib/os-i18n/context'
import { MONEY_COPY } from '@/lib/os-i18n/money'
import type { InvoiceMoney } from '@/lib/money/types'
import { useMoneyAction } from './useMoneyAction'

const mono = 'var(--brand-font-mono)'
const section: React.CSSProperties = { border: '1px solid var(--brand-border)', background: 'var(--brand-surface)', padding: 'var(--space-4)', marginTop: 'var(--space-4)' }
const heading: React.CSSProperties = { fontFamily: mono, fontSize: 'var(--text-label-dense)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand-text-secondary)', margin: '0 0 var(--space-3)' }

export function formatMoney(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'de-DE', { style: 'currency', currency }).format(amount)
}

export function InvoiceMoneyPanel({ invoiceId, invoiceNumber, status, onChanged }: { invoiceId: string; invoiceNumber: string; status: string; onChanged?: () => void }) {
  const { locale, fmtDate } = useOsLocale()
  const c = MONEY_COPY[locale]
  const [data, setData] = useState<InvoiceMoney | null>(null)
  const [copied, setCopied] = useState(false)
  const [refundFor, setRefundFor] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const load = useCallback(() => {
    fetch(`/api/os/money?invoice=${invoiceId}`, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(d => setData(d as InvoiceMoney | null)).catch(() => setData(null))
  }, [invoiceId])
  useEffect(() => { load() }, [load])
  const action = useMoneyAction(c, () => { load(); onChanged?.(); setRefundFor(null) })

  if (!data) return null
  const fmt = (v: number, cur: string) => formatMoney(v, cur, locale)

  return (
    <div>
      <section style={section} aria-label={c.payLink}>
        <h2 style={heading}>{c.payLink}</h2>
        {data.link ? (
          <>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
              <code style={{ fontFamily: mono, fontSize: 'var(--text-small)', overflowWrap: 'anywhere', flex: '1 1 240px' }}>{data.link.url}</code>
              <button type="button" className="btn-secondary btn-sm" style={{ minHeight: '40px' }}
                onClick={() => { void navigator.clipboard?.writeText(data.link!.url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }) }}>{copied ? c.copied : c.copy}</button>
              <button type="button" className="btn-secondary btn-sm" style={{ minHeight: '40px' }} disabled={action.busy}
                onClick={() => void action.run('payment.link', { invoice_id: invoiceId, revoke: true })}>{c.revoke}</button>
            </div>
            <p style={{ color: 'var(--brand-text-secondary)', fontSize: 'var(--text-small)', margin: 'var(--space-2) 0 0' }}>
              {c.opened({ count: data.link.opened })}{!data.card ? ` · ${c.linkCardOff}` : ''}
            </p>
          </>
        ) : status !== 'cancelled' ? (
          <>
            <p style={{ margin: '0 0 var(--space-2)', color: 'var(--brand-text-secondary)' }}>{c.payLinkNone}{!data.card ? ` ${c.linkCardOff}` : ''}</p>
            <button type="button" className="btn-secondary btn-sm" style={{ minHeight: '40px' }} disabled={action.busy}
              onClick={() => void action.run('payment.link', { invoice_id: invoiceId })}>{c.createLink}</button>
          </>
        ) : null}
      </section>

      <section style={section} aria-label={c.ledger}>
        <h2 style={heading}>{c.ledger}</h2>
        <p style={{ margin: '0 0 var(--space-3)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <span>{c.openNow}: <strong style={{ fontFamily: mono }}>{fmt(data.open, data.currency)}</strong></span>
          <span>{c.receivedNet}: <strong style={{ fontFamily: mono }}>{fmt(data.received, data.currency)}</strong></span>
        </p>
        {data.ledger.length === 0 ? <p style={{ margin: 0, color: 'var(--brand-text-secondary)' }}>{c.noLedger}</p> : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {data.ledger.map(e => (
              <li key={`${e.kind}:${e.id}`} style={{ borderTop: '1px solid var(--brand-border)', padding: 'var(--space-2) 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <span>
                    <strong>{c.entryKind[e.kind]}</strong> · {fmtDate(e.date)} · {c.provider[e.provider] ?? e.provider}
                    {c.entryStatus[e.status] ? ` · ${c.entryStatus[e.status]}` : ''}
                    {e.fee !== null ? ` · ${c.fee(fmt(e.fee, e.currency))}` : ''}
                  </span>
                  <span style={{ fontFamily: mono, fontWeight: 700 }}>{e.kind === 'payment' ? '' : '−'}{fmt(e.amount, e.currency)}</span>
                </div>
                {e.kind === 'payment' && e.refundable > 0 && refundFor !== e.id && (
                  <button type="button" className="btn-secondary btn-sm" style={{ minHeight: '36px', marginTop: 'var(--space-1)' }}
                    onClick={() => { setRefundFor(e.id); setAmount(String(e.refundable)); setReason('') }}>{c.refund}</button>
                )}
                {refundFor === e.id && (
                  <form style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 'var(--space-2)' }}
                    onSubmit={ev => { ev.preventDefault(); void action.run('payment.refund', { invoice_id: invoiceId, payment_id: e.id, amount: Number(amount), ...(reason.trim() ? { reason: reason.trim() } : {}) }) }}>
                    <label style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ fontSize: 'var(--text-small)' }}>{c.refundAmount}</span>
                      <input type="number" step="0.01" min="0.01" max={e.refundable} value={amount} onChange={ev => setAmount(ev.target.value)} required style={{ minHeight: '40px', width: '120px' }} />
                    </label>
                    <label style={{ display: 'grid', gap: '4px', flex: '1 1 180px' }}>
                      <span style={{ fontSize: 'var(--text-small)' }}>{c.refundReason}</span>
                      <input type="text" maxLength={300} value={reason} onChange={ev => setReason(ev.target.value)} style={{ minHeight: '40px' }} />
                    </label>
                    <button type="submit" className="btn-primary btn-sm" style={{ minHeight: '40px' }} disabled={action.busy}>{c.refund}</button>
                    <button type="button" className="btn-secondary btn-sm" style={{ minHeight: '40px' }} onClick={() => setRefundFor(null)}>{c.cancel}</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {action.panel}
      </section>

      {data.attempts.length > 0 && (
        <section style={section} aria-label={c.attempts}>
          <h2 style={heading}>{c.attempts}</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {data.attempts.map((a, i) => (
              <li key={i} style={{ padding: 'var(--space-1) 0', color: 'var(--brand-text-secondary)' }}>
                {fmtDate(a.createdAt)} · {fmt(a.amount, a.currency)} · {c.attemptStatus[a.status] ?? a.status}{a.failureCode ? ` · ${a.failureCode}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}
      <span hidden>{invoiceNumber}</span>
    </div>
  )
}
