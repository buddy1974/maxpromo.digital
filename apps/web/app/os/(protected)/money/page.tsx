'use client'
/**
 * /os/money — the Money domain of the Business Control Plane (ADR-0025). Not a second money system:
 * every figure is read from the invoices, the one payment ledger and the rail records pointing at
 * them. Answers "what needs my attention in money today?" first, then the figures.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useOsLocale } from '@/lib/os-i18n/context'
import { MONEY_COPY } from '@/lib/os-i18n/money'
import type { MoneySnapshot } from '@/lib/money/types'
import { formatMoney } from '@/components/os/money/InvoiceMoneyPanel'
import { useMoneyAction } from '@/components/os/money/useMoneyAction'

const mono = 'var(--brand-font-mono)'
const card: React.CSSProperties = { border: '1px solid var(--brand-border)', background: 'var(--brand-surface)', padding: 'var(--space-4)' }
const heading: React.CSSProperties = { fontFamily: mono, fontSize: 'var(--text-label-dense)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand-text-secondary)', margin: '0 0 var(--space-3)' }

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
    const parts = Object.entries(amounts).filter(([, v]) => v !== 0).map(([cur, v]) => formatMoney(v, cur, locale))
    return parts.length ? parts.join(' · ') : formatMoney(0, 'EUR', locale)
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      <h1 style={{ marginBottom: 'var(--space-1)' }}>{c.title}</h1>
      <p style={{ color: 'var(--brand-text-secondary)', margin: '0 0 var(--space-4)' }}>{c.hint}</p>
      {failed && <p role="alert" style={{ color: 'var(--semantic-danger)' }}>{c.failed}</p>}
      {data && (
        <>
          <p style={{ ...card, margin: '0 0 var(--space-4)' }}>
            {data.rail.connected ? c.railOn(data.rail.mode ?? 'test') : `${c.railOff} ${data.rail.reason ? c.railReason[data.rail.reason] ?? '' : ''}`}
            {data.rail.connected && !data.rail.webhook && <><br /><strong style={{ color: 'var(--semantic-danger)' }}>{c.webhookMissing}</strong></>}
          </p>

          <section aria-label={c.issues} style={{ ...card, marginBottom: 'var(--space-4)' }}>
            <h2 style={heading}>{c.issues}</h2>
            {data.issues.length === 0 ? <p style={{ margin: 0 }}>{c.noIssues}</p> : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {data.issues.map(i => (
                  <li key={`${i.kind}:${i.id}`} style={{ borderTop: '1px solid var(--brand-border)', padding: 'var(--space-3) 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                      <span><strong>{c.issueKind[i.kind]}</strong> · {fmtDate(i.date)}{i.invoiceNumber && i.invoiceId ? <> · <Link href={`/os/invoices/${i.invoiceId}`}>{c.invoice} {i.invoiceNumber}</Link></> : null} · {detailOf(i.kind, i.detail)}</span>
                      <span style={{ fontFamily: mono, fontWeight: 700 }}>{formatMoney(i.amount, i.currency, locale)}</span>
                    </div>
                    {i.kind === 'unapplied' && (
                      <form style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}
                        onSubmit={e => { e.preventDefault(); void action.run('money.resolve', { id: i.id, note: note[i.id] ?? '' }) }}>
                        <input aria-label={c.resolveNote} placeholder={c.resolveNote} minLength={3} maxLength={300} required value={note[i.id] ?? ''}
                          onChange={e => setNote(n => ({ ...n, [i.id]: e.target.value }))} style={{ flex: '1 1 240px', minHeight: '40px' }} />
                        <button type="submit" className="btn-secondary btn-sm" style={{ minHeight: '40px' }} disabled={action.busy}>{c.resolve}</button>
                      </form>
                    )}
                    {i.kind === 'unreconciled' && (
                      <form style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}
                        onSubmit={e => { e.preventDefault(); void action.run('payout.reconcile', { payout_id: i.id, ...(note[i.id]?.trim() ? { bank_reference: note[i.id].trim() } : {}) }) }}>
                        <input aria-label={c.bankRef} placeholder={c.bankRef} maxLength={120} value={note[i.id] ?? ''}
                          onChange={e => setNote(n => ({ ...n, [i.id]: e.target.value }))} style={{ flex: '1 1 240px', minHeight: '40px' }} />
                        <button type="submit" className="btn-secondary btn-sm" style={{ minHeight: '40px' }} disabled={action.busy}>{c.reconcile}</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {action.panel}
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            {[
              [c.outstanding, per(data.outstanding)], [c.overdue, per(data.overdue)], [c.received, per(data.receivedThisMonth)],
              ...(data.rail.connected || Object.keys(data.card.gross).length ? [[c.cardGross, per(data.card.gross)], [c.fees, per(data.card.fees)], [c.pendingPayout, per(data.card.pendingPayout)]] : []),
            ].map(([label, value]) => (
              <div key={label} style={card}>
                <p style={{ ...heading, margin: '0 0 var(--space-1)' }}>{label}</p>
                <p style={{ fontFamily: mono, fontWeight: 'var(--weight-heading)', fontSize: 'var(--text-h4)', margin: 0, overflowWrap: 'anywhere' }}>{value}</p>
              </div>
            ))}
          </div>

          <section aria-label={c.payouts} style={{ ...card, marginBottom: 'var(--space-4)' }}>
            <h2 style={heading}>{c.payouts}</h2>
            {data.payouts.length === 0 ? <p style={{ margin: 0 }}>{c.noPayouts}</p> : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {data.payouts.map(p => (
                  <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', borderTop: '1px solid var(--brand-border)', padding: 'var(--space-2) 0', flexWrap: 'wrap' }}>
                    <span>{p.arrivalDate ? fmtDate(p.arrivalDate) : c.dash} · {c.payoutStatus[p.status] ?? p.status}{p.reconciled ? ` · ${c.reconciled}` : ''}</span>
                    <span style={{ fontFamily: mono, fontWeight: 700 }}>{formatMoney(p.amount, p.currency, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label={c.ledger} style={card}>
            <h2 style={heading}>{c.ledger}</h2>
            {data.ledger.length === 0 ? <p style={{ margin: 0 }}>{c.noLedger}</p> : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {data.ledger.map(e => (
                  <li key={`${e.kind}:${e.id}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', borderTop: '1px solid var(--brand-border)', padding: 'var(--space-2) 0', flexWrap: 'wrap' }}>
                    <span>{fmtDate(e.date)} · <Link href={`/os/invoices/${e.invoiceId}`}>{e.invoiceNumber}</Link> · {e.client} · {c.entryKind[e.kind]} · {c.provider[e.provider] ?? e.provider}{c.entryStatus[e.status] ? ` · ${c.entryStatus[e.status]}` : ''}</span>
                    <span style={{ fontFamily: mono, fontWeight: 700 }}>{e.kind === 'payment' ? '' : '−'}{formatMoney(e.amount, e.currency, locale)}</span>
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
