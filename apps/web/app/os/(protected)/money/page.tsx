'use client'
/**
 * /os/money — the Money domain of the Business Control Plane (ADR-0025). Not a second money system:
 * every figure is read from the invoices, the one payment ledger and the rail records pointing at
 * them. Built to be understood in seconds on a phone:
 *   1. what is owed, overdue and received (the hero)
 *   2. what needs Marcel's look — shown only when something does
 *   3. card money in business words ("€28.40 awaiting Stripe payout"); provider detail stays below
 *   4. payouts and the ledger
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useOsLocale } from '@/lib/os-i18n/context'
import { MONEY_COPY } from '@/lib/os-i18n/money'
import type { MoneySnapshot } from '@/lib/money/types'
import { formatMoney } from '@/components/os/money/InvoiceMoneyPanel'
import { useMoneyAction } from '@/components/os/money/useMoneyAction'

export default function MoneyPage() {
  const { locale, fmtDate } = useOsLocale()
  const c = MONEY_COPY[locale]
  const [data, setData] = useState<MoneySnapshot | null>(null)
  const [failed, setFailed] = useState(false)
  const [note, setNote] = useState<Record<string, string>>({})
  const load = useCallback(() => {
    fetch('/api/os/money', { cache: 'no-store' }).then(r => (r.ok ? r.json() : Promise.reject())).then(d => { setData(d as MoneySnapshot); setFailed(false) }).catch(() => setFailed(true))
  }, [])
  useEffect(() => { load() }, [load])
  const action = useMoneyAction(c, load)
  /* Rail details are stored in English for the audit; the screen says them in Marcel's language. */
  const detailOf = (kind: string, detail: string) => kind === 'unreconciled' || kind === 'payoutFailed'
    ? (c.payoutStatus[detail.split(' ')[0]] ?? detail) + (detail.includes(' ') ? ` · ${detail.split(' ').slice(1).join(' ')}` : '')
    : c.reasons[detail] ?? (detail.startsWith('currency ') ? c.reasons.currency : kind === 'dispute' ? detail.replace(/_/g, ' ') : detail)
  const per = (amounts: Record<string, number>) => {
    const parts = Object.entries(amounts).filter(([, v]) => Math.abs(v) > 0.004).map(([cur, v]) => formatMoney(v, cur, locale))
    return parts.length ? parts.join(' · ') : formatMoney(0, 'EUR', locale)
  }
  const anyOverdue = data ? Object.values(data.overdue).some(v => v > 0.004) : false
  const showCard = data ? data.rail.connected || Object.keys(data.card.gross).length > 0 : false
  const pending = data ? Object.entries(data.card.pendingPayout).filter(([, v]) => Math.abs(v) > 0.004) : []

  return (
    <div className="os-page money-page">
      <header className="money-head">
        <h1>{c.title}</h1>
        <p>{c.hint}</p>
      </header>
      {failed && <p role="alert" className="money-alert">{c.failed}</p>}
      {!data && !failed && <p role="status" className="money-quiet">…</p>}
      {data && (
        <>
          <section className="money-hero" aria-label={c.outstanding}>
            <p className="money-label">{c.outstanding}</p>
            <p className="money-big">{per(data.outstanding)}</p>
            <dl className="money-pair">
              <div className={anyOverdue ? 'is-alert' : ''}><dt>{c.overdue}</dt><dd>{per(data.overdue)}</dd></div>
              <div><dt>{c.received}</dt><dd>{per(data.receivedThisMonth)}</dd></div>
            </dl>
            <Link href="/os/invoices" className="money-more">{c.openInvoices} ›</Link>
          </section>

          {data.issues.length > 0 ? (
            <section aria-label={c.issues} className="money-card money-issues">
              <h2 className="money-label">{c.issues}</h2>
              <ul className="money-list">
                {data.issues.map(i => (
                  <li key={`${i.kind}:${i.id}`}>
                    <div className="money-row">
                      <span><strong>{c.issueKind[i.kind]}</strong> · {fmtDate(i.date)}{i.invoiceNumber && i.invoiceId ? <> · <Link href={`/os/invoices/${i.invoiceId}`}>{c.invoice} {i.invoiceNumber}</Link></> : null}<span className="money-sub">{detailOf(i.kind, i.detail)}</span></span>
                      <span className="money-amount">{formatMoney(i.amount, i.currency, locale)}</span>
                    </div>
                    {i.kind === 'unapplied' && (
                      <form className="money-form" onSubmit={e => { e.preventDefault(); void action.run('money.resolve', { id: i.id, note: note[i.id] ?? '' }) }}>
                        <input aria-label={c.resolveNote} placeholder={c.resolveNote} minLength={3} maxLength={300} required value={note[i.id] ?? ''} onChange={e => setNote(n => ({ ...n, [i.id]: e.target.value }))} />
                        <button type="submit" className="btn-secondary btn-sm" disabled={action.busy}>{c.resolve}</button>
                      </form>
                    )}
                    {i.kind === 'unreconciled' && (
                      <form className="money-form" onSubmit={e => { e.preventDefault(); void action.run('payout.reconcile', { payout_id: i.id, ...(note[i.id]?.trim() ? { bank_reference: note[i.id].trim() } : {}) }) }}>
                        <input aria-label={c.bankRef} placeholder={c.bankRef} maxLength={120} value={note[i.id] ?? ''} onChange={e => setNote(n => ({ ...n, [i.id]: e.target.value }))} />
                        <button type="submit" className="btn-secondary btn-sm" disabled={action.busy}>{c.reconcile}</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
              {action.panel}
            </section>
          ) : <p className="money-quiet">{c.allClear}</p>}

          {showCard && (
            <section aria-label={c.cardSection} className="money-card">
              <h2 className="money-label">{c.cardSection}</h2>
              <p className="money-sentence">
                {pending.length === 0 ? c.nothingPending : pending.map(([cur, v]) => (v > 0 ? c.awaitingPayout(formatMoney(v, cur, locale)) : c.stripeBalance(formatMoney(v, cur, locale)))).join(' · ')}
              </p>
              <dl className="money-pair">
                <div><dt>{c.cardGross}</dt><dd>{per(data.card.gross)}</dd></div>
                <div><dt>{c.fees}</dt><dd>{per(data.card.fees)}</dd></div>
              </dl>
              <p className="money-rail">
                {data.rail.connected ? c.railOn(data.rail.mode ?? 'test') : `${c.railOff} ${data.rail.reason ? c.railReason[data.rail.reason] ?? '' : ''}`}
                {data.rail.connected && !data.rail.webhook && <strong className="money-alert"> {c.webhookMissing}</strong>}
              </p>
            </section>
          )}
          {!showCard && <p className="money-rail">{c.railOff} {data.rail.reason ? c.railReason[data.rail.reason] ?? '' : ''}</p>}

          {(data.payouts.length > 0 || showCard) && (
            <section aria-label={c.payouts} className="money-card">
              <h2 className="money-label">{c.payouts}</h2>
              {data.payouts.length === 0 ? <p className="money-quiet">{c.noPayouts}</p> : (
                <ul className="money-list">
                  {data.payouts.map(p => (
                    <li key={p.id} className="money-row">
                      <span>{p.arrivalDate ? fmtDate(p.arrivalDate) : c.dash}<span className="money-sub">{c.payoutStatus[p.status] ?? p.status}{p.reconciled ? ` · ${c.reconciled}` : ''}</span></span>
                      <span className="money-amount">{formatMoney(p.amount, p.currency, locale)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section aria-label={c.ledger} className="money-card">
            <h2 className="money-label">{c.ledger}</h2>
            {data.ledger.length === 0 ? <p className="money-quiet">{c.noLedger}</p> : (
              <ul className="money-list">
                {data.ledger.map(e => (
                  <li key={`${e.kind}:${e.id}`} className="money-row">
                    <span><Link href={`/os/invoices/${e.invoiceId}`}>{e.invoiceNumber}</Link> · {e.client}
                      <span className="money-sub">{fmtDate(e.date)} · {c.entryKind[e.kind]} · {c.provider[e.provider] ?? e.provider}{c.entryStatus[e.status] ? ` · ${c.entryStatus[e.status]}` : ''}</span></span>
                    <span className="money-amount">{e.kind === 'payment' ? '' : '−'}{formatMoney(e.amount, e.currency, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
